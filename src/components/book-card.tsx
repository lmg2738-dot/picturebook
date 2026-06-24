import Link from "next/link";
import type { Book } from "@/lib/types";
import { BOOK_STATUS_LABELS } from "@/lib/constants";

interface BookCardProps {
  book: Book;
}

const statusStyle: Record<string, string> = {
  pending: "bg-cream-dark text-ink-muted",
  generating_story: "bg-gold/15 text-gold-dark",
  generating_images: "bg-gold/15 text-gold-dark",
  generating_audio: "bg-gold/15 text-gold-dark",
  completed: "bg-sage/15 text-sage",
  failed: "bg-red-50 text-red-600",
};

export function BookCard({ book }: BookCardProps) {
  const statusLabel = BOOK_STATUS_LABELS[book.status] ?? book.status;
  const isGenerating = !["completed", "failed"].includes(book.status);

  return (
    <Link href={`/book/${book.id}`} className="group block">
      <article className="card-premium overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-ink/5">
        {/* Cover placeholder */}
        <div className="relative h-44 bg-gradient-to-br from-blush via-cream-dark to-gold/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-5xl font-light text-gold/30">
              {book.child_name.charAt(0)}
            </span>
          </div>
          <span
            className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wider ${statusStyle[book.status]}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="p-5">
          <h3 className="font-serif text-lg font-semibold text-ink group-hover:text-gold-dark transition-colors line-clamp-1">
            {book.title ?? `${book.child_name}의 이야기`}
          </h3>
          <p className="mt-1 text-xs text-ink-light">
            {book.child_name} · {book.child_age}세 · {book.lesson}
          </p>

          {isGenerating && (
            <div className="mt-4">
              <div className="h-1 overflow-hidden rounded-full bg-cream-dark">
                <div
                  className="progress-bar h-full rounded-full transition-all duration-500"
                  style={{ width: `${book.progress}%` }}
                />
              </div>
            </div>
          )}

          <p className="mt-3 text-[10px] uppercase tracking-wider text-ink-light">
            {new Date(book.created_at).toLocaleDateString("ko-KR")}
          </p>
        </div>
      </article>
    </Link>
  );
}
