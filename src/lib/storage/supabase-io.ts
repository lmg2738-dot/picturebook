import { getSupabaseAdmin, getSupabaseStorageBucket } from "@/lib/supabase/client";

function bucket() {
  return getSupabaseStorageBucket();
}

async function listAllObjectPaths(prefix: string): Promise<string[]> {
  const client = getSupabaseAdmin();
  const paths: string[] = [];
  const root = prefix.replace(/\/$/, "");
  const queue: string[] = [root];

  while (queue.length > 0) {
    const folder = queue.pop()!;
    const { data, error } = await client.storage.from(bucket()).list(folder, { limit: 1000 });
    if (error) throw new Error(`Supabase Storage list failed: ${error.message}`);

    for (const item of data ?? []) {
      const fullPath = folder ? `${folder}/${item.name}` : item.name;
      if (item.metadata === null) {
        queue.push(fullPath);
      } else {
        paths.push(fullPath);
      }
    }
  }

  return paths;
}

export async function supabaseWrite(
  objectPath: string,
  data: Buffer | string,
  contentType?: string
): Promise<void> {
  const body = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  const { error } = await getSupabaseAdmin()
    .storage.from(bucket())
    .upload(objectPath, body, { contentType, upsert: true });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }
}

export async function supabaseRead(objectPath: string): Promise<Buffer | null> {
  const { data, error } = await getSupabaseAdmin().storage.from(bucket()).download(objectPath);
  if (error) {
    if (/not found|404/i.test(error.message)) return null;
    console.error(`[Supabase] read failed (${objectPath}):`, error.message);
    return null;
  }
  return Buffer.from(await data.arrayBuffer());
}

export async function supabaseReadText(objectPath: string): Promise<string | null> {
  const buffer = await supabaseRead(objectPath);
  return buffer ? buffer.toString("utf8") : null;
}

export async function supabaseDelete(objectPath: string): Promise<void> {
  const { error } = await getSupabaseAdmin().storage.from(bucket()).remove([objectPath]);
  if (error) {
    throw new Error(`Supabase Storage delete failed: ${error.message}`);
  }
}

export async function supabaseDeletePrefix(prefix: string): Promise<void> {
  const paths = await listAllObjectPaths(prefix);
  if (paths.length === 0) return;

  const client = getSupabaseAdmin();
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const { error } = await client.storage.from(bucket()).remove(batch);
    if (error) {
      throw new Error(`Supabase Storage batch delete failed: ${error.message}`);
    }
  }
}

export async function supabaseListKeys(prefix: string): Promise<string[]> {
  return listAllObjectPaths(prefix);
}
