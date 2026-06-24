import { AihubExplorer } from "@/components/aihub-explorer";

export default function DatasetsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold">AI Hub</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink md:text-4xl">
          AI Hub 데이터
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          AI 허브 학습용 데이터셋을 조회하고 다운로드합니다.
        </p>
      </div>
      <AihubExplorer />
    </div>
  );
}
