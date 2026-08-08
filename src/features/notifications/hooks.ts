"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { notificationsApi } from "./api";
import type { ListNotificationsQuery } from "./types";

/** Paginated inbox for the notifications center. */
export function useNotificationsPage(
  page: number,
  pageSize: number,
  filters: Partial<ListNotificationsQuery> = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.notifications({ ...filters, page, pageSize }),
    queryFn: () => notificationsApi.list({ ...filters, page, pageSize }),
    enabled,
    retry: 0,
  });
}

/** Unread badge count (bell) — shared key with the center for invalidation. */
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: notificationsApi.unreadCount,
    enabled,
    refetchInterval: 60_000,
    retry: 0,
  });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
  };
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: invalidate,
  });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: invalidate,
  });
}

/** Preferences — optimistic update with rollback on failure. */
export function useNotificationPreferences(enabled = true) {
  const queryClient = useQueryClient();
  const key = ["notifications", "preferences"] as const;
  const query = useQuery({
    queryKey: key,
    queryFn: notificationsApi.getPreferences,
    enabled,
    retry: 0,
  });
  const mutation = useMutation({
    mutationFn: (body: Partial<{ email: boolean; inApp: boolean; slack: boolean }>) =>
      notificationsApi.updatePreferences(body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ email: boolean; inApp: boolean; slack: boolean }>(key);
      queryClient.setQueryData(key, (old) => ({ ...(old ?? {}), ...body }));
      return { previous };
    },
    onError: (_err, _body, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
  return { ...query, mutation };
}
