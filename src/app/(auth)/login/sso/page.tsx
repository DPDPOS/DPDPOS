"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { FormAlert } from "@/features/auth/components/form-alert";
import { RequireGuest } from "@/features/auth/components/require-guest";
import { authApi } from "@/features/auth/api";
import { authErrorMessage } from "@/features/auth/error-utils";
import type { LoginSuccessResult } from "@/features/auth/types";
import { ApiError } from "@/lib/api/errors";
import { useSessionStore } from "@/state/session";

/**
 * One-time exchange codes: share a single in-flight request across Strict Mode
 * remounts so the first call is not abandoned after Redis deletes the code.
 */
const exchangeInflight = new Map<string, Promise<LoginSuccessResult>>();

function exchangeOnce(code: string): Promise<LoginSuccessResult> {
  const existing = exchangeInflight.get(code);
  if (existing) return existing;
  const promise = authApi.oidcExchange(code).finally(() => {
    // Keep failed entries briefly so a remount does not hammer Redis with a dead code.
    window.setTimeout(() => exchangeInflight.delete(code), 5_000);
  });
  exchangeInflight.set(code, promise);
  return promise;
}

function SsoExchangeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const exchange = params.get("exchange");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!exchange) {
      setBusy(false);
      setError("Missing SSO exchange code.");
      return;
    }

    let alive = true;
    void (async () => {
      try {
        const result = await exchangeOnce(exchange);
        useSessionStore.getState().markAuthenticated(result.tokens, result.user);
        const next = result.mfaEnrollmentRequired ? "/mfa?step=enroll" : "/dashboard";
        router.replace(next);
      } catch (err) {
        if (!alive) return;
        if (useSessionStore.getState().status === "authenticated") {
          router.replace("/dashboard");
          return;
        }
        setBusy(false);
        if (err instanceof ApiError) {
          setError(authErrorMessage(err));
        } else {
          setError("SSO sign-in failed. Please try again.");
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [exchange, router]);

  return (
    <AuthShell title="Completing sign-in" description="Finishing directory authentication.">
      {error ? (
        <div className="space-y-3">
          <FormAlert message={error} />
          <p className="text-xs text-ink-2">
            Close this tab and start again from{" "}
            <a className="underline" href="/login">
              Sign in
            </a>
            . Do not refresh this page — the Microsoft handoff code works only once.
          </p>
        </div>
      ) : (
        <p className="text-sm text-ink-2">
          {busy ? "Please wait…" : "Redirecting…"}
        </p>
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
