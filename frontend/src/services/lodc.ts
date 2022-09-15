import { Axios } from "axios";
import { useApi } from "../hooks/useApi";

export interface LODCDataset {
  title: string;
  identifier: string;
  website?: string;
  domain?: string;
  keywords: string[];

  other_download: LODCDownload[];
  full_download: LODCDownload[];

  [key: string]: any;
}

export interface LODCDownload {
  title: string;
  description: string;
  url: string;
  available: boolean;
  detect_kg: "YES" | "NO" | "MAYBE";

  [key: string]: any;
}


export const fetchLODCDatasets = (apiClient: Axios) => async () => {
  const result = await apiClient.get<Record<string, LODCDataset>>('lodc/datasets');
  const data = Object.values(result.data).map((dataset) => ({
    id: dataset._id,
    ...dataset,
  }));

  return data;
}
