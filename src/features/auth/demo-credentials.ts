/**
 * Demo tenant from dpdpos_backend/prisma/seed/seed.ts.
 * Surfaced on the login screen in non-production builds only.
 */
export const DEMO_CREDENTIALS = {
  organizationId: "00000000-0000-4000-8000-000000000001",
  email: "admin@demo.dpdpos.local",
  password: "ChangeMe123!",
} as const;

export const DEMO_AVAILABLE = process.env.NODE_ENV !== "production";
