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
 * with envelope `meta.pagination` (normalized by apiList), and the export pack
 * queues an EVIDENCE_REPORT (trackable in the report center).
 */
export const evidenceApi = {
  list: (query: EvidenceListQuery) =>
    apiClient.list<EvidenceFileRecord>("/evidence", query),

  get: async (id: string) => {
    const data = await apiClient.get<
      EvidenceFileRecord | { evidence: EvidenceFileRecord; downloadUrl?: string }
    >(`/evidence/${id}`);
    // Backend historically nested `{ evidence, downloadUrl }`; normalize either shape.
    if (data && typeof data === "object" && "evidence" in data && data.evidence) {
      return {
        ...data.evidence,
        tags: data.evidence.tags ?? [],
        downloadUrl: data.downloadUrl,
      };
    }
    const record = data as EvidenceFileRecord;
    return { ...record, tags: record.tags ?? [] };
  },

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
