"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Tab = "dataset" | "package";

interface DatasetItem {
  key: number;
  title: string;
}

interface FileItem {
  path: string;
  name: string;
  size: string;
  filekey: number;
}

export function AihubExplorer() {
  const [tab, setTab] = useState<Tab>("dataset");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<DatasetItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const listMode = tab === "dataset" ? "l" : "pl";
  const keyParam = tab === "dataset" ? "datasetkey" : "datapckagekey";

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    setFiles([]);
    setSelectedKey(null);

    try {
      const params = new URLSearchParams({ mode: listMode });
      if (query) params.set("q", query);

      const res = await fetch(`/api/aihub/datasets?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "조회 실패");

      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류 발생");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [listMode, query]);

  async function fetchFiles(key: number) {
    setLoading(true);
    setError("");
    setSelectedKey(key);

    try {
      const params = new URLSearchParams({ mode: listMode, [keyParam]: String(key) });
      const res = await fetch(`/api/aihub/datasets?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "파일 조회 실패");

      setFiles(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류 발생");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(key: number, filekeys?: number[]) {
    if (
      !confirm(
        filekeys
          ? `선택한 ${filekeys.length}개 파일을 다운로드하시겠습니까?`
          : "전체 데이터셋을 다운로드하시겠습니까? (용량이 클 수 있습니다)"
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        mode: tab === "dataset" ? "d" : "pd",
        [keyParam]: key,
      };
      if (filekeys?.length) body.filekeys = filekeys;

      const res = await fetch("/api/aihub/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "다운로드 실패");

      alert(data.message ?? "다운로드 완료");
    } catch (err) {
      setError(err instanceof Error ? err.message : "다운로드 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["dataset", "package"] as Tab[]).map((t) => (
          <Button
            key={t}
            variant={tab === t ? "primary" : "secondary"}
            size="sm"
            onClick={() => {
              setTab(t);
              setItems([]);
              setFiles([]);
            }}
          >
            {t === "dataset" ? "데이터셋" : "데이터패키지"}
          </Button>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="검색어 (예: 이미지, 말뭉치)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={fetchList} loading={loading}>
            목록 조회
          </Button>
        </div>
        <p className="mt-3 text-xs text-ink-light">
          AI Hub aihubshell · 승인된 데이터셋만 다운로드 가능
        </p>
      </Card>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {items.length > 0 && (
        <Card padding="sm">
          <h3 className="mb-4 px-2 text-sm font-medium text-ink">
            {tab === "dataset" ? "데이터셋" : "데이터패키지"} ({items.length})
          </h3>
          <ul className="max-h-80 space-y-0.5 overflow-y-auto">
            {items.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => fetchFiles(item.key)}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-all ${
                    selectedKey === item.key
                      ? "bg-ink text-surface"
                      : "text-ink-muted hover:bg-cream-dark"
                  }`}
                >
                  <span className="font-mono text-gold">{item.key}</span>
                  <span className="mx-2 opacity-30">·</span>
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {files.length > 0 && selectedKey && (
        <Card padding="sm">
          <div className="mb-4 flex items-center justify-between px-2">
            <h3 className="text-sm font-medium text-ink">파일 목록</h3>
            <Button size="sm" onClick={() => handleDownload(selectedKey)} loading={loading}>
              전체 다운로드
            </Button>
          </div>
          <ul className="max-h-96 space-y-0.5 overflow-y-auto font-mono text-xs">
            {files.map((file) => (
              <li
                key={file.filekey}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-cream-dark/50"
              >
                <span className="truncate text-ink-muted">
                  {file.name} · {file.size}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(selectedKey, [file.filekey])}
                >
                  다운로드
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
