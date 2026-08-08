/** Mirrors RequirementResponse in requirement.types.ts. */
export interface RequirementResponse {
  id: string;
  organizationId: string;
  frameworkId: string;
  controlId: string | null;
  code: string;
  title: string;
  description: string | null;
  legalBasisRef: string | null;
  createdAt: string;
  updatedAt: string;
}
