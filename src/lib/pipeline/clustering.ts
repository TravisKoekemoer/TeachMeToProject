import type { SignalAnalysis, Signal } from "../../generated/prisma/client";

import type { AudienceClusterDraft, Sport, UserType } from "../types";
import { average, clamp01, titleCase } from "../utils";

type AnalysisWithSignal = SignalAnalysis & {
  signal: Signal;
};

const MIN_CLUSTERABLE_LEAD_SCORE = 0.4;

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

function isClusterCandidate(analysis: AnalysisWithSignal) {
  return (
    analysis.relevanceStatus !== "FILTERED_OUT" &&
    analysis.relevanceStatus !== "IRRELEVANT" &&
    analysis.leadIntentScore >= MIN_CLUSTERABLE_LEAD_SCORE
  );
}

function getClusterLabel(userType: UserType, averageLeadScore: number) {
  const intentLabel = averageLeadScore >= 0.7 ? "ready to book" : "nurture";

  switch (userType) {
    case "adult_beginner":
      return `adult beginners ${intentLabel}`;
    case "parent_youth":
      return "parents seeking youth coaching";
    case "general_improver":
      return "improvers comparing lessons";
    case "competitive_player":
      return "competitive players";
    case "casual_player":
      return "casual players";
    default:
      return "mixed intent prospects";
  }
}

function buildGeoScope(group: AnalysisWithSignal[]) {
  const dominantState = dominantValue(group.map((analysis) => analysis.state), "Multi-state US");
  const dominantCity = dominantValue(group.map((analysis) => analysis.city), dominantState);
  const sharedStateCount = group.filter((analysis) => analysis.state === dominantState).length;

  if (sharedStateCount >= Math.ceil(group.length * 0.6)) {
    return `${dominantState}${dominantCity !== dominantState ? ` / ${dominantCity}` : ""}`;
  }

  return "Multi-state US";
}

function buildClusterSummary(group: AnalysisWithSignal[], sport: Sport, clusterLabel: string, geoScope: string) {
  const averageLeadScore = average(group.map((analysis) => analysis.leadIntentScore));
  const averageUrgencyScore = average(group.map((analysis) => analysis.urgencyScore));

  return `Grouped ${group.length} ${sport} signals around ${clusterLabel}. Dominant market is ${geoScope}, and the typical post shows lead intent ${averageLeadScore.toFixed(2)} with urgency ${averageUrgencyScore.toFixed(2)}.`;
}

function groupAnalysesByTheme(analyses: AnalysisWithSignal[]) {
  return analyses.reduce<Record<string, AnalysisWithSignal[]>>((accumulator, analysis) => {
    const key = `${analysis.sport ?? "unknown"}|${analysis.userType ?? "unknown"}`;
    accumulator[key] = accumulator[key] ?? [];
    accumulator[key].push(analysis);
    return accumulator;
  }, {});
}

export function buildAudienceClusters(analyses: AnalysisWithSignal[]): AudienceClusterDraft[] {
  const candidateAnalyses = analyses.filter(isClusterCandidate);

  if (!candidateAnalyses.length) {
    return [];
  }

  return Object.values(groupAnalysesByTheme(candidateAnalyses))
    .map((group) => {
      const sport = (group[0]?.sport ?? "unknown") as Sport;
      const audienceType = (group[0]?.userType ?? "unknown") as UserType;
      const averageLeadScore = average(group.map((analysis) => analysis.leadIntentScore));
      const averageUrgencyScore = average(group.map((analysis) => analysis.urgencyScore));
      const averageCommercialScore = average(group.map((analysis) => analysis.commercialRelevanceScore));
      const confidenceScore = clamp01((averageLeadScore + averageUrgencyScore + averageCommercialScore) / 3);
      const clusterLabel = getClusterLabel(audienceType, averageLeadScore);
      const geoScope = buildGeoScope(group);

      return {
        name: `${titleCase(sport)} ${clusterLabel}`,
        sport,
        geoScope,
        audienceType,
        summary: buildClusterSummary(group, sport, clusterLabel, geoScope),
        confidenceScore,
        analysisIds: group.map((analysis) => analysis.id)
      };
    })
    .sort((left, right) => right.confidenceScore - left.confidenceScore);
}

