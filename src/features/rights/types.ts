/**
 * Rights requests — mirrors dpdpos_backend/src/modules/rights
 * (data-subject-request.dto.ts + rights-request-lifecycle.state-machine.ts).
 */

export const REQUEST_TYPES = [
  "ACCESS",
  "CORRECTION",
  "COMPLETION",
  "UPDATING",
  "ERASURE",
  "GRIEVANCE_REDRESSAL",
  "NOMINATION",
] as const;
export type RightsRequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_STATUSES = [
  "SUBMITTED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESPONDED",
  "REJECTED",
  "CLOSED",
] as const;
export type RightsRequestStatus = (typeof REQUEST_STATUSES)[number];

/** Mirrors DataSubjectRequestResponse in data-subject-request.types.ts. */
export interface RightsRequestResponse {
  id: string;
  requestType: string;
  requesterReference: string;
  status: string;
  assignedTo: string | null;
  openedAt: string;
  dueAt: string | null;
  closedAt: string | null;
  resolutionSummary: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type ListRightsRequestsQuery = {
  requestType?: RightsRequestType;
  status?: RightsRequestStatus;
  assignedTo?: string;
};

export interface CreateRightsRequestPayload {
  requestType: RightsRequestType;
  requesterReference: string;
  assignedTo?: string;
}

export interface UpdateRightsRequestPayload {
  /** Optimistic-lock token — mismatch returns 409. */
  version: number;
  assignedTo?: string | null;
  status?: RightsRequestStatus;
  resolutionSummary?: string | null;
}

export const RIGHTS_REQUEST_TYPE_LABELS: Record<RightsRequestType, string> = {
  ACCESS: "Right of access",
  CORRECTION: "Right to correction",
  COMPLETION: "Right to completion",
  UPDATING: "Right to updating",
  ERASURE: "Right to erasure",
  GRIEVANCE_REDRESSAL: "Grievance redressal",
  NOMINATION: "Nomination of a representative",
};

/** One-line plain-language explanations for the submit drawer options. */
export const RIGHTS_REQUEST_TYPE_HINTS: Record<RightsRequestType, string> = {
  ACCESS: "Principal asks for a copy of their personal data",
  CORRECTION: "Principal asks to correct inaccurate data",
  COMPLETION: "Principal asks to complete incomplete data",
  UPDATING: "Principal asks to update their data",
  ERASURE: "Principal asks to erase their data",
  GRIEVANCE_REDRESSAL: "Principal raises a grievance about data processing",
  NOMINATION: "Principal nominates a representative for their rights",
};

/**
 * Mirror of the backend RightsRequestStateMachine TRANSITIONS — action → target
 * status. Used for action labels and tests only; buttons in the UI are gated on
 * the exact current status (§10.4 — canTransition returns true for from === to).
 */
export const RIGHTS_TRANSITIONS: Record<
  RightsRequestStatus,
  Partial<Record<RightsRequestStatus, string>>
> = {
  SUBMITTED: { ASSIGNED: "assign", IN_PROGRESS: "start", REJECTED: "reject" },
  ASSIGNED: { IN_PROGRESS: "start", REJECTED: "reject" },
  IN_PROGRESS: { RESPONDED: "respond", REJECTED: "reject" },
  RESPONDED: { CLOSED: "close" },
  REJECTED: {},
  CLOSED: {},
};

/** Legal actions for a status, in a stable order (assign first where legal). */
export function rightsActionsFor(
  status: RightsRequestStatus,
): { action: string; to: RightsRequestStatus }[] {
  const map = RIGHTS_TRANSITIONS[status] ?? {};
  const entries = Object.entries(map) as [RightsRequestStatus, string][];
  return entries.map(([to, action]) => ({ action, to }));
}

/** Terminal states — no further transitions (CLOSED/REJECTED). */
export function isRightsTerminal(status: string): boolean {
  return status === "CLOSED" || status === "REJECTED";
}

/** DPDP-aligned SLA — mirror of RIGHTS_REQUEST_SLA_DAYS (30/45 days). */
export const RIGHTS_REQUEST_SLA_DAYS: Record<RightsRequestType, number> = {
  ACCESS: 30,
  CORRECTION: 30,
  COMPLETION: 30,
  UPDATING: 30,
  ERASURE: 30,
  GRIEVANCE_REDRESSAL: 45,
  NOMINATION: 30,
};

/** Forward progress chain for the stepper (REJECTED branches off). */
export const RIGHTS_STEP_CHAIN: RightsRequestStatus[] = [
  "SUBMITTED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESPONDED",
  "CLOSED",
];
