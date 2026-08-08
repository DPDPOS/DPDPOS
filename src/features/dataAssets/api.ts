import { apiClient } from "@/lib/api/client";
import type {
  CreateDataAssetPayload,
  DataAssetResponse,
  UpdateDataAssetPayload,
} from "./types";

/**
 * GET/POST /api/v1/data-assets, GET/PATCH/DELETE /api/v1/data-assets/:id.
 * Note: the list endpoint is unpaginated on the backend (no page/pageSize
 * query schema) — data comes back as a bare array in the envelope.
 */
export const dataAssetsApi = {
  list: () => apiClient.get<DataAssetResponse[]>("/data-assets"),
  getById: (id: string) =>
    apiClient.get<DataAssetResponse>(`/data-assets/${id}`),
  create: (body: CreateDataAssetPayload) =>
    apiClient.post<DataAssetResponse>("/data-assets", body),
  update: (id: string, body: UpdateDataAssetPayload) =>
    apiClient.patch<DataAssetResponse>(`/data-assets/${id}`, body),
  /** Soft archive — the record is retained for traceability. */
  archive: (id: string) => apiClient.del<DataAssetResponse>(`/data-assets/${id}`),
};
