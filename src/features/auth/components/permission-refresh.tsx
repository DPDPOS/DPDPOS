"use client";

import { useEffect } from "react";
import { authApi } from "@/features/auth/api";
import { useSessionStore } from "@/state/session";

/**
 * Re-fetch /auth/me once per authenticated mount so role permission updates
 * (e.g. newly added vendor:*) apply without waiting for JWT expiry.
 */
export function PermissionRefresh({ children }: { children: React.ReactNode }) {
  const status = useSessionStore((s) => s.status);
  const setUser = useSessionStore((s) => s.setUser);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    void authApi
      .me()
      .then((user) => {
        if (!cancelled) setUser(user);
      })
      .catch(() => {
        /* keep existing session user on transient failure */
      });
    return () => {
      cancelled = true;
    };
  }, [status, setUser]);

  return <>{children}</>;
}
