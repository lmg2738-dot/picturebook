import { getOpenRouterClient } from "./client";
import { withModelFallback } from "./models";
import { TOTAL_PAGES } from "@/lib/constants";
import type { BookInput, GeneratedStory } from "@/lib/types";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

function buildStoryPrompt(input: BookInput): string {
  return `당신은 어린이 그림책 작가입니다.
다음 정보로 정확히 ${TOTAL_PAGES}페이지 그림책 JSON을 작성하세요.

- 주인공: ${input.name} (${input.age}세)
- 좋아하는 것: ${input.favorite}
- 교육 주제: ${input.lesson}

반드시 아래 JSON 형식만 출력하세요 (다른 텍스트 없이):
{
  "title": "그림책 제목 (한국어)",
  "pages": [
    {
      "page_no": 1,
      "story": "2-4문장 한국어 스토리",
      "image_prompt": "English illustration prompt, soft watercolor, child-friendly"
    }
  ]
}

규칙:
- pages는 page_no 1~${TOTAL_PAGES}까지 ${TOTAL_PAGES}개
- ${input.age}세가 이해할 수 있는 어휘
- "${input.lesson}" 주제가 자연스럽게 녹아들 것
- 주인공 외모/이름 일관성 유지`;
}

export async function generateStory(input: BookInput): Promise<GeneratedStory> {
  const client = getOpenRouterClient();
  const prompt = buildStoryPrompt(input);

  const { result: content, modelId } = await withModelFallback("text", async (model) => {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a children's book author. Respond ONLY with valid JSON. No markdown.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 12000,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("스토리 응답이 비어 있습니다.");
    return text;
  });

  console.info(`[StorySeed] Story generated with model: ${modelId}`);

  const parsed = JSON.parse(extractJson(content)) as GeneratedStory;

  if (!parsed.pages || parsed.pages.length < TOTAL_PAGES) {
    throw new Error(`스토리 페이지 수 부족 (${parsed.pages?.length ?? 0}/${TOTAL_PAGES})`);
  }

  parsed.pages.sort((a, b) => a.page_no - b.page_no);
  parsed.pages = parsed.pages.slice(0, TOTAL_PAGES);
  return parsed;
}
