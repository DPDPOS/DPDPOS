"use client";

import { useRouter } from "next/navigation";
import { authApi } from "./api";
import { tokenStorage } from "@/lib/auth/storage";
import { useSessionStore } from "@/state/session";

/** Logout (plan §6.1): revoke server-side (denies the access-token jti), clear local state. */
export function useLogout() {
  const router = useRouter();

  return async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Local teardown still proceeds even if the server is unreachable.
      }
    }
    useSessionStore.getState().clear();
    router.replace("/login");
  };
}
