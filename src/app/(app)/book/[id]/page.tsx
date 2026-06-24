import { notFound } from "next/navigation";
import { getBook } from "@/lib/actions/books";
import { BookReader } from "@/components/book-reader";
import { GenerationProgress } from "@/components/generation-progress";
import { DeleteBookButton } from "@/components/delete-book-button";
import { Card } from "@/components/ui/card";

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBook(id);

  if (!book) notFound();

  const title = book.title ?? `${book.child_name}의 이야기`;

  if (book.status !== "completed") {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Creating</p>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">{title}</h1>
          </div>
          <DeleteBookButton bookId={book.id} />
        </div>
        <Card padding="lg">
          <GenerationProgress bookId={book.id} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DeleteBookButton bookId={book.id} />
      </div>
      <BookReader
        title={title}
        pages={book.pages}
        bookId={book.id}
        pdfUrl={book.pdf_url}
      />
    </div>
  );
}
