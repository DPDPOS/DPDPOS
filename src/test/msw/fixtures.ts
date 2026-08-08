import type { AuthMeResponse, AuthTokens } from "@/features/auth/types";
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
