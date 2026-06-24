import { NextResponse } from "next/server";
import { downloadDataset } from "@/lib/aihub/shell";
import { z } from "zod";

const downloadSchema = z.object({
  mode: z.enum(["d", "pd"]),
  datasetkey: z.number().int().positive().optional(),
  datapckagekey: z.number().int().positive().optional(),
  filekeys: z.array(z.number().int().positive()).optional(),
});

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = downloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { mode, datasetkey, datapckagekey, filekeys } = parsed.data;

    if (mode === "d" && !datasetkey) {
      return NextResponse.json({ error: "datasetkey가 필요합니다." }, { status: 400 });
    }
    if (mode === "pd" && !datapckagekey) {
      return NextResponse.json({ error: "datapckagekey가 필요합니다." }, { status: 400 });
    }

    const output = await downloadDataset({
      mode,
      datasetkey,
      datapckagekey,
      filekeys,
      outputDir: "downloads",
    });

    return NextResponse.json({
      success: true,
      message: "다운로드가 완료되었습니다.",
      log: output.slice(-1000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "다운로드 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
