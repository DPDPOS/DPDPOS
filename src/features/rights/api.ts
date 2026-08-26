import { apiClient } from "@/lib/api/client";
import type {
  CreateRightsRequestPayload,
  ListRightsRequestsQuery,
  RightsRequestResponse,
  UpdateRightsRequestPayload,
} from "./types";

export type ErasureChecklistItem = {
  id: string;
  systemKey: string;
  systemLabel: string;
  vendorId: string | null;
  status: string;
  confirmedAt: string | null;
  notes: string | null;
};

export type ErasurePack = {
  requestId: string;
  requestType: string;
  status: string;
  immediateErase: boolean;
  coolingOffUntil: string | null;
  softDeletedAt: string | null;
  hardDeletedAt: string | null;
  evidence: unknown;
  checklist: ErasureChecklistItem[];
};

/**
 * GET/POST /api/v1/data-subject-requests, GET/PATCH /:id. The list is
 * unpaginated — a bare array in `data`.
 */
export const rightsApi = {
  list: (query?: ListRightsRequestsQuery) =>
    apiClient.get<RightsRequestResponse[]>("/data-subject-requests", query),
  getById: (id: string) =>
    apiClient.get<RightsRequestResponse>(`/data-subject-requests/${id}`),
  create: (body: CreateRightsRequestPayload) =>
    apiClient.post<RightsRequestResponse>("/data-subject-requests", body),
  update: (id: string, body: UpdateRightsRequestPayload) =>
    apiClient.patch<RightsRequestResponse>(`/data-subject-requests/${id}`, body),
  getErasure: (id: string) =>
    apiClient.get<ErasurePack>(`/data-subject-requests/${id}/erasure`),
  startErasure: (
    id: string,
    body?: { immediate?: boolean; coolingOffDays?: number },
  ) =>
    apiClient.post<ErasurePack>(
      `/data-subject-requests/${id}/erasure/start`,
      body ?? {},
    ),
  confirmErasureItem: (
    id: string,
    body: { systemKey: string; status: "DONE" | "SKIPPED" | "FAILED"; notes?: string },
  ) =>
    apiClient.post(`/data-subject-requests/${id}/erasure/confirm`, body),
  completeErasure: (id: string) =>
    apiClient.post(`/data-subject-requests/${id}/erasure/complete`, {}),
};
