import type { AudienceCluster, SignalAnalysis, Signal } from "@prisma/client";

import { getOpenAIClient, getOpenAIModel, shouldUseMockLlm } from "../openai";
import type { AudienceRecipeDraft, UserType } from "../types";
import { clamp01, safeJsonParse, titleCase } from "../utils";

type ClusterContext = AudienceCluster & {
  analyses: Array<SignalAnalysis & { signal: Signal }>;
};

function recipeTemplate(cluster: ClusterContext): AudienceRecipeDraft {
  const userType = (cluster.audienceType || "unknown") as UserType;
  const keywordStem =
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
    keywordTargets: keywordStem,
    conversationTargets: cluster.analyses.slice(0, 5).map((analysis) => `@${analysis.signal.authorHandle}`),
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

function normalizeRecipe(recipe: Partial<AudienceRecipeDraft>, fallback: AudienceRecipeDraft): AudienceRecipeDraft {
  return {
    audienceName: recipe.audienceName || fallback.audienceName,
    targetSport: (recipe.targetSport || fallback.targetSport) as AudienceRecipeDraft["targetSport"],
    targetLocation: recipe.targetLocation || fallback.targetLocation,
    targetUserType: (recipe.targetUserType || fallback.targetUserType) as AudienceRecipeDraft["targetUserType"],
    keywordTargets: recipe.keywordTargets?.length ? recipe.keywordTargets : fallback.keywordTargets,
    conversationTargets: recipe.conversationTargets?.length ? recipe.conversationTargets : fallback.conversationTargets,
    exclusions: recipe.exclusions?.length ? recipe.exclusions : fallback.exclusions,
    suggestedLandingPage: recipe.suggestedLandingPage || fallback.suggestedLandingPage,
    adAngle: recipe.adAngle || fallback.adAngle,
    cta: recipe.cta || fallback.cta,
    confidenceScore: clamp01(Number(recipe.confidenceScore ?? fallback.confidenceScore))
  };
}

export async function generateAudienceRecipe(cluster: ClusterContext): Promise<AudienceRecipeDraft> {
  const fallback = recipeTemplate(cluster);

  if (shouldUseMockLlm()) {
    return fallback;
  }

  const client = getOpenAIClient();

  if (!client) {
    return fallback;
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
            requiredShape: fallback
          })
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    const payload = typeof content === "string" ? content : Array.isArray(content) ? content.map((part) => ("text" in part ? part.text : "")).join("") : "";
    const parsed = safeJsonParse<Partial<AudienceRecipeDraft>>(payload, {});

    return normalizeRecipe(parsed, fallback);
  } catch {
    return fallback;
  }
}
