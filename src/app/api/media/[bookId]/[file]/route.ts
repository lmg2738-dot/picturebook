import { NextResponse } from "next/server";
import { readMediaFile } from "@/lib/storage/books";
import { detectImageFormat, imageMimeType } from "@/lib/utils/image-format";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  mp3: "audio/mpeg",
  pdf: "application/pdf",
};

function resolveContentType(buffer: Buffer, file: string): string {
  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf" || ext === "mp3") {
    return MIME[ext] ?? "application/octet-stream";
  }
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "svg") {
    return imageMimeType(detectImageFormat(buffer));
  }
  return MIME[ext] ?? "application/octet-stream";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; file: string }> }
) {
  const { bookId, file } = await params;

  if (file.includes("..") || file.includes("/")) {
    return NextResponse.json({ error: "잘못된 파일 경로" }, { status: 400 });
  }

  const buffer = await readMediaFile(bookId, file);
  if (!buffer) {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
  }

  const contentType = resolveContentType(buffer, file);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
