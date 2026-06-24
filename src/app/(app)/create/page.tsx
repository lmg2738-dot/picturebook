import { CreateBookForm } from "@/components/create-book-form";

export default function CreatePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Create</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink md:text-4xl">
          새 그림책 만들기
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          세 단계만 거치면 AI가 20페이지 그림책을 완성합니다.
        </p>
      </div>
      <CreateBookForm />
    </div>
  );
}
