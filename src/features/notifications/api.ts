import { apiClient } from "@/lib/api/client";
import type { ListNotificationsQuery, NotificationPreferences, NotificationRecord } from "./types";

/** GET/PATCH /api/v1/notifications/* — gated by `notification:read`. */
export const notificationsApi = {
  /** GET /notifications — paginated `{ items, pagination }` (Variant C list). */
  list: (query?: ListNotificationsQuery) =>
    apiClient.list<NotificationRecord>("/notifications", query as Record<string, string | number | boolean | null | undefined>),
  unreadCount: () =>
    apiClient.get<{ count: number }>("/notifications/unread-count"),
  /** PATCH /notifications/:id/read — `notification:read`. */
  markRead: (id: string) =>
    apiClient.patch<{ success: boolean }>(`/notifications/${id}/read`),
  markAllRead: () =>
    apiClient.patch<{ updatedCount?: number }>("/notifications/read-all"),
  /** GET /notifications/preferences — `notification:read`. */
  getPreferences: () =>
    apiClient.get<NotificationPreferences>("/notifications/preferences"),
  /** PUT /notifications/preferences — `notification:update_preferences`. */
  updatePreferences: (body: Partial<NotificationPreferences>) =>
    apiClient.put<NotificationPreferences>("/notifications/preferences", body),
};
