import type { AuthMeResponse, AuthTokens } from "@/features/auth/types";
import type { DashboardOverview } from "@/features/analytics/types";
import { DEMO_CREDENTIALS } from "@/features/auth/demo-credentials";

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
    "control:read",
    "requirement:read",
    "validation:read",
    "violation:read",
    "remediation:read",
    "evidence:read",
    "report:read",
    "audit:read",
    "user:read",
    "role:read",
    "department:read",
    "organization:read",
    "data_asset:read",
    "processing_activity:read",
    "notice:read",
    "consent:read",
    "rights_request:read",
    "ai:explain",
  ],
};

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
