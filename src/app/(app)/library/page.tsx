import { getBooks } from "@/lib/actions/books";
import { BookCard } from "@/components/book-card";
import { Button } from "@/components/ui/button";

export default async function LibraryPage() {
  const books = await getBooks();

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Library</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink md:text-4xl">
            내 서재
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {books.length > 0
              ? `${books.length}권의 그림책`
              : "아직 만든 그림책이 없습니다"}
          </p>
        </div>
        <Button href="/create">+ 새 그림책</Button>
      </div>

      {books.length === 0 ? (
        <div className="card-premium rounded-3xl py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cream-dark">
            <span className="font-serif text-2xl text-gold">S</span>
          </div>
          <p className="font-serif text-xl text-ink">첫 번째 이야기를 시작해 보세요</p>
          <p className="mt-2 text-sm text-ink-muted">
            30초 입력으로 아이만을 위한 그림책이 완성됩니다.
          </p>
          <Button href="/create" size="lg" className="mt-8">
            그림책 만들기
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
