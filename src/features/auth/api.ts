import { api } from "@/lib/api/client";
import type {
  AcceptInviteResult,
  AuthMeResponse,
  AuthTokens,
  LoginResult,
  LoginSuccessResult,
  LookupOrganizationsResult,
  MfaSetupResult,
  SignupInput,
} from "./types";

export interface LoginInput {
  organizationId: string;
  email: string;
  password: string;
}

export interface MfaVerifyInput {
  mfaToken: string;
  code: string;
}

export interface AcceptInviteInput {
  organizationId: string;
  email: string;
  inviteToken: string;
  password: string;
}

export const authApi = {
  signup: (input: SignupInput) =>
    api<LoginSuccessResult>("/auth/signup", { method: "POST", body: input }),

  lookupOrganizations: (email: string) =>
    api<LookupOrganizationsResult>("/auth/lookup-organizations", {
      method: "POST",
      body: { email },
    }),

  login: (input: LoginInput) =>
    api<LoginResult>("/auth/login", { method: "POST", body: input }),

  verifyMfa: (input: MfaVerifyInput) =>
    api<LoginSuccessResult>("/auth/mfa/verify", { method: "POST", body: input }),

  acceptInvite: (input: AcceptInviteInput) =>
    api<AcceptInviteResult>("/auth/accept-invite", {
      method: "POST",
      body: input,
    }),

  mfaSetup: () =>
    api<MfaSetupResult>("/auth/mfa/setup", { method: "POST" }),

  mfaConfirm: (code: string) =>
    api<{ mfaEnabled: true }>("/auth/mfa/confirm", {
      method: "POST",
      body: { code },
    }),

  refresh: (refreshToken: string) =>
    api<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    }),

  logout: (refreshToken: string) =>
    api<{ success: true }>("/auth/logout", {
      method: "POST",
      body: { refreshToken },
    }),

  me: () => api<AuthMeResponse>("/auth/me"),

  identityOptions: (organizationId: string) =>
    api<{
      mode: string;
      enforceSso: boolean;
      allowLocalBreakGlass: boolean;
      oidcEnabled: boolean;
      ldapEnabled: boolean;
      samlEnabled: boolean;
      providers: Array<{ id: string; type: string; name: string }>;
    }>(`/auth/identity/options?organizationId=${encodeURIComponent(organizationId)}`),

  oidcStart: (organizationId: string) =>
    api<{ authorizationUrl: string }>(
      `/auth/oidc/start?organizationId=${encodeURIComponent(organizationId)}`,
    ),

  oidcExchange: (exchangeCode: string) =>
    api<LoginSuccessResult>("/auth/oidc/exchange", {
      method: "POST",
      body: { exchangeCode },
    }),

  ldapLogin: (input: {
    organizationId: string;
    username: string;
    password: string;
  }) => api<LoginSuccessResult>("/auth/ldap/login", { method: "POST", body: input }),
};
