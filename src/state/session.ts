"use client";

import { create } from "zustand";
import type { AuthMeResponse, AuthTokens } from "@/features/auth/types";
import { tokenStorage } from "@/lib/auth/storage";

export type AuthStatus =
  | "idle" // not bootstrapped yet (fresh page load)
  | "authenticating"
  | "authenticated"
  | "unauthenticated";

interface SessionState {
  status: AuthStatus;
  /** Access token — memory only, never persisted (plan §6.2). */
  accessToken: string | null;
  user: AuthMeResponse | null;

  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: AuthMeResponse) => void;
  markAuthenticated: (tokens: AuthTokens, user: AuthMeResponse) => void;
  /** Bootstrap path: tokens were already set by refresh — just mark it. */
  markBootstrapped: (user: AuthMeResponse) => void;
  /** Bootstrap path where the profile fetch failed transiently — keep the session. */
  markSessionRestored: () => void;
  markAuthenticating: () => void;
  markUnauthenticated: () => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  status: "idle",
  accessToken: null,
  user: null,

  setTokens: (tokens) => {
    tokenStorage.setRefreshToken(tokens.refreshToken);
    set({ accessToken: tokens.accessToken });
  },

  setUser: (user) => set({ user }),

  markAuthenticated: (tokens, user) => {
    tokenStorage.setRefreshToken(tokens.refreshToken);
    set({ status: "authenticated", accessToken: tokens.accessToken, user });
  },

  markBootstrapped: (user) => set({ status: "authenticated", user }),

  // Tokens were rotated successfully but the profile fetch failed transiently.
  // The session stays alive; the user object is fetched on the next retry.
  markSessionRestored: () => set({ status: "authenticated" }),

  markAuthenticating: () => set({ status: "authenticating" }),

  markUnauthenticated: () =>
    set({ status: "unauthenticated", accessToken: null, user: null }),

  clear: () => {
    tokenStorage.clearRefreshToken();
    set({ status: "unauthenticated", accessToken: null, user: null });
  },
}));
