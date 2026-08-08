/**
 * Remediation tasks — full module surface (Phase 8).
 * Mirrors dpdpos_backend/src/modules/remediation incl. the lifecycle state
 * machine (domain/remediation-task-lifecycle.state-machine.ts) verbatim.
 */

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

/** Canonical chain for the stepper — terminal CLOSED closes it. */
export const REMEDIATION_STEP_CHAIN = [
  "PENDING",
  "IN_PROGRESS",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "CLOSED",
] as const;

export interface RemediationTaskResponse {
  id: string;
  violationId: string;
  source: string;
  taskTitle: string;
  taskDescription: string | null;
  status: string;
  assignedTo: string | null;
  dueAt: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  closedAt: string | null;
  verificationNotes: string | null;
  resolutionSummary: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors createRemediationTaskDtoSchema — MANUAL tasks only (AUTO comes from the event bus). */
export interface CreateRemediationTaskPayload {
  violationId: string;
  taskTitle: string;
  taskDescription?: string;
  assignedTo?: string;
  dueAt?: string;
}

/** Mirrors updateRemediationTaskDtoSchema — version is the optimistic-lock token. */
export interface UpdateRemediationTaskPayload {
  version: number;
  taskTitle?: string;
  taskDescription?: string | null;
  status?: RemediationTaskStatus;
  assignedTo?: string | null;
  dueAt?: string | null;
  verificationNotes?: string | null;
  resolutionSummary?: string | null;
}

/** Mirrors closeRemediationTaskBodySchema. */
export interface CloseRemediationTaskPayload {
  version: number;
  resolutionSummary: string;
}

export type ListRemediationTasksQuery = {
  status?: RemediationTaskStatus;
  violationId?: string;
  assignedTo?: string;
};

export interface LifecycleAction<T extends string> {
  action: string;
  to: T;
}

/**
 * Lifecycle mirror (§9.9) — copied from the backend state machine. Action
 * availability is derived from the exact source state, never `canTransition`.
 */
export const REMEDIATION_TRANSITIONS: Record<
  RemediationTaskStatus,
  LifecycleAction<RemediationTaskStatus>[]
> = {
  PENDING: [
    { action: "start", to: "IN_PROGRESS" },
    { action: "cancel", to: "CANCELLED" },
  ],
  IN_PROGRESS: [
    { action: "submit", to: "PENDING_VERIFICATION" },
    { action: "cancel", to: "CANCELLED" },
  ],
  PENDING_VERIFICATION: [
    { action: "rework", to: "IN_PROGRESS" },
    { action: "verify", to: "VERIFIED" },
    { action: "cancel", to: "CANCELLED" },
  ],
  VERIFIED: [
    { action: "close", to: "CLOSED" },
    { action: "cancel", to: "CANCELLED" },
  ],
  CLOSED: [],
  CANCELLED: [],
};

export function remediationActionsFor(
  status: string,
): LifecycleAction<RemediationTaskStatus>[] {
  return REMEDIATION_TRANSITIONS[status as RemediationTaskStatus] ?? [];
}

export function isRemediationTerminal(status: string): boolean {
  return status === "CLOSED" || status === "CANCELLED";
}
