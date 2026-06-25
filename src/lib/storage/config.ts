import os from "os";
import path from "path";
import { hasSupabaseStorageConfig } from "@/lib/supabase/client";

const BOOK_PREFIX = "storyseed/books/";
const MEDIA_PREFIX = "storyseed/media/";

export type StorageBackend = "local" | "supabase" | "blob" | "s3";

function envBackend(): string | undefined {
  return process.env.STORAGE_BACKEND?.trim().toLowerCase();
}

export function useSupabaseStorage(): boolean {
  const mode = envBackend();
  if (mode === "supabase") return hasSupabaseStorageConfig();
  if (mode === "blob" || mode === "s3" || mode === "local") return false;
  return hasSupabaseStorageConfig();
}

export function useS3Storage(): boolean {
  if (useSupabaseStorage()) return false;
  const mode = envBackend();
  if (mode === "s3") return true;
  if (mode === "blob" || mode === "local" || mode === "supabase") return false;
  return Boolean(
    process.env.S3_BUCKET?.trim() &&
      process.env.S3_ACCESS_KEY_ID?.trim() &&
      process.env.S3_SECRET_ACCESS_KEY?.trim()
  );
}

export function useBlobStorage(): boolean {
  if (useSupabaseStorage() || useS3Storage()) return false;
  const mode = envBackend();
  if (mode === "blob") return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  if (mode === "s3" || mode === "local" || mode === "supabase") return false;
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function useRemoteStorage(): boolean {
  return useSupabaseStorage() || useS3Storage() || useBlobStorage();
}

export function getStorageBackend(): StorageBackend {
  if (useSupabaseStorage()) return "supabase";
  if (useS3Storage()) return "s3";
  if (useBlobStorage()) return "blob";
  return "local";
}

/**
 * 새 그림책 생성 전 기존 데이터 전체 삭제 (용량 초기화).
 * Vercel 배포 환경에서는 기본 true. 로컬은 기본 false.
 * STORAGE_RESET_ON_GENERATE=false 로 비활성화.
 */
export function shouldResetStorageOnGenerate(): boolean {
  const raw = process.env.STORAGE_RESET_ON_GENERATE?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "no") return false;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  return Boolean(process.env.VERCEL);
}

/** 로컬: ./data · Vercel/서버리스: /tmp (보조 캐시만) */
export function getDataDir(): string {
  if (process.env.DATA_DIR?.trim()) {
    return process.env.DATA_DIR.trim();
  }
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), "storyseed-data");
  }
  return path.join(process.cwd(), "data");
}

export function assertStorageReady(): void {
  if (!process.env.VERCEL) return;

  if (useRemoteStorage()) return;

  throw new Error(
    "Vercel 배포에는 영구 스토리지가 필요합니다. " +
      "Supabase(NEXT_PUBLIC_STORYSUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY), " +
      "Cloudflare R2(S3_*), 또는 Vercel Blob(BLOB_READ_WRITE_TOKEN)을 설정하세요."
  );
}

export function bookBlobPath(id: string): string {
  return `${BOOK_PREFIX}${id}.json`;
}

export function mediaBlobPath(bookId: string, filename: string): string {
  return `${MEDIA_PREFIX}${bookId}/${filename}`;
}

export function mediaBlobPrefix(bookId: string): string {
  return `${MEDIA_PREFIX}${bookId}/`;
}

export { BOOK_PREFIX, MEDIA_PREFIX };
