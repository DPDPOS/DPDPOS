/** Mirrors controlStatusSchema in control.dto.ts. */
export const CONTROL_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "IMPLEMENTED",
  "VERIFIED",
] as const;

export type ControlStatus = (typeof CONTROL_STATUSES)[number];

/** Mirrors ControlResponse in control.types.ts. */
export interface ControlResponse {
  id: string;
  organizationId: string;
  frameworkId: string;
  code: string;
  title: string;
  description: string | null;
  ownerUserId: string | null;
  dueAt: string | null;
  status: string;
  legalBasisRef: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateControlPayload {
  frameworkId: string;
  code: string;
  title: string;
  description?: string;
  ownerUserId?: string;
  dueAt?: string;
  legalBasisRef?: string;
  status?: ControlStatus;
}

/** Mirrors updateControlDtoSchema — nullable fields may be cleared. */
export type UpdateControlPayload = {
  title?: string;
  description?: string | null;
  ownerUserId?: string | null;
  dueAt?: string | null;
  legalBasisRef?: string | null;
  status?: ControlStatus;
};
