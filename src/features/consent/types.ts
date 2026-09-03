/** Mirrors ConsentState in the Prisma schema. */
export const CONSENT_STATES = ["GRANTED", "WITHDRAWN"] as const;
export type ConsentState = (typeof CONSENT_STATES)[number];

/** Mirrors ConsentRecordResponse in consent-record.types.ts. */
export interface ConsentRecordResponse {
  id: string;
  dataSubjectIdentifier: string;
  noticeId: string | null;
  dataAssetId: string | null;
  purpose: string;
  purposes: string[];
  consentState: string;
  grantedAt: string;
  withdrawnAt: string | null;
  expiresAt: string | null;
  proofFileId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors createConsentRecordDtoSchema. */
export interface CreateConsentRecordPayload {
  dataSubjectIdentifier: string;
  noticeId?: string;
  dataAssetId?: string;
  /** Preferred multi-purpose list. */
  purposes?: string[];
  /** Back-compat singular purpose. */
  purpose: string;
  grantedAt?: string;
  expiresAt?: string;
  proofFileId?: string;
}

/** Mirrors listConsentRecordsQuerySchema. */
export type ListConsentRecordsQuery = {
  dataAssetId?: string;
  noticeId?: string;
  consentState?: ConsentState;
  dataSubjectIdentifier?: string;
};
