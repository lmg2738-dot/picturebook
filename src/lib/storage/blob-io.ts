import { del, list, put } from "@vercel/blob";

function isBlobSuspendedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /suspended|blocked|store has been/i.test(msg);
}

function wrapBlobError(err: unknown): Error {
  if (isBlobSuspendedError(err)) {
    return new Error(
      "Vercel Blob 스토어가 정지되었습니다. Vercel Dashboard → Storage에서 새 Public Blob을 만들고 프로젝트에 연결하거나, " +
        "Cloudflare R2 등 S3 호환 스토리지로 전환하세요(STORAGE_BACKEND=s3). Hobby 플랜 한도(전송 10GB/월) 초과 시에도 정지될 수 있습니다."
    );
  }
  return err instanceof Error ? err : new Error(String(err));
}

async function fetchBlobBytes(downloadUrl: string): Promise<Buffer> {
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    throw new Error(`Blob download failed (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function findBlobByPathname(pathname: string) {
  const { blobs } = await list({ prefix: pathname, limit: 20 });
  return blobs.find((b) => b.pathname === pathname) ?? null;
}

export async function blobWrite(
  pathname: string,
  data: Buffer | string,
  contentType?: string
): Promise<void> {
  try {
    await put(pathname, data, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
  } catch (err) {
    throw wrapBlobError(err);
  }
}

export async function blobRead(pathname: string): Promise<Buffer | null> {
  try {
    const blob = await findBlobByPathname(pathname);
    if (!blob) return null;
    return await fetchBlobBytes(blob.downloadUrl);
  } catch (err) {
    if (isBlobSuspendedError(err)) throw wrapBlobError(err);
    console.error(`[Blob] read failed (${pathname}):`, err);
    return null;
  }
}

export async function blobReadText(pathname: string): Promise<string | null> {
  const buffer = await blobRead(pathname);
  return buffer ? buffer.toString("utf8") : null;
}

export async function blobDelete(pathname: string): Promise<void> {
  const blob = await findBlobByPathname(pathname);
  if (blob) await del(blob.url);
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
