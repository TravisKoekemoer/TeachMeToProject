import OpenAI from "openai";

import { getAppRuntimeConfig } from "./config";

let cachedClient: OpenAI | null | undefined;

export function getOpenAIClient() {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const config = getAppRuntimeConfig();

  if (config.llmMode !== "live" || !config.openAiApiKey) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = new OpenAI({
    apiKey: config.openAiApiKey
  });

  return cachedClient;
}

export function shouldUseMockLlm() {
  return getAppRuntimeConfig().llmMode === "mock";
}

export function getOpenAIModel() {
  return getAppRuntimeConfig().openAiModel;
}
