import type { Signal } from "@prisma/client";

import { getOpenAIClient, getOpenAIModel, shouldUseMockLlm } from "../openai";
import type { SignalAnalysisResult } from "../types";
import { clamp01, safeJsonParse } from "../utils";

import { deriveRelevanceStatus, runFallbackClassification } from "./fallback-analysis";

const analysisSchemaExample = {
  sport: "tennis",
  city: "Austin",
  state: "TX",
  country: "USA",
  userType: "adult_beginner",
  skillLevel: "beginner",
  leadIntentScore: 0.92,
  urgencyScore: 0.88,
  commercialRelevanceScore: 0.88,
  sentiment: "positive",
  relevanceStatus: "RELEVANT",
  explanation: "Clear intent to find and pay for instruction immediately."
};

const scoreRubric = [
  "Use decimal scores with two-digit precision, not buckets.",
  "leadIntentScore: 0.90-0.99 means explicit readiness to book or pay now; 0.70-0.89 means clear search for coaching; 0.45-0.69 means moderate lesson interest; 0.20-0.44 means weak or exploratory interest; 0.05-0.19 means mostly irrelevant.",
  "urgencyScore: 0.90+ means immediate timing like today, tomorrow, immediately, or first available slot; 0.75-0.89 means this week or a near deadline; 0.45-0.74 means a clear near-term plan; 0.20-0.44 means some timing signal but not urgent; 0.05-0.19 means no urgency.",
  "commercialRelevanceScore: 0.85+ means clear paid instruction intent; 0.60-0.84 means strong lesson or clinic relevance; 0.35-0.59 means possible coaching relevance; 0.05-0.34 means weak commercial relevance.",
  "When the post explicitly says ready to book, wants private lessons soon, or is clearly willing to pay, scores above 0.80 are appropriate.",
  "Use higher urgency when the post mentions today, tomorrow, immediately, right away, earliest opening, or first available slot.",
  "Use middle values frequently when the post is curious, hesitant, comparing options, or asking whether lessons are worth it.",
  "Avoid defaulting to 0.05 or 0.95 unless the post is overwhelmingly clear.",
  "Use the example only for keys and value types. Do not copy the example numbers."
].join("\n");

function roundScore(value: number) {
  return Math.round(clamp01(value) * 100) / 100;
}

function normalizeAnalysis(input: Partial<SignalAnalysisResult>): SignalAnalysisResult {
  return {
    sport: (input.sport ?? "unknown").toLowerCase() as SignalAnalysisResult["sport"],
    city: input.city ?? null,
    state: input.state ?? null,
    country: input.country ?? "USA",
    userType: (input.userType ?? "unknown").toLowerCase() as SignalAnalysisResult["userType"],
    skillLevel: (input.skillLevel ?? "unknown").toLowerCase() as SignalAnalysisResult["skillLevel"],
    leadIntentScore: roundScore(Number(input.leadIntentScore ?? 0)),
    urgencyScore: roundScore(Number(input.urgencyScore ?? 0)),
    commercialRelevanceScore: roundScore(Number(input.commercialRelevanceScore ?? 0)),
    sentiment: (input.sentiment ?? "unknown").toLowerCase() as SignalAnalysisResult["sentiment"],
    relevanceStatus: ((input.relevanceStatus ?? "IRRELEVANT").toUpperCase() as SignalAnalysisResult["relevanceStatus"]),
    explanation: input.explanation?.trim() || "No explanation provided."
  };
}

function preferParsedValue<T extends string>(parsedValue: T, fallbackValue: T) {
  return parsedValue === "unknown" ? fallbackValue : parsedValue;
}

function blendScore(parsedScore: number, heuristicScore: number) {
  if (heuristicScore >= 0.85) {
    return roundScore(Math.max(parsedScore * 0.28 + heuristicScore * 0.72, heuristicScore - 0.02));
  }

  if (heuristicScore >= 0.65) {
    return roundScore(parsedScore * 0.38 + heuristicScore * 0.62);
  }

  if (heuristicScore <= 0.2) {
    return roundScore(parsedScore * 0.3 + heuristicScore * 0.7);
  }

  return roundScore(parsedScore * 0.45 + heuristicScore * 0.55);
}

function blendUrgencyScore(parsedScore: number, heuristicScore: number) {
  if (heuristicScore >= 0.8) {
    return roundScore(Math.max(parsedScore * 0.22 + heuristicScore * 0.78, heuristicScore - 0.02));
  }

  if (heuristicScore >= 0.55) {
    return roundScore(parsedScore * 0.32 + heuristicScore * 0.68);
  }

  if (heuristicScore <= 0.18) {
    return roundScore(parsedScore * 0.24 + heuristicScore * 0.76);
  }

  return roundScore(parsedScore * 0.38 + heuristicScore * 0.62);
}

function calibrateAnalysisWithHeuristic(
  parsedAnalysis: SignalAnalysisResult,
  heuristicAnalysis: SignalAnalysisResult
): SignalAnalysisResult {
  const leadIntentScore = blendScore(parsedAnalysis.leadIntentScore, heuristicAnalysis.leadIntentScore);
  const urgencyScore = blendUrgencyScore(parsedAnalysis.urgencyScore, heuristicAnalysis.urgencyScore);
  const commercialRelevanceScore = blendScore(
    parsedAnalysis.commercialRelevanceScore,
    heuristicAnalysis.commercialRelevanceScore
  );

  return {
    sport: preferParsedValue(parsedAnalysis.sport, heuristicAnalysis.sport),
    city: parsedAnalysis.city ?? heuristicAnalysis.city,
    state: parsedAnalysis.state ?? heuristicAnalysis.state,
    country: parsedAnalysis.country ?? heuristicAnalysis.country,
    userType: preferParsedValue(parsedAnalysis.userType, heuristicAnalysis.userType),
    skillLevel: preferParsedValue(parsedAnalysis.skillLevel, heuristicAnalysis.skillLevel),
    leadIntentScore,
    urgencyScore,
    commercialRelevanceScore,
    sentiment: preferParsedValue(parsedAnalysis.sentiment, heuristicAnalysis.sentiment),
    relevanceStatus: deriveRelevanceStatus(leadIntentScore, commercialRelevanceScore),
    explanation: parsedAnalysis.explanation || heuristicAnalysis.explanation
  };
}

function extractContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : typeof part === "object" && part && "text" in part ? String(part.text) : ""))
      .join("");
  }

  return "";
}

export async function classifySignalWithLlm(signal: Pick<Signal, "postText" | "rawJson">): Promise<SignalAnalysisResult> {
  const heuristicAnalysis = runFallbackClassification(signal);

  if (shouldUseMockLlm()) {
    return heuristicAnalysis;
  }

  const client = getOpenAIClient();

  if (!client) {
    return heuristicAnalysis;
  }

  try {
    const response = await client.chat.completions.create({
      model: getOpenAIModel(),
      temperature: 0.1,
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content:
            "You classify X posts for TeachMeGTM, a sports lessons marketplace. Return only valid JSON. Use sports: tennis, golf, pickleball, unknown. Use userType: adult_beginner, parent_youth, general_improver, competitive_player, casual_player, unknown. Use skillLevel: beginner, intermediate, advanced, unknown. Use sentiment: positive, neutral, frustrated, unknown. Use relevanceStatus: RELEVANT, POSSIBLE, IRRELEVANT."
        },
        {
          role: "user",
          content: [
            `Post text: ${signal.postText}`,
            `Raw JSON: ${JSON.stringify(signal.rawJson)}`,
            "Score leadIntentScore, urgencyScore, and commercialRelevanceScore from 0 to 1.",
            scoreRubric,
            `Return exactly this shape: ${JSON.stringify(analysisSchemaExample)}`
          ].join("\n")
        }
      ]
    });

    const content = extractContent(response.choices[0]?.message?.content);
    const parsed = safeJsonParse<Partial<SignalAnalysisResult>>(content, {});
    const normalized = normalizeAnalysis(parsed);

    return calibrateAnalysisWithHeuristic(normalized, heuristicAnalysis);
  } catch {
    return heuristicAnalysis;
  }
}
