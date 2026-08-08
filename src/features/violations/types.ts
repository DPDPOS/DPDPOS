/**
 * Violations — minimal surface for the Phase 7 validation chain
 * (§10.3 create-violation from a FAIL result). Phase 8 expands this module.
 * Mirrors dpdpos_backend/src/modules/violations.
 */

export const VIOLATION_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type ViolationSeverity = (typeof VIOLATION_SEVERITIES)[number];

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
