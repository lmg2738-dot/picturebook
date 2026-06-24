"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BOOK_STATUS_LABELS } from "@/lib/constants";
import type { BookStatus } from "@/lib/types";

interface GenerationProgressProps {
  bookId: string;
  onComplete?: () => void;
}

interface StatusResponse {
  status: BookStatus;
  progress: number;
  title: string | null;
  error_message: string | null;
  status_message: string | null;
  images_done: number;
  images_total: number;
  generation_log: string[];
  updated_at: string;
}

const STEPS = [
  { key: "generating_story", label: "스토리 작성" },
  { key: "generating_images", label: "삽화 그리기" },
  { key: "generating_audio", label: "PDF 완성" },
  { key: "completed", label: "완료" },
];

function isStale(updatedAt: string, status: BookStatus): boolean {
  const diff = Date.now() - new Date(updatedAt).getTime();
  // 삽화 1장당 LLM 호출이 1~3분 걸릴 수 있음
  const limit = status === "generating_images" ? 6 * 60 * 1000 : 4 * 60 * 1000;
  return diff > limit;
}

export function GenerationProgress({ bookId, onComplete }: GenerationProgressProps) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [processing, setProcessing] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const processingRef = useRef(false);
  onCompleteRef.current = onComplete;

  const pollStatus = useCallback(async (signal: AbortSignal) => {
    const res = await fetch(`/api/book/${bookId}/status`, { signal, cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as StatusResponse;
  }, [bookId]);

  const runProcessStep = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    try {
      await fetch(`/api/book/${bookId}/process`, { method: "POST", cache: "no-store" });
    } catch {
      // 다음 폴링에서 재시도
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }, [bookId]);

  useEffect(() => {
    const controller = new AbortController();
    let pollTimer: ReturnType<typeof setTimeout>;
    let processTimer: ReturnType<typeof setTimeout>;
    let active = true;

    async function poll() {
      if (!active) return;
      try {
        const data = await pollStatus(controller.signal);
        if (!data) {
          pollTimer = setTimeout(poll, 3000);
          return;
        }

        setStatus(data);

        if (data.status === "completed") {
          onCompleteRef.current?.();
          return;
        }
        if (data.status === "failed") return;

        pollTimer = setTimeout(poll, 2000);
      } catch {
        if (!controller.signal.aborted) {
          pollTimer = setTimeout(poll, 4000);
        }
      }
    }

    async function processLoop() {
      if (!active) return;
      const data = await pollStatus(controller.signal);
      if (data && data.status !== "completed" && data.status !== "failed") {
        await runProcessStep();
      }
      if (active) {
        processTimer = setTimeout(processLoop, 500);
      }
    }

    poll();
    processLoop();

    return () => {
      active = false;
      controller.abort();
      clearTimeout(pollTimer);
      clearTimeout(processTimer);
    };
  }, [bookId, pollStatus, runProcessStep]);

  const currentStep = STEPS.findIndex((s) => s.key === status?.status);
  const isImagePhase = status?.status === "generating_images";
  const stale =
    status &&
    !processing &&
    status.status.startsWith("generating") &&
    status.updated_at &&
    isStale(status.updated_at, status.status);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Creating</p>
        <h3 className="mt-2 font-serif text-2xl font-semibold text-ink">
          {status?.title ?? "그림책을 만들고 있어요"}
        </h3>
        {status && (
          <p className="mt-2 text-sm text-ink-muted">
            {BOOK_STATUS_LABELS[status.status]} · {status.progress}%
            {processing && " · 작업 중"}
          </p>
        )}
      </div>

      {status?.status_message && (
        <div className="rounded-2xl border border-gold/20 bg-gold/5 px-5 py-4 text-center">
          <p className="text-sm font-medium text-ink">{status.status_message}</p>
          {isImagePhase && status.images_total > 0 && (
            <p className="mt-2 text-xs text-ink-muted">
              삽화 진행: {status.images_done}/{status.images_total}페이지
            </p>
          )}
          {processing && (
            <p className="mt-2 text-xs text-gold-dark">AI 작업 실행 중… (이 페이지를 닫지 마세요)</p>
          )}
          {status.updated_at && (
            <p className="mt-1 text-[10px] text-ink-light">
              마지막 업데이트:{" "}
              {new Date(status.updated_at).toLocaleTimeString("ko-KR")}
            </p>
          )}
        </div>
      )}

      {stale && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          6분 이상 진행 기록이 없습니다. 페이지를 새로고침하거나 잠시 후 다시 확인해 주세요.
          Vercel Logs에서 오류 메시지를 확인할 수 있습니다.
        </p>
      )}

      <div className="h-1.5 overflow-hidden rounded-full bg-cream-dark">
        <div
          className="progress-bar h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${status?.progress ?? 5}%` }}
        />
      </div>

      {isImagePhase && status.images_total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-ink-muted">
            <span>삽화 진행률</span>
            <span>
              {status.images_done}/{status.images_total}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-cream-dark">
            <div
              className="h-full rounded-full bg-sage/70 transition-all duration-500"
              style={{
                width: `${Math.round((status.images_done / status.images_total) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {STEPS.map((s, i) => {
          const done = currentStep > i || status?.status === "completed";
          const active = s.key === status?.status;
          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                active ? "bg-gold/10" : done ? "opacity-60" : "opacity-30"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  done
                    ? "bg-sage text-surface"
                    : active
                      ? "bg-gold text-surface"
                      : "bg-cream-dark text-ink-light"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${active ? "font-medium text-ink" : "text-ink-muted"}`}>
                {s.label}
              </span>
              {active && (
                <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              )}
            </div>
          );
        })}
      </div>

      {status?.generation_log && status.generation_log.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-surface/60 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-light">
            작업 내역
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-ink-muted">
            {status.generation_log.map((line, i) => (
              <li key={`${line}-${i}`} className="font-mono leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status?.status === "failed" && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
          {status.error_message ?? "생성 중 오류가 발생했습니다."}
        </p>
      )}

      {status?.status === "completed" && (
        <p className="text-center text-sm font-medium text-sage">
          완성되었습니다! 잠시 후 이동합니다...
        </p>
      )}

      {!status && (
        <div className="flex justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      )}

      <p className="text-center text-xs text-ink-light">
        삽화 20장 포함 약 15~30분 · 브라우저를 열어 두세요
      </p>
    </div>
  );
}
