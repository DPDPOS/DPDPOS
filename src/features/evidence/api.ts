import { apiClient } from "@/lib/api/client";
import type {
  ConfirmUploadPayload,
  CreateEvidencePayload,
  EvidenceExportPayload,
  EvidenceExportResult,
  EvidenceFileRecord,
  EvidenceListQuery,
  InitiateUploadResult,
} from "./types";

/**
 * Evidence API — mirrors dpdpos_backend/src/modules/evidence/routes/evidence.routes.ts
 * exactly, including the oddities: the list endpoint returns the paged shape
 * *inside* `data` (normalized by apiList), and the export pack returns a job id
 * with no status-poll endpoint exposed (§9.10).
 */
export const evidenceApi = {
  list: (query: EvidenceListQuery) =>
    apiClient.list<EvidenceFileRecord>("/evidence", query),

  get: (id: string) => apiClient.get<EvidenceFileRecord>(`/evidence/${id}`),

  /** Presigned pipeline step 1 — creates the record + returns a PUT url. */
  initiateUpload: (body: CreateEvidencePayload) =>
    apiClient.post<InitiateUploadResult>("/evidence", body),

  /** Presigned pipeline step 3 — confirms the object arrived with its hash. */
  confirmUpload: (id: string, body: ConfirmUploadPayload) =>
    apiClient.patch<EvidenceFileRecord>(`/evidence/${id}/confirm`, body),

  tag: (id: string, body: { tags: string[]; description?: string }) =>
    apiClient.patch<EvidenceFileRecord>(`/evidence/${id}/tag`, body),

  mapToControl: (id: string, controlId: string) =>
    apiClient.patch<EvidenceFileRecord>(`/evidence/${id}/map`, { controlId }),

  submitForReview: (id: string) =>
    apiClient.patch<EvidenceFileRecord>(`/evidence/${id}/submit-review`),

  approve: (id: string) =>
    apiClient.patch<EvidenceFileRecord>(`/evidence/${id}/approve`),

  lock: (id: string) =>
    apiClient.patch<EvidenceFileRecord>(`/evidence/${id}/lock`),

  /** Returns `{ downloadUrl }` — open it directly to fetch the object. */
  download: (id: string) =>
    apiClient.get<{ downloadUrl: string }>(`/evidence/${id}/download`),

  exportPack: (body: EvidenceExportPayload) =>
    apiClient.post<EvidenceExportResult>("/evidence/export", body),
};
