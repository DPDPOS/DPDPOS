/** Mirrors AuthTokens in dpdpos_backend auth.service.ts. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

/** Mirrors AuthMeResponse. */
export interface AuthMeResponse {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  status: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  mfaEnrollmentRequired: boolean;
  /** True when the org has finished /onboarding/complete. */
  onboardingCompleted: boolean;
  /** Convenience for FE routing — same as !onboardingCompleted. */
  requiresOnboarding: boolean;
}

export interface LookupOrganization {
  id: string;
  name: string;
  onboardingCompleted: boolean;
}

export interface LookupOrganizationsResult {
  organizations: LookupOrganization[];
}

export interface SignupInput {
  organizationName: string;
  adminName: string;
  email: string;
  password: string;
  industry?: string;
}

export interface LoginSuccessResult {
  mfaRequired: false;
  user: AuthMeResponse;
  tokens: AuthTokens;
  mfaEnrollmentRequired: boolean;
}

export interface LoginMfaChallengeResult {
  mfaRequired: true;
  mfaToken: string;
  expiresIn: number;
}

export type LoginResult = LoginSuccessResult | LoginMfaChallengeResult;

export interface MfaSetupResult {
  secret: string;
  otpauthUrl: string;
}

export interface AcceptInviteResult {
  userId: string;
  status: "ACTIVE";
}
