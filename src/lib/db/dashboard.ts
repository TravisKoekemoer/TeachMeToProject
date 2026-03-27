import { unstable_cache } from "next/cache";
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

const DASHBOARD_REVALIDATE_SECONDS = 10;

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

async function loadDashboardData(filters: DashboardFilters) {
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
      select: {
        id: true,
        authorHandle: true,
        postText: true,
        createdAt: true,
        matchedRule: true,
        analysis: {
          select: {
            id: true,
            sport: true,
            relevanceStatus: true,
            leadIntentScore: true,
            commercialRelevanceScore: true,
            cluster: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.audienceCluster.findMany({
      where: clusterWhere,
      select: {
        id: true,
        name: true,
        sport: true,
        geoScope: true,
        audienceType: true,
        summary: true,
        confidenceScore: true,
        recipe: {
          select: {
            id: true,
            audienceName: true
          }
        },
        _count: {
          select: {
            analyses: true
          }
        }
      },
      orderBy: {
        confidenceScore: "desc"
      },
      take: 12
    }),
    prisma.audienceRecipe.findMany({
      where: recipeWhere,
      select: {
        id: true,
        audienceName: true,
        targetSport: true,
        targetLocation: true,
        targetUserType: true,
        suggestedLandingPage: true,
        adAngle: true,
        cta: true,
        confidenceScore: true,
        cluster: {
          select: {
            name: true
          }
        }
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
    clusters: clusters.map((cluster) => ({
      id: cluster.id,
      name: cluster.name,
      sport: cluster.sport,
      geoScope: cluster.geoScope,
      audienceType: cluster.audienceType,
      summary: cluster.summary,
      confidenceScore: cluster.confidenceScore,
      signalCount: cluster._count.analyses,
      recipe: cluster.recipe
    })),
    recipes
  };
}

const getCachedDashboardData = unstable_cache(
  async (sport: string, status: string, score: string, days: string) =>
    loadDashboardData({
      sport,
      status,
      score,
      days
    }),
  ["dashboard-data"],
  {
    revalidate: DASHBOARD_REVALIDATE_SECONDS
  }
);

export async function getDashboardData(filters: DashboardFilters) {
  return getCachedDashboardData(filters.sport, filters.status, filters.score, filters.days);
}

const getCachedSignalDetail = unstable_cache(
  async (id: string) =>
    prisma.signal.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        authorHandle: true,
        postText: true,
        createdAt: true,
        matchedRule: true,
        postUrl: true,
        rawJson: true,
        analysis: {
          select: {
            sport: true,
            relevanceStatus: true,
            leadIntentScore: true,
            userType: true,
            skillLevel: true,
            city: true,
            state: true,
            country: true,
            sentiment: true,
            urgencyScore: true,
            commercialRelevanceScore: true,
            explanation: true,
            cluster: {
              select: {
                recipe: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        }
      }
    }),
  ["signal-detail"],
  {
    revalidate: DASHBOARD_REVALIDATE_SECONDS
  }
);

export async function getSignalDetail(id: string) {
  return getCachedSignalDetail(id);
}

const getCachedRecipeDetail = unstable_cache(
  async (id: string) =>
    prisma.audienceRecipe.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        audienceName: true,
        targetSport: true,
        targetLocation: true,
        targetUserType: true,
        cta: true,
        suggestedLandingPage: true,
        adAngle: true,
        keywordTargets: true,
        conversationTargets: true,
        exclusions: true,
        confidenceScore: true,
        cluster: {
          select: {
            name: true,
            summary: true,
            _count: {
              select: {
                analyses: true
              }
            },
            analyses: {
              select: {
                id: true,
                relevanceStatus: true,
                leadIntentScore: true,
                signal: {
                  select: {
                    id: true,
                    authorHandle: true,
                    postText: true
                  }
                }
              },
              orderBy: {
                leadIntentScore: "desc"
              },
              take: 8
            }
          }
        }
      }
    }),
  ["recipe-detail"],
  {
    revalidate: DASHBOARD_REVALIDATE_SECONDS
  }
);

export async function getRecipeDetail(id: string) {
  return getCachedRecipeDetail(id);
}
