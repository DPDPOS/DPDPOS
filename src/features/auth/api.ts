import { api } from "@/lib/api/client";
import type {
  AcceptInviteResult,
  AuthMeResponse,
  AuthTokens,
  LoginResult,
  LoginSuccessResult,
  MfaSetupResult,
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
};
