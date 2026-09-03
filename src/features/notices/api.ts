import { apiClient } from "@/lib/api/client";
import type {
  CreateNoticePayload,
  NoticeDiffResponse,
  NoticeResponse,
} from "./types";

/**
 * GET/POST /api/v1/notices, GET/DELETE /api/v1/notices/:id. The list is
 * unpaginated on the backend — data comes back as a bare array.
 */
export const noticesApi = {
  list: () => apiClient.get<NoticeResponse[]>("/notices"),
  getById: (id: string) =>
    apiClient.get<NoticeResponse>(`/notices/${id}`),
  create: (body: CreateNoticePayload) =>
    apiClient.post<NoticeResponse>("/notices", body),
  /** Soft delete — the notice stays in the audit trail. */
  remove: (id: string) => apiClient.del<NoticeResponse>(`/notices/${id}`),
  /** Unified diff of the current notice against another version of the same title. */
  diff: (id: string, againstVersion: number) =>
    apiClient.get<NoticeDiffResponse>(`/notices/${id}/diff`, {
      againstVersion,
    }),
};
