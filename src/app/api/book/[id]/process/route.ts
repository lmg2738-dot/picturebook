import { NextResponse } from "next/server";
import { getOpenRouterApiKey } from "@/lib/openrouter/config";
import { processBookStep } from "@/lib/pipeline/process-book-step";

export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    getOpenRouterApiKey();
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenRouter API 키가 필요합니다.";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const { id } = await params;

  try {
    const result = await processBookStep(id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "처리 중 오류";
    return NextResponse.json({ error: message, status: "failed" }, { status: 500 });
  }
}
