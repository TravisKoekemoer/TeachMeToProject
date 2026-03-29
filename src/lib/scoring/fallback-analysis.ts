import type { Signal } from "../../generated/prisma/client";

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
    { token: "looking for", weight: 0.28 },
    { token: "searching for", weight: 0.26 },
    { token: "any recs", weight: 0.28 },
    { token: "who offers", weight: 0.2 },
    { token: "looking to book", weight: 0.28 },
    { token: "want to book", weight: 0.24 },
    { token: "need to book", weight: 0.32 },
    { token: "book a lesson", weight: 0.34 },
    { token: "book a private lesson", weight: 0.38 },
    { token: "book lessons", weight: 0.26 },
    { token: "need", weight: 0.24 },
    { token: "needs", weight: 0.24 },
    { token: "ready to book", weight: 0.42 },
    { token: "book my first", weight: 0.36 },
    { token: "book", weight: 0.18 },
    { token: "want to start", weight: 0.22 },
    { token: "start lessons", weight: 0.2 },
    { token: "start this week", weight: 0.32 },
    { token: "send them my way", weight: 0.15 },
    { token: "as soon as possible", weight: 0.32 },
    { token: "private", weight: 0.12 },
    { token: "private lesson", weight: 0.22 },
    { token: "private lessons", weight: 0.22 },
    { token: "private instruction", weight: 0.2 },
    { token: "private sessions", weight: 0.18 },
    { token: "lesson", weight: 0.08 },
    { token: "lessons", weight: 0.12 },
    { token: "session", weight: 0.06 },
    { token: "paid sessions", weight: 0.16 },
    { token: "coach", weight: 0.16 },
    { token: "instructor", weight: 0.16 },
    { token: "classes", weight: 0.1 },
    { token: "evaluation", weight: 0.18 },
    { token: "package", weight: 0.1 },
    { token: "lesson package", weight: 0.12 },
    { token: "starter package", weight: 0.12 },
    { token: "weekly", weight: 0.12 },
    { token: "happy to pay", weight: 0.2 },
    { token: "willing to pay", weight: 0.12 },
    { token: "can pay", weight: 0.12 },
    { token: "ready to spend", weight: 0.24 },
    { token: "premium", weight: 0.1 }
  ];
  const leadReducers: WeightedSignal[] = [
    { token: "thinking about", weight: 0.18 },
    { token: "not sure", weight: 0.18 },
    { token: "maybe", weight: 0.14 },
    { token: "on the fence", weight: 0.22 },
    { token: "curious whether", weight: 0.16 },
    { token: "curious if", weight: 0.14 },
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
    { token: "today", weight: 0.58 },
    { token: "tomorrow", weight: 0.62 },
    { token: "this week", weight: 0.54 },
    { token: "start this week", weight: 0.22 },
    { token: "lessons this week", weight: 0.18 },
    { token: "lesson this week", weight: 0.16 },
    { token: "this weekend", weight: 0.5 },
    { token: "next week", weight: 0.5 },
    { token: "start next week", weight: 0.2 },
    { token: "lessons next week", weight: 0.16 },
    { token: "lesson next week", weight: 0.14 },
    { token: "next couple of days", weight: 0.56 },
    { token: "next month", weight: 0.3 },
    { token: "starting next month", weight: 0.24 },
    { token: "spring break", weight: 0.34 },
    { token: "before summer", weight: 0.24 },
    { token: "before next week", weight: 0.54 },
    { token: "work trip", weight: 0.24 },
    { token: "as soon as possible", weight: 0.58 },
    { token: "immediately", weight: 0.72 },
    { token: "right away", weight: 0.64 },
    { token: "starting now", weight: 0.64 },
    { token: "first available slot", weight: 0.66 },
    { token: "earliest opening", weight: 0.6 },
    { token: "ready to book", weight: 0.28 },
    { token: "looking to book", weight: 0.24 },
    { token: "need to book", weight: 0.3 },
    { token: "want to book", weight: 0.2 },
    { token: "book my first", weight: 0.26 },
    { token: "book a lesson", weight: 0.28 },
    { token: "book a private lesson", weight: 0.3 },
    { token: "want to start", weight: 0.16 },
    { token: "start lessons", weight: 0.18 },
    { token: "coach now", weight: 0.5 },
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
    { token: "whenever", weight: 0.14 },
    { token: "in a few months", weight: 0.16 },
    { token: "next season", weight: 0.18 }
  ];
  const commercialSignals: WeightedSignal[] = [
    { token: "pay", weight: 0.22 },
    { token: "happy to pay", weight: 0.3 },
    { token: "willing to pay", weight: 0.12 },
    { token: "can pay", weight: 0.12 },
    { token: "ready to spend", weight: 0.26 },
    { token: "package", weight: 0.14 },
    { token: "lesson package", weight: 0.14 },
    { token: "starter lesson package", weight: 0.18 },
    { token: "starter package", weight: 0.16 },
    { token: "private session", weight: 0.16 },
    { token: "private sessions", weight: 0.22 },
    { token: "weekly private sessions", weight: 0.24 },
    { token: "private instruction", weight: 0.18 },
    { token: "private lesson", weight: 0.2 },
    { token: "private lessons", weight: 0.2 },
    { token: "paid session", weight: 0.18 },
    { token: "paid sessions", weight: 0.18 },
    { token: "budget", weight: 0.12 },
    { token: "pricing", weight: 0.12 },
    { token: "coach", weight: 0.12 },
    { token: "instructor", weight: 0.12 },
    { token: "clinic", weight: 0.08 },
    { token: "lesson", weight: 0.08 },
    { token: "lessons", weight: 0.1 },
    { token: "weekly", weight: 0.04 },
    { token: "premium", weight: 0.1 },
    { token: "evaluation", weight: 0.1 }
  ];
  const commercialReducers: WeightedSignal[] = [
    { token: "free", weight: 0.2 },
    { token: "watch videos", weight: 0.18 },
    { token: "worth it", weight: 0.12 },
    { token: "for fun", weight: 0.12 },
    { token: "casual play", weight: 0.14 },
    { token: "only play once a week", weight: 0.1 },
    { token: "borrowing gear", weight: 0.12 },
    { token: "play socially", weight: 0.12 }
  ];
  const frustratedSignals = ["embarrassing myself", "frustration", "fix that"];
  const bookingReadinessTokens = [
    "ready to book",
    "looking to book",
    "want to book",
    "need to book",
    "book my first",
    "book a lesson",
    "book a private lesson",
    "book lessons",
    "want to start",
    "start lessons",
    "first available slot",
    "earliest opening"
  ];
  const strongBookingTokens = [
    "ready to book",
    "need to book",
    "book my first",
    "book a lesson",
    "book a private lesson",
    "first available slot",
    "earliest opening",
    "today",
    "tomorrow",
    "right away",
    "immediately",
    "starting now"
  ];
  const explicitHighIntent = hasAny(text, [
    "ready to book",
    "looking to book",
    "want to book",
    "need to book",
    "book my first",
    "book a lesson",
    "book a private lesson",
    "happy to pay",
    "willing to pay",
    "can pay",
    "ready to spend",
    "starter lesson package",
    "starter package",
    "as soon as possible"
  ]);
  const explicitImmediateUrgency = hasAny(text, [
    "today",
    "tomorrow",
    "immediately",
    "right away",
    "starting now",
    "first available slot",
    "earliest opening",
    "before next week",
    "as soon as possible",
    "next couple of days"
  ]);
  const explicitNearTermUrgency = hasAny(text, [
    "this week",
    "start this week",
    "lessons this week",
    "lesson this week",
    "this weekend",
    "next week",
    "start next week",
    "lessons next week",
    "lesson next week"
  ]);
  const explicitPlannedUrgency = hasAny(text, ["next month", "starting next month", "spring break", "before summer", "work trip"]);
  const instructionDemand = hasAny(text, [
    "lesson",
    "lessons",
    "coach",
    "coaching",
    "instructor",
    "instruction",
    "private",
    "session",
    "sessions",
    "clinic",
    "classes"
  ]);
  const paidCommitment = hasAny(text, [
    "happy to pay",
    "willing to pay",
    "can pay",
    "ready to spend",
    "pay",
    "package",
    "lesson package",
    "starter package",
    "starter lesson package",
    "pricing",
    "budget"
  ]);
  const bookingReadiness = hasAny(text, bookingReadinessTokens);
  const directBookingSearch = hasAny(text, [
    "ready to book",
    "looking to book",
    "want to book",
    "need to book",
    "book my first",
    "book a lesson",
    "book a private lesson"
  ]);
  const strongBookingReadiness = hasAny(text, strongBookingTokens) || (bookingReadiness && paidCommitment) || explicitHighIntent;
  const coachSearch = hasAny(text, ["looking for", "searching for", "any recs", "who offers", "looking to book", "want to book"]) &&
    hasAny(text, ["lesson", "lessons", "coach", "instructor", "classes", "clinic", "session", "sessions"]);
  const familyNeedIntent = userType === "parent_youth" && hasAny(text, ["need", "needs", "looking for", "coach", "lesson", "lessons", "private session", "private sessions"]);
  const exploratoryIntent = hasAny(text, [
    "thinking about",
    "not sure",
    "maybe",
    "on the fence",
    "curious whether",
    "curious if",
    "worth it",
    "watch videos",
    "only play for fun",
    "casual play",
    "casually",
    "eventually",
    "hard to tell",
    "someday",
    "not convinced",
    "mostly just",
    "rather just play socially"
  ]);
  const structuredProgramIntent = hasAny(text, ["package", "lesson package", "starter package", "starter lesson package", "weekly private sessions", "weekly"]);
  const explicitPaidInstruction = instructionDemand && paidCommitment;
  const explicitNearTermInstruction = instructionDemand && (explicitNearTermUrgency || explicitImmediateUrgency);
  const plannedInstruction = instructionDemand && explicitPlannedUrgency;
  const leadMatchBonus = Math.max(0, matchCount(text, leadSignals) - 2) * 0.005;
  const urgencyMatchBonus = Math.max(0, matchCount(text, urgencySignals) - 1) * 0.035;
  const commercialMatchBonus = Math.max(0, matchCount(text, commercialSignals) - 1) * 0.015;

  const leadIntentScore = clamp01(
    0.06 +
      weightedMatches(text, leadSignals) * 0.62 +
      leadMatchBonus +
      (instructionDemand ? 0.07 : 0) +
      (coachSearch ? 0.07 : 0) +
      (paidCommitment ? 0.05 : 0) +
      (familyNeedIntent ? 0.05 : 0) +
      (explicitHighIntent ? 0.24 : 0) -
      weightedMatches(text, leadReducers) * 0.6 -
      (exploratoryIntent && !explicitHighIntent ? 0.05 : 0)
  );

  const urgencyFloor = explicitImmediateUrgency
    ? 0.9
    : explicitNearTermInstruction
      ? strongBookingReadiness
        ? 0.88
        : 0.82
      : explicitNearTermUrgency
        ? 0.76
        : strongBookingReadiness && instructionDemand
          ? 0.72
          : bookingReadiness && instructionDemand
            ? 0.62
            : coachSearch && instructionDemand
              ? 0.52
              : plannedInstruction
                ? 0.54
                : 0;

  const urgencyScore = Math.min(
    0.98,
    clamp01(
      Math.max(
        0.06 +
          weightedMatches(text, urgencySignals) * 0.9 +
          urgencyMatchBonus +
          (bookingReadiness ? 0.14 : 0) +
          (directBookingSearch ? 0.08 : 0) +
          (strongBookingReadiness ? 0.1 : 0) +
          (instructionDemand && paidCommitment ? 0.08 : 0) +
          (coachSearch ? 0.06 : 0) +
          (explicitNearTermUrgency ? 0.22 : 0) +
          (explicitImmediateUrgency ? 0.3 : explicitPlannedUrgency ? 0.14 : 0) +
          (explicitNearTermInstruction ? 0.12 : 0) +
          (plannedInstruction ? 0.08 : 0) -
          weightedMatches(text, urgencyReducers) * 0.46 -
          (exploratoryIntent && !bookingReadiness ? 0.08 : 0),
        urgencyFloor
      )
    )
  );

  const strongPaidCommitment = hasAny(text, [
    "happy to pay",
    "ready to spend",
    "willing to pay",
    "starter lesson package",
    "starter package",
    "weekly private sessions"
  ]);
  const commercialFloor = exploratoryIntent ? 0 : explicitPaidInstruction
    ? strongPaidCommitment
      ? bookingReadiness
        ? 0.88
        : 0.84
      : structuredProgramIntent
        ? 0.8
        : bookingReadiness
          ? 0.76
          : 0.72
    : coachSearch && structuredProgramIntent
      ? 0.74
      : coachSearch && bookingReadiness
        ? 0.7
        : coachSearch
          ? 0.62
          : instructionDemand && paidCommitment
            ? bookingReadiness
              ? 0.68
              : 0.64
            : 0;

  const commercialRelevanceScore = Math.min(0.96, clamp01(
    Math.max(
      0.08 +
        weightedMatches(text, commercialSignals) * 0.78 +
        commercialMatchBonus +
        (explicitPaidInstruction ? 0.08 : 0) +
        (structuredProgramIntent ? 0.06 : 0) +
        (coachSearch ? 0.05 : 0) +
        (bookingReadiness ? 0.06 : 0) +
        (directBookingSearch ? 0.04 : 0) +
        (explicitNearTermInstruction ? 0.05 : 0) -
        weightedMatches(text, commercialReducers) * 0.56 -
        (exploratoryIntent && !paidCommitment ? 0.08 : 0),
      commercialFloor + (explicitNearTermInstruction ? 0.04 : 0)
    )
  ));

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
        ? "Strong instructional intent with clear coaching, timing, or paid-lesson language."
        : relevanceStatus === "POSSIBLE"
          ? "Moderate lesson interest with enough coaching or timing cues to keep in nurture or retargeting audiences."
          : "Mentions instruction or the sport, but the post reads exploratory, hesitant, or weakly commercial."
  };
}