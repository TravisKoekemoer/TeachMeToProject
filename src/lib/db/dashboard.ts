import type { Prisma } from "../../generated/prisma/client";

import { prisma } from "../prisma";
import type {
  DashboardClusterListItem,
  DashboardData,
  DashboardRecipeListItem,
  DashboardSignalListItem,
  DashboardSummary,
  RecipeDetailData,
  RelevanceStatus,
  SignalDetailData,
  SkillLevel,
  Sentiment,
  Sport,
  UserType
} from "../types";

const ALLOWED_SPORT_FILTERS = ["all", "tennis", "golf", "pickleball"] as const;
const ALLOWED_STATUS_FILTERS = ["all", "RELEVANT", "POSSIBLE", "IRRELEVANT", "FILTERED_OUT"] as const;
const ALLOWED_SCORE_FILTERS = ["all", "high", "medium", "low"] as const;
const ALLOWED_DAY_FILTERS = ["7", "30", "90", "all"] as const;

type DashboardSportFilter = (typeof ALLOWED_SPORT_FILTERS)[number];
type DashboardStatusFilter = (typeof ALLOWED_STATUS_FILTERS)[number];
type DashboardScoreFilter = (typeof ALLOWED_SCORE_FILTERS)[number];
type DashboardDayFilter = (typeof ALLOWED_DAY_FILTERS)[number];

type SortableDashboardSignalRow = {
  id: string;
  authorHandle: string;
  postText: string;
  createdAt: Date;
  matchedRule: string | null;
  analysis:
    | {
        id: string;
        sport: Sport | null;
        relevanceStatus: RelevanceStatus;
        leadIntentScore: number;
        commercialRelevanceScore: number;
        cluster: {
          name: string;
        } | null;
      }
    | null;
};

export type DashboardFilters = {
  sport: DashboardSportFilter;
  status: DashboardStatusFilter;
  score: DashboardScoreFilter;
  days: DashboardDayFilter;
};

export const defaultDashboardFilters: DashboardFilters = {
  sport: "all",
  status: "all",
  score: "all",
  days: "all"
};

function normalizeChoice<T extends readonly string[]>(
  rawValue: string | string[] | undefined,
  allowedValues: T,
  fallbackValue: T[number]
): T[number] {
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  return value && allowedValues.includes(value as T[number]) ? (value as T[number]) : fallbackValue;
}

function thresholdFromScore(value: DashboardScoreFilter) {
  if (value === "high") return 0.75;
  if (value === "medium") return 0.5;
  if (value === "low") return 0.25;
  return null;
}

function dateFromDays(value: DashboardDayFilter) {
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

function mapDashboardSummary(summary: [number, number, number, number, number]): DashboardSummary {
  return {
    totalSignals: summary[0],
    candidateSignals: summary[1],
    relevantSignals: summary[2],
    clusterCount: summary[3],
    recipeCount: summary[4]
  };
}

function sortSignalRows(rows: SortableDashboardSignalRow[]) {
  return rows.sort((left, right) => {
    const leftLead = left.analysis?.leadIntentScore ?? -1;
    const rightLead = right.analysis?.leadIntentScore ?? -1;

    if (rightLead !== leftLead) {
      return rightLead - leftLead;
    }

    const leftCommercial = left.analysis?.commercialRelevanceScore ?? -1;
    const rightCommercial = right.analysis?.commercialRelevanceScore ?? -1;

    if (rightCommercial !== leftCommercial) {
      return rightCommercial - leftCommercial;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}

function toDashboardSignalListItem(signal: SortableDashboardSignalRow): DashboardSignalListItem {
  return {
    id: signal.id,
    authorHandle: signal.authorHandle,
    postText: signal.postText,
    createdAt: signal.createdAt,
    matchedRule: signal.matchedRule,
    analysis: signal.analysis
      ? {
          id: signal.analysis.id,
          sport: signal.analysis.sport,
          relevanceStatus: signal.analysis.relevanceStatus,
          leadIntentScore: signal.analysis.leadIntentScore,
          cluster: signal.analysis.cluster
        }
      : null
  };
}

export function createEmptyDashboardData(): DashboardData {
  return {
    summary: {
      totalSignals: 0,
      candidateSignals: 0,
      relevantSignals: 0,
      clusterCount: 0,
      recipeCount: 0
    },
    signals: [],
    clusters: [],
    recipes: []
  };
}

function formatDatabaseReadError(error: unknown) {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === "object" && error !== null && "type" in error) {
    const maybeType = (error as { type?: unknown }).type;
    const maybeMessage = (error as { message?: unknown }).message;
    const eventType = typeof maybeType === "string" ? maybeType : "unknown";
    const eventMessage = typeof maybeMessage === "string" && maybeMessage.length > 0 ? `: ${maybeMessage}` : "";

    return `Driver event (${eventType})${eventMessage}`;
  }

  return "Unknown database read error";
}

function logDatabaseReadError(scope: string, error: unknown) {
  console.error(`[dashboard:${scope}] ${formatDatabaseReadError(error)}`, error);
}

export function normalizeDashboardFilters(input?: Partial<Record<string, string | string[] | undefined>>): DashboardFilters {
  return {
    sport: normalizeChoice(input?.sport, ALLOWED_SPORT_FILTERS, defaultDashboardFilters.sport),
    status: normalizeChoice(input?.status, ALLOWED_STATUS_FILTERS, defaultDashboardFilters.status),
    score: normalizeChoice(input?.score, ALLOWED_SCORE_FILTERS, defaultDashboardFilters.score),
    days: normalizeChoice(input?.days, ALLOWED_DAY_FILTERS, defaultDashboardFilters.days)
  };
}

async function loadDashboardData(filters: DashboardFilters): Promise<DashboardData> {
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

  const [summary, rawSignals, rawClusters, rawRecipes] = await Promise.all([
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

  const signals = sortSignalRows(
    rawSignals.map((signal) => ({
      id: signal.id,
      authorHandle: signal.authorHandle,
      postText: signal.postText,
      createdAt: signal.createdAt,
      matchedRule: signal.matchedRule,
      analysis: signal.analysis
        ? {
            id: signal.analysis.id,
            sport: signal.analysis.sport as Sport | null,
            relevanceStatus: signal.analysis.relevanceStatus as RelevanceStatus,
            leadIntentScore: signal.analysis.leadIntentScore,
            commercialRelevanceScore: signal.analysis.commercialRelevanceScore,
            cluster: signal.analysis.cluster
          }
        : null
    }))
  ).map(toDashboardSignalListItem);

  const clusters: DashboardClusterListItem[] = rawClusters.map((cluster) => ({
    id: cluster.id,
    name: cluster.name,
    sport: cluster.sport as Sport,
    geoScope: cluster.geoScope,
    audienceType: cluster.audienceType as UserType,
    summary: cluster.summary,
    confidenceScore: cluster.confidenceScore,
    signalCount: cluster._count.analyses,
    recipe: cluster.recipe
  }));

  const recipes: DashboardRecipeListItem[] = rawRecipes.map((recipe) => ({
    id: recipe.id,
    audienceName: recipe.audienceName,
    targetSport: recipe.targetSport as Sport,
    targetLocation: recipe.targetLocation,
    targetUserType: recipe.targetUserType as UserType,
    suggestedLandingPage: recipe.suggestedLandingPage,
    adAngle: recipe.adAngle,
    cta: recipe.cta,
    confidenceScore: recipe.confidenceScore,
    cluster: {
      name: recipe.cluster.name
    }
  }));

  return {
    summary: mapDashboardSummary(summary),
    signals,
    clusters,
    recipes
  };
}

export async function getDashboardData(filters: DashboardFilters) {
  try {
    return await loadDashboardData(filters);
  } catch (error) {
    logDatabaseReadError("load", error);
    return createEmptyDashboardData();
  }
}

export async function getSignalDetail(id: string): Promise<SignalDetailData | null> {
  const signal = await prisma.signal.findUnique({
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
  });

  if (!signal) {
    return null;
  }

  return {
    id: signal.id,
    authorHandle: signal.authorHandle,
    postText: signal.postText,
    createdAt: signal.createdAt,
    matchedRule: signal.matchedRule,
    postUrl: signal.postUrl,
    rawJson: signal.rawJson,
    analysis: signal.analysis
      ? {
          sport: signal.analysis.sport as Sport | null,
          relevanceStatus: signal.analysis.relevanceStatus as RelevanceStatus,
          leadIntentScore: signal.analysis.leadIntentScore,
          userType: signal.analysis.userType as UserType | null,
          skillLevel: signal.analysis.skillLevel as SkillLevel | null,
          city: signal.analysis.city,
          state: signal.analysis.state,
          country: signal.analysis.country,
          sentiment: signal.analysis.sentiment as Sentiment | null,
          urgencyScore: signal.analysis.urgencyScore,
          commercialRelevanceScore: signal.analysis.commercialRelevanceScore,
          explanation: signal.analysis.explanation,
          cluster: signal.analysis.cluster
        }
      : null
  };
}

export async function getRecipeDetail(id: string): Promise<RecipeDetailData | null> {
  const recipe = await prisma.audienceRecipe.findUnique({
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
  });

  if (!recipe) {
    return null;
  }

  return {
    id: recipe.id,
    audienceName: recipe.audienceName,
    targetSport: recipe.targetSport as Sport,
    targetLocation: recipe.targetLocation,
    targetUserType: recipe.targetUserType as UserType,
    cta: recipe.cta,
    suggestedLandingPage: recipe.suggestedLandingPage,
    adAngle: recipe.adAngle,
    keywordTargets: recipe.keywordTargets,
    conversationTargets: recipe.conversationTargets,
    exclusions: recipe.exclusions,
    confidenceScore: recipe.confidenceScore,
    cluster: {
      name: recipe.cluster.name,
      summary: recipe.cluster.summary,
      signalCount: recipe.cluster._count.analyses,
      analyses: recipe.cluster.analyses.map((analysis) => ({
        id: analysis.id,
        relevanceStatus: analysis.relevanceStatus as RelevanceStatus,
        leadIntentScore: analysis.leadIntentScore,
        signal: analysis.signal
      }))
    }
  };
}