import OpenAI from "openai";

let cachedClient: OpenAI | null | undefined;

export function getOpenAIClient() {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  if (!process.env.OPENAI_API_KEY) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  return cachedClient;
}

export function shouldUseMockLlm() {
  return process.env.MOCK_OPENAI_MODE !== "false" || !process.env.OPENAI_API_KEY;
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

