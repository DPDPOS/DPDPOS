"use client";

import { useSessionStore } from "@/state/session";

export interface CanProps {
  /** A `resource:action` string from the backend permission catalog. */
  perm: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/** Renders children when the user holds `perm`, else the fallback (default nothing). */
export function Can({ perm, fallback = null, children }: CanProps) {
  const allowed = useSessionStore((state) =>
    state.user?.permissions.includes(perm) ?? false,
  );
  return allowed ? <>{children}</> : <>{fallback}</>;
}
