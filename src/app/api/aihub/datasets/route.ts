import { NextResponse } from "next/server";
import { listDatasets } from "@/lib/aihub/shell";
import type { AihubListMode } from "@/lib/aihub/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") ?? "l") as AihubListMode;
    const datasetkey = searchParams.get("datasetkey");
    const datapckagekey = searchParams.get("datapckagekey");
    const query = searchParams.get("q");

    const result = await listDatasets({
      mode,
      datasetkey: datasetkey ? parseInt(datasetkey, 10) : undefined,
      datapckagekey: datapckagekey ? parseInt(datapckagekey, 10) : undefined,
    });

    let items = result.items;
    if (query && Array.isArray(items) && "title" in (items[0] ?? {})) {
      items = (items as { key: number; title: string }[]).filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    return NextResponse.json({ mode, items, count: items.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI Hub 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
