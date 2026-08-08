/**
 * Evidence vault types — mirror the backend `EvidenceFile` model
 * (dpdpos_backend/prisma/schema.prisma) and its lifecycle state machine
 * (evidence-lifecycle.state-machine.ts).
 */

export const EVIDENCE_STATES = [
  "UPLOADED",
  "TAGGED",
  "MAPPED",
  "UNDER_REVIEW",
  "APPROVED",
  "LOCKED",
] as const;

export type EvidenceStatus = (typeof EVIDENCE_STATES)[number];

/** EvidenceFile as exposed by the response DTO (Prisma shape). */
export interface EvidenceFileRecord {
  id: string;
  organizationId: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  fileHash: string | null;
  fileSizeBytes: number | null;
  description: string | null;
  tags: string[];
  status: EvidenceStatus;
  controlId: string | null;
  violationId: string | null;
  uploadedBy: string | null;
  reviewedBy: string | null;
  approvedBy: string | null;
  lockedAt: string | null;
  expiresAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Client mirror of the server-side state machine (§10.4) — the UI must never
 * offer an illegal transition. `UPLOADED` may jump straight to tag, map or
 * review; afterwards each step is a single onward hop until LOCKED is terminal.
 */
export const EVIDENCE_TRANSITIONS: Record<EvidenceStatus, EvidenceStatus[]> = {
  UPLOADED: ["TAGGED", "MAPPED", "UNDER_REVIEW"],
  TAGGED: ["MAPPED"],
  MAPPED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED"],
  APPROVED: ["LOCKED"],
  LOCKED: [],
};

export function canTransition(
  from: EvidenceStatus,
  to: EvidenceStatus,
): boolean {
  return from === to || EVIDENCE_TRANSITIONS[from].includes(to);
}

/** Human labels + tone keys for the status chips. */
export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  UPLOADED: "Uploaded",
  TAGGED: "Tagged",
  MAPPED: "Mapped",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  LOCKED: "Locked",
};

export type EvidenceListQuery = {
  status?: EvidenceStatus;
  controlId?: string;
  violationId?: string;
  page?: number;
  pageSize?: number;
};

export interface CreateEvidencePayload {
  fileName: string;
  mimeType: string;
  description?: string;
  controlId?: string;
  violationId?: string;
  tags?: string[];
}

export interface ConfirmUploadPayload {
  fileHash: string;
  fileSizeBytes: number;
}

export interface InitiateUploadResult {
  evidence: EvidenceFileRecord;
  uploadUrl: string;
}

export interface EvidenceExportPayload {
  status?: EvidenceStatus;
  controlId?: string;
  violationId?: string;
}

export interface EvidenceExportResult {
  jobId: string;
  status: "PENDING";
}
