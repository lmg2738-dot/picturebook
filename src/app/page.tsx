import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    step: "01",
    title: "아이 정보 입력",
    desc: "이름, 나이, 좋아하는 것, 배울 가치를 30초만에 입력하세요.",
  },
  {
    step: "02",
    title: "AI 스토리 생성",
    desc: "OpenRouter 무료 LLM으로 20페이지 이야기 완성.",
  },
  {
    step: "03",
    title: "삽화 & 낭독",
    desc: "무료 이미지 모델 + 브라우저 음성 낭독.",
  },
  {
    step: "04",
    title: "PDF 저장",
    desc: "완성된 그림책을 PDF로 저장하고 언제든 다시 읽어 보세요.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-surface">
            <span className="font-serif text-lg font-semibold">S</span>
          </div>
          <span className="font-serif text-xl font-semibold text-ink">StorySeed</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button href="/library" variant="ghost" size="sm">
            내 서재
          </Button>
          <Button href="/create" size="sm">
            그림책 만들기
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:pt-20">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="animate-fade-up">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-gold">
                Personalized Storybooks
              </p>
              <h1 className="font-serif text-5xl font-semibold leading-[1.1] text-ink md:text-6xl lg:text-7xl">
                우리 아이만을 위한
                <br />
                <span className="italic text-gold">특별한 이야기</span>
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-muted">
                AI가 아이의 이름과 성격을 담아 스토리, 삽화, 음성낭독, PDF까지
                완성합니다. OpenRouter 무료 모델만 사용합니다.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button href="/create" size="lg">
                  지금 만들기
                </Button>
                <Button href="/library" variant="secondary" size="lg">
                  내 서재 보기
                </Button>
              </div>
              <p className="mt-6 text-xs text-ink-light">
                로그인 없이 바로 시작 · 약 5~10분 소요
              </p>
            </div>

            {/* Visual mockup */}
            <div className="relative hidden lg:block animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <div className="card-premium absolute -right-4 top-8 z-10 w-64 rotate-3 rounded-2xl p-6">
                <div className="mb-3 h-32 rounded-xl bg-gradient-to-br from-blush to-cream-dark" />
                <p className="font-serif text-lg text-ink">민준이와 티라노의 모험</p>
                <p className="mt-1 text-xs text-ink-light">Page 7 · 용기</p>
              </div>
              <div className="card-premium ml-12 w-72 -rotate-2 rounded-2xl p-6">
                <div className="mb-3 h-40 rounded-xl bg-gradient-to-br from-sage/30 to-gold/20" />
                <p className="font-serif text-xl text-ink">숲 속 작은 영웅</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  &ldquo;민준이는 용감하게 앞으로 나아갔어요...&rdquo;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="border-t border-[var(--border)] bg-surface/50 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">
                How it works
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-ink md:text-4xl">
                네 단계로 완성되는 그림책
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div key={f.step} className="group">
                  <span className="font-serif text-4xl font-light text-gold/40 transition-colors group-hover:text-gold">
                    {f.step}
                  </span>
                  <h3 className="mt-4 font-serif text-xl font-semibold text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="font-serif text-3xl font-semibold text-ink md:text-4xl">
              오늘, 아이에게 줄
              <br />
              <span className="italic text-gold">가장 특별한 선물</span>
            </h2>
            <Button href="/create" size="lg" className="mt-8">
              첫 그림책 만들기
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-ink-light">
        © {new Date().getFullYear()} StorySeed AI
      </footer>
    </div>
  );
}
