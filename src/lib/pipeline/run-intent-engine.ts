import { seedRules } from "../../data/seed-rules";
import { prisma } from "../prisma";
import { createXSignalProvider } from "../providers/x";
import { classifySignalWithLlm } from "../scoring/classifier";
import { buildFilteredOutAnalysis } from "../scoring/fallback-analysis";
import { matchSignalToRules } from "../scoring/rule-prefilter";
import { stableId } from "../stable-id";
import type { RelevanceStatus } from "../types";
import { generateAudienceClusters } from "./clustering";
import { generateAudienceRecipe } from "./recipe-generator";

type RunOptions = {
  providerMode?: "mock";
};

function normalizeStatus(status: RelevanceStatus) {
  return status;
}

async function runInBatches<T>(items: T[], batchSize: number, worker: (item: T, index: number) => Promise<void>) {
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    await Promise.all(batch.map((item, batchIndex) => worker(item, index + batchIndex)));
  }
}

export async function syncRules() {
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

async function upsertProviderSignals() {
  const provider = createXSignalProvider("mock");
  const providerSignals = await provider.fetchSignals();

  await runInBatches(providerSignals, 24, async (signal) => {
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
        rawJson: signal.rawJson
      },
      create: {
        id: stableId("signal", signal.platformSignalId),
        platformSignalId: signal.platformSignalId,
        authorHandle: signal.authorHandle,
        authorDisplayName: signal.authorDisplayName,
        postText: signal.postText,
        postUrl: signal.postUrl,
        createdAt: new Date(signal.createdAt),
        rawJson: signal.rawJson
      }
    });
  });
}

export async function runIntentToAudienceEngine(_options: RunOptions = {}) {
  await syncRules();
  await upsertProviderSignals();

  const [rules, signals] = await Promise.all([
    prisma.rule.findMany({
      where: {
        enabled: true
      }
    }),
    prisma.signal.findMany({
      orderBy: {
        createdAt: "desc"
      }
    })
  ]);

  await prisma.audienceRecipe.deleteMany();
  await prisma.signalAnalysis.deleteMany();
  await prisma.audienceCluster.deleteMany();

  await runInBatches(signals, 6, async (signal) => {
    const ruleMatch = matchSignalToRules(signal, rules);

    const analysis = ruleMatch ? await classifySignalWithLlm(signal) : buildFilteredOutAnalysis(signal);

    await prisma.$transaction([
      prisma.signal.update({
        where: {
          id: signal.id
        },
        data: {
          matchedRule: ruleMatch?.ruleName ?? null
        }
      }),
      prisma.signalAnalysis.create({
        data: {
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
          relevanceStatus: normalizeStatus(analysis.relevanceStatus),
          explanation: analysis.explanation
        }
      })
    ]);
  });

  const analysesWithSignals = await prisma.signalAnalysis.findMany({
    include: {
      signal: true
    },
    orderBy: {
      leadIntentScore: "desc"
    }
  });

  const clusterDrafts = generateAudienceClusters(analysesWithSignals);

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

  const clustersWithSignals = await prisma.audienceCluster.findMany({
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

  await runInBatches(clustersWithSignals, 4, async (cluster) => {
    const recipe = await generateAudienceRecipe(cluster);

    await prisma.audienceRecipe.create({
      data: {
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

  const summary = await Promise.all([
    prisma.signal.count(),
    prisma.signalAnalysis.count({
      where: {
        relevanceStatus: {
          in: ["RELEVANT", "POSSIBLE"]
        }
      }
    }),
    prisma.audienceCluster.count(),
    prisma.audienceRecipe.count()
  ]);

  return {
    totalSignals: summary[0],
    candidateSignals: summary[1],
    clusters: summary[2],
    recipes: summary[3]
  };
}
