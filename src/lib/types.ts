export type Sport = "tennis" | "golf" | "pickleball" | "unknown";
export type UserType =
  | "adult_beginner"
  | "parent_youth"
  | "general_improver"
  | "competitive_player"
  | "casual_player"
  | "unknown";
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "unknown";
export type Sentiment = "positive" | "neutral" | "frustrated" | "unknown";
export type RelevanceStatus = "RELEVANT" | "POSSIBLE" | "FILTERED_OUT" | "IRRELEVANT";

export type SignalAnalysisResult = {
  sport: Sport;
  city: string | null;
  state: string | null;
  country: string | null;
  userType: UserType;
  skillLevel: SkillLevel;
  leadIntentScore: number;
  urgencyScore: number;
  commercialRelevanceScore: number;
  sentiment: Sentiment;
  relevanceStatus: RelevanceStatus;
  explanation: string;
};

export type AudienceClusterDraft = {
  name: string;
  sport: Sport;
  geoScope: string;
  audienceType: UserType;
  summary: string;
  confidenceScore: number;
  analysisIds: string[];
};

export type AudienceRecipeDraft = {
  audienceName: string;
  targetSport: Sport;
  targetLocation: string;
  targetUserType: UserType;
  keywordTargets: string[];
  conversationTargets: string[];
  exclusions: string[];
  suggestedLandingPage: string;
  adAngle: string;
  cta: string;
  confidenceScore: number;
};

export type PipelineSummary = {
  totalSignals: number;
  candidateSignals: number;
  clusters: number;
  recipes: number;
};

export type DashboardSummary = {
  totalSignals: number;
  candidateSignals: number;
  relevantSignals: number;
  clusterCount: number;
  recipeCount: number;
};

export type DashboardSignalListItem = {
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
        cluster: {
          name: string;
        } | null;
      }
    | null;
};

export type DashboardClusterListItem = {
  id: string;
  name: string;
  sport: Sport;
  geoScope: string;
  audienceType: UserType;
  summary: string;
  confidenceScore: number;
  signalCount: number;
  recipe: {
    id: string;
    audienceName: string;
  } | null;
};

export type DashboardRecipeListItem = {
  id: string;
  audienceName: string;
  targetSport: Sport;
  targetLocation: string;
  targetUserType: UserType;
  suggestedLandingPage: string;
  adAngle: string;
  cta: string;
  confidenceScore: number;
  cluster: {
    name: string;
  };
};

export type DashboardData = {
  summary: DashboardSummary;
  signals: DashboardSignalListItem[];
  clusters: DashboardClusterListItem[];
  recipes: DashboardRecipeListItem[];
};

export type SignalDetailData = {
  id: string;
  authorHandle: string;
  postText: string;
  createdAt: Date;
  matchedRule: string | null;
  postUrl: string;
  rawJson: unknown;
  analysis:
    | {
        sport: Sport | null;
        relevanceStatus: RelevanceStatus;
        leadIntentScore: number;
        userType: UserType | null;
        skillLevel: SkillLevel | null;
        city: string | null;
        state: string | null;
        country: string | null;
        sentiment: Sentiment | null;
        urgencyScore: number;
        commercialRelevanceScore: number;
        explanation: string;
        cluster: {
          recipe: {
            id: string;
          } | null;
        } | null;
      }
    | null;
};

export type RecipeDetailData = {
  id: string;
  audienceName: string;
  targetSport: Sport;
  targetLocation: string;
  targetUserType: UserType;
  cta: string;
  suggestedLandingPage: string;
  adAngle: string;
  keywordTargets: string[];
  conversationTargets: string[];
  exclusions: string[];
  confidenceScore: number;
  cluster: {
    name: string;
    summary: string;
    signalCount: number;
    analyses: Array<{
      id: string;
      relevanceStatus: RelevanceStatus;
      leadIntentScore: number;
      signal: {
        id: string;
        authorHandle: string;
        postText: string;
      };
    }>;
  };
};
