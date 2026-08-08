import { apiClient } from "@/lib/api/client";
import type { GenerateReportPayload, ReportListQuery, ReportRecord } from "./types";

/**
 * Reports API — mirrors dpdpos_backend/src/modules/reports/routes/report.routes.ts.
 * The list returns the paged shape inside `data` (no meta) — normalized by apiList.
 */
export const reportsApi = {
  list: (query: ReportListQuery) =>
    apiClient.list<ReportRecord>("/reports", query),

  get: (id: string) => apiClient.get<ReportRecord>(`/reports/${id}`),

  generate: (body: GenerateReportPayload) =>
    apiClient.post<ReportRecord>("/reports", body),

  cancel: (id: string) =>
    apiClient.del<{ cancelled: boolean }>(`/reports/${id}`),

  /** Returns `{ downloadUrl }` — only valid once COMPLETED. */
  download: (id: string) =>
    apiClient.get<{ downloadUrl: string }>(`/reports/${id}/download`),
};
