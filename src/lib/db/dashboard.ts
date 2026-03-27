import type { Prisma } from "@prisma/client";

import { prisma } from "../prisma";

export type DashboardFilters = {
  sport: string;
  status: string;
  score: string;
  days: string;
};

export const defaultDashboardFilters: DashboardFilters = {
  sport: "all",
  status: "all",
  score: "all",
  days: "30"
};

function thresholdFromScore(value: string) {
  if (value === "high") return 0.75;
  if (value === "medium") return 0.5;
  if (value === "low") return 0.25;
  return null;
}

function dateFromDays(value: string) {
  if (value === "all") {
    return null;
  }

  const days = Number(value);

  if (!Number.isFinite(days) || days <= 0) {
    return null;
  }

  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export function normalizeDashboardFilters(input?: Partial<Record<string, string | string[] | undefined>>): DashboardFilters {
  const value = (key: keyof DashboardFilters) => {
    const raw = input?.[key];
    return Array.isArray(raw) ? raw[0] ?? defaultDashboardFilters[key] : raw ?? defaultDashboardFilters[key];
  };

  return {
    sport: value("sport"),
    status: value("status"),
    score: value("score"),
    days: value("days")
  };
}

export async function getDashboardData(filters: DashboardFilters) {
  const scoreThreshold = thresholdFromScore(filters.score);
  const fromDate = dateFromDays(filters.days);

  const analysisWhere: Prisma.SignalAnalysisWhereInput = {
    ...(filters.sport !== "all" ? { sport: filters.sport } : {}),
    ...(filters.status !== "all" ? { relevanceStatus: filters.status } : {}),
    ...(scoreThreshold !== null ? { leadIntentScore: { gte: scoreThreshold } } : {})
  };

  const signalWhere: Prisma.SignalWhereInput = {
    ...(fromDate ? { createdAt: { gte: fromDate } } : {}),
    ...(Object.keys(analysisWhere).length > 0
      ? {
          analysis: {
            is: analysisWhere
          }
        }
      : {})
  };

  const clusterWhere: Prisma.AudienceClusterWhereInput = {
    ...(filters.sport !== "all" ? { sport: filters.sport } : {})
  };

  const recipeWhere: Prisma.AudienceRecipeWhereInput = {
    ...(filters.sport !== "all" ? { targetSport: filters.sport } : {})
  };

  const [summary, rawSignals, clusters, recipes] = await Promise.all([
    Promise.all([
      prisma.signal.count(),
      prisma.signal.count({
        where: {
          matchedRule: {
            not: null
          }
        }
      }),
      prisma.signalAnalysis.count({
        where: {
          relevanceStatus: "RELEVANT"
        }
      }),
      prisma.audienceCluster.count(),
      prisma.audienceRecipe.count()
    ]),
    prisma.signal.findMany({
      where: signalWhere,
      include: {
        analysis: {
          include: {
            cluster: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.audienceCluster.findMany({
      where: clusterWhere,
      include: {
        analyses: true,
        recipe: true
      },
      orderBy: {
        confidenceScore: "desc"
      },
      take: 12
    }),
    prisma.audienceRecipe.findMany({
      where: recipeWhere,
      include: {
        cluster: true
      },
      orderBy: {
        confidenceScore: "desc"
      },
      take: 8
    })
  ]);

  const signals = rawSignals.sort((left, right) => {
    const leftScore = left.analysis?.leadIntentScore ?? -1;
    const rightScore = right.analysis?.leadIntentScore ?? -1;

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    const leftCommercial = left.analysis?.commercialRelevanceScore ?? -1;
    const rightCommercial = right.analysis?.commercialRelevanceScore ?? -1;

    if (rightCommercial !== leftCommercial) {
      return rightCommercial - leftCommercial;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });

  return {
    summary: {
      totalSignals: summary[0],
      candidateSignals: summary[1],
      relevantSignals: summary[2],
      clusterCount: summary[3],
      recipeCount: summary[4]
    },
    signals,
    clusters,
    recipes
  };
}

export async function getSignalDetail(id: string) {
  return prisma.signal.findUnique({
    where: {
      id
    },
    include: {
      analysis: {
        include: {
          cluster: {
            include: {
              recipe: true
            }
          }
        }
      }
    }
  });
}

export async function getRecipeDetail(id: string) {
  return prisma.audienceRecipe.findUnique({
    where: {
      id
    },
    include: {
      cluster: {
        include: {
          analyses: {
            include: {
              signal: true
            },
            orderBy: {
              leadIntentScore: "desc"
            }
          }
        }
      }
    }
  });
}
