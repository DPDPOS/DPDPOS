import { apiClient } from "@/lib/api/client";

/** Mirrors `GET /notifications/unread-count` → `{ count }`. */
export interface UnreadCount {
  count: number;
}

/** GET/PATCH /api/v1/notifications/* — gated by `notification:read`. */
export const notificationsApi = {
  unreadCount: () =>
    apiClient.get<UnreadCount>("/notifications/unread-count"),
  markAllRead: () => apiClient.patch<{ count?: number }>("/notifications/read-all"),
};
