import fs from "fs/promises";
import path from "path";
import {
  BOOK_PREFIX,
  MEDIA_PREFIX,
  getDataDir,
  shouldResetStorageOnGenerate,
  useRemoteStorage,
} from "./config";
import { remoteDeletePrefix, remoteListJsonKeys } from "./remote-io";

const BOOKS_DIR = () => path.join(getDataDir(), "books");
const MEDIA_DIR = () => path.join(getDataDir(), "media");

export interface StorageResetResult {
  deletedBooks: number;
  deletedObjects: number;
}

export { shouldResetStorageOnGenerate };

/** Blob/S3/로컬의 storyseed 데이터를 모두 삭제합니다. */
export async function clearAllStorage(): Promise<StorageResetResult> {
  if (useRemoteStorage()) {
    const bookKeys = await remoteListJsonKeys(BOOK_PREFIX);
    let deletedObjects = bookKeys.length;

    await remoteDeletePrefix(MEDIA_PREFIX);
    await remoteDeletePrefix(BOOK_PREFIX);

    const remainingMedia = await remoteListJsonKeys(MEDIA_PREFIX).catch(() => [] as string[]);
    const remainingBooks = await remoteListJsonKeys(BOOK_PREFIX).catch(() => [] as string[]);
    deletedObjects += remainingMedia.length + remainingBooks.length;

    return { deletedBooks: bookKeys.length, deletedObjects };
  }

  let deletedBooks = 0;
  try {
    const files = await fs.readdir(BOOKS_DIR());
    deletedBooks = files.filter((f) => f.endsWith(".json")).length;
    for (const file of files) {
      if (file.endsWith(".json")) {
        await fs.unlink(path.join(BOOKS_DIR(), file)).catch(() => undefined);
      }
    }
  } catch {
    // books dir may not exist
  }

  try {
    await fs.rm(MEDIA_DIR(), { recursive: true, force: true });
    await fs.mkdir(MEDIA_DIR(), { recursive: true });
  } catch {
    // ignore
  }

  return { deletedBooks, deletedObjects: deletedBooks };
}

export async function resetStorageIfConfigured(): Promise<StorageResetResult | null> {
  if (!shouldResetStorageOnGenerate()) return null;
  const result = await clearAllStorage();
  console.info(
    `[Storage] Reset on generate: ${result.deletedBooks} books, ~${result.deletedObjects} objects removed`
  );
  return result;
}
