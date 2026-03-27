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

