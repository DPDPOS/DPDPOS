"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useSessionStore } from "@/state/session";

/**
 * Keeps authenticated users who still need org setup on /onboarding,
 * and sends completed orgs away from that page.
 */
export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  const onOnboarding = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const requiresOnboarding = Boolean(user?.requiresOnboarding);

  useEffect(() => {
    if (status !== "authenticated" || !user) return;

    if (requiresOnboarding && !onOnboarding) {
      router.replace("/onboarding");
      return;
    }

    if (!requiresOnboarding && onOnboarding) {
      router.replace("/dashboard");
    }
  }, [status, user, requiresOnboarding, onOnboarding, router]);

  if (status === "authenticated" && user) {
    if (requiresOnboarding && !onOnboarding) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-bg">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" label="Redirecting to onboarding" />
            <p className="micro-label">Opening onboarding…</p>
          </div>
        </div>
      );
    }
    if (!requiresOnboarding && onOnboarding) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-bg">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" label="Redirecting to dashboard" />
            <p className="micro-label">Opening dashboard…</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
