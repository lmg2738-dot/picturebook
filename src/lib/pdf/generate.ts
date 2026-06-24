import { PDFDocument, rgb, type PDFImage } from "pdf-lib";
import type { BookPage } from "@/lib/types";
import { embedKoreanFonts } from "./korean-font";
import { detectImageFormat } from "@/lib/utils/image-format";

interface PdfPageData {
  pageNo: number;
  story: string;
  imageBytes: Uint8Array | null;
}

export async function generateBookPdf(
  title: string,
  pages: PdfPageData[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const { regular: font, bold: boldFont } = await embedKoreanFonts(pdfDoc);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;

  // Cover page
  const cover = pdfDoc.addPage([pageWidth, pageHeight]);
  cover.drawText(title, {
    x: margin,
    y: pageHeight / 2 + 40,
    size: 28,
    font: boldFont,
    color: rgb(0.2, 0.15, 0.35),
    maxWidth: pageWidth - margin * 2,
  });
  cover.drawText("StorySeed AI", {
    x: margin,
    y: pageHeight / 2 - 20,
    size: 14,
    font,
    color: rgb(0.5, 0.45, 0.6),
  });

  const sorted = [...pages].sort((a, b) => a.pageNo - b.pageNo);

  for (const pageData of sorted) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    page.drawText(`${pageData.pageNo}`, {
      x: pageWidth - margin - 20,
      y: pageHeight - margin,
      size: 10,
      font,
      color: rgb(0.6, 0.55, 0.65),
    });

    let textY = pageHeight - margin - 30;

    if (pageData.imageBytes) {
      try {
        const image = await embedPageImage(pdfDoc, pageData.imageBytes);
        const maxImgHeight = 380;
        const scale = Math.min(
          (pageWidth - margin * 2) / image.width,
          maxImgHeight / image.height
        );
        const imgWidth = image.width * scale;
        const imgHeight = image.height * scale;
        const imgX = (pageWidth - imgWidth) / 2;
        const imgY = pageHeight - margin - 30 - imgHeight;

        page.drawImage(image, {
          x: imgX,
          y: imgY,
          width: imgWidth,
          height: imgHeight,
        });
        textY = imgY - 30;
      } catch {
        // Skip image if embedding fails
      }
    }

    const lines = wrapText(pageData.story, 22);
    let y = textY;
    for (const line of lines) {
      if (y < margin + 20) break;
      page.drawText(line, {
        x: margin,
        y,
        size: 12,
        font,
        color: rgb(0.15, 0.12, 0.2),
        maxWidth: pageWidth - margin * 2,
      });
      y -= 18;
    }
  }

  return pdfDoc.save();
}

async function embedPageImage(
  pdfDoc: PDFDocument,
  bytes: Uint8Array
): Promise<PDFImage> {
  const buffer = Buffer.from(bytes);
  const format = detectImageFormat(buffer);

  if (format === "svg") {
    return pdfDoc.embedSvg(buffer.toString("utf8"));
  }
  if (format === "jpeg") {
    return pdfDoc.embedJpg(bytes);
  }
  return pdfDoc.embedPng(bytes);
}

function isCjkText(text: string): boolean {
  return /[\u3000-\u9fff\uf900-\ufaff]/.test(text);
}

function wrapText(text: string, maxChars: number): string[] {
  if (isCjkText(text)) {
    const lines: string[] = [];
    let current = "";

    for (const char of text) {
      if (char === "\n") {
        if (current) lines.push(current);
        current = "";
        continue;
      }
      if (current.length >= maxChars) {
        lines.push(current);
        current = char;
      } else {
        current += char;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

export function buildPdfPageData(
  pages: BookPage[],
  imageBytesMap: Map<number, Uint8Array | null>
): PdfPageData[] {
  return pages.map((p) => ({
    pageNo: p.page_no,
    story: p.story,
    imageBytes: imageBytesMap.get(p.page_no) ?? null,
  }));
}
