"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { bootstrapSession } from "@/features/auth/session";
import { useSessionStore } from "@/state/session";

/**
 * Entry point (plan §6.4): restore the session, then route to the dashboard
 * or the sign-in page. Never shows content — just a redirect.
 */
export default function RootPage() {
  const status = useSessionStore((state) => state.status);
  const router = useRouter();

  useEffect(() => {
    if (status === "idle") void bootstrapSession();
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
    else if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" label="Redirecting" />
        <p className="micro-label">Redirecting…</p>
      </div>
    </div>
  );
}
