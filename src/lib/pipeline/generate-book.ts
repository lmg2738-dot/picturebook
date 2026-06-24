import { z } from "zod";
import { generateStory } from "@/lib/openrouter/story";
import { generatePageImage } from "@/lib/openrouter/image";
import { buildPdfPageData, generateBookPdf } from "@/lib/pdf/generate";
import { mapWithConcurrency } from "@/lib/utils/concurrency";
import { detectImageFormat, pageImageFilename } from "@/lib/utils/image-format";
import { BookSession } from "@/lib/storage/book-session";
import { saveMediaFile } from "@/lib/storage/books";
import { TOTAL_PAGES } from "@/lib/constants";
import { randomUUID } from "crypto";
import type { BookInput, BookPage } from "@/lib/types";
import { createBook as createBookRecord } from "@/lib/storage/books";

export const bookInputSchema = z.object({
  name: z.string().min(1).max(20),
  age: z.number().int().min(1).max(12),
  favorite: z.string().min(1).max(50),
  lesson: z.string().min(1).max(50),
});

const IMAGE_CONCURRENCY = 2;

export async function runBookGenerationPipeline(
  bookId: string,
  input: BookInput
): Promise<void> {
  const session = await BookSession.open(bookId);

  try {
    session.appendLog("스토리 생성 시작");
    await session.setStatus("generating_story", 5, {
      status_message: `${TOTAL_PAGES}페이지 스토리를 AI가 작성하고 있어요...`,
    });
    await session.flush();

    const story = await generateStory(input);

    session.appendLog(`스토리 완료: «${story.title}»`);
    await session.setStatus("generating_story", 15, {
      title: story.title,
      status_message: `스토리 완료 — 이제 삽화를 그릴게요`,
      images_total: story.pages.length,
      images_done: 0,
    });

    const now = new Date().toISOString();
    const pages: BookPage[] = story.pages.map((p) => ({
      id: randomUUID(),
      book_id: bookId,
      page_no: p.page_no,
      story: p.story,
      image_prompt: p.image_prompt,
      image_url: null,
      audio_url: null,
      created_at: now,
    }));
    session.setPages(pages);
    await session.flush();

    const totalPages = story.pages.length;
    let imagesDone = 0;

    session.appendLog(`삽화 ${totalPages}장 생성 시작 (동시 ${IMAGE_CONCURRENCY}장)`);
    await session.setStatus("generating_images", 20, {
      status_message: `1/${totalPages}페이지 삽화 준비 중...`,
      images_total: totalPages,
      images_done: 0,
    });
    await session.flush();

    const imageBytesMap = new Map<number, Uint8Array>();

    await mapWithConcurrency(story.pages, IMAGE_CONCURRENCY, async (page) => {
      await session.setStatus(
        "generating_images",
        20 + Math.round((imagesDone / totalPages) * 55),
        {
          status_message: `${page.page_no}/${totalPages}페이지 삽화를 AI가 그리는 중... (페이지당 약 1~2분)`,
          images_total: totalPages,
          images_done: imagesDone,
        }
      );
      session.appendLog(`${page.page_no}페이지 삽화 생성 중`);
      await session.flush();

      const { buffer, source } = await generatePageImage(page.image_prompt, input.name);
      const format = detectImageFormat(buffer);
      const filename = pageImageFilename(page.page_no, format);
      const imageUrl = await saveMediaFile(bookId, filename, buffer);

      session.updatePage(page.page_no, { image_url: imageUrl });
      imageBytesMap.set(page.page_no, new Uint8Array(buffer));

      imagesDone += 1;
      const progress = 20 + Math.round((imagesDone / totalPages) * 55);
      const sourceLabel = source === "llm" ? "AI 삽화" : "대체 장면";

      session.appendLog(`${page.page_no}페이지 완료 (${sourceLabel})`);
      await session.setStatus("generating_images", progress, {
        status_message: `${imagesDone}/${totalPages}페이지 삽화 완료 · ${page.page_no}페이지 ${sourceLabel}`,
        images_total: totalPages,
        images_done: imagesDone,
      });

      return { pageNo: page.page_no, buffer, imageUrl, source };
    });

    await session.flush();

    session.appendLog("PDF 파일 생성 중");
    await session.setStatus("generating_audio", 85, {
      status_message: "PDF 파일을 만들고 있어요...",
    });
    await session.flush();

    const pdfBytes = await generateBookPdf(
      story.title,
      buildPdfPageData(session.data.pages, imageBytesMap)
    );
    const pdfUrl = await saveMediaFile(bookId, "book.pdf", Buffer.from(pdfBytes));

    session.appendLog("그림책 생성 완료!");
    await session.setStatus("completed", 100, {
      pdf_url: pdfUrl,
      status_message: "모든 작업이 완료되었습니다!",
      images_done: totalPages,
    });
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

export { createBookRecord as createBook };
