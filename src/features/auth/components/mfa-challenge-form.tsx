"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsClient } from "@/hooks/use-is-client";
import { ApiError } from "@/lib/api/errors";
import { useSessionStore } from "@/state/session";
import { authApi } from "../api";
import { authErrorMessage, applyFieldErrors } from "../error-utils";
import {
  clearMfaChallenge,
  MFA_EXPIRES_AT_KEY,
  MFA_TOKEN_KEY,
} from "../mfa-constants";
import { FormAlert } from "./form-alert";

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Reads the one-time challenge from sessionStorage (never from the URL). */
function readChallenge() {
  if (typeof window === "undefined") {
    return { token: null as string | null, expiresAt: 0 };
  }
  const token = window.sessionStorage.getItem(MFA_TOKEN_KEY);
  const stored = Number(window.sessionStorage.getItem(MFA_EXPIRES_AT_KEY) ?? 0);
  return { token, expiresAt: stored || Date.now() + 300_000 };
}

export function MfaChallengeForm() {
  const router = useRouter();
  const isClient = useIsClient();
  // Lazy initializers so nothing is set from an effect; SSR-safe (no window).
  const [challenge] = useState(readChallenge);
  const [remaining, setRemaining] = useState(() => challenge.expiresAt - Date.now());
  const [code, setCode] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!challenge.token) router.replace("/login");
  }, [challenge.token, router]);

  useEffect(() => {
    if (!challenge.expiresAt) return;
    const interval = window.setInterval(() => {
      setRemaining(challenge.expiresAt - Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [challenge.expiresAt]);

  const expired = remaining <= 0;

  // SSR renders with the same placeholder the client renders before hydration,
  // so there is no mismatch between the server HTML and the first client paint.
  if (!isClient) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!challenge.token) return;
    if (code.trim().length < 6) {
      setFieldError("Enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    setServerError(null);
    setFieldError(undefined);
    try {
      const result = await authApi.verifyMfa({
        mfaToken: challenge.token,
        code: code.trim(),
      });
      clearMfaChallenge();
      useSessionStore.getState().markAuthenticated(result.tokens, result.user);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        applyFieldErrors(err, (field, opts) => {
          if (field === "code") setFieldError(opts.message);
        });
      } else if (err instanceof ApiError) {
        setServerError(
          err.code === "UNAUTHORIZED"
            ? "Invalid code. Check your authenticator app and try again."
            : authErrorMessage(err),
        );
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {serverError ? <FormAlert message={serverError} /> : null}

      <Field
        label="Authentication code"
        htmlFor="mfa-code"
        error={fieldError}
        hint="Enter the 6-digit code from your authenticator app."
      >
        <Input
          id="mfa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={8}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          className="font-mono text-base tracking-[0.4em]"
          placeholder="••••••"
          aria-invalid={fieldError ? true : undefined}
          disabled={expired}
        />
      </Field>

      <p
        className={
          remaining > 60_000
            ? "tabular text-xs text-ink-3"
            : "tabular text-xs text-warn"
        }
        aria-live="polite"
      >
        {expired
          ? "This code has expired — sign in again."
          : `Code expires in ${formatRemaining(remaining)}`}
      </p>

      <div className="flex items-center gap-2 pt-1">
        <Button
          onClick={() => void submit()}
          disabled={submitting || expired || !challenge.token}
        >
          {submitting ? "Verifying…" : "Verify"}
        </Button>
        <Button variant="ghost" onClick={() => router.replace("/login")}>
          Back to sign in
        </Button>
      </div>
    </div>
  );
}
