import { apiClient } from "@/lib/api/client";
import type {
  CreateRightsRequestPayload,
  ListRightsRequestsQuery,
  RightsRequestResponse,
  UpdateRightsRequestPayload,
} from "./types";

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
};
