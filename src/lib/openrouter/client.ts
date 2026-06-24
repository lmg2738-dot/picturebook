import OpenAI from "openai";
import { getOpenRouterApiKey, OPENROUTER_BASE_URL } from "./config";

let client: OpenAI | null = null;
let cachedApiKey: string | null = null;

export function getOpenRouterClient(): OpenAI {
  const apiKey = getOpenRouterApiKey();
  if (!client || cachedApiKey !== apiKey) {
    cachedApiKey = apiKey;
    client = new OpenAI({
      apiKey,
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:50003",
        "X-Title": "StorySeed AI",
      },
    });
  }
  return client;
}
