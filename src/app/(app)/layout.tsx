"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PermissionRefresh } from "@/features/auth/components/permission-refresh";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { RequireOnboarding } from "@/features/auth/components/require-onboarding";
import { RequireRoutePermission } from "@/features/auth/components/require-route-permission";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // All workspace screens are behind the auth gate (plan §6.4).
  return (
    <RequireAuth>
      <RequireOnboarding>
        <PermissionRefresh>
          <AppShell>
            <RequireRoutePermission>{children}</RequireRoutePermission>
          </AppShell>
        </PermissionRefresh>
      </RequireOnboarding>
    </RequireAuth>
  );
}
