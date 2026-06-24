"use server";

import { listDatasets, downloadDataset } from "@/lib/aihub/shell";
import type { AihubDownloadParams, AihubListDatasetsParams } from "@/lib/aihub/types";

export async function listAihubDatasets(params: AihubListDatasetsParams = {}) {
  return listDatasets(params);
}

export async function downloadAihubDataset(params: AihubDownloadParams) {
  const output = await downloadDataset(params);
  return { success: true, message: output.slice(-500) };
}
