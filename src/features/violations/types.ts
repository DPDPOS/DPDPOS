/**
 * Violations — full module surface (Phase 8).
 * Mirrors dpdpos_backend/src/modules/violations incl. the lifecycle state
 * machine (domain/violation-lifecycle.state-machine.ts) verbatim.
 */

export const VIOLATION_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type ViolationSeverity = (typeof VIOLATION_SEVERITIES)[number];

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

/** Canonical chain for the stepper — terminal CLOSED closes it. */
export const VIOLATION_STEP_CHAIN = [
  "OPEN",
  "TRIAGE",
  "ASSIGNED",
  "IN_PROGRESS",
  "PENDING_EVIDENCE",
  "VALIDATED",
  "CLOSED",
] as const;

export interface ViolationResponse {
  id: string;
  validationResultId: string | null;
  severity: string;
  title: string;
  description: string | null;
  status: string;
  assignedTo: string | null;
  openedAt: string;
  dueAt: string | null;
  closedAt: string | null;
  resolutionSummary: string | null;
  evidenceRequiredFlag: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateViolationPayload {
  validationResultId?: string;
  severity: ViolationSeverity;
  title: string;
  description?: string;
  assignedTo?: string;
  dueAt?: string;
}

/** Mirrors updateViolationDtoSchema — version is the optimistic-lock token. */
export interface UpdateViolationPayload {
  version: number;
  title?: string;
  description?: string | null;
  severity?: ViolationSeverity;
  status?: ViolationStatus;
  assignedTo?: string | null;
  dueAt?: string | null;
  resolutionSummary?: string | null;
}

/** Mirrors closeViolationBodySchema. */
export interface CloseViolationPayload {
  version: number;
  resolutionSummary: string;
}

export type ListViolationsQuery = {
  status?: ViolationStatus;
  severity?: ViolationSeverity;
  assignedTo?: string;
};

/**
 * Lifecycle mirror (§9.8) — copied from the backend state machine. Each entry
 * lists the actions legal from that exact source state; the UI never offers a
 * transition the server would reject (never derive from `canTransition` —
 * from===to is trivially true there).
 */
export interface LifecycleAction<T extends string> {
  action: string;
  to: T;
}

export const VIOLATION_TRANSITIONS: Record<
  ViolationStatus,
  LifecycleAction<ViolationStatus>[]
> = {
  OPEN: [
    { action: "triage", to: "TRIAGE" },
    { action: "assign", to: "ASSIGNED" },
    { action: "archive", to: "ARCHIVED" },
  ],
  TRIAGE: [
    { action: "assign", to: "ASSIGNED" },
    { action: "start", to: "IN_PROGRESS" },
    { action: "archive", to: "ARCHIVED" },
  ],
  ASSIGNED: [
    { action: "start", to: "IN_PROGRESS" },
    { action: "archive", to: "ARCHIVED" },
  ],
  IN_PROGRESS: [
    { action: "request_evidence", to: "PENDING_EVIDENCE" },
    { action: "validate", to: "VALIDATED" },
    { action: "archive", to: "ARCHIVED" },
  ],
  PENDING_EVIDENCE: [
    { action: "submit_evidence", to: "IN_PROGRESS" },
    { action: "validate", to: "VALIDATED" },
    { action: "archive", to: "ARCHIVED" },
  ],
  VALIDATED: [
    { action: "close", to: "CLOSED" },
    { action: "archive", to: "ARCHIVED" },
  ],
  CLOSED: [],
  ARCHIVED: [],
};

export function violationActionsFor(
  status: string,
): LifecycleAction<ViolationStatus>[] {
  return VIOLATION_TRANSITIONS[status as ViolationStatus] ?? [];
}

export function isViolationTerminal(status: string): boolean {
  return status === "CLOSED" || status === "ARCHIVED";
}
