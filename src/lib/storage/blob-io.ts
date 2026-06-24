import { del, head, list, put } from "@vercel/blob";

async function fetchBlobBytes(downloadUrl: string): Promise<Buffer> {
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    throw new Error(`Blob download failed (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function blobWrite(
  pathname: string,
  data: Buffer | string,
  contentType?: string
): Promise<void> {
  await put(pathname, data, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
}

export async function blobRead(pathname: string): Promise<Buffer | null> {
  try {
    const meta = await head(pathname);
    return await fetchBlobBytes(meta.downloadUrl);
  } catch {
    return null;
  }
}

export async function blobReadText(pathname: string): Promise<string | null> {
  const buffer = await blobRead(pathname);
  return buffer ? buffer.toString("utf8") : null;
}

export async function blobDeletePrefix(prefix: string): Promise<void> {
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor });
    if (page.blobs.length > 0) {
      await del(page.blobs.map((b) => b.url));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}
