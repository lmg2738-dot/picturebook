import { NextResponse } from "next/server";
import { getOpenRouterApiKey } from "@/lib/openrouter/config";
import { bookInputSchema, createBook } from "@/lib/pipeline/generate-book-schema";
import { shouldResetStorageOnGenerate } from "@/lib/storage/config";

export const maxDuration = 60;

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

    return NextResponse.json({
      bookId,
      status: "pending",
      storageReset: shouldResetStorageOnGenerate(),
      message: "그림책 생성이 시작되었습니다. 브라우저에서 단계별로 진행합니다.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "서버 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
