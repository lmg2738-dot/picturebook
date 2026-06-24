import { NextResponse } from "next/server";
import { getModelStatus } from "@/lib/openrouter/models";

export async function GET() {
  try {
    const status = await getModelStatus();
    return NextResponse.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "모델 상태 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
