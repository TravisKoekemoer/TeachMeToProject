import type { SignalAnalysis, Signal } from "@prisma/client";

import type { AudienceClusterDraft, Sport, UserType } from "../types";
import { average, clamp01, titleCase } from "../utils";

type AnalysisWithSignal = SignalAnalysis & {
  signal: Signal;
};

function dominantValue(values: Array<string | null | undefined>, fallback: string) {
  const counts = values.reduce<Record<string, number>>((accumulator, value) => {
    if (!value) {
      return accumulator;
    }

    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});

  const sorted = Object.entries(counts).sort((left, right) => right[1] - left[1]);
  return sorted[0]?.[0] ?? fallback;
}

function clusterLabel(userType: UserType, averageLeadScore: number) {
  const intentLabel = averageLeadScore >= 0.7 ? "ready to book" : "nurture";

  switch (userType) {
    case "adult_beginner":
      return `adult beginners ${intentLabel}`;
    case "parent_youth":
      return `parents seeking youth coaching`;
    case "general_improver":
      return `improvers comparing lessons`;
    case "competitive_player":
      return `competitive players`;
    case "casual_player":
      return `casual players`;
    default:
      return "mixed intent prospects";
  }
}

export function generateAudienceClusters(analyses: AnalysisWithSignal[]): AudienceClusterDraft[] {
  const candidateAnalyses = analyses.filter(
    (analysis) =>
      analysis.relevanceStatus !== "FILTERED_OUT" &&
      analysis.relevanceStatus !== "IRRELEVANT" &&
      analysis.leadIntentScore >= 0.4
  );

  const groups = candidateAnalyses.reduce<Record<string, AnalysisWithSignal[]>>((accumulator, analysis) => {
    const key = `${analysis.sport ?? "unknown"}|${analysis.userType ?? "unknown"}`;
    accumulator[key] = accumulator[key] ?? [];
    accumulator[key].push(analysis);
    return accumulator;
  }, {});

  return Object.values(groups).map((group) => {
    const sport = (group[0]?.sport ?? "unknown") as Sport;
    const audienceType = (group[0]?.userType ?? "unknown") as UserType;
    const leadScore = average(group.map((analysis) => analysis.leadIntentScore));
    const urgencyScore = average(group.map((analysis) => analysis.urgencyScore));
    const confidenceScore = clamp01((leadScore + urgencyScore + average(group.map((analysis) => analysis.commercialRelevanceScore))) / 3);
    const dominantState = dominantValue(group.map((analysis) => analysis.state), "Multi-state US");
    const dominantCity = dominantValue(group.map((analysis) => analysis.city), dominantState);
    const geoScope =
      group.filter((analysis) => analysis.state === dominantState).length >= Math.ceil(group.length * 0.6)
        ? `${dominantState}${dominantCity !== dominantState ? ` / ${dominantCity}` : ""}`
        : "Multi-state US";

    return {
      name: `${titleCase(sport)} ${clusterLabel(audienceType, leadScore)}`,
      sport,
      geoScope,
      audienceType,
      summary: `Grouped ${group.length} ${sport} signals around ${clusterLabel(audienceType, leadScore)}. Dominant market is ${geoScope}, and the typical post shows lead intent ${leadScore.toFixed(2)} with urgency ${urgencyScore.toFixed(2)}.`,
      confidenceScore,
      analysisIds: group.map((analysis) => analysis.id)
    };
  });
}
