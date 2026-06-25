"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface GenerationPagePreview {
  page_no: number;
  story: string;
  image_url: string | null;
}

interface GenerationPageGalleryProps {
  pages: GenerationPagePreview[];
  imagesDone: number;
  imagesTotal: number;
}

export function GenerationPageGallery({
  pages,
  imagesDone,
  imagesTotal,
}: GenerationPageGalleryProps) {
  const [selectedPageNo, setSelectedPageNo] = useState<number | null>(null);
  const [manualSelect, setManualSelect] = useState(false);
  const thumbStripRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...pages].sort((a, b) => a.page_no - b.page_no),
    [pages]
  );

  const latestWithImage = useMemo(
    () => [...sorted].reverse().find((p) => p.image_url)?.page_no ?? null,
    [sorted]
  );

  const generatingPageNo = useMemo(
    () => sorted.find((p) => !p.image_url)?.page_no ?? null,
    [sorted]
  );

  const stillGenerating = imagesDone < (imagesTotal || sorted.length);

  useEffect(() => {
    if (sorted.length === 0) return;
    if (!manualSelect && latestWithImage != null) {
      setSelectedPageNo(latestWithImage);
    } else if (selectedPageNo == null) {
      setSelectedPageNo(sorted[0].page_no);
    }
  }, [sorted.length, latestWithImage, manualSelect, selectedPageNo, sorted]);

  useEffect(() => {
    if (!thumbStripRef.current || latestWithImage == null || manualSelect) return;
    const el = thumbStripRef.current.querySelector(`[data-page="${latestWithImage}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }, [latestWithImage, manualSelect]);

  if (sorted.length === 0) return null;

  const selected = sorted.find((p) => p.page_no === selectedPageNo) ?? sorted[0];
  const hasAnyImage = sorted.some((p) => p.image_url);

  function selectPage(pageNo: number) {
    setManualSelect(true);
    setSelectedPageNo(pageNo);
  }

  function followLatest() {
    setManualSelect(false);
    if (latestWithImage != null) setSelectedPageNo(latestWithImage);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-surface/60 p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-light">
          제작 미리보기
        </p>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span>
            삽화 {imagesDone}/{imagesTotal || sorted.length}
          </span>
          {manualSelect && latestWithImage != null && selectedPageNo !== latestWithImage && (
            <button
              type="button"
              onClick={followLatest}
              className="rounded-full border border-gold/30 px-2 py-0.5 text-[10px] text-gold-dark transition hover:bg-gold/10"
            >
              최신 페이지
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-surface shadow-sm">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-dark">
          {selected.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={selected.image_url}
              src={selected.image_url}
              alt={`${selected.page_no}페이지 삽화`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 font-serif text-lg text-gold-dark">
                {selected.page_no}
              </span>
              <p className="text-xs text-ink-muted">
                {hasAnyImage
                  ? "이 페이지 삽화를 그리는 중이에요"
                  : "스토리 작성이 끝나면 삽화가 순서대로 나타납니다"}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-[var(--border)] p-4 md:p-5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-light">
            <span>Page {selected.page_no}</span>
            <span>{sorted.length}페이지 중</span>
          </div>
          <p className="line-clamp-4 font-serif text-sm leading-relaxed text-ink md:text-base">
            {selected.story}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-ink-light">
          페이지 썸네일 · 클릭하여 보기
        </p>
        <div
          ref={thumbStripRef}
          className="flex gap-2 overflow-x-auto pb-1"
          role="list"
          aria-label="페이지 썸네일"
        >
          {sorted.map((page) => {
            const isSelected = page.page_no === selectedPageNo;
            const isReady = Boolean(page.image_url);
            const isGenerating =
              stillGenerating && !isReady && page.page_no === generatingPageNo;

            return (
              <button
                key={page.page_no}
                type="button"
                data-page={page.page_no}
                role="listitem"
                onClick={() => selectPage(page.page_no)}
                className={`relative shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-gold shadow-md ring-2 ring-gold/20"
                    : "border-transparent hover:border-gold/30"
                }`}
                style={{ width: 72, height: 72 }}
                title={`${page.page_no}페이지`}
              >
                {isReady && page.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={page.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className={`flex h-full w-full flex-col items-center justify-center text-xs ${
                      isGenerating ? "bg-gold/15 text-gold-dark" : "bg-cream-dark text-ink-light"
                    }`}
                  >
                    {isGenerating ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                    ) : (
                      <span className="font-medium">{page.page_no}</span>
                    )}
                  </div>
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-ink/50 py-0.5 text-center text-[9px] font-medium text-surface">
                  {page.page_no}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
