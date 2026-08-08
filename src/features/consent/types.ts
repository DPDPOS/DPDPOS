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
  consentState: string;
  grantedAt: string;
  withdrawnAt: string | null;
  proofFileId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors createConsentRecordDtoSchema. */
export interface CreateConsentRecordPayload {
  dataSubjectIdentifier: string;
  noticeId?: string;
  dataAssetId?: string;
  purpose: string;
  grantedAt?: string;
  proofFileId?: string;
}

/** Mirrors listConsentRecordsQuerySchema. */
export type ListConsentRecordsQuery = {
  dataAssetId?: string;
  noticeId?: string;
  consentState?: ConsentState;
  dataSubjectIdentifier?: string;
};
