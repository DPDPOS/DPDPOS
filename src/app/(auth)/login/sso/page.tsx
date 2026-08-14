"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { FormAlert } from "@/features/auth/components/form-alert";
import { RequireGuest } from "@/features/auth/components/require-guest";
import { authApi } from "@/features/auth/api";
import { authErrorMessage } from "@/features/auth/error-utils";
import { ApiError } from "@/lib/api/errors";
import { useSessionStore } from "@/state/session";

function SsoExchangeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const exchange = params.get("exchange");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!exchange) return;

    let cancelled = false;
    void (async () => {
      try {
        const result = await authApi.oidcExchange(exchange);
        if (cancelled) return;
        useSessionStore.getState().markAuthenticated(result.tokens, result.user);
        router.replace(
          result.mfaEnrollmentRequired ? "/mfa?step=enroll" : "/dashboard",
        );
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(authErrorMessage(err));
        } else {
          setError("SSO sign-in failed. Please try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exchange, router]);

  return (
    <AuthShell title="Completing sign-in" description="Finishing directory authentication.">
       {!exchange ? <FormAlert message="Missing SSO exchange code." /> : error ? <FormAlert message={error} /> : (
        <p className="text-sm text-ink-2">Please wait…</p>
      )}
    </AuthShell>
  );
}

export default function LoginSsoPage() {
  return (
    <RequireGuest>
      <Suspense fallback={<AuthShell title="Completing sign-in" description="Loading…" />}>
        <SsoExchangeInner />
      </Suspense>
    </RequireGuest>
  );
}
