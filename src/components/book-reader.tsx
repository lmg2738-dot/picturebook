"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BookPage } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface BookReaderProps {
  title: string;
  pages: BookPage[];
  bookId: string;
  pdfUrl: string | null;
}

export function BookReader({ title, pages, bookId, pdfUrl }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const page = pages[currentPage];
  const total = pages.length;

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  useEffect(() => {
    return () => stopSpeech();
  }, [stopSpeech, currentPage]);

  function goPrev() {
    stopSpeech();
    setCurrentPage((p) => Math.max(0, p - 1));
  }

  function goNext() {
    stopSpeech();
    setCurrentPage((p) => Math.min(total - 1, p + 1));
  }

  function toggleSpeech() {
    if (speaking) {
      stopSpeech();
      return;
    }

    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("이 브라우저는 음성 낭독을 지원하지 않습니다.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(page.story);
    utterance.lang = "ko-KR";
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;

    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Storybook</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">{title}</h1>
        </div>
        {pdfUrl && (
          <a
            href={`/api/book/${bookId}/pdf`}
            download
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-surface px-4 py-2 text-xs font-medium text-ink transition-all hover:border-gold/40 hover:bg-cream-dark/50"
          >
            PDF 다운로드
          </a>
        )}
      </div>

      <div className="card-premium overflow-hidden rounded-3xl">
        {page.image_url && (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-dark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.image_url}
              alt={`페이지 ${page.page_no} 삽화`}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="space-y-5 p-8 md:p-10">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-ink-light">
            <span>Chapter {page.page_no}</span>
            <span>
              {currentPage + 1} / {total}
            </span>
          </div>

          <p className="font-serif text-xl leading-relaxed text-ink md:text-2xl">
            {page.story}
          </p>

          <Button variant="secondary" size="sm" onClick={toggleSpeech}>
            {speaking ? "낭독 중지" : "낭독 듣기"}
          </Button>
          <p className="text-[10px] text-ink-light">브라우저 무료 음성 낭독 (Web Speech API)</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={goPrev} disabled={currentPage === 0}>
          ← 이전 페이지
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                stopSpeech();
                setCurrentPage(i);
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === currentPage ? "w-6 bg-gold" : "w-1.5 bg-cream-dark hover:bg-gold/40"
              }`}
            />
          ))}
        </div>

        <Button variant="ghost" onClick={goNext} disabled={currentPage === total - 1}>
          다음 페이지 →
        </Button>
      </div>
    </div>
  );
}
