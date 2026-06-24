export type AihubListMode = "l" | "pl";
export type AihubDownloadMode = "d" | "pd";

export interface AihubDatasetSummary {
  key: number;
  title: string;
}

export interface AihubFileEntry {
  path: string;
  name: string;
  size: string;
  filekey: number;
}

export interface AihubListDatasetsParams {
  mode?: AihubListMode;
  datasetkey?: number;
  datapckagekey?: number;
}

export interface AihubDownloadParams {
  mode: AihubDownloadMode;
  datasetkey?: number;
  datapckagekey?: number;
  filekeys?: number[];
  outputDir?: string;
}
