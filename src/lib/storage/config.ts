import os from "os";
import path from "path";

const BOOK_PREFIX = "storyseed/books/";
const MEDIA_PREFIX = "storyseed/media/";

export function useBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
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
  if (process.env.VERCEL && !useBlobStorage()) {
    throw new Error(
      "Vercel 배포에는 Blob 스토리지가 필요합니다. Vercel Dashboard → Storage → Blob을 생성하고 프로젝트에 연결한 뒤 BLOB_READ_WRITE_TOKEN 환경변수를 설정하세요."
    );
  }
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
