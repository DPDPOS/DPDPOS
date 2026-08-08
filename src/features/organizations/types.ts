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
}
