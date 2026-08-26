export type VendorResponse = {
  id: string;
  name: string;
  legalName: string | null;
  vendorType: string;
  countries: string[];
  services: string | null;
  dataCategories: string[];
  criticality: string;
  status: string;
  inherentRiskScore: number | null;
  residualRiskScore: number | null;
  nextReviewAt: string | null;
  ownerUserId: string | null;
  notes: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type VendorRiskScorecard = {
  vendorId: string;
  inherentRiskScore: number;
  residualRiskScore: number;
  criticality: string;
  factors: string[];
  hasActiveDpa: boolean;
  dpaExpiresAt: string | null;
  latestReviewOutcome: string | null;
  childCriticalCount: number;
  openRiskFlags: string[];
};

export type CreateVendorPayload = {
  name: string;
  legalName?: string;
  vendorType?: string;
  countries?: string[];
  services?: string;
  dataCategories?: string[];
  criticality?: string;
  status?: string;
  notes?: string;
};

export type CreateAgreementPayload = {
  title: string;
  versionLabel: string;
  status?: string;
  expiresAt?: string;
  allowsSubProcessors?: boolean;
  crossBorderAllowed?: boolean;
  breachNotifyHours?: number;
};

export type CreateReviewPayload = {
  outcome?: string;
  residualRisk?: string;
  notes?: string;
  complete?: boolean;
};

export type CreateRelationshipPayload = {
  childVendorId: string;
  relationshipType: string;
  personalDataFlows?: boolean;
  notificationRequired?: boolean;
  notes?: string;
};

export type VendorCliTokenResponse = {
  id: string;
  token: string;
  label: string;
  expiresAt: string | null;
  instructions: {
    install: string;
    login: string;
    scan: string;
    sync: string;
  };
};
