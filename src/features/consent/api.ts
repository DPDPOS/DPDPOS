import { apiClient } from "@/lib/api/client";
import type {
  ConsentRecordResponse,
  CreateConsentRecordPayload,
  ListConsentRecordsQuery,
} from "./types";

/**
 * GET/POST /api/v1/consent-records, GET /api/v1/consent-records/:id,
 * POST /api/v1/consent-records/:id/withdraw. The list is unpaginated — data
 * comes back as a bare array.
 */
export const consentApi = {
  list: (query?: ListConsentRecordsQuery) =>
    apiClient.get<ConsentRecordResponse[]>("/consent-records", query),
  getById: (id: string) =>
    apiClient.get<ConsentRecordResponse>(`/consent-records/${id}`),
  create: (body: CreateConsentRecordPayload) =>
    apiClient.post<ConsentRecordResponse>("/consent-records", body),
  withdraw: (id: string) =>
    apiClient.post<ConsentRecordResponse>(`/consent-records/${id}/withdraw`),
};
