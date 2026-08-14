"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { RequireRoutePermission } from "@/features/auth/components/require-route-permission";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // All workspace screens are behind the auth gate (plan §6.4).
  return (
    <RequireAuth>
      <AppShell>
        <RequireRoutePermission>{children}</RequireRoutePermission>
      </AppShell>
    </RequireAuth>
  );
}
