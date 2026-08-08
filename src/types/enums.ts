/**
 * Backend enum mirrors — implementation plan §7.3.
 * Source: dpdpos_backend/prisma/schema.prisma + module DTOs.
 * A CI drift check (plan §7.3) diffs these member lists against the zod mirrors.
 */

export const ORGANIZATION_STATUSES = ["ACTIVE", "SUSPENDED", "ARCHIVED"] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const USER_STATUSES = ["ACTIVE", "INVITED", "DISABLED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const FRAMEWORK_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type FrameworkStatus = (typeof FRAMEWORK_STATUSES)[number];

export const CONTROL_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "IMPLEMENTED",
  "VERIFIED",
] as const;
export type ControlStatus = (typeof CONTROL_STATUSES)[number];

export const DATA_ASSET_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export type DataAssetStatus = (typeof DATA_ASSET_STATUSES)[number];

export const DATA_SENSITIVITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type DataSensitivity = (typeof DATA_SENSITIVITIES)[number];

export const CONSENT_STATES = ["GRANTED", "WITHDRAWN"] as const;
export type ConsentState = (typeof CONSENT_STATES)[number];

export const RIGHTS_REQUEST_TYPES = [
  "ACCESS",
  "CORRECTION",
  "COMPLETION",
  "UPDATING",
  "ERASURE",
  "GRIEVANCE_REDRESSAL",
  "NOMINATION",
] as const;
export type RightsRequestType = (typeof RIGHTS_REQUEST_TYPES)[number];

export const RIGHTS_REQUEST_STATUSES = [
  "SUBMITTED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESPONDED",
  "REJECTED",
  "CLOSED",
] as const;
export type RightsRequestStatus = (typeof RIGHTS_REQUEST_STATUSES)[number];

export const RULE_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type RuleSeverity = (typeof RULE_SEVERITIES)[number];

export const RULE_CATEGORIES = ["NOTICE", "CONSENT", "RETENTION", "RIGHTS"] as const;
export type RuleCategory = (typeof RULE_CATEGORIES)[number];

export const VALIDATION_RUN_STATUSES = [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "PARTIAL",
  "FAILED",
] as const;
export type ValidationRunStatus = (typeof VALIDATION_RUN_STATUSES)[number];

export const VALIDATION_RESULT_STATUSES = ["PASS", "FAIL", "SKIPPED", "ERROR"] as const;
export type ValidationResultStatus = (typeof VALIDATION_RESULT_STATUSES)[number];

export const VIOLATION_STATUSES = [
  "OPEN",
  "TRIAGE",
  "ASSIGNED",
  "IN_PROGRESS",
  "PENDING_EVIDENCE",
  "VALIDATED",
  "CLOSED",
  "ARCHIVED",
] as const;
export type ViolationStatus = (typeof VIOLATION_STATUSES)[number];

export const REMEDIATION_TASK_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "CLOSED",
  "CANCELLED",
] as const;
export type RemediationTaskStatus = (typeof REMEDIATION_TASK_STATUSES)[number];

export const REMEDIATION_TASK_SOURCES = ["AUTO", "MANUAL"] as const;
export type RemediationTaskSource = (typeof REMEDIATION_TASK_SOURCES)[number];

export const EVIDENCE_STATUSES = [
  "UPLOADED",
  "TAGGED",
  "MAPPED",
  "UNDER_REVIEW",
  "APPROVED",
  "LOCKED",
] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const REPORT_STATUSES = ["PENDING", "GENERATING", "COMPLETED", "FAILED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_FORMATS = ["PDF", "CSV", "EXCEL"] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];

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

export const NOTIFICATION_STATUSES = ["PENDING", "SENT", "FAILED", "READ"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const NOTIFICATION_CHANNELS = ["EMAIL", "IN_APP", "SLACK", "TEAMS", "WEBHOOK"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const AI_USECASES = ["SUMMARIZE", "DRAFT", "EXPLAIN", "SEARCH"] as const;
export type AiUseCase = (typeof AI_USECASES)[number];

export const AI_REQUEST_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const;
export type AiRequestStatus = (typeof AI_REQUEST_STATUSES)[number];

/** Maturity / sensitivity options for framework generation (framework.dto.ts). */
export const FRAMEWORK_MATURITY_LEVELS = ["basic", "intermediate", "advanced"] as const;
export type FrameworkMaturityLevel = (typeof FRAMEWORK_MATURITY_LEVELS)[number];

export const FRAMEWORK_DATA_SENSITIVITIES = ["low", "medium", "high"] as const;
export type FrameworkDataSensitivity = (typeof FRAMEWORK_DATA_SENSITIVITIES)[number];
