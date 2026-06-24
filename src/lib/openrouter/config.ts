export function getOpenRouterApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY가 설정되지 않았습니다. .env.local에 OpenRouter API 키를 입력한 뒤 서버를 재시작해 주세요."
    );
  }
  return key;
}

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const OPENROUTER_HEADERS = {
  "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:50003",
  "X-Title": "StorySeed AI",
};
