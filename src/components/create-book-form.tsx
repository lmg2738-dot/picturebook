"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GenerationProgress } from "@/components/generation-progress";

const LESSONS = ["용기", "우정", "정직", "배려", "인내", "감사", "협력", "자신감"];
const STEPS = ["아이 정보", "관심사", "교육 주제"];

export function CreateBookForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("5");
  const [favorite, setFavorite] = useState("");
  const [lesson, setLesson] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookId, setBookId] = useState<string | null>(null);

  async function handleSubmit() {
    if (loading) return;

    if (!name.trim()) {
      setStep(0);
      setError("아이 이름을 입력해 주세요.");
      return;
    }
    if (!favorite.trim()) {
      setStep(1);
      setError("좋아하는 것을 입력해 주세요.");
      return;
    }
    if (!lesson.trim()) {
      setStep(2);
      setError("교육 주제를 입력하거나 선택해 주세요.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/book/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          age: parseInt(age, 10),
          favorite: favorite.trim(),
          lesson: lesson.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 요청 실패");
      setBookId(data.bookId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 2) {
      if (step === 0 && !name.trim()) {
        setError("아이 이름을 입력해 주세요.");
        return;
      }
      if (step === 1 && !favorite.trim()) {
        setError("좋아하는 것을 입력해 주세요.");
        return;
      }
      setError("");
      setStep(step + 1);
      return;
    }
    handleSubmit();
  }

  if (bookId) {
    return (
      <Card padding="lg">
        <GenerationProgress
          bookId={bookId}
          onComplete={() => router.push(`/book/${bookId}`)}
        />
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-10 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all ${
                i <= step ? "bg-ink text-surface" : "bg-cream-dark text-ink-light"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`hidden text-sm sm:inline ${
                i <= step ? "font-medium text-ink" : "text-ink-light"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 h-px w-8 ${i < step ? "bg-ink" : "bg-cream-dark"}`} />
            )}
          </div>
        ))}
      </div>

      <Card padding="lg">
        <form onSubmit={handleFormSubmit} className="space-y-0">
          {step === 0 && (
            <div className="space-y-6 animate-fade-up">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-ink">
                  아이에 대해 알려주세요
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  이야기의 주인공이 될 아이의 정보입니다.
                </p>
              </div>
              <Input
                label="아이 이름"
                placeholder="예: 민준"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                autoFocus
                required
              />
              <Input
                label="나이"
                type="number"
                min={1}
                max={12}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                hint="1~12세"
                required
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-fade-up">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-ink">
                  {name}이(가) 좋아하는 것
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  이야기에 자연스럽게 녹아들어요.
                </p>
              </div>
              <Input
                label="좋아하는 것"
                placeholder="예: 공룡, 우주, 강아지, 요리"
                value={favorite}
                onChange={(e) => setFavorite(e.target.value)}
                maxLength={50}
                autoFocus
                required
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-up">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-ink">
                  배우고 싶은 가치
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  스토리를 통해 자연스럽게 전달됩니다.
                </p>
              </div>
              <Input
                label="교육 주제"
                placeholder="직접 입력하거나 아래에서 선택"
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                maxLength={50}
                autoFocus
                required
              />
              <div className="flex flex-wrap gap-2">
                {LESSONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setLesson(s);
                      setError("");
                    }}
                    className={`rounded-full border px-4 py-2 text-sm transition-all ${
                      lesson === s
                        ? "border-gold bg-gold/10 font-medium text-gold-dark"
                        : "border-[var(--border)] text-ink-muted hover:border-gold/30"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep(step - 1);
                  setError("");
                }}
              >
                이전
              </Button>
            ) : (
              <div />
            )}
            <Button type="submit" loading={loading}>
              {step < 2 ? "다음" : "그림책 생성하기"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
