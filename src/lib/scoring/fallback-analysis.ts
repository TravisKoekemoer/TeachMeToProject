import type { Signal } from "@prisma/client";

import type { RelevanceStatus, SignalAnalysisResult, SkillLevel, Sport, UserType } from "../types";
import { clamp01 } from "../utils";

function normalizedText(signal: Pick<Signal, "postText">) {
  return signal.postText.toLowerCase();
}

function inferSport(text: string): Sport {
  if (text.includes("tennis")) return "tennis";
  if (text.includes("golf")) return "golf";
  if (text.includes("pickleball")) return "pickleball";
  return "unknown";
}

function inferUserType(text: string): UserType {
  if (text.includes("my 10 year old") || text.includes("my daughter") || text.includes("my son") || text.includes("middle schooler") || text.includes("junior")) {
    return "parent_youth";
  }
  if (text.includes("adult beginner") || text.includes("brand new") || text.includes("beginner")) {
    return "adult_beginner";
  }
  if (text.includes("casually") || text.includes("thinking about") || text.includes("level up") || text.includes("fundamentals") || text.includes("clinic")) {
    return "general_improver";
  }

  return "unknown";
}

function inferSkillLevel(text: string): SkillLevel {
  if (text.includes("brand new") || text.includes("beginner")) return "beginner";
  if (text.includes("level up") || text.includes("fundamentals") || text.includes("consistency")) return "intermediate";
  if (text.includes("tournament") || text.includes("competitive")) return "advanced";
  return "unknown";
}

function extractLocation(signal: Pick<Signal, "postText" | "rawJson">) {
  const rawJson = signal.rawJson as { inferred_market?: { city?: string; state?: string; country?: string } };

  return {
    city: rawJson.inferred_market?.city ?? null,
    state: rawJson.inferred_market?.state ?? null,
    country: rawJson.inferred_market?.country ?? "USA"
  };
}

type WeightedSignal = {
  token: string;
  weight: number;
};

function weightedMatches(text: string, signals: WeightedSignal[]) {
  return signals.reduce((score, signal) => {
    return text.includes(signal.token) ? score + signal.weight : score;
  }, 0);
}

function matchCount(text: string, signals: WeightedSignal[]) {
  return signals.filter((signal) => text.includes(signal.token)).length;
}

function hasAny(text: string, tokens: string[]) {
  return tokens.some((token) => text.includes(token));
}

export function buildFilteredOutAnalysis(signal: Pick<Signal, "postText" | "rawJson">): SignalAnalysisResult {
  const text = normalizedText(signal);
  const sport = inferSport(text);
  const location = extractLocation(signal);

  return {
    sport,
    city: location.city,
    state: location.state,
    country: location.country,
    userType: "unknown",
    skillLevel: "unknown",
    leadIntentScore: 0.05,
    urgencyScore: 0.05,
    commercialRelevanceScore: 0.05,
    sentiment: "neutral",
    relevanceStatus: "FILTERED_OUT",
    explanation: "Did not match the v1 keyword prefilter, so it was stored as noise for dashboard review."
  };
}

export function deriveRelevanceStatus(
  leadIntentScore: number,
  commercialRelevanceScore: number
): RelevanceStatus {
  return leadIntentScore >= 0.7 || commercialRelevanceScore >= 0.7
    ? "RELEVANT"
    : leadIntentScore >= 0.45
      ? "POSSIBLE"
      : "IRRELEVANT";
}

export function runFallbackClassification(signal: Pick<Signal, "postText" | "rawJson">): SignalAnalysisResult {
  const text = normalizedText(signal);
  const sport = inferSport(text);
  const userType = inferUserType(text);
  const skillLevel = inferSkillLevel(text);
  const location = extractLocation(signal);

  const leadSignals: WeightedSignal[] = [
    { token: "looking for", weight: 0.26 },
    { token: "searching for", weight: 0.24 },
    { token: "any recs", weight: 0.2 },
    { token: "who offers", weight: 0.18 },
    { token: "need", weight: 0.24 },
    { token: "ready to book", weight: 0.42 },
    { token: "book my first", weight: 0.34 },
    { token: "book", weight: 0.16 },
    { token: "start this week", weight: 0.32 },
    { token: "send them my way", weight: 0.15 },
    { token: "as soon as possible", weight: 0.3 },
    { token: "private", weight: 0.12 },
    { token: "private lessons", weight: 0.18 },
    { token: "private instruction", weight: 0.18 },
    { token: "lessons", weight: 0.12 },
    { token: "coach", weight: 0.14 },
    { token: "classes", weight: 0.1 },
    { token: "evaluation", weight: 0.18 },
    { token: "package", weight: 0.16 },
    { token: "weekly", weight: 0.14 },
    { token: "instructor", weight: 0.14 },
    { token: "happy to pay", weight: 0.18 },
    { token: "ready to spend", weight: 0.22 },
    { token: "premium", weight: 0.12 }
  ];
  const leadReducers: WeightedSignal[] = [
    { token: "thinking about", weight: 0.18 },
    { token: "not sure", weight: 0.18 },
    { token: "maybe", weight: 0.14 },
    { token: "on the fence", weight: 0.22 },
    { token: "curious whether", weight: 0.16 },
    { token: "worth it", weight: 0.1 },
    { token: "watch videos", weight: 0.22 },
    { token: "only play for fun", weight: 0.18 },
    { token: "casual play", weight: 0.16 },
    { token: "casually", weight: 0.12 },
    { token: "eventually", weight: 0.18 },
    { token: "hard to tell", weight: 0.18 },
    { token: "someday", weight: 0.12 },
    { token: "not convinced", weight: 0.16 },
    { token: "mostly just", weight: 0.14 },
    { token: "rather just play socially", weight: 0.18 }
  ];
  const urgencySignals: WeightedSignal[] = [
    { token: "today", weight: 0.3 },
    { token: "tomorrow", weight: 0.4 },
    { token: "this week", weight: 0.32 },
    { token: "this weekend", weight: 0.3 },
    { token: "next week", weight: 0.28 },
    { token: "next month", weight: 0.18 },
    { token: "starting next month", weight: 0.18 },
    { token: "spring break", weight: 0.24 },
    { token: "before summer", weight: 0.18 },
    { token: "before next week", weight: 0.34 },
    { token: "work trip", weight: 0.22 },
    { token: "as soon as possible", weight: 0.34 },
    { token: "immediately", weight: 0.42 },
    { token: "right away", weight: 0.38 },
    { token: "starting now", weight: 0.36 },
    { token: "first available slot", weight: 0.36 },
    { token: "earliest opening", weight: 0.34 },
    { token: "weekend", weight: 0.12 },
    { token: "in six weeks", weight: 0.12 }
  ];
  const urgencyReducers: WeightedSignal[] = [
    { token: "eventually", weight: 0.14 },
    { token: "later this summer", weight: 0.12 },
    { token: "later", weight: 0.08 },
    { token: "not sure", weight: 0.08 },
    { token: "on the fence", weight: 0.08 },
    { token: "someday", weight: 0.12 },
    { token: "whenever", weight: 0.14 }
  ];
  const commercialSignals: WeightedSignal[] = [
    { token: "pay", weight: 0.22 },
    { token: "happy to pay", weight: 0.28 },
    { token: "ready to spend", weight: 0.24 },
    { token: "package", weight: 0.2 },
    { token: "private sessions", weight: 0.18 },
    { token: "private instruction", weight: 0.18 },
    { token: "budget", weight: 0.08 },
    { token: "coach", weight: 0.1 },
    { token: "clinic", weight: 0.08 },
    { token: "lessons", weight: 0.1 },
    { token: "premium", weight: 0.14 },
    { token: "pricing", weight: 0.14 },
    { token: "starter lesson package", weight: 0.2 },
    { token: "evaluation", weight: 0.1 }
  ];
  const commercialReducers: WeightedSignal[] = [
    { token: "free", weight: 0.18 },
    { token: "watch videos", weight: 0.16 },
    { token: "for fun", weight: 0.12 },
    { token: "casual play", weight: 0.14 },
    { token: "only play once a week", weight: 0.1 },
    { token: "borrowing gear", weight: 0.12 },
    { token: "play socially", weight: 0.12 }
  ];
  const frustratedSignals = ["embarrassing myself", "frustration", "fix that"];
  const explicitHighIntent = hasAny(text, [
    "ready to book",
    "book my first",
    "happy to pay",
    "ready to spend",
    "starter lesson package",
    "as soon as possible"
  ]);
  const explicitHighUrgency = hasAny(text, [
    "today",
    "tomorrow",
    "immediately",
    "right away",
    "starting now",
    "first available slot",
    "earliest opening",
    "before next week",
    "as soon as possible"
  ]);
  const leadMatchBonus = Math.max(0, matchCount(text, leadSignals) - 2) * 0.04;
  const instructionStackBonus = hasAny(text, ["coach", "instructor", "lessons", "classes", "clinic"]) ? 0.06 : 0;
  const urgencyMatchBonus = Math.max(0, matchCount(text, urgencySignals) - 1) * 0.06;
  const commercialMatchBonus = Math.max(0, matchCount(text, commercialSignals) - 2) * 0.04;

  const leadIntentScore = clamp01(
    0.04 +
      weightedMatches(text, leadSignals) * 0.82 +
      leadMatchBonus +
      instructionStackBonus +
      (explicitHighIntent ? 0.18 : 0) -
      weightedMatches(text, leadReducers) * 0.68
  );
  const urgencyScore = clamp01(
    0.02 +
      weightedMatches(text, urgencySignals) * 1.02 +
      urgencyMatchBonus +
      (explicitHighUrgency ? 0.24 : 0) -
      weightedMatches(text, urgencyReducers) * 0.55
  );
  const commercialRelevanceScore = clamp01(
    0.05 +
      weightedMatches(text, commercialSignals) * 0.78 +
      commercialMatchBonus +
      (hasAny(text, ["happy to pay", "ready to spend", "starter lesson package"]) ? 0.14 : 0) -
      weightedMatches(text, commercialReducers) * 0.6
  );

  const relevanceStatus = deriveRelevanceStatus(leadIntentScore, commercialRelevanceScore);

  const sentiment = frustratedSignals.some((token) => text.includes(token))
    ? "frustrated"
    : text.includes("want") || text.includes("finally committing")
      ? "positive"
      : "neutral";

  return {
    sport,
    city: location.city,
    state: location.state,
    country: location.country,
    userType,
    skillLevel,
    leadIntentScore,
    urgencyScore,
    commercialRelevanceScore,
    sentiment,
    relevanceStatus,
    explanation:
      relevanceStatus === "RELEVANT"
        ? "Strong instructional intent with clear coaching or booking language."
        : relevanceStatus === "POSSIBLE"
          ? "Moderate lesson interest with enough intent cues to keep in nurture or retargeting audiences."
          : "Mentions instruction or the sport, but the post reads exploratory, hesitant, or weakly commercial."
  };
}
