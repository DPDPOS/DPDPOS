"use client";

import { RequireGuest } from "@/features/auth/components/require-guest";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Sign-in, MFA, and invite pages are for unauthenticated users only.
  return <RequireGuest>{children}</RequireGuest>;
}
