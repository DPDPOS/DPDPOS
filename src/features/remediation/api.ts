import { apiClient } from "@/lib/api/client";
import type {
  CloseRemediationTaskPayload,
  CreateRemediationTaskPayload,
  ListRemediationTasksQuery,
  RemediationTaskResponse,
  UpdateRemediationTaskPayload,
} from "./types";

/**
 * GET/POST /api/v1/remediation-tasks, GET/PATCH /:id, POST /:id/close.
 * The list is unpaginated — a bare array in `data`.
 */
export const remediationApi = {
  list: (query?: ListRemediationTasksQuery) =>
    apiClient.get<RemediationTaskResponse[]>("/remediation-tasks", query),
  getById: (id: string) =>
    apiClient.get<RemediationTaskResponse>(`/remediation-tasks/${id}`),
  create: (body: CreateRemediationTaskPayload) =>
    apiClient.post<RemediationTaskResponse>("/remediation-tasks", body),
  update: (id: string, body: UpdateRemediationTaskPayload) =>
    apiClient.patch<RemediationTaskResponse>(`/remediation-tasks/${id}`, body),
  close: (id: string, body: CloseRemediationTaskPayload) =>
    apiClient.post<RemediationTaskResponse>(`/remediation-tasks/${id}/close`, body),
};
