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
