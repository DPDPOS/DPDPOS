import type { AuthTokens } from "@/features/auth/types";
import { useSessionStore } from "@/state/session";
import { tokenStorage } from "./storage";

/**
 * Single-flight refresh — concurrent 401s trigger exactly one refresh call.
 * On success the rotated tokens are written to the session store (memory)
 * and persisted (refresh token). Never imports the API client, so there is
 * no circular dependency.
 */

let inFlight: Promise<boolean> | null = null;

export function refreshAccessToken(): Promise<boolean> {
  if (!inFlight) {
    inFlight = performRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function performRefresh(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return false;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
  try {
    const res = await fetch(`${base}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;

    const envelope = await res.json();
    if (!envelope || envelope.success !== true) return false;

    const tokens = envelope.data as AuthTokens;
    useSessionStore.getState().setTokens(tokens);
    return true;
  } catch {
    return false;
  }
}
