export type ImageFormat = "png" | "jpeg" | "svg";

export function detectImageFormat(buffer: Buffer): ImageFormat {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e) {
    return "png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  const head = buffer.subarray(0, Math.min(buffer.length, 256)).toString("utf8").trimStart();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) {
    return "svg";
  }

  return "png";
}

export function imageMimeType(format: ImageFormat): string {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "svg":
      return "image/svg+xml";
    default:
      return "image/png";
  }
}

export function pageImageFilename(pageNo: number, format: ImageFormat): string {
  const ext = format === "jpeg" ? "jpg" : format;
  return `page-${pageNo}.${ext}`;
}
