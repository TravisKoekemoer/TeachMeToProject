import type { AudienceCluster, Prisma, Rule, Signal, SignalAnalysis } from "../../generated/prisma/client";

import { seedRules } from "../../data/seed-rules";
import { prisma } from "../prisma";
import { createXIngestionProvider } from "../providers/x";
import { classifySignal } from "../scoring/classifier";
import { buildFilteredOutAnalysis } from "../scoring/fallback-analysis";
import { matchSignalToRules } from "../scoring/rule-prefilter";
import { stableId } from "../stable-id";
import type { PipelineSummary, SignalAnalysisResult } from "../types";
import { buildAudienceClusters } from "./clustering";
import { generateAudienceRecipe } from "./recipe-generator";

type StoredSignal = Pick<
  Signal,
  "id" | "platformSignalId" | "authorHandle" | "authorDisplayName" | "postText" | "postUrl" | "createdAt" | "rawJson"
>;

type AnalysisWithSignal = SignalAnalysis & {
  signal: Signal;
};

type ClusterWithSignals = AudienceCluster & {
  analyses: AnalysisWithSignal[];
};

const INGEST_BATCH_SIZE = 24;
const ANALYSIS_BATCH_SIZE = 6;
const RECIPE_BATCH_SIZE = 4;

function toPrismaJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function runInBatches<T>(items: T[], batchSize: number, worker: (item: T, index: number) => Promise<void>) {
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    await Promise.all(batch.map((item, batchIndex) => worker(item, index + batchIndex)));
  }
}

async function replaceSeedRules() {
  await prisma.rule.deleteMany();

  await prisma.rule.createMany({
    data: seedRules.map((rule) => ({
      id: stableId("rule", `${rule.sport}:${rule.name}`),
      name: rule.name,
      queryText: rule.queryText,
      enabled: rule.enabled,
      sport: rule.sport,
      geographyHint: rule.geographyHint
    }))
  });
}

async function ingestSignalsFromProvider() {
  const provider = createXIngestionProvider();
  const providerSignals = await provider.fetchSignals();

  await runInBatches(providerSignals, INGEST_BATCH_SIZE, async (signal) => {
    await prisma.signal.upsert({
      where: {
        platformSignalId: signal.platformSignalId
      },
      update: {
        authorHandle: signal.authorHandle,
        authorDisplayName: signal.authorDisplayName,
        postText: signal.postText,
        postUrl: signal.postUrl,
        createdAt: new Date(signal.createdAt),
        rawJson: toPrismaJson(signal.rawJson)
      },
      create: {
        id: stableId("signal", signal.platformSignalId),
        platformSignalId: signal.platformSignalId,
        authorHandle: signal.authorHandle,
        authorDisplayName: signal.authorDisplayName,
        postText: signal.postText,
        postUrl: signal.postUrl,
        createdAt: new Date(signal.createdAt),
        rawJson: toPrismaJson(signal.rawJson)
      }
    });
  });
}

async function clearDerivedData() {
  await prisma.audienceRecipe.deleteMany();
  await prisma.signalAnalysis.deleteMany();
  await prisma.audienceCluster.deleteMany();
}

async function loadRules() {
  return prisma.rule.findMany({
    where: {
      enabled: true
    }
  });
}

async function loadSignals(): Promise<StoredSignal[]> {
  return prisma.signal.findMany({
    select: {
      id: true,
      platformSignalId: true,
      authorHandle: true,
      authorDisplayName: true,
      postText: true,
      postUrl: true,
      createdAt: true,
      rawJson: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

async function analyzeStoredSignal(signal: StoredSignal, rules: Rule[]) {
  const ruleMatch = matchSignalToRules(signal, rules);
  const analysis: SignalAnalysisResult = ruleMatch ? await classifySignal(signal) : buildFilteredOutAnalysis(signal);

  return {
    matchedRule: ruleMatch?.ruleName ?? null,
    analysis
  };
}

async function persistSignalAnalysis(signal: StoredSignal, matchedRule: string | null, analysis: SignalAnalysisResult) {
  // Keep seed/pipeline writes compatible with Neon HTTP mode by avoiding
  // interactive transactions in the runtime client.
  await prisma.signal.update({
    where: {
      id: signal.id
    },
    data: {
      matchedRule
    }
  });

  await prisma.signalAnalysis.upsert({
    where: {
      signalId: signal.id
    },
    update: {
      sport: analysis.sport,
      city: analysis.city,
      state: analysis.state,
      country: analysis.country,
      userType: analysis.userType,
      skillLevel: analysis.skillLevel,
      leadIntentScore: analysis.leadIntentScore,
      urgencyScore: analysis.urgencyScore,
      commercialRelevanceScore: analysis.commercialRelevanceScore,
      sentiment: analysis.sentiment,
      relevanceStatus: analysis.relevanceStatus,
      explanation: analysis.explanation,
      clusterId: null
    },
    create: {
      id: stableId("analysis", signal.platformSignalId),
      signalId: signal.id,
      sport: analysis.sport,
      city: analysis.city,
      state: analysis.state,
      country: analysis.country,
      userType: analysis.userType,
      skillLevel: analysis.skillLevel,
      leadIntentScore: analysis.leadIntentScore,
      urgencyScore: analysis.urgencyScore,
      commercialRelevanceScore: analysis.commercialRelevanceScore,
      sentiment: analysis.sentiment,
      relevanceStatus: analysis.relevanceStatus,
      explanation: analysis.explanation
    }
  });
}

async function analyzeSignals(signals: StoredSignal[], rules: Rule[]) {
  if (!signals.length) {
    return;
  }

  await runInBatches(signals, ANALYSIS_BATCH_SIZE, async (signal) => {
    const { matchedRule, analysis } = await analyzeStoredSignal(signal, rules);
    await persistSignalAnalysis(signal, matchedRule, analysis);
  });
}

async function materializeAudienceClusters(): Promise<ClusterWithSignals[]> {
  const analyses = await prisma.signalAnalysis.findMany({
    include: {
      signal: true
    },
    orderBy: {
      leadIntentScore: "desc"
    }
  });

  const clusterDrafts = buildAudienceClusters(analyses);

  if (!clusterDrafts.length) {
    return [];
  }

  for (const clusterDraft of clusterDrafts) {
    const clusterId = stableId(
      "cluster",
      `${clusterDraft.sport}|${clusterDraft.audienceType}|${clusterDraft.geoScope}|${clusterDraft.name}`
    );

    const cluster = await prisma.audienceCluster.create({
      data: {
        id: clusterId,
        name: clusterDraft.name,
        sport: clusterDraft.sport,
        geoScope: clusterDraft.geoScope,
        audienceType: clusterDraft.audienceType,
        summary: clusterDraft.summary,
        confidenceScore: clusterDraft.confidenceScore
      }
    });

    await prisma.signalAnalysis.updateMany({
      where: {
        id: {
          in: clusterDraft.analysisIds
        }
      },
      data: {
        clusterId: cluster.id
      }
    });
  }

  return prisma.audienceCluster.findMany({
    include: {
      analyses: {
        include: {
          signal: true
        },
        orderBy: {
          leadIntentScore: "desc"
        }
      }
    },
    orderBy: {
      confidenceScore: "desc"
    }
  });
}

async function materializeAudienceRecipes(clusters: ClusterWithSignals[]) {
  if (!clusters.length) {
    return;
  }

  await runInBatches(clusters, RECIPE_BATCH_SIZE, async (cluster) => {
    const recipe = await generateAudienceRecipe(cluster);

    await prisma.audienceRecipe.upsert({
      where: {
        clusterId: cluster.id
      },
      update: {
        audienceName: recipe.audienceName,
        targetSport: recipe.targetSport,
        targetLocation: recipe.targetLocation,
        targetUserType: recipe.targetUserType,
        keywordTargets: recipe.keywordTargets,
        conversationTargets: recipe.conversationTargets,
        exclusions: recipe.exclusions,
        suggestedLandingPage: recipe.suggestedLandingPage,
        adAngle: recipe.adAngle,
        cta: recipe.cta,
        confidenceScore: recipe.confidenceScore
      },
      create: {
        id: stableId("recipe", cluster.id),
        clusterId: cluster.id,
        audienceName: recipe.audienceName,
        targetSport: recipe.targetSport,
        targetLocation: recipe.targetLocation,
        targetUserType: recipe.targetUserType,
        keywordTargets: recipe.keywordTargets,
        conversationTargets: recipe.conversationTargets,
        exclusions: recipe.exclusions,
        suggestedLandingPage: recipe.suggestedLandingPage,
        adAngle: recipe.adAngle,
        cta: recipe.cta,
        confidenceScore: recipe.confidenceScore
      }
    });
  });
}

async function buildPipelineSummary(): Promise<PipelineSummary> {
  const [totalSignals, candidateSignals, clusters, recipes] = await Promise.all([
    prisma.signal.count(),
    prisma.signal.count({
      where: {
        matchedRule: {
          not: null
        }
      }
    }),
    prisma.audienceCluster.count(),
    prisma.audienceRecipe.count()
  ]);

  return {
    totalSignals,
    candidateSignals,
    clusters,
    recipes
  };
}

export async function runIntentToAudienceEngine(): Promise<PipelineSummary> {
  await replaceSeedRules();
  await ingestSignalsFromProvider();
  await clearDerivedData();

  const [rules, signals] = await Promise.all([loadRules(), loadSignals()]);

  if (!signals.length) {
    return buildPipelineSummary();
  }

  await analyzeSignals(signals, rules);

  const clusters = await materializeAudienceClusters();
  await materializeAudienceRecipes(clusters);

  return buildPipelineSummary();
}

