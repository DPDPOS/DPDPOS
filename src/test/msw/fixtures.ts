import type { AuthMeResponse, AuthTokens } from "@/features/auth/types";
import type { DashboardOverview } from "@/features/analytics/types";
import type { ControlResponse } from "@/features/controls/types";
import type { DataAssetResponse } from "@/features/dataAssets/types";
import type { FrameworkResponse } from "@/features/framework/types";
import type { ProcessingActivityResponse } from "@/features/processingActivities/types";
import type { RequirementResponse } from "@/features/requirements/types";
import type { UserResponse } from "@/features/users/types";
import type { DepartmentResponse } from "@/features/departments/types";
import { DEMO_CREDENTIALS } from "@/features/auth/demo-credentials";

const ORG_ID = DEMO_CREDENTIALS.organizationId;
const FRAMEWORK_ID = "11111111-1111-4111-8111-111111111111";

/** Mirrors the seed admin (dpdpos_backend/prisma/seed/seed.ts). */
export const testUser: AuthMeResponse = {
  id: "usr_demo_admin",
  organizationId: DEMO_CREDENTIALS.organizationId,
  email: DEMO_CREDENTIALS.email,
  name: "Asha Rao",
  status: "ACTIVE",
  roles: ["ORG_ADMIN"],
  permissions: ["users:create", "violations:create", "remediation:create"],
  mfaEnabled: true,
  mfaEnrollmentRequired: false,
};

export const testTokens: AuthTokens = {
  accessToken: "at-demo",
  refreshToken: "rt-demo",
  tokenType: "Bearer",
  expiresIn: 900,
};

/** User whose sign-in requires an MFA challenge step. */
export const MFA_USER_EMAIL = "mfa@demo.dpdpos.local";
export const MFA_USER_PASSWORD = "ChangeMe123!";

/** Broad-read user for shell/dashboard tests (holds analytics:read). */
export const adminUser: AuthMeResponse = {
  ...testUser,
  name: "Arjun Mehta",
  email: "admin@demo.dpdpos.local",
  roles: ["ORG_ADMIN"],
  permissions: [
    "analytics:read",
    "notification:read",
    "framework:read",
    "framework:generate",
    "framework:publish",
    "control:read",
    "control:create",
    "control:update",
    "requirement:read",
    "requirement:create",
    "validation:read",
    "violation:read",
    "remediation:read",
    "evidence:read",
    "report:read",
    "audit:read",
    "user:read",
    "role:read",
    "department:read",
    "data_asset:read",
    "data_asset:create",
    "data_asset:update",
    "data_asset:delete",
    "processing_activity:read",
    "processing_activity:create",
    "processing_activity:update",
    "processing_activity:delete",
    "organization:read",
    "data_asset:read",
    "processing_activity:read",
    "notice:read",
    "consent:read",
    "rights_request:read",
    "ai:explain",
  ],
};

/** A generated framework (healthcare, basic, SDF) mirroring the backend output. */
export const generatedFramework: FrameworkResponse = {
  id: FRAMEWORK_ID,
  organizationId: ORG_ID,
  name: "Healthcare programme",
  status: "DRAFT",
  industryProfile: "healthcare",
  maturityLevel: "basic",
  isSdf: true,
  roadmapJson: {
    generatedAt: "2026-08-01T09:00:00.000Z",
    profile: {
      industryProfile: "healthcare",
      maturityLevel: "basic",
      dataSensitivity: "medium",
      departmentCount: 2,
      processorCount: 1,
      isSdf: true,
    },
    summary: { controlCount: 3, requirementCount: 4, isSdf: true, phaseCount: 2 },
    phases: [
      {
        name: "Foundation",
        controls: [
          {
            code: "CTRL-NOTICE",
            title: "Privacy notice program",
            dueAt: "2026-08-31T00:00:00.000Z",
          },
          {
            code: "CTRL-CONSENT",
            title: "Consent management",
            dueAt: "2026-09-15T00:00:00.000Z",
          },
        ],
      },
      {
        name: "Significant Fiduciary",
        controls: [
          {
            code: "CTRL-SDF-DPO",
            title: "Appoint Data Protection Officer",
            dueAt: "2026-09-01T00:00:00.000Z",
          },
        ],
      },
    ],
  },
  publishedAt: null,
  createdAt: "2026-08-01T09:00:00.000Z",
  updatedAt: "2026-08-01T09:00:00.000Z",
  controls: [],
  requirements: [],
};

/** Generated controls for the register fixture. */
const seedControlRows: ControlResponse[] = [
  {
    id: "c0000000-0000-4000-8000-000000000001",
    organizationId: ORG_ID,
    frameworkId: FRAMEWORK_ID,
    code: "CTRL-NOTICE",
    title: "Privacy notice program",
    description: "Establish and maintain privacy notices for all collection points.",
    ownerUserId: "usr_demo_admin",
    dueAt: "2026-08-31T00:00:00.000Z",
    status: "IMPLEMENTED",
    legalBasisRef: "DPDP Act 2023 s.5",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "c0000000-0000-4000-8000-000000000002",
    organizationId: ORG_ID,
    frameworkId: FRAMEWORK_ID,
    code: "CTRL-CONSENT",
    title: "Consent management",
    description: "Operate consent capture, proof storage, and withdrawal workflows.",
    ownerUserId: null,
    dueAt: "2026-09-15T00:00:00.000Z",
    status: "IN_PROGRESS",
    legalBasisRef: "DPDP Act 2023 s.6",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "c0000000-0000-4000-8000-000000000003",
    organizationId: ORG_ID,
    frameworkId: FRAMEWORK_ID,
    code: "CTRL-SDF-DPO",
    title: "Appoint Data Protection Officer",
    description: "Designate an India-based DPO for Significant Data Fiduciary duties.",
    ownerUserId: "usr_demo_admin",
    dueAt: "2026-09-01T00:00:00.000Z",
    status: "NOT_STARTED",
    legalBasisRef: "DPDP Act 2023 s.10(2)(a)",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
];

/** Generated obligations — one still unmapped. */
const seedRequirementRows: RequirementResponse[] = [
  {
    id: "r0000000-0000-4000-8000-000000000001",
    organizationId: ORG_ID,
    frameworkId: FRAMEWORK_ID,
    controlId: "c0000000-0000-4000-8000-000000000001",
    code: "REQ-NOTICE-01",
    title: "Privacy notice content",
    description: "Publish a notice covering purpose, rights, and contact details.",
    legalBasisRef: "DPDP Act 2023 s.5",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "r0000000-0000-4000-8000-000000000002",
    organizationId: ORG_ID,
    frameworkId: FRAMEWORK_ID,
    controlId: null,
    code: "REQ-CONSENT-01",
    title: "Consent capture",
    description: "Obtain free, specific, informed, unconditional, and clear consent.",
    legalBasisRef: "DPDP Act 2023 s.6",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "r0000000-0000-4000-8000-000000000003",
    organizationId: ORG_ID,
    frameworkId: FRAMEWORK_ID,
    controlId: null,
    code: "REQ-CONSENT-02",
    title: "Consent withdrawal",
    description: "Provide an easy means to withdraw consent comparable to giving it.",
    legalBasisRef: "DPDP Act 2023 s.6(4)",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
];

/** Generated inventory — data assets and their processing activities. */
const seedDataAssets: DataAssetResponse[] = [
  {
    id: "a0000000-0000-4000-8000-000000000001",
    assetName: "Employee records",
    assetType: "Database",
    category: "HR",
    sensitivity: "HIGH",
    description: "Personnel files including salary, appraisal and leave records.",
    storageLocation: "AWS eu-west-1",
    retentionPeriod: "36 months after termination",
    departmentId: "d0000000-0000-4000-8000-000000000001",
    ownerUserId: "usr_demo_admin",
    status: "ACTIVE",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "a0000000-0000-4000-8000-000000000002",
    assetName: "Customer CRM",
    assetType: "SaaS",
    category: "Sales",
    sensitivity: "MEDIUM",
    description: "Contact details and interaction history for customers.",
    storageLocation: "Salesforce EU",
    retentionPeriod: "24 months after last contact",
    departmentId: "d0000000-0000-4000-8000-000000000004",
    ownerUserId: null,
    status: "ACTIVE",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "a0000000-0000-4000-8000-000000000003",
    assetName: "Clinical trial data",
    assetType: "Database",
    category: "Health",
    sensitivity: "CRITICAL",
    description: "De-identification keyed participant health outcomes.",
    storageLocation: "Private cloud IN",
    retentionPeriod: "10 years per regulation",
    departmentId: "d0000000-0000-4000-8000-000000000003",
    ownerUserId: "usr_demo_admin",
    status: "ACTIVE",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
];

const seedActivities: ProcessingActivityResponse[] = [
  {
    id: "pa000000-0000-4000-8000-000000000001",
    dataAssetId: "a0000000-0000-4000-8000-000000000001",
    purpose: "Payroll administration",
    sourceSystem: "SAP HR",
    recipientType: "Processor",
    processorName: "Acme Payroll Pvt Ltd",
    legalBasis: "Employment contract",
    retentionRule: "Deleted 36 months after termination",
    notes: null,
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "pa000000-0000-4000-8000-000000000002",
    dataAssetId: "a0000000-0000-4000-8000-000000000002",
    purpose: "Customer support ticketing",
    sourceSystem: "Zendesk",
    recipientType: "Internal",
    processorName: null,
    legalBasis: "Consent",
    retentionRule: "Closed tickets kept 24 months",
    notes: null,
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "pa000000-0000-4000-8000-000000000003",
    dataAssetId: "a0000000-0000-4000-8000-000000000003",
    purpose: "Trial outcome processing",
    sourceSystem: "Trial OS",
    recipientType: "Third party",
    processorName: "MediTrials Research",
    legalBasis: "Informed consent",
    retentionRule: "10 years per regulation",
    notes: "High-risk — DPIA maintained.",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
];

const seedDepartments: DepartmentResponse[] = [
  {
    id: "d0000000-0000-4000-8000-000000000001",
    organizationId: ORG_ID,
    name: "Human Resources",
    headUserId: "usr_demo_admin",
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
  },
  {
    id: "d0000000-0000-4000-8000-000000000002",
    organizationId: ORG_ID,
    name: "Finance",
    headUserId: null,
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
  },
  {
    id: "d0000000-0000-4000-8000-000000000003",
    organizationId: ORG_ID,
    name: "Research",
    headUserId: null,
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
  },
  {
    id: "d0000000-0000-4000-8000-000000000004",
    organizationId: ORG_ID,
    name: "Sales",
    headUserId: null,
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
  },
];

/**
 * Mutable registries the MSW handlers read and write (create/map/update
 * mutate them). Exported as `let` and restored by resetTestFixtures() so
 * mutating tests never leak state into later tests in the same file.
 */
export let controlRows: ControlResponse[] = [...seedControlRows];
export let requirementRows: RequirementResponse[] = [...seedRequirementRows];
export let dataAssetRows: DataAssetResponse[] = [...seedDataAssets];
export let activityRows: ProcessingActivityResponse[] = [...seedActivities];
export let departmentRows: DepartmentResponse[] = [...seedDepartments];

/** Restores the mutable MSW registries to their seed state. */
export function resetTestFixtures(): void {
  controlRows = [...seedControlRows];
  requirementRows = [...seedRequirementRows];
  dataAssetRows = [...seedDataAssets];
  activityRows = [...seedActivities];
  departmentRows = [...seedDepartments];
}

/** Directory rows for owner comboboxes. */
export const userRows: UserResponse[] = [
  {
    id: "usr_demo_admin",
    organizationId: ORG_ID,
    email: "admin@demo.dpdpos.local",
    name: "Arjun Mehta",
    status: "ACTIVE",
    roleIds: [],
    roleNames: ["ORG_ADMIN"],
    lastLoginAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

/** Realistic overview mirroring the analytics module's aggregate shape. */
export const analyticsOverview: DashboardOverview = {
  complianceScore: { score: 72, totalRules: 96, passed: 69, failed: 27 },
  violations: {
    total: 14,
    byStatus: { OPEN: 5, TRIAGE: 3, IN_PROGRESS: 4, CLOSED: 2 },
    bySeverity: { CRITICAL: 1, HIGH: 4, MEDIUM: 6, LOW: 3 },
  },
  evidence: { totalControls: 48, controlsWithEvidence: 31, coveragePercent: 65 },
  rightsRequests: {
    total: 11,
    open: 6,
    closed: 5,
    avgResolutionDays: 9.4,
    byType: { ACCESS: 4, ERASURE: 3, CORRECTION: 2, COMPLETION: 1, NOMINATION: 1 },
  },
  consent: { totalRecords: 342, granted: 298, withdrawn: 38 },
};
