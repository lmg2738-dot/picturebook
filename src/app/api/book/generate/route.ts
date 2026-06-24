import { NextResponse, after } from "next/server";
import { getOpenRouterApiKey } from "@/lib/openrouter/config";
import {
  bookInputSchema,
  createBook,
  runBookGenerationPipeline,
} from "@/lib/pipeline/generate-book";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    try {
      getOpenRouterApiKey();
    } catch (err) {
      const message = err instanceof Error ? err.message : "OpenRouter API 키가 필요합니다.";
      return NextResponse.json({ error: message }, { status: 503 });
    }

    const body = await request.json();
    const parsed = bookInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const bookId = await createBook(parsed.data);

    after(async () => {
      try {
        await runBookGenerationPipeline(bookId, parsed.data);
      } catch (err) {
        console.error(`Book generation failed for ${bookId}:`, err);
      }
    });

    return NextResponse.json({
      bookId,
      status: "pending",
      message: "그림책 생성이 시작되었습니다.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "서버 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
