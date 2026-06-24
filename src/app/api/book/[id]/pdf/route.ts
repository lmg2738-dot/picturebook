import { NextResponse } from "next/server";
import { getBook, readMediaFile } from "@/lib/storage/books";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const book = await getBook(id);

  if (!book) {
    return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });
  }

  if (book.status !== "completed" || !book.pdf_url) {
    return NextResponse.json(
      { error: "PDF가 아직 준비되지 않았습니다." },
      { status: 400 }
    );
  }

  const pdfBuffer = await readMediaFile(id, "book.pdf");
  if (!pdfBuffer) {
    return NextResponse.json({ error: "PDF 파일을 찾을 수 없습니다." }, { status: 404 });
  }

  const filename = `${book.title ?? "storybook"}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
