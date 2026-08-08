import { apiClient } from "@/lib/api/client";
import type {
  CloseViolationPayload,
  CreateViolationPayload,
  ListViolationsQuery,
  UpdateViolationPayload,
  ViolationResponse,
} from "./types";

/**
 * GET/POST /api/v1/violations, GET/PATCH /:id, POST /:id/close.
 * The list is unpaginated — a bare array in `data` (mirrors the repository's
 * flat `list`), so no pagination params are sent.
 */
export const violationsApi = {
  list: (query?: ListViolationsQuery) =>
    apiClient.get<ViolationResponse[]>("/violations", query),
  getById: (id: string) =>
    apiClient.get<ViolationResponse>(`/violations/${id}`),
  create: (body: CreateViolationPayload) =>
    apiClient.post<ViolationResponse>("/violations", body),
  update: (id: string, body: UpdateViolationPayload) =>
    apiClient.patch<ViolationResponse>(`/violations/${id}`, body),
  close: (id: string, body: CloseViolationPayload) =>
    apiClient.post<ViolationResponse>(`/violations/${id}/close`, body),
};
