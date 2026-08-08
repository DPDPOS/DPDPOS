"use client";

import { useSessionStore } from "@/state/session";

/** Returns a checker for a single `resource:action` permission. */
export function usePermission(): (permission: string) => boolean {
  const permissions = useSessionStore((state) => state.user?.permissions);
  return (permission: string) => permissions?.includes(permission) ?? false;
}

/** True when the user holds ANY of the given permissions. */
export function useHasAnyPermission(...permissions: string[]): boolean {
  const userPermissions = useSessionStore(
    (state) => state.user?.permissions,
  );
  if (!userPermissions) return false;
  return permissions.some((permission) => userPermissions.includes(permission));
}
