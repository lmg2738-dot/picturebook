import fs from "fs/promises";
import path from "path";
import type { Book, BookPage, BookStatus, BookWithPages } from "@/lib/types";

const BOOKS_DIR = path.join(process.cwd(), "data", "books");
const MAX_LOG_ENTRIES = 12;

function bookPath(id: string) {
  return path.join(BOOKS_DIR, `${id}.json`);
}

function formatLogTime(): string {
  return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** 파이프라인 실행 중 메모리에 책 상태를 유지해 디스크 I/O를 줄입니다. */
export class BookSession {
  private book: BookWithPages;
  private dirty = false;
  private lastProgress = -1;
  private lastStatusMessage: string | null = null;

  private constructor(book: BookWithPages) {
    this.book = book;
    if (!this.book.generation_log) this.book.generation_log = [];
    if (this.book.images_total == null) this.book.images_total = 0;
    if (this.book.images_done == null) this.book.images_done = 0;
    this.lastStatusMessage = this.book.status_message ?? null;
  }

  static async open(bookId: string): Promise<BookSession> {
    const raw = await fs.readFile(bookPath(bookId), "utf-8");
    return new BookSession(JSON.parse(raw) as BookWithPages);
  }

  get data(): BookWithPages {
    return this.book;
  }

  setPages(pages: BookPage[]) {
    this.book.pages = pages;
    this.book.updated_at = new Date().toISOString();
    this.dirty = true;
  }

  updatePage(pageNo: number, updates: Partial<Pick<BookPage, "image_url" | "audio_url">>) {
    const page = this.book.pages.find((p) => p.page_no === pageNo);
    if (!page) throw new Error(`페이지 ${pageNo}를 찾을 수 없습니다.`);
    Object.assign(page, updates);
    this.book.updated_at = new Date().toISOString();
    this.dirty = true;
  }

  appendLog(message: string) {
    const entry = `${formatLogTime()} · ${message}`;
    this.book.generation_log = [entry, ...(this.book.generation_log ?? [])].slice(0, MAX_LOG_ENTRIES);
    this.book.updated_at = new Date().toISOString();
    this.dirty = true;
  }

  /** 진행 상세가 바뀌면 즉시 디스크에 기록합니다. */
  async setStatus(status: BookStatus, progress: number, extra?: Partial<Book>) {
    const prevMessage = this.book.status_message ?? null;
    Object.assign(this.book, extra, { status, progress });
    this.book.updated_at = new Date().toISOString();
    this.dirty = true;

    const messageChanged = (this.book.status_message ?? null) !== prevMessage;
    const imagesChanged =
      extra?.images_done !== undefined || extra?.images_total !== undefined;

    const shouldFlush =
      status === "completed" ||
      status === "failed" ||
      messageChanged ||
      imagesChanged ||
      progress - this.lastProgress >= 2 ||
      this.lastProgress < 0;

    if (shouldFlush) {
      this.lastProgress = progress;
      this.lastStatusMessage = this.book.status_message ?? null;
      await this.flush();
    }
  }

  async flush() {
    if (!this.dirty) return;
    await fs.writeFile(bookPath(this.book.id), JSON.stringify(this.book, null, 2));
    this.dirty = false;
  }
}
