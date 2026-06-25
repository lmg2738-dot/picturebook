import { useBlobStorage, useS3Storage } from "./config";
import {
  blobDelete,
  blobDeletePrefix,
  blobRead,
  blobReadText,
  blobWrite,
} from "./blob-io";
import {
  s3Delete,
  s3DeletePrefix,
  s3ListKeys,
  s3Read,
  s3ReadText,
  s3Write,
} from "./s3-io";

export async function remoteWrite(
  pathname: string,
  data: Buffer | string,
  contentType?: string
): Promise<void> {
  if (useS3Storage()) {
    await s3Write(pathname, data, contentType);
    return;
  }
  await blobWrite(pathname, data, contentType);
}

export async function remoteRead(pathname: string): Promise<Buffer | null> {
  if (useS3Storage()) return s3Read(pathname);
  return blobRead(pathname);
}

export async function remoteReadText(pathname: string): Promise<string | null> {
  if (useS3Storage()) return s3ReadText(pathname);
  return blobReadText(pathname);
}

export async function remoteDelete(pathname: string): Promise<void> {
  if (useS3Storage()) {
    await s3Delete(pathname);
    return;
  }
  await blobDelete(pathname);
}

export async function remoteDeletePrefix(prefix: string): Promise<void> {
  if (useS3Storage()) {
    await s3DeletePrefix(prefix);
    return;
  }
  await blobDeletePrefix(prefix);
}

export async function remoteListJsonKeys(prefix: string): Promise<string[]> {
  if (useS3Storage()) {
    const keys = await s3ListKeys(prefix);
    return keys.filter((k) => k.endsWith(".json"));
  }

  const { list } = await import("@vercel/blob");
  const keys: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor });
    for (const blob of page.blobs) {
      if (blob.pathname.endsWith(".json")) keys.push(blob.pathname);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return keys;
}
