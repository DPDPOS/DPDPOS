"use client";

import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLogout } from "@/features/auth/hooks";
import { useSessionStore } from "@/state/session";

/**
 * Phase 1 shell — brand, session identity, sign-out. Navigation and the
 * command palette arrive in Phase 2.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useSessionStore((state) => state.user);
  const logout = useLogout();
  const [loggingOut, setLoggingOut] = useState(false);

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="focus-ring flex items-center gap-2.5 rounded-sm"
          >
            <div className="flex size-7 items-center justify-center rounded-sm border border-border bg-surface text-accent">
              <ShieldCheck className="size-4" aria-hidden />
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold tracking-tight text-ink">
                DPDPOS
              </p>
              <p className="micro-label hidden sm:block">Compliance console</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-[13px] font-medium text-ink">{user.name}</span>
                <Badge variant="outline">{user.roles[0] ?? "MEMBER"}</Badge>
              </div>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              disabled={loggingOut}
              onClick={() => {
                setLoggingOut(true);
                void logout().finally(() => setLoggingOut(false));
              }}
            >
              {loggingOut ? (
                <Spinner size="sm" label="Signing out" />
              ) : (
                <LogOut className="size-3.5" aria-hidden />
              )}
              <span className="hidden sm:inline">
                {loggingOut ? "Signing out…" : "Sign out"}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
