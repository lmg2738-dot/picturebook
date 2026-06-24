import fs from "fs/promises";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import type { PDFDocument, PDFFont } from "pdf-lib";
import { getDataDir } from "@/lib/storage/config";

const FONT_FILE = "NotoSansKR.ttf";
const FONT_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf";
const FONT_DIR = path.join(getDataDir(), "fonts");

let cachedFontBytes: Uint8Array | null = null;

async function loadFontBytes(): Promise<Uint8Array> {
  if (cachedFontBytes) return cachedFontBytes;

  const localPath = path.join(FONT_DIR, FONT_FILE);
  try {
    const local = await fs.readFile(localPath);
    cachedFontBytes = new Uint8Array(local);
    return cachedFontBytes;
  } catch {
    // Download on first use and cache locally (data/ is gitignored).
  }

  const res = await fetch(FONT_URL);
  if (!res.ok) {
    throw new Error(`한글 폰트 다운로드 실패 (${res.status}). 네트워크 연결을 확인해 주세요.`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(FONT_DIR, { recursive: true });
  await fs.writeFile(localPath, buffer);

  cachedFontBytes = new Uint8Array(buffer);
  return cachedFontBytes;
}

export async function embedKoreanFonts(
  pdfDoc: PDFDocument
): Promise<{ regular: PDFFont; bold: PDFFont }> {
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await loadFontBytes();
  const regular = await pdfDoc.embedFont(fontBytes, { subset: true });

  // Variable font single file — cover uses larger size for emphasis.
  return { regular, bold: regular };
}
