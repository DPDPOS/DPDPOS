/**
 * Report center types — mirror the backend Report model and enums
 * (dpdpos_backend/prisma/schema.prisma, report.dto.ts).
 */

export const REPORT_TYPES = [
  "COMPLIANCE_SUMMARY",
  "BOARD_PACK",
  "VIOLATION_REPORT",
  "EVIDENCE_REPORT",
  "VALIDATION_REPORT",
  "CONSENT_REPORT",
  "RIGHTS_REPORT",
  "AUDIT_REPORT",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_FORMATS = ["PDF", "CSV", "EXCEL"] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];

export const REPORT_STATUSES = ["PENDING", "GENERATING", "COMPLETED", "FAILED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** ReportRecord as exposed by the response DTO. */
export interface ReportRecord {
  id: string;
  organizationId: string;
  reportType: string;
  title: string;
  status: ReportStatus;
  format: string;
  generatedBy: string | null;
  storageKey: string | null;
  parameters: { dateFrom?: string; dateTo?: string } | null;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  COMPLIANCE_SUMMARY: "Compliance summary",
  BOARD_PACK: "Board pack",
  VIOLATION_REPORT: "Violation report",
  EVIDENCE_REPORT: "Evidence report",
  VALIDATION_REPORT: "Validation report",
  CONSENT_REPORT: "Consent report",
  RIGHTS_REPORT: "Rights report",
  AUDIT_REPORT: "Audit report",
};

/** One-line purpose per type for the generate modal. */
export const REPORT_TYPE_DESCRIPTIONS: Record<ReportType, string> = {
  COMPLIANCE_SUMMARY: "Score, rule pass/fail and open violations",
  BOARD_PACK: "Executive-ready compliance digest",
  VIOLATION_REPORT: "Open and closed violations by severity",
  EVIDENCE_REPORT: "Evidence coverage across controls",
  VALIDATION_REPORT: "Latest validation run results",
  CONSENT_REPORT: "Grants and withdrawals over time",
  RIGHTS_REPORT: "Data subject requests and SLAs",
  AUDIT_REPORT: "Activity trail extract",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: "Queued",
  GENERATING: "Generating",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

export type ReportListQuery = {
  reportType?: ReportType;
  status?: ReportStatus;
  page?: number;
  pageSize?: number;
};

export interface GenerateReportPayload {
  reportType: ReportType;
  title?: string;
  format?: ReportFormat;
  parameters?: { dateFrom?: string; dateTo?: string };
}
