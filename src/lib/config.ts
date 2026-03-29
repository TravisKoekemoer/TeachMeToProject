export type RuntimeNoticeLevel = "info" | "warning" | "error";

export type RuntimeNotice = {
  level: RuntimeNoticeLevel;
  title: string;
  message: string;
};

export type XProviderMode = "mock";
export type LlmMode = "mock" | "live";

export type AppRuntimeConfig = {
  databaseUrl: string | null;
  directUrl: string | null;
  runtimeDatabaseUrl: string | null;
  openAiApiKey: string | null;
  openAiModel: string;
  llmMode: LlmMode;
  xProviderMode: XProviderMode;
  isDatabaseConfigured: boolean;
  isDirectUrlConfigured: boolean;
  isOpenAiConfigured: boolean;
  notices: RuntimeNotice[];
};

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

let cachedConfig: AppRuntimeConfig | undefined;

function pushNotice(notices: RuntimeNotice[], level: RuntimeNoticeLevel, title: string, message: string) {
  notices.push({ level, title, message });
}

export function getAppRuntimeConfig(): AppRuntimeConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const notices: RuntimeNotice[] = [];
  const databaseUrl = process.env.DATABASE_URL?.trim() || null;
  const directUrl = process.env.DIRECT_URL?.trim() || null;
  const runtimeDatabaseUrl = directUrl || databaseUrl;
  const openAiApiKey = process.env.OPENAI_API_KEY?.trim() || null;
  const configuredModel = process.env.OPENAI_MODEL?.trim();
  const openAiModel = configuredModel || DEFAULT_OPENAI_MODEL;
  const rawMockMode = process.env.MOCK_OPENAI_MODE?.trim().toLowerCase();
  const rawProviderMode = process.env.X_PROVIDER_MODE?.trim().toLowerCase();

  if (!runtimeDatabaseUrl) {
    pushNotice(
      notices,
      "error",
      "Missing database connection URL",
      "Set DIRECT_URL or DATABASE_URL in .env before running the app or seeding the database."
    );
  }

  if (!directUrl) {
    pushNotice(
      notices,
      "warning",
      "Missing DIRECT_URL",
      "TeachMeGTM runs most reliably against Neon using DIRECT_URL. The app will fall back to DATABASE_URL if needed."
    );
  }

  if (!databaseUrl) {
    pushNotice(
      notices,
      "info",
      "Missing DATABASE_URL",
      "DATABASE_URL is optional in this local setup because the app can run from DIRECT_URL alone."
    );
  }

  if (!configuredModel) {
    pushNotice(
      notices,
      "info",
      "Using default OpenAI model",
      `OPENAI_MODEL is not set, so the app will use ${DEFAULT_OPENAI_MODEL}.`
    );
  }

  let llmMode: LlmMode = "mock";

  if (rawMockMode === undefined || rawMockMode === "" || rawMockMode === "true") {
    llmMode = "mock";
  } else if (rawMockMode === "false") {
    if (openAiApiKey) {
      llmMode = "live";
    } else {
      pushNotice(
        notices,
        "warning",
        "OpenAI key missing",
        "MOCK_OPENAI_MODE is false, but OPENAI_API_KEY is missing. Falling back to mock scoring and recipe generation."
      );
      llmMode = "mock";
    }
  } else {
    pushNotice(
      notices,
      "warning",
      "Invalid MOCK_OPENAI_MODE",
      'Use MOCK_OPENAI_MODE="true" or MOCK_OPENAI_MODE="false". Falling back to mock mode.'
    );
    llmMode = "mock";
  }

  let xProviderMode: XProviderMode = "mock";

  if (rawProviderMode && rawProviderMode !== "mock") {
    pushNotice(
      notices,
      "warning",
      "Unsupported X provider mode",
      `X_PROVIDER_MODE="${rawProviderMode}" is not supported in v1. Falling back to mock ingestion.`
    );
    xProviderMode = "mock";
  }

  cachedConfig = {
    databaseUrl,
    directUrl,
    runtimeDatabaseUrl,
    openAiApiKey,
    openAiModel,
    llmMode,
    xProviderMode,
    isDatabaseConfigured: Boolean(runtimeDatabaseUrl),
    isDirectUrlConfigured: Boolean(directUrl),
    isOpenAiConfigured: Boolean(openAiApiKey),
    notices
  };

  return cachedConfig;
}

export function getRuntimeNotices() {
  return getAppRuntimeConfig().notices;
}

export function getBlockingEnvironmentErrors() {
  return getAppRuntimeConfig().notices.filter((notice) => notice.level === "error");
}

export function hasBlockingEnvironmentErrors() {
  return getBlockingEnvironmentErrors().length > 0;
}