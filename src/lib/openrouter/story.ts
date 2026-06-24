import { getOpenRouterClient } from "./client";
import { withModelFallback } from "./models";
import { parseJsonWithRepair, extractJsonBlock } from "@/lib/utils/parse-json";
import { TOTAL_PAGES } from "@/lib/constants";
import type { BookInput, GeneratedStory, StoryPage } from "@/lib/types";

function buildStoryPrompt(input: BookInput, fromPage: number, toPage: number): string {
  const count = toPage - fromPage + 1;
  return `당신은 어린이 그림책 작가입니다.
다음 정보로 page_no ${fromPage}~${toPage} (총 ${count}페이지) 그림책 JSON을 작성하세요.

- 주인공: ${input.name} (${input.age}세)
- 좋아하는 것: ${input.favorite}
- 교육 주제: ${input.lesson}
${fromPage === 1 ? "- 이 응답에 title 필드를 포함하세요" : `- title은 "${input.name}의 이야기"로 고정`}

반드시 아래 JSON 형식만 출력하세요 (다른 텍스트 없이):
{
  "title": "그림책 제목 (한국어)",
  "pages": [
    {
      "page_no": ${fromPage},
      "story": "2-4문장 한국어 스토리",
      "image_prompt": "English illustration prompt, soft watercolor, child-friendly"
    }
  ]
}

규칙:
- pages는 page_no ${fromPage}~${toPage}까지 정확히 ${count}개
- ${input.age}세가 이해할 수 있는 어휘
- "${input.lesson}" 주제가 자연스럽게 녹아들 것
- 주인공 외모/이름 일관성 유지
- JSON 문자열 안에 줄바꿈·따옴표(")를 넣지 말 것 (story는 한 줄)
- trailing comma 금지, 유효한 JSON만 출력`;
}

function validatePages(pages: StoryPage[], fromPage: number, toPage: number): StoryPage[] {
  if (!pages?.length) {
    throw new Error(`스토리 페이지가 비어 있습니다. (${fromPage}~${toPage})`);
  }
  pages.sort((a, b) => a.page_no - b.page_no);
  const expected = toPage - fromPage + 1;
  const slice = pages.filter((p) => p.page_no >= fromPage && p.page_no <= toPage).slice(0, expected);
  if (slice.length < expected) {
    throw new Error(`스토리 페이지 수 부족 (${slice.length}/${expected})`);
  }
  return slice;
}

function parseStoryContent(content: string, fromPage: number, toPage: number): { title?: string; pages: StoryPage[] } {
  try {
    const parsed = parseJsonWithRepair<{ title?: string; pages: StoryPage[] }>(content);
    return { title: parsed.title, pages: validatePages(parsed.pages, fromPage, toPage) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const preview = extractJsonBlock(content).slice(Math.max(0, 4690), 4720);
    throw new Error(`${msg}${preview ? ` (근처: …${preview}…)` : ""}`);
  }
}

async function callStoryModel(
  model: string,
  system: string,
  prompt: string,
  fromPage: number,
  toPage: number
): Promise<{ title?: string; pages: StoryPage[] }> {
  const client = getOpenRouterClient();
  const baseParams = {
    model,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: prompt },
    ],
    temperature: 0.7,
    max_tokens: fromPage === 1 && toPage === TOTAL_PAGES ? 16000 : 9000,
  };

  const tryCreate = async (useJsonMode: boolean) => {
    const response = await client.chat.completions.create({
      ...baseParams,
      ...(useJsonMode ? { response_format: { type: "json_object" as const } } : {}),
    });
    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("스토리 응답이 비어 있습니다.");
    return parseStoryContent(text, fromPage, toPage);
  };

  try {
    return await tryCreate(true);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const jsonModeRejected =
      msg.includes("response_format") ||
      msg.includes("json_object") ||
      msg.includes("structured outputs");
    if (jsonModeRejected) {
      return tryCreate(false);
    }
    throw err;
  }
}

async function generateStoryRange(
  input: BookInput,
  fromPage: number,
  toPage: number
): Promise<{ title?: string; pages: StoryPage[] }> {
  const prompt = buildStoryPrompt(input, fromPage, toPage);
  const system =
    "You are a children's book author. Respond ONLY with valid JSON. No markdown, no trailing commas.";

  const { result, modelId } = await withModelFallback("text", async (model) =>
    callStoryModel(model, system, prompt, fromPage, toPage)
  );

  console.info(`[StorySeed] Story pages ${fromPage}-${toPage} with model: ${modelId}`);
  return result;
}

async function generateStoryInBatches(input: BookInput): Promise<GeneratedStory> {
  const mid = Math.ceil(TOTAL_PAGES / 2);
  const first = await generateStoryRange(input, 1, mid);
  const second = await generateStoryRange(input, mid + 1, TOTAL_PAGES);

  return {
    title: first.title ?? `${input.name}의 이야기`,
    pages: [...first.pages, ...second.pages],
  };
}

export async function generateStory(input: BookInput): Promise<GeneratedStory> {
  try {
    const full = await generateStoryRange(input, 1, TOTAL_PAGES);
    return {
      title: full.title ?? `${input.name}의 이야기`,
      pages: full.pages,
    };
  } catch (fullErr) {
    console.warn(
      `[StorySeed] Full story JSON failed, retrying in batches: ${
        fullErr instanceof Error ? fullErr.message : fullErr
      }`
    );
    return generateStoryInBatches(input);
  }
}
