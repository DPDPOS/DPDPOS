/** Mirrors AuditLogRecord in dpdpos_backend audit-response.dto.ts. */
export interface AuditLogRecord {
  id: string;
  organizationId: string;
  actorUserId: string | null;
  actionType: string;
  entityType: string | null;
  entityId: string | null;
  /** Human-readable explanation of the event (from audit catalog). */
  description?: string;
  beforeJson: unknown | null;
  afterJson: unknown | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
  createdAt: string;
}

/** Mirrors listAuditLogsQuerySchema — cursor pagination, not page-based. */
export interface ListAuditLogsQuery {
  entityType?: string;
  actionType?: string;
  actorUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}

/** `GET /audit` → `{ data: rows, nextCursor }` (cursor pagination). */
export interface AuditLogPage {
  data: AuditLogRecord[];
  nextCursor: string | null;
}

/** Mirrors exportAuditDtoSchema. */
export interface ExportAuditPayload {
  dateFrom?: string;
  dateTo?: string;
  format?: "csv" | "pdf";
}

/** Known entity types (derived from event names) for the filter datalist. */
export const AUDIT_ENTITY_TYPES = [
  "Violation",
  "RemediationTask",
  "EvidenceFile",
  "Control",
  "Requirement",
  "DataAsset",
  "ProcessingActivity",
  "Notice",
  "ConsentRecord",
  "ValidationRun",
  "ValidationRule",
  "Report",
  "User",
  "Role",
  "Department",
  "Framework",
] as const;
