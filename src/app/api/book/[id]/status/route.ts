import { NextResponse } from "next/server";
import { getBook } from "@/lib/storage/books";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const book = await getBook(id);

  if (!book) {
    return NextResponse.json({ error: "책을 찾을 수 없습니다." }, { status: 404 });
  }

  const imagesDoneFromPages = book.pages.filter((p) => p.image_url).length;

  return NextResponse.json({
    id: book.id,
    status: book.status,
    progress: book.progress,
    title: book.title,
    error_message: book.error_message,
    status_message: book.status_message ?? null,
    images_done: book.images_done ?? imagesDoneFromPages,
    images_total: book.images_total ?? book.pages.length,
    generation_log: book.generation_log ?? [],
    updated_at: book.updated_at,
  });
}
