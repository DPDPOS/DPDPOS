/** The framework control that owns DPIA delivery (SDF templates). */
export const DPIA_CONTROL_CODE = "CTRL-SDF-DPIA";

/** Mirrors ProcessingActivityResponse in processing-activity.types.ts. */
export interface ProcessingActivityResponse {
  id: string;
  dataAssetId: string;
  vendorId: string | null;
  purpose: string;
  sourceSystem: string | null;
  recipientType: string | null;
  processorName: string | null;
  legalBasis: string | null;
  retentionRule: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors createProcessingActivityDtoSchema. */
export interface CreateProcessingActivityPayload {
  dataAssetId: string;
  purpose: string;
  sourceSystem?: string;
  recipientType?: string;
  processorName?: string;
  vendorId?: string | null;
  legalBasis?: string;
  retentionRule?: string;
  notes?: string;
}

/** Mirrors updateProcessingActivityDtoSchema (partial). */
export type UpdateProcessingActivityPayload = Partial<CreateProcessingActivityPayload>;

/**
 * The backend has no DPIA fields on the activity — the DPIA duty lives on the
 * framework control CTRL-SDF-DPIA. The frontend derives the signal: high-risk
 * processing (HIGH/CRITICAL sensitivity assets) makes a DPIA likely required
 * (DPDP Act 2023 s.17), surfaced as an advisory chip/banner that links back
 * to the control register.
 */
export function dpiaRequiredFor(sensitivity: string | undefined): boolean {
  return sensitivity === "HIGH" || sensitivity === "CRITICAL";
}
