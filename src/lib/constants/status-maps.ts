/**
 * Status semantics — single source of truth for chips and filter dropdowns
 * (implementation plan §8.2). Keys are the backend enum members.
 */

export type Tone = "pass" | "warn" | "fail" | "info" | "neutral";

export const STATUS_TONES: Record<string, Tone> = {
  // Control lifecycle
  NOT_STARTED: "neutral",
  IMPLEMENTED: "pass",

  // Violation lifecycle
  OPEN: "fail",
  TRIAGE: "warn",
  ASSIGNED: "info",
  IN_PROGRESS: "info",
  PENDING_EVIDENCE: "warn",
  VALIDATED: "pass",
  CLOSED: "neutral",
  ARCHIVED: "neutral",

  // Remediation lifecycle
  PENDING: "warn",
  PENDING_VERIFICATION: "warn",
  VERIFIED: "pass",
  CANCELLED: "neutral",

  // Evidence lifecycle
  UPLOADED: "neutral",
  TAGGED: "info",
  MAPPED: "info",
  UNDER_REVIEW: "warn",
  APPROVED: "pass",
  LOCKED: "neutral",

  // Rights requests
  SUBMITTED: "info",
  RESPONDED: "pass",
  REJECTED: "fail",

  // Validation runs
  RUNNING: "info",
  COMPLETED: "pass",
  PARTIAL: "warn",
  FAILED: "fail",

  // Validation results
  PASS: "pass",
  FAIL: "fail",
  SKIPPED: "neutral",
  ERROR: "fail",

  // Severity / sensitivity
  LOW: "neutral",
  MEDIUM: "warn",
  HIGH: "warn",
  CRITICAL: "fail",

  // Consent
  GRANTED: "pass",
  WITHDRAWN: "neutral",

  // Users / org / framework / assets
  ACTIVE: "pass",
  INVITED: "info",
  DISABLED: "neutral",
  SUSPENDED: "fail",
  DRAFT: "neutral",
  PUBLISHED: "pass",

  // Reports / notifications / AI
  GENERATING: "info",
  SENT: "info",
  READ: "neutral",
  PROCESSING: "info",

  // Rights request types (labels only)
  ACCESS: "info",
  CORRECTION: "info",
  COMPLETION: "info",
  UPDATING: "info",
  ERASURE: "warn",
  GRIEVANCE_REDRESSAL: "warn",
  NOMINATION: "info",
} as const;

/** Resolve a status string to a tone; unknown values fall back to neutral. */
export function toneFor(status: string | null | undefined): Tone {
  if (status && status in STATUS_TONES) {
    return STATUS_TONES[status];
  }
  return "neutral";
}

/** "PENDING_VERIFICATION" → "Pending Verification" */
export function humanizeStatus(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
