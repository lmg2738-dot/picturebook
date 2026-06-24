import fs from "fs/promises";
import path from "path";
import { getOpenRouterApiKey, OPENROUTER_BASE_URL } from "./config";

export type ModelCapability = "text" | "image";

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length?: number;
}

interface ModelsCache {
  fetchedAt: number;
  text: OpenRouterModel[];
  image: OpenRouterModel[];
}

interface BlocklistData {
  models: Record<string, { reason: string; blockedAt: string }>;
}

const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_MODEL_ATTEMPTS = 5;
const DATA_DIR = path.join(process.cwd(), "data");
const BLOCKLIST_PATH = path.join(DATA_DIR, "blocked-models.json");

let cache: ModelsCache | null = null;
let blocklistCache: BlocklistData | null = null;
const workingModels: Partial<Record<ModelCapability, string>> = {};

function isFreePricing(
  pricing: { prompt?: string; completion?: string; image?: string; request?: string } | undefined,
  capability: ModelCapability
): boolean {
  if (!pricing) return false;
  const prompt = parseFloat(pricing.prompt ?? "1");
  const completion = parseFloat(pricing.completion ?? "1");
  if (prompt !== 0 || completion !== 0) return false;
  if (capability === "image") {
    return parseFloat(pricing.image ?? "1") === 0;
  }
  return true;
}

async function loadBlocklist(): Promise<BlocklistData> {
  if (blocklistCache) return blocklistCache;
  try {
    const raw = await fs.readFile(BLOCKLIST_PATH, "utf-8");
    blocklistCache = JSON.parse(raw) as BlocklistData;
  } catch {
    blocklistCache = { models: {} };
  }
  return blocklistCache;
}

export async function blockModel(modelId: string, reason: string): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const blocklist = await loadBlocklist();
  blocklist.models[modelId] = { reason, blockedAt: new Date().toISOString() };
  blocklistCache = blocklist;
  await fs.writeFile(BLOCKLIST_PATH, JSON.stringify(blocklist, null, 2));
  cache = null;
  if (workingModels.text === modelId) delete workingModels.text;
  if (workingModels.image === modelId) delete workingModels.image;
  console.warn(`[OpenRouter] Model blocked: ${modelId} — ${reason}`);
}

function shouldBlockModel(message: string): boolean {
  return (
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("No endpoints") ||
    message.includes("invalid model") ||
    message.includes("does not exist")
  );
}

/** API 1회 호출로 텍스트·이미지 모델 목록을 함께 캐시합니다. */
async function refreshModelCache(): Promise<ModelsCache> {
  const headers = { Authorization: `Bearer ${getOpenRouterApiKey()}` };

  const [allRes, imageRes] = await Promise.all([
    fetch(`${OPENROUTER_BASE_URL}/models?max_price=0`, { headers, next: { revalidate: 3600 } }),
    fetch(`${OPENROUTER_BASE_URL}/models?output_modalities=image&max_price=0`, {
      headers,
      next: { revalidate: 3600 },
    }),
  ]);

  if (!allRes.ok) {
    throw new Error(`OpenRouter 모델 목록 조회 실패 (${allRes.status})`);
  }

  const json = (await allRes.json()) as {
    data?: Array<{
      id: string;
      name?: string;
      context_length?: number;
      pricing?: { prompt?: string; completion?: string; image?: string; request?: string };
      architecture?: { output_modalities?: string[] };
    }>;
  };

  const imageJson = imageRes.ok
    ? ((await imageRes.json()) as typeof json)
    : { data: [] as NonNullable<typeof json.data> };

  const blocklist = await loadBlocklist();
  const blocked = blocklist.models;

  const toModel = (m: NonNullable<(typeof json.data)>[number]): OpenRouterModel => ({
    id: m.id,
    name: m.name ?? m.id,
    context_length: m.context_length,
  });

  const text: OpenRouterModel[] = [];
  const image: OpenRouterModel[] = [];
  const imageIds = new Set<string>();

  for (const m of json.data ?? []) {
    if (blocked[m.id]) continue;
    const modalities = m.architecture?.output_modalities ?? ["text"];

    if (isFreePricing(m.pricing, "text") && modalities.includes("text")) {
      text.push(toModel(m));
    }
  }

  for (const m of imageJson.data ?? []) {
    if (blocked[m.id]) continue;
    if (!isFreePricing(m.pricing, "text")) continue;
    image.push(toModel(m));
    imageIds.add(m.id);
  }

  // 멀티모달(텍스트+이미지) 모델도 이미지 후보에 포함
  for (const m of json.data ?? []) {
    if (blocked[m.id] || imageIds.has(m.id)) continue;
    const modalities = m.architecture?.output_modalities ?? ["text"];
    if (modalities.includes("image") && isFreePricing(m.pricing, "text")) {
      image.push(toModel(m));
    }
  }

  const sortByContext = (a: OpenRouterModel, b: OpenRouterModel) =>
    (b.context_length ?? 0) - (a.context_length ?? 0);

  return {
    fetchedAt: Date.now(),
    text: text.sort(sortByContext),
    image: image.sort(sortByContext),
  };
}

export async function getFreeModels(
  capability: ModelCapability
): Promise<OpenRouterModel[]> {
  const now = Date.now();
  if (!cache || now - cache.fetchedAt >= CACHE_TTL_MS) {
    cache = await refreshModelCache();
  }

  const models = capability === "text" ? cache.text : cache.image;
  const preferred = workingModels[capability];

  if (preferred && models.some((m) => m.id === preferred)) {
    return [
      models.find((m) => m.id === preferred)!,
      ...models.filter((m) => m.id !== preferred),
    ].slice(0, MAX_MODEL_ATTEMPTS);
  }

  return models.slice(0, MAX_MODEL_ATTEMPTS);
}

export function setWorkingModel(capability: ModelCapability, modelId: string) {
  workingModels[capability] = modelId;
}

export async function withModelFallback<T>(
  capability: ModelCapability,
  fn: (modelId: string) => Promise<T>
): Promise<{ result: T; modelId: string }> {
  const models = await getFreeModels(capability);

  if (models.length === 0) {
    throw new Error(
      `사용 가능한 무료 ${capability === "text" ? "텍스트" : "이미지"} 모델이 없습니다.`
    );
  }

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const result = await fn(model.id);
      setWorkingModel(capability, model.id);
      return { result, modelId: model.id };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message;
      if (shouldBlockModel(msg)) await blockModel(model.id, msg);
      console.warn(`[OpenRouter] ${model.id} failed: ${msg}`);
    }
  }

  throw lastError ?? new Error("모든 무료 모델 시도 실패");
}

/** 이미 성공한 모델이 있으면 바로 사용, 실패 시에만 폴백 탐색 */
export async function withPreferredModel<T>(
  capability: ModelCapability,
  fn: (modelId: string) => Promise<T>
): Promise<{ result: T; modelId: string }> {
  const preferred = workingModels[capability];
  if (preferred) {
    try {
      const result = await fn(preferred);
      return { result, modelId: preferred };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (shouldBlockModel(msg)) await blockModel(preferred, msg);
      delete workingModels[capability];
    }
  }
  return withModelFallback(capability, fn);
}

export async function getModelStatus() {
  const blocklist = await loadBlocklist();
  if (!cache) cache = await refreshModelCache();
  return {
    textModels: cache.text.map((m) => m.id),
    imageModels: cache.image.map((m) => m.id),
    workingModels: { ...workingModels },
    blockedModels: blocklist.models,
  };
}
