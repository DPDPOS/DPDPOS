import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { refreshAccessToken } from "@/lib/auth/refresh";
import { tokenStorage } from "@/lib/auth/storage";
import { useSessionStore } from "@/state/session";
import type { AuthMeResponse } from "./types";

/**
 * Restores a session on page load: rotate the refresh token, then fetch the
 * current user. Idempotent — concurrent callers share the single-flight
 * refresh and the store-status guard.
 *
 * The session is only torn down on genuine auth failures (no refresh token,
 * refresh rejected, or the profile fetch rejected with 401). Transient
 * failures after a successful rotation keep the session alive — a network
 * blip must never destroy a valid session and its persisted refresh token.
 */
export async function bootstrapSession(): Promise<void> {
  const store = useSessionStore.getState();
  if (store.status === "authenticated" || store.status === "authenticating") {
    return;
  }

  if (!tokenStorage.getRefreshToken()) {
    store.markUnauthenticated();
    return;
  }

  store.markAuthenticating();
  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    store.clear();
    return;
  }

  try {
    const user = await api<AuthMeResponse>("/auth/me");
    useSessionStore.getState().markBootstrapped(user);
  } catch (err) {
    if (err instanceof ApiError && err.code === "UNAUTHORIZED") {
      // The token we just rotated is already rejected server-side.
      useSessionStore.getState().clear();
      return;
    }
    // Transient failure (network / 5xx) after a successful rotation.
    useSessionStore.getState().markSessionRestored();
  }
}
