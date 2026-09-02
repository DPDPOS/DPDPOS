"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { bootstrapSession } from "@/features/auth/session";
import { postAuthPath } from "@/features/auth/post-auth-path";
import { useSessionStore } from "@/state/session";

export function RequireGuest({ children }: { children: React.ReactNode }) {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (status === "idle") void bootstrapSession();
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(user ? postAuthPath(user) : "/dashboard");
    }
  }, [status, user, router]);

  // Wait for bootstrap before showing auth pages, so an already-signed-in
  // user never sees a flash of the login form.
  if (status === "idle" || status === "authenticating") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" label="Restoring session" />
          <p className="micro-label">Restoring session…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
