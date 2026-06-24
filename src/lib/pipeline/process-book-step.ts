import { generateStory } from "@/lib/openrouter/story";
import { generatePageImage } from "@/lib/openrouter/image";
import { buildPdfPageData, generateBookPdf } from "@/lib/pdf/generate";
import { detectImageFormat, pageImageFilename } from "@/lib/utils/image-format";
import { BookSession } from "@/lib/storage/book-session";
import { readMediaFile, saveMediaFile } from "@/lib/storage/books";
import { TOTAL_PAGES } from "@/lib/constants";
import { randomUUID } from "crypto";
import type { BookInput, BookStatus } from "@/lib/types";

export type ProcessResult =
  | { done: true; status: BookStatus }
  | { done: false; status: BookStatus; message: string };

function bookInputFromBook(book: {
  child_name: string;
  child_age: number;
  favorite: string;
  lesson: string;
}): BookInput {
  return {
    name: book.child_name,
    age: book.child_age,
    favorite: book.favorite,
    lesson: book.lesson,
  };
}

/** Vercel 호환: 한 번에 한 단계만 실행 (스토리 / 삽화 1장 / PDF) */
export async function processBookStep(bookId: string): Promise<ProcessResult> {
  const session = await BookSession.open(bookId);
  const book = session.data;
  const input = bookInputFromBook(book);

  if (book.status === "completed") {
    return { done: true, status: "completed" };
  }
  if (book.status === "failed") {
    return { done: true, status: "failed" };
  }

  try {
    // 1) 스토리 생성
    if (book.status === "pending" || (book.status === "generating_story" && book.pages.length === 0)) {
      session.appendLog("스토리 생성 시작");
      await session.setStatus("generating_story", 5, {
        status_message: `${TOTAL_PAGES}페이지 스토리를 AI가 작성하고 있어요...`,
      });
      await session.flush();

      const story = await generateStory(input);

      session.appendLog(`스토리 완료: «${story.title}»`);
      const now = new Date().toISOString();
      const pages = story.pages.map((p) => ({
        id: randomUUID(),
        book_id: bookId,
        page_no: p.page_no,
        story: p.story,
        image_prompt: p.image_prompt,
        image_url: null as string | null,
        audio_url: null as string | null,
        created_at: now,
      }));
      session.setPages(pages);

      const total = pages.length;
      session.appendLog(`삽화 ${total}장 생성 시작`);
      await session.setStatus("generating_images", 20, {
        title: story.title,
        status_message: `스토리 완료 — 1/${total}페이지 삽화 준비 중...`,
        images_total: total,
        images_done: 0,
      });

      return {
        done: false,
        status: "generating_images",
        message: "스토리 생성 완료",
      };
    }

    // 2) 삽화 1장씩
    if (book.status === "generating_images") {
      const total = book.pages.length || book.images_total || TOTAL_PAGES;
      const nextPage = book.pages.find((p) => !p.image_url);

      if (!nextPage) {
        session.appendLog("삽화 완료 — PDF 생성 준비");
        await session.setStatus("generating_audio", 85, {
          status_message: "PDF 파일을 만들고 있어요...",
          images_done: total,
        });
        return processBookStep(bookId);
      }

      const imagesDone = book.pages.filter((p) => p.image_url).length;

      await session.setStatus("generating_images", 20 + Math.round((imagesDone / total) * 55), {
        status_message: `${nextPage.page_no}/${total}페이지 삽화를 AI가 그리는 중... (페이지당 1~3분)`,
        images_total: total,
        images_done: imagesDone,
      });
      session.appendLog(`${nextPage.page_no}페이지 삽화 생성 중`);
      await session.flush();

      const { buffer, source } = await generatePageImage(
        nextPage.image_prompt ?? "",
        input.name
      );
      const format = detectImageFormat(buffer);
      const filename = pageImageFilename(nextPage.page_no, format);
      const imageUrl = await saveMediaFile(bookId, filename, buffer);

      session.updatePage(nextPage.page_no, { image_url: imageUrl });

      const done = imagesDone + 1;
      const sourceLabel = source === "llm" ? "AI 삽화" : "대체 장면";
      session.appendLog(`${nextPage.page_no}페이지 완료 (${sourceLabel})`);
      await session.setStatus("generating_images", 20 + Math.round((done / total) * 55), {
        status_message: `${done}/${total}페이지 삽화 완료`,
        images_total: total,
        images_done: done,
      });

      return {
        done: false,
        status: "generating_images",
        message: `${nextPage.page_no}페이지 삽화 완료`,
      };
    }

    // 3) PDF 생성
    if (book.status === "generating_audio") {
      session.appendLog("PDF 파일 생성 중");
      await session.setStatus("generating_audio", 90, {
        status_message: "PDF 파일을 만들고 있어요...",
      });
      await session.flush();

      const imageBytesMap = new Map<number, Uint8Array>();
      for (const page of session.data.pages) {
        if (!page.image_url) continue;
        const filename = page.image_url.split("/").pop();
        if (!filename) continue;
        const buf = await readMediaFile(bookId, filename);
        if (buf) imageBytesMap.set(page.page_no, new Uint8Array(buf));
      }

      const title = session.data.title ?? `${input.name}의 이야기`;
      const pdfBytes = await generateBookPdf(
        title,
        buildPdfPageData(session.data.pages, imageBytesMap)
      );
      const pdfUrl = await saveMediaFile(bookId, "book.pdf", Buffer.from(pdfBytes));

      session.appendLog("그림책 생성 완료!");
      await session.setStatus("completed", 100, {
        pdf_url: pdfUrl,
        status_message: "모든 작업이 완료되었습니다!",
        images_done: session.data.pages.length,
      });

      return { done: true, status: "completed" };
    }

    return { done: false, status: book.status, message: "대기 중" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    session.appendLog(`오류: ${message}`);
    await session.setStatus("failed", session.data.progress, {
      error_message: message,
      status_message: `생성 실패: ${message}`,
    });
    throw err;
  }
}
