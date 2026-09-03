/** Consent manager integration mode — mirrors Prisma ConsentManagerMode. */
export const CONSENT_MANAGER_MODES = ["NONE", "EXTERNAL_CM"] as const;
export type ConsentManagerMode = (typeof CONSENT_MANAGER_MODES)[number];

/** Mirrors OrganizationResponse in dpdpos_backend organizations/types. */
export interface OrganizationResponse {
  id: string;
  name: string;
  industry: string | null;
  companySize: string | null;
  operatingRegion: string | null;
  companyType: string | null;
  maturityLevel: string | null;
  isSignificantDataFiduciary: boolean;
  consentManagerMode: ConsentManagerMode | string;
  consentManagerUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors updateOrganizationDtoSchema — no version field on the org DTO. */
export interface UpdateOrganizationPayload {
  name?: string;
  industry?: string | null;
  companySize?: string | null;
  operatingRegion?: string | null;
  companyType?: string | null;
  maturityLevel?: string | null;
  isSignificantDataFiduciary?: boolean;
  consentManagerMode?: ConsentManagerMode;
  consentManagerUrl?: string | null;
}
