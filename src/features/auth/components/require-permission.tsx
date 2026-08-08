"use client";

import { ForbiddenScreen } from "@/components/shell/forbidden-screen";
import { useSessionStore } from "@/state/session";

/**
 * Route-level permission gate (plan §6.4) — wraps a screen with a required
 * `resource:action` permission and renders the 403 screen otherwise. Used by
 * sections that gate the whole page rather than showing a reduced variant.
 */
export function RequirePermission({
  perm,
  children,
}: {
  perm: string;
  children: React.ReactNode;
}) {
  const allowed = useSessionStore((state) =>
    state.user?.permissions.includes(perm) ?? false,
  );
  if (!allowed) {
    return <ForbiddenScreen permission={perm} />;
  }
  return <>{children}</>;
}
