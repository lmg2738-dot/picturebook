import fs from "fs/promises";
import path from "path";
import { del, list } from "@vercel/blob";
import { randomUUID } from "crypto";
import type { Book, BookInput, BookPage, BookStatus, BookWithPages } from "@/lib/types";
import { TOTAL_PAGES } from "@/lib/constants";
import {
  assertStorageReady,
  bookBlobPath,
  getDataDir,
  mediaBlobPath,
  mediaBlobPrefix,
  BOOK_PREFIX,
  useBlobStorage,
} from "./config";
import {
  blobDeletePrefix,
  blobRead,
  blobReadText,
  blobWrite,
} from "./blob-io";

const BOOKS_DIR = () => path.join(getDataDir(), "books");
const MEDIA_DIR = () => path.join(getDataDir(), "media");

async function ensureLocalDirs() {
  await fs.mkdir(BOOKS_DIR(), { recursive: true });
  await fs.mkdir(MEDIA_DIR(), { recursive: true });
}

function localBookPath(id: string) {
  return path.join(BOOKS_DIR(), `${id}.json`);
}

function localMediaDir(bookId: string) {
  return path.join(MEDIA_DIR(), bookId);
}

export function mediaUrl(bookId: string, filename: string) {
  return `/api/media/${bookId}/${filename}`;
}

export async function saveBookDocument(book: BookWithPages): Promise<void> {
  const json = JSON.stringify(book, null, 2);
  if (useBlobStorage()) {
    await blobWrite(bookBlobPath(book.id), json, "application/json");
    return;
  }
  await ensureLocalDirs();
  await fs.writeFile(localBookPath(book.id), json);
}

export async function saveMediaFile(
  bookId: string,
  filename: string,
  data: Buffer
): Promise<string> {
  if (useBlobStorage()) {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const mime =
      ext === "svg"
        ? "image/svg+xml"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "pdf"
            ? "application/pdf"
            : "image/png";
    await blobWrite(mediaBlobPath(bookId, filename), data, mime);
    return mediaUrl(bookId, filename);
  }

  await ensureLocalDirs();
  const dir = localMediaDir(bookId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), data);
  return mediaUrl(bookId, filename);
}

export async function readMediaFile(
  bookId: string,
  filename: string
): Promise<Buffer | null> {
  if (useBlobStorage()) {
    return blobRead(mediaBlobPath(bookId, filename));
  }
  try {
    return await fs.readFile(path.join(localMediaDir(bookId), filename));
  } catch {
    return null;
  }
}

export async function createBook(input: BookInput): Promise<string> {
  assertStorageReady();

  const id = randomUUID();
  const now = new Date().toISOString();

  const book: BookWithPages = {
    id,
    title: null,
    child_name: input.name,
    child_age: input.age,
    favorite: input.favorite,
    lesson: input.lesson,
    status: "pending",
    progress: 0,
    error_message: null,
    pdf_url: null,
    status_message: "생성 대기 중...",
    images_done: 0,
    images_total: TOTAL_PAGES,
    generation_log: [],
    created_at: now,
    updated_at: now,
    pages: [],
  };

  await saveBookDocument(book);
  return id;
}

export async function getBook(id: string): Promise<BookWithPages | null> {
  if (useBlobStorage()) {
    const raw = await blobReadText(bookBlobPath(id));
    if (!raw) return null;
    return JSON.parse(raw) as BookWithPages;
  }
  try {
    const raw = await fs.readFile(localBookPath(id), "utf-8");
    return JSON.parse(raw) as BookWithPages;
  } catch {
    return null;
  }
}

export async function getBooks(): Promise<Book[]> {
  if (useBlobStorage()) {
    const books: Book[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: BOOK_PREFIX, cursor });
      for (const blob of page.blobs) {
        try {
          const raw = await blobReadText(blob.pathname);
          if (!raw) continue;
          const book = JSON.parse(raw) as BookWithPages;
          const { pages: _, ...meta } = book;
          books.push(meta);
        } catch {
          // skip corrupt
        }
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    return books.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  await ensureLocalDirs();
  const files = (await fs.readdir(BOOKS_DIR())).filter((f) => f.endsWith(".json"));

  const books = await Promise.all(
    files.map(async (file) => {
      try {
        const raw = await fs.readFile(path.join(BOOKS_DIR(), file), "utf-8");
        const book = JSON.parse(raw) as BookWithPages;
        const { pages: _, ...meta } = book;
        return meta;
      } catch {
        return null;
      }
    })
  );

  return books
    .filter((b): b is Book => b !== null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function updateBook(
  id: string,
  updates: Partial<Book> & { pages?: BookPage[] }
) {
  const book = await getBook(id);
  if (!book) throw new Error("책을 찾을 수 없습니다.");

  const { pages, ...metaUpdates } = updates;
  Object.assign(book, metaUpdates, { updated_at: new Date().toISOString() });
  if (pages) book.pages = pages;

  await saveBookDocument(book);
}

export async function updateBookStatus(
  id: string,
  status: BookStatus,
  progress: number,
  extra?: Partial<Book>
) {
  await updateBook(id, { status, progress, ...extra });
}

export async function deleteBook(id: string): Promise<void> {
  if (useBlobStorage()) {
    await blobDeletePrefix(mediaBlobPrefix(id));
    try {
      const { blobs } = await list({ prefix: bookBlobPath(id), limit: 1 });
      if (blobs[0]) await del(blobs[0].url);
    } catch {
      // ignore
    }
    return;
  }

  try {
    await fs.unlink(localBookPath(id));
  } catch {
    // ignore
  }
  try {
    await fs.rm(localMediaDir(id), { recursive: true, force: true });
  } catch {
    // ignore
  }
}

export async function addPages(
  id: string,
  pages: Omit<BookPage, "id" | "book_id" | "created_at" | "image_url" | "audio_url">[]
) {
  const book = await getBook(id);
  if (!book) throw new Error("책을 찾을 수 없습니다.");

  const now = new Date().toISOString();
  book.pages = pages.map((p) => ({
    id: randomUUID(),
    book_id: id,
    page_no: p.page_no,
    story: p.story,
    image_prompt: p.image_prompt,
    image_url: null,
    audio_url: null,
    created_at: now,
  }));

  await saveBookDocument(book);
}

export async function updatePage(
  bookId: string,
  pageNo: number,
  updates: Partial<Pick<BookPage, "image_url" | "audio_url">>
) {
  const book = await getBook(bookId);
  if (!book) throw new Error("책을 찾을 수 없습니다.");

  const page = book.pages.find((p) => p.page_no === pageNo);
  if (!page) throw new Error("페이지를 찾을 수 없습니다.");

  Object.assign(page, updates);
  book.updated_at = new Date().toISOString();
  await saveBookDocument(book);
}
