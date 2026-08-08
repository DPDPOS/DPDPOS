import type { AuthMeResponse, AuthTokens } from "@/features/auth/types";
import type { DashboardOverview } from "@/features/analytics/types";
import type { ControlResponse } from "@/features/controls/types";
import type { ConsentRecordResponse } from "@/features/consent/types";
import type { RightsRequestResponse } from "@/features/rights/types";
import type {
  ValidationResultResponse,
  ValidationRuleResponse,
  ValidationRunResponse,
} from "@/features/validations/types";
import type { ViolationResponse } from "@/features/violations/types";

import type { DataAssetResponse } from "@/features/dataAssets/types";
import type { EvidenceFileRecord } from "@/features/evidence/types";
import type { FrameworkResponse } from "@/features/framework/types";
import type { NoticeResponse } from "@/features/notices/types";
import type { ProcessingActivityResponse } from "@/features/processingActivities/types";
import type { ReportRecord } from "@/features/reports/types";
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
    "validation:run",
    "violation:read",
    "violation:create",
    "violation:assign",
    "violation:close",
    "remediation:read",
    "evidence:read",
    "evidence:create",
    "evidence:approve",
    "evidence:export",
    "report:read",
    "report:generate",
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
    "notice:read",
    "notice:create",
    "notice:delete",
    "consent:read",
    "consent:create",
    "consent:withdraw",
    "organization:read",
    "data_asset:read",
    "processing_activity:read",
    "notice:read",
    "consent:read",
    "rights_request:read",
    "rights_request:create",
    "rights_request:update",
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

/** Generated transparency — versioned notices and consent records. */
const seedNotices: NoticeResponse[] = [
  {
    id: "n0000000-0000-4000-8000-000000000001",
    title: "Customer data privacy notice",
    version: 2,
    content:
      "We collect your name, contact details and order history to fulfil\ncontracts and meet legal obligations. You may access, correct or erase\nyour data, and withdraw consent at any time. Contact privacy@dpdpos.local.",
    effectiveFrom: "2026-07-01T00:00:00.000Z",
    publishedBy: "usr_demo_admin",
    createdAt: "2026-06-15T09:00:00.000Z",
    updatedAt: "2026-06-20T09:00:00.000Z",
  },
  {
    id: "n0000000-0000-4000-8000-000000000002",
    title: "Marketing communications notice",
    version: 1,
    content:
      "With your consent, we send marketing communications about products and\nservices you may like. You can withdraw this consent at any time with\nequal ease to granting it.",
    effectiveFrom: "2026-07-15T00:00:00.000Z",
    publishedBy: null,
    createdAt: "2026-07-10T09:00:00.000Z",
    updatedAt: "2026-07-10T09:00:00.000Z",
  },
];

const seedConsentRecords: ConsentRecordResponse[] = [
  {
    id: "cn000000-0000-4000-8000-000000000001",
    dataSubjectIdentifier: "user@example.com",
    noticeId: "n0000000-0000-4000-8000-000000000002",
    dataAssetId: "a0000000-0000-4000-8000-000000000002",
    purpose: "Marketing emails",
    consentState: "GRANTED",
    grantedAt: "2026-07-16T08:30:00.000Z",
    withdrawnAt: null,
    proofFileId: null,
    createdAt: "2026-07-16T08:30:00.000Z",
    updatedAt: "2026-07-16T08:30:00.000Z",
  },
  {
    id: "cn000000-0000-4000-8000-000000000002",
    dataSubjectIdentifier: "priya@example.com",
    noticeId: "n0000000-0000-4000-8000-000000000001",
    dataAssetId: "a0000000-0000-4000-8000-000000000001",
    purpose: "Payroll processing",
    consentState: "GRANTED",
    grantedAt: "2026-07-02T09:00:00.000Z",
    withdrawnAt: null,
    proofFileId: "ev-consent-001",
    createdAt: "2026-07-02T09:00:00.000Z",
    updatedAt: "2026-07-02T09:00:00.000Z",
  },
  {
    id: "cn000000-0000-4000-8000-000000000003",
    dataSubjectIdentifier: "user@example.com",
    noticeId: "n0000000-0000-4000-8000-000000000002",
    dataAssetId: null,
    purpose: "Newsletter subscription",
    consentState: "WITHDRAWN",
    grantedAt: "2026-05-01T10:00:00.000Z",
    withdrawnAt: "2026-07-20T11:15:00.000Z",
    proofFileId: null,
    createdAt: "2026-05-01T10:00:00.000Z",
    updatedAt: "2026-07-20T11:15:00.000Z",
  },
  {
    id: "cn000000-0000-4000-8000-000000000004",
    dataSubjectIdentifier: "rahul@example.com",
    noticeId: "n0000000-0000-4000-8000-000000000001",
    dataAssetId: "a0000000-0000-4000-8000-000000000003",
    purpose: "Trial participation",
    consentState: "GRANTED",
    grantedAt: "2026-07-18T14:00:00.000Z",
    withdrawnAt: null,
    proofFileId: "ev-consent-004",
    createdAt: "2026-07-18T14:00:00.000Z",
    updatedAt: "2026-07-18T14:00:00.000Z",
  },
];

/** Generated proof — evidence spanning the lifecycle, reports across statuses. */
const seedEvidenceRows: EvidenceFileRecord[] = [
  {
    id: "ev000000-0000-4000-8000-000000000001",
    organizationId: ORG_ID,
    fileName: "consent-capture-screenshot.png",
    storageKey: `evidence/${ORG_ID}/ev000000-0000-4000-8000-000000000001/consent-capture-screenshot.png`,
    mimeType: "image/png",
    fileHash: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    fileSizeBytes: 214_520,
    description: "Consent checkbox flow captured from staging.",
    tags: ["consent", "screenshot"],
    status: "APPROVED",
    controlId: "c0000000-0000-4000-8000-000000000002",
    violationId: null,
    uploadedBy: "usr_demo_admin",
    reviewedBy: "usr_demo_admin",
    approvedBy: "usr_demo_admin",
    lockedAt: null,
    expiresAt: null,
    createdBy: "usr_demo_admin",
    updatedBy: "usr_demo_admin",
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-25T12:30:00.000Z",
    deletedAt: null,
  },
  {
    id: "ev000000-0000-4000-8000-000000000002",
    organizationId: ORG_ID,
    fileName: "dpo-appointment-letter.pdf",
    storageKey: `evidence/${ORG_ID}/ev000000-0000-4000-8000-000000000002/dpo-appointment-letter.pdf`,
    mimeType: "application/pdf",
    fileHash: "60303ae22b998861bce3b28f33eec1be758a213c86c93c076dbe9f558c11c752",
    fileSizeBytes: 182_400,
    description: "Board-approved appointment of the Data Protection Officer.",
    tags: ["dpo", "sdf", "board"],
    status: "LOCKED",
    controlId: "c0000000-0000-4000-8000-000000000003",
    violationId: null,
    uploadedBy: "usr_demo_admin",
    reviewedBy: "usr_demo_admin",
    approvedBy: "usr_demo_admin",
    lockedAt: "2026-08-01T09:15:00.000Z",
    expiresAt: null,
    createdBy: "usr_demo_admin",
    updatedBy: "usr_demo_admin",
    createdAt: "2026-07-15T09:00:00.000Z",
    updatedAt: "2026-08-01T09:15:00.000Z",
    deletedAt: null,
  },
  {
    id: "ev000000-0000-4000-8000-000000000003",
    organizationId: ORG_ID,
    fileName: "notice-v1-published.html",
    storageKey: `evidence/${ORG_ID}/ev000000-0000-4000-8000-000000000003/notice-v1-published.html`,
    mimeType: "text/html",
    fileHash: "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    fileSizeBytes: 12_912,
    description: "Published privacy notice archive — v1 snapshot.",
    tags: ["notice"],
    status: "UNDER_REVIEW",
    controlId: "c0000000-0000-4000-8000-000000000001",
    violationId: null,
    uploadedBy: "usr_demo_admin",
    reviewedBy: null,
    approvedBy: null,
    lockedAt: null,
    expiresAt: null,
    createdBy: "usr_demo_admin",
    updatedBy: "usr_demo_admin",
    createdAt: "2026-08-02T10:00:00.000Z",
    updatedAt: "2026-08-03T10:00:00.000Z",
    deletedAt: null,
  },
  {
    id: "ev000000-0000-4000-8000-000000000004",
    organizationId: ORG_ID,
    fileName: "retention-policy.xlsx",
    storageKey: `evidence/${ORG_ID}/ev000000-0000-4000-8000-000000000004/retention-policy.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileHash: null,
    fileSizeBytes: 48_120,
    description: "Retention schedule draft — awaiting review.",
    tags: ["retention"],
    status: "TAGGED",
    controlId: null,
    violationId: null,
    uploadedBy: "usr_demo_admin",
    reviewedBy: null,
    approvedBy: null,
    lockedAt: null,
    expiresAt: null,
    createdBy: "usr_demo_admin",
    updatedBy: "usr_demo_admin",
    createdAt: "2026-08-05T14:00:00.000Z",
    updatedAt: "2026-08-05T14:05:00.000Z",
    deletedAt: null,
  },
  {
    id: "ev000000-0000-4000-8000-000000000005",
    organizationId: ORG_ID,
    fileName: "penetration-test-report.pdf",
    storageKey: `evidence/${ORG_ID}/ev000000-0000-4000-8000-000000000005/penetration-test-report.pdf`,
    mimeType: "application/pdf",
    fileHash: null,
    fileSizeBytes: null,
    description: "Q3 external penetration test.",
    tags: [],
    status: "UPLOADED",
    controlId: null,
    violationId: null,
    uploadedBy: "usr_demo_admin",
    reviewedBy: null,
    approvedBy: null,
    lockedAt: null,
    expiresAt: null,
    createdBy: "usr_demo_admin",
    updatedBy: "usr_demo_admin",
    createdAt: "2026-08-07T09:00:00.000Z",
    updatedAt: "2026-08-07T09:00:00.000Z",
    deletedAt: null,
  },
];

const seedReportRows: ReportRecord[] = [
  {
    id: "rpt00000-0000-4000-8000-000000000001",
    organizationId: ORG_ID,
    reportType: "BOARD_PACK",
    title: "Board pack — July 2026",
    status: "COMPLETED",
    format: "PDF",
    generatedBy: "usr_demo_admin",
    storageKey: `reports/${ORG_ID}/rpt00000-0000-4000-8000-000000000001/board-pack.pdf`,
    parameters: { dateFrom: "2026-07-01T00:00:00.000Z", dateTo: "2026-07-31T23:59:59.000Z" },
    startedAt: "2026-08-01T08:00:00.000Z",
    completedAt: "2026-08-01T08:00:14.000Z",
    errorMessage: null,
    createdBy: "usr_demo_admin",
    updatedBy: "usr_demo_admin",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-01T08:00:14.000Z",
    deletedAt: null,
  },
  {
    id: "rpt00000-0000-4000-8000-000000000002",
    organizationId: ORG_ID,
    reportType: "COMPLIANCE_SUMMARY",
    title: "Compliance summary — Q3",
    status: "GENERATING",
    format: "CSV",
    generatedBy: "usr_demo_admin",
    storageKey: null,
    parameters: null,
    startedAt: "2026-08-08T09:00:00.000Z",
    completedAt: null,
    errorMessage: null,
    createdBy: "usr_demo_admin",
    updatedBy: "usr_demo_admin",
    createdAt: "2026-08-08T09:00:00.000Z",
    updatedAt: "2026-08-08T09:00:00.000Z",
    deletedAt: null,
  },
  {
    id: "rpt00000-0000-4000-8000-000000000003",
    organizationId: ORG_ID,
    reportType: "VIOLATION_REPORT",
    title: "Violation report",
    status: "FAILED",
    format: "EXCEL",
    generatedBy: "usr_demo_admin",
    storageKey: null,
    parameters: null,
    startedAt: null,
    completedAt: null,
    errorMessage: "Storage write failed — bucket unavailable.",
    createdBy: "usr_demo_admin",
    updatedBy: "usr_demo_admin",
    createdAt: "2026-08-06T11:30:00.000Z",
    updatedAt: "2026-08-06T11:30:05.000Z",
    deletedAt: null,
  },
];

/** Rights fixtures — every lifecycle state, SLA tones, one overdue row. */
const seedRightsRows: RightsRequestResponse[] = [
  {
    id: "rqst-00000000-0000-4000-8000-000000000001",
    requestType: "ACCESS",
    requesterReference: "DS-2026-0192",
    status: "SUBMITTED",
    assignedTo: null,
    openedAt: "2026-07-20T09:00:00.000Z",
    dueAt: "2026-08-19T09:00:00.000Z",
    closedAt: null,
    resolutionSummary: null,
    version: 1,
    createdAt: "2026-07-20T09:00:00.000Z",
    updatedAt: "2026-07-20T09:00:00.000Z",
  },
  {
    id: "rqst-00000000-0000-4000-8000-000000000002",
    requestType: "ERASURE",
    requesterReference: "DS-2026-0210",
    status: "IN_PROGRESS",
    assignedTo: "usr_demo_admin",
    openedAt: "2026-07-25T09:00:00.000Z",
    dueAt: "2026-08-24T09:00:00.000Z",
    closedAt: null,
    resolutionSummary: null,
    version: 2,
    createdAt: "2026-07-25T09:00:00.000Z",
    updatedAt: "2026-07-28T08:30:00.000Z",
  },
  {
    id: "rqst-00000000-0000-4000-8000-000000000003",
    requestType: "GRIEVANCE_REDRESSAL",
    requesterReference: "GR-2026-0044",
    status: "ASSIGNED",
    assignedTo: "usr_demo_admin",
    openedAt: "2026-08-01T09:00:00.000Z",
    dueAt: "2026-09-15T09:00:00.000Z",
    closedAt: null,
    resolutionSummary: null,
    version: 1,
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "rqst-00000000-0000-4000-8000-000000000004",
    requestType: "CORRECTION",
    requesterReference: "DS-2026-0145",
    status: "RESPONDED",
    assignedTo: null,
    openedAt: "2026-07-05T09:00:00.000Z",
    dueAt: "2026-08-04T09:00:00.000Z",
    closedAt: null,
    resolutionSummary: "Corrected record provided to the principal.",
    version: 3,
    createdAt: "2026-07-05T09:00:00.000Z",
    updatedAt: "2026-07-30T12:00:00.000Z",
  },
  {
    id: "rqst-00000000-0000-4000-8000-000000000005",
    requestType: "COMPLETION",
    requesterReference: "DS-2026-0110",
    status: "CLOSED",
    assignedTo: "usr_demo_admin",
    openedAt: "2026-06-10T09:00:00.000Z",
    dueAt: "2026-07-10T09:00:00.000Z",
    closedAt: "2026-07-09T16:00:00.000Z",
    resolutionSummary: "Completed record delivered within SLA.",
    version: 4,
    createdAt: "2026-06-10T09:00:00.000Z",
    updatedAt: "2026-07-09T16:00:00.000Z",
  },
  {
    id: "rqst-00000000-0000-4000-8000-000000000006",
    requestType: "UPDATING",
    requesterReference: "DS-2026-0157",
    status: "REJECTED",
    assignedTo: null,
    openedAt: "2026-07-01T09:00:00.000Z",
    dueAt: "2026-07-31T09:00:00.000Z",
    closedAt: "2026-07-22T10:00:00.000Z",
    resolutionSummary: "Identity could not be verified against records.",
    version: 2,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-22T10:00:00.000Z",
  },
  {
    id: "rqst-00000000-0000-4000-8000-000000000007",
    requestType: "ACCESS",
    requesterReference: "DS-2026-0093",
    status: "IN_PROGRESS",
    assignedTo: "usr_demo_admin",
    openedAt: "2026-06-15T09:00:00.000Z",
    dueAt: "2026-07-15T09:00:00.000Z",
    closedAt: null,
    resolutionSummary: null,
    version: 2,
    createdAt: "2026-06-15T09:00:00.000Z",
    updatedAt: "2026-06-30T09:00:00.000Z",
  },
];

/** Validation runs — one completed (with results), one queued. */
const seedValidationRuns: ValidationRunResponse[] = [
  {
    id: "run-00000000-0000-4000-8000-000000000001",
    triggerType: "MANUAL",
    triggeredBy: "usr_demo_admin",
    status: "COMPLETED",
    startedAt: "2026-08-02T09:00:00.000Z",
    finishedAt: "2026-08-02T09:01:42.000Z",
    durationMs: 102000,
    createdAt: "2026-08-02T09:00:00.000Z",
    updatedAt: "2026-08-02T09:01:42.000Z",
  },
  {
    id: "run-00000000-0000-4000-8000-000000000002",
    triggerType: "MANUAL",
    triggeredBy: "usr_demo_admin",
    status: "PENDING",
    startedAt: "2026-08-08T09:00:00.000Z",
    finishedAt: null,
    durationMs: null,
    createdAt: "2026-08-08T09:00:00.000Z",
    updatedAt: "2026-08-08T09:00:00.000Z",
  },
];

/** Results per run id (the run detail endpoint attaches these). */
export const validationResultsByRun: Record<string, ValidationResultResponse[]> = {
  "run-00000000-0000-4000-8000-000000000001": [
    {
      id: "res-00000000-0000-4000-8000-000000000001",
      runId: "run-00000000-0000-4000-8000-000000000001",
      ruleId: "rule-ret-001",
      ruleCode: "RET-001",
      resultStatus: "PASS",
      explanation: null,
      score: 100,
      evidenceRequiredFlag: false,
      controlId: null,
      createdAt: "2026-08-02T09:01:30.000Z",
      updatedAt: "2026-08-02T09:01:30.000Z",
    },
    {
      id: "res-00000000-0000-4000-8000-000000000002",
      runId: "run-00000000-0000-4000-8000-000000000001",
      ruleId: "rule-not-003",
      ruleCode: "NOT-003",
      resultStatus: "FAIL",
      explanation:
        "The privacy notice for the marketing processing activity is not published (no notice with an effective date on or before the processing start). Publish a notice and link the consent records before re-running.",
      score: 40,
      evidenceRequiredFlag: true,
      controlId: null,
      createdAt: "2026-08-02T09:01:31.000Z",
      updatedAt: "2026-08-02T09:01:31.000Z",
    },
    {
      id: "res-00000000-0000-4000-8000-000000000003",
      runId: "run-00000000-0000-4000-8000-000000000001",
      ruleId: "rule-cons-001",
      ruleCode: "CONS-001",
      resultStatus: "FAIL",
      explanation:
        "No consent records found for the campaign data asset. Consent must be recorded before processing begins.",
      score: 55,
      evidenceRequiredFlag: true,
      controlId: null,
      createdAt: "2026-08-02T09:01:31.000Z",
      updatedAt: "2026-08-02T09:01:31.000Z",
    },
    {
      id: "res-00000000-0000-4000-8000-000000000004",
      runId: "run-00000000-0000-4000-8000-000000000001",
      ruleId: "rule-rig-002",
      ruleCode: "RIG-002",
      resultStatus: "SKIPPED",
      explanation: null,
      score: null,
      evidenceRequiredFlag: false,
      controlId: null,
      createdAt: "2026-08-02T09:01:32.000Z",
      updatedAt: "2026-08-02T09:01:32.000Z",
    },
  ],
};

/** Rule library — across categories, one inactive for the activeOnly filter. */
const seedValidationRules: ValidationRuleResponse[] = [
  {
    id: "rule-ret-001",
    ruleCode: "RET-001",
    title: "Retention schedule is enforced",
    description: "Personal data is not kept beyond the retention schedule.",
    legalBasisRef: "DPDP Act §8(6)",
    severity: "MEDIUM",
    category: "RETENTION",
    activeFlag: true,
    version: 2,
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "rule-not-003",
    ruleCode: "NOT-003",
    title: "Privacy notice published for processing",
    description: null,
    legalBasisRef: "DPDP Act §5",
    severity: "HIGH",
    category: "NOTICE",
    activeFlag: true,
    version: 1,
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "rule-cons-001",
    ruleCode: "CONS-001",
    title: "Consent recorded before processing",
    description: null,
    legalBasisRef: "DPDP Act §6",
    severity: "CRITICAL",
    category: "CONSENT",
    activeFlag: true,
    version: 3,
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-05-20T09:00:00.000Z",
  },
  {
    id: "rule-rig-002",
    ruleCode: "RIG-002",
    title: "Rights requests answered within SLA",
    description: null,
    legalBasisRef: "DPDP Act §11–14",
    severity: "LOW",
    category: "RIGHTS",
    activeFlag: true,
    version: 1,
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "rule-ret-004",
    ruleCode: "RET-004",
    title: "Archived records purged quarterly",
    description: null,
    legalBasisRef: "DPDP Act §8(6)",
    severity: "LOW",
    category: "RETENTION",
    activeFlag: false,
    version: 1,
    createdAt: "2026-03-01T09:00:00.000Z",
    updatedAt: "2026-03-01T09:00:00.000Z",
  },
];

/** Violations — none linked to seeded results, so the chain stays exercisable. */
const seedViolationRows: ViolationResponse[] = [
  {
    id: "vio-00000000-0000-4000-8000-000000000001",
    validationResultId: null,
    severity: "HIGH",
    title: "Retention overrun on HR records",
    description: null,
    status: "OPEN",
    assignedTo: null,
    openedAt: "2026-08-01T09:00:00.000Z",
    dueAt: null,
    closedAt: null,
    resolutionSummary: null,
    version: 1,
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "vio-00000000-0000-4000-8000-000000000002",
    validationResultId: null,
    severity: "MEDIUM",
    title: "Consent not re-verified on renewal",
    description: null,
    status: "IN_PROGRESS",
    assignedTo: "usr_demo_admin",
    openedAt: "2026-07-28T09:00:00.000Z",
    dueAt: null,
    closedAt: null,
    resolutionSummary: null,
    version: 2,
    createdAt: "2026-07-28T09:00:00.000Z",
    updatedAt: "2026-07-30T09:00:00.000Z",
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
export let noticeRows: NoticeResponse[] = [...seedNotices];
export let consentRows: ConsentRecordResponse[] = [...seedConsentRecords];
export let evidenceRows: EvidenceFileRecord[] = [...seedEvidenceRows];
export let reportRows: ReportRecord[] = [...seedReportRows];
export let rightsRows: RightsRequestResponse[] = [...seedRightsRows];
export let validationRunRows: ValidationRunResponse[] = [...seedValidationRuns];
export let validationRuleRows: ValidationRuleResponse[] = [...seedValidationRules];
export let violationRows: ViolationResponse[] = [...seedViolationRows];

/** Restores the mutable MSW registries to their seed state. */
export function resetTestFixtures(): void {
  controlRows = [...seedControlRows];
  requirementRows = [...seedRequirementRows];
  dataAssetRows = [...seedDataAssets];
  activityRows = [...seedActivities];
  departmentRows = [...seedDepartments];
  noticeRows = [...seedNotices];
  consentRows = [...seedConsentRecords];
  evidenceRows = [...seedEvidenceRows];
  reportRows = [...seedReportRows];
  rightsRows = [...seedRightsRows];
  validationRunRows = [...seedValidationRuns];
  validationRuleRows = [...seedValidationRules];
  violationRows = [...seedViolationRows];
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
