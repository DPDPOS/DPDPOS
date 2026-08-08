"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { auditApi } from "./api";
import type { ListAuditLogsQuery } from "./types";

/** Cursor-paginated log feed — the `cursor` param is the load-more lever. */
export function useAuditLogs(filters: Omit<ListAuditLogsQuery, "cursor">, enabled = true) {
  return useQuery({
    queryKey: queryKeys.audit(filters as Record<string, unknown>),
    queryFn: () => auditApi.search(filters),
    enabled,
    retry: 0,
  });
}

/** Append the next cursor page to the existing list (load-more, no dedup). */
export function useAuditLogsPage() {
  const queryClient = useQueryClient();
  return (filters: Omit<ListAuditLogsQuery, "cursor">, cursor: string) =>
    queryClient.fetchQuery({
      queryKey: queryKeys.audit({ ...filters, cursor }),
      queryFn: () => auditApi.search({ ...filters, cursor }),
    });
}

/** GET /audit/entity/:type/:id — chronological history for a record. */
export function useAuditEntityHistory(entityType: string | null, entityId: string | null) {
  return useQuery({
    queryKey: ["audit", "entity", entityType, entityId] as const,
    queryFn: () => auditApi.entityHistory(entityType as string, entityId as string),
    enabled: Boolean(entityType && entityId),
    retry: 0,
  });
}
