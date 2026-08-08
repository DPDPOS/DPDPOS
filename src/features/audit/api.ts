import { apiClient, BASE_URL } from "@/lib/api/client";
import { useSessionStore } from "@/state/session";
import type { AuditLogPage, AuditLogRecord, ExportAuditPayload, ListAuditLogsQuery } from "./types";

/** GET /audit — cursor-paginated; gated by `audit:read`. */
export const auditApi = {
  search: (query?: ListAuditLogsQuery) =>
    apiClient.get<AuditLogPage>("/audit", query as Record<string, string | number | boolean | null | undefined>),
  /** GET /audit/entity/:entityType/:entityId — chronological history. */
  entityHistory: (entityType: string, entityId: string) =>
    apiClient.get<AuditLogRecord[]>(`/audit/entity/${entityType}/${entityId}`),
};

/**
 * POST /audit/export — the controller streams the artifact (csv/pdf) directly,
 * not an envelope, so this bypasses the JSON client and triggers a download.
 * Gated by `audit:export`.
 */
export async function downloadAuditExport(body: ExportAuditPayload): Promise<void> {
  const accessToken = useSessionStore.getState().accessToken;
  const res = await fetch(`${BASE_URL}/audit/export`, {
    method: "POST",
    headers: {
      Accept: "text/csv, application/pdf, application/octet-stream",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Export failed (HTTP ${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-export.${body.format === "pdf" ? "pdf" : "csv"}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
