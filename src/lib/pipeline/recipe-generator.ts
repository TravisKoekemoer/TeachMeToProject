import type { AudienceCluster, SignalAnalysis, Signal } from "../../generated/prisma/client";

import { getOpenAIClient, getOpenAIModel, shouldUseMockLlm } from "../openai";
import type { AudienceRecipeDraft, UserType } from "../types";
import { clamp01, safeJsonParse, titleCase } from "../utils";

type ClusterContext = AudienceCluster & {
  analyses: Array<SignalAnalysis & { signal: Signal }>;
};

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildFallbackAudienceRecipe(cluster: ClusterContext): AudienceRecipeDraft {
  const userType = (cluster.audienceType || "unknown") as UserType;
  const keywordTargets =
    cluster.sport === "tennis"
      ? ["tennis lessons", "tennis coach", "beginner tennis class", "private tennis lesson"]
      : cluster.sport === "golf"
        ? ["golf lessons", "golf instructor", "swing coach", "golf clinic"]
        : ["pickleball lessons", "pickleball coach", "pickleball clinic", "pickleball drills"];

  const adAngle =
    userType === "parent_youth"
      ? `Position TeachMeGTM as the fastest way for busy families in ${cluster.geoScope} to find vetted ${cluster.sport} instruction for kids.`
      : userType === "adult_beginner"
        ? `Lead with low-pressure, beginner-friendly ${cluster.sport} coaching that helps adults get started without feeling intimidated.`
        : `Frame TeachMeGTM as the easiest way to turn scattered practice into structured ${cluster.sport} improvement with a local coach.`;

  const cta =
    userType === "parent_youth"
      ? "Find a youth coach"
      : userType === "adult_beginner"
        ? "Book a beginner lesson"
        : "See local lesson options";

  return {
    audienceName: `${titleCase(cluster.sport)} ${titleCase(userType)} audience`,
    targetSport: cluster.sport as AudienceRecipeDraft["targetSport"],
    targetLocation: cluster.geoScope,
    targetUserType: userType,
    keywordTargets,
    conversationTargets: uniqueStrings(cluster.analyses.map((analysis) => `@${analysis.signal.authorHandle}`)).slice(0, 5),
    exclusions: ["pro tournament chatter", "equipment-only shoppers", "job postings", "brand giveaways"],
    suggestedLandingPage:
      userType === "parent_youth"
        ? `/sports/${cluster.sport}?segment=parents`
        : userType === "adult_beginner"
          ? `/sports/${cluster.sport}?segment=beginners`
          : `/sports/${cluster.sport}?segment=improvers`,
    adAngle,
    cta,
    confidenceScore: clamp01(cluster.confidenceScore)
  };
}

function normalizeStringArray(values: unknown, fallback: string[]) {
  if (!Array.isArray(values)) {
    return fallback;
  }

  const sanitized = values.map((value) => String(value).trim()).filter(Boolean);
  return sanitized.length ? sanitized : fallback;
}

function normalizeRecipe(recipe: Partial<AudienceRecipeDraft>, fallback: AudienceRecipeDraft): AudienceRecipeDraft {
  return {
    audienceName: recipe.audienceName?.trim() || fallback.audienceName,
    targetSport: (recipe.targetSport || fallback.targetSport) as AudienceRecipeDraft["targetSport"],
    targetLocation: recipe.targetLocation?.trim() || fallback.targetLocation,
    targetUserType: (recipe.targetUserType || fallback.targetUserType) as AudienceRecipeDraft["targetUserType"],
    keywordTargets: normalizeStringArray(recipe.keywordTargets, fallback.keywordTargets),
    conversationTargets: normalizeStringArray(recipe.conversationTargets, fallback.conversationTargets),
    exclusions: normalizeStringArray(recipe.exclusions, fallback.exclusions),
    suggestedLandingPage: recipe.suggestedLandingPage?.trim() || fallback.suggestedLandingPage,
    adAngle: recipe.adAngle?.trim() || fallback.adAngle,
    cta: recipe.cta?.trim() || fallback.cta,
    confidenceScore: clamp01(Number(recipe.confidenceScore ?? fallback.confidenceScore))
  };
}

function extractResponseContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map((part) => (typeof part === "object" && part && "text" in part ? String(part.text) : "")).join("");
  }

  return "";
}

export async function generateAudienceRecipe(cluster: ClusterContext): Promise<AudienceRecipeDraft> {
  const fallbackRecipe = buildFallbackAudienceRecipe(cluster);

  if (!cluster.analyses.length || shouldUseMockLlm()) {
    return fallbackRecipe;
  }

  const client = getOpenAIClient();

  if (!client) {
    return fallbackRecipe;
  }

  try {
    const samplePosts = cluster.analyses.slice(0, 6).map((analysis) => analysis.signal.postText);
    const response = await client.chat.completions.create({
      model: getOpenAIModel(),
      temperature: 0.2,
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content:
            "You are generating internal X ads audience recipes for TeachMeGTM. Return only JSON. Keep recommendations practical and suitable for manual campaign setup."
        },
        {
          role: "user",
          content: JSON.stringify({
            cluster: {
              name: cluster.name,
              sport: cluster.sport,
              geoScope: cluster.geoScope,
              audienceType: cluster.audienceType,
              summary: cluster.summary,
              confidenceScore: cluster.confidenceScore
            },
            samplePosts,
            requiredShape: fallbackRecipe
          })
        }
      ]
    });

    const content = extractResponseContent(response.choices[0]?.message?.content);
    const parsed = safeJsonParse<Partial<AudienceRecipeDraft>>(content, {});

    return normalizeRecipe(parsed, fallbackRecipe);
  } catch {
    return fallbackRecipe;
  }
}

