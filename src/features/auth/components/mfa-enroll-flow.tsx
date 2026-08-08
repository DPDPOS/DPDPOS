"use client";

import { CheckCircle2, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import { useSessionStore } from "@/state/session";
import { authApi } from "../api";
import type { MfaSetupResult } from "../types";
import { authErrorMessage, applyFieldErrors } from "../error-utils";
import { FormAlert } from "./form-alert";
import { TotpQr } from "./totp-qr";
import { AuthShell } from "./auth-shell";

type Phase = "setup" | "confirm" | "done";

export function MfaEnrollFlow() {
  const router = useRouter();
  const status = useSessionStore((state) => state.status);

  const [phase, setPhase] = useState<Phase>("setup");
  const [setup, setSetup] = useState<MfaSetupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    authApi
      .mfaSetup()
      .then((result) => {
        if (!cancelled) setSetup(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? authErrorMessage(err) : "Failed to start MFA setup.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  const confirm = async () => {
    if (code.trim().length < 6) {
      setFieldError("Enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    setError(null);
    setFieldError(undefined);
    try {
      await authApi.mfaConfirm(code.trim());
      setPhase("done");
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        applyFieldErrors(err, (field, opts) => {
          if (field === "code") setFieldError(opts.message);
        });
      } else if (err instanceof ApiError) {
        setError(
          err.code === "UNAUTHORIZED" ? "That code didn't match. Try again." : authErrorMessage(err),
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copySecret = () => {
    if (!setup) return;
    void navigator.clipboard.writeText(setup.secret).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AuthShell
      title="Set up two-factor authentication"
      description="Privileged roles (ORG_ADMIN, DPO, AUDITOR) must enroll a TOTP authenticator."
      footer={
        <p className="text-xs text-ink-3">
          Already enrolled?{" "}
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className="focus-ring font-medium text-accent hover:text-accent-hover"
          >
            Skip for now
          </button>
        </p>
      }
    >
      {loading ? (
        <div className="space-y-3">
          <div className="size-42 animate-pulse rounded-sm bg-surface-2" />
          <div className="h-3 w-3/4 animate-pulse rounded-sm bg-surface-2" />
          <div className="h-3 w-1/2 animate-pulse rounded-sm bg-surface-2" />
        </div>
      ) : error ? (
        <FormAlert message={error} />
      ) : phase === "done" ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-sm border border-pass/20 bg-pass-bg/50 p-3">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-pass" aria-hidden />
            <div>
              <p className="text-sm font-medium text-pass">MFA enabled</p>
              <p className="mt-0.5 text-[13px] text-ink-2">
                Future sign-ins will ask for a code from your authenticator app.
              </p>
            </div>
          </div>
          <Button className="w-full" onClick={() => router.replace("/dashboard")}>
            Continue to dashboard
          </Button>
        </div>
      ) : phase === "confirm" && setup ? (
        <div className="space-y-4">
          {error ? <FormAlert message={error} /> : null}
          <Field
            label="Confirm the code"
            htmlFor="mfa-enroll-code"
            error={fieldError}
            hint="Enter the 6-digit code your authenticator app is showing."
          >
            <Input
              id="mfa-enroll-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={8}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              className="font-mono text-base tracking-[0.4em]"
              placeholder="••••••"
              aria-invalid={fieldError ? true : undefined}
            />
          </Field>
          <div className="flex items-center gap-2 pt-1">
            <Button onClick={() => void confirm()} disabled={submitting}>
              {submitting ? "Confirming…" : "Confirm"}
            </Button>
            <Button variant="ghost" onClick={() => setPhase("setup")}>
              Back
            </Button>
          </div>
        </div>
      ) : setup ? (
        <div className="space-y-4">
          <ol className="space-y-1.5 text-[13px] leading-relaxed text-ink-2">
            <li className="flex gap-2">
              <span className="tabular font-mono text-ink-3">01</span>
              <span>Open your authenticator app (Google Authenticator, 1Password, …)</span>
            </li>
            <li className="flex gap-2">
              <span className="tabular font-mono text-ink-3">02</span>
              <span>Scan the QR code, or enter the setup key manually.</span>
            </li>
            <li className="flex gap-2">
              <span className="tabular font-mono text-ink-3">03</span>
              <span>Enter the 6-digit code on the next step to confirm.</span>
            </li>
          </ol>

          <div className="flex gap-4">
            <TotpQr otpauthUrl={setup.otpauthUrl} />
            <div className="min-w-0 flex-1">
              <p className="micro-label mb-1.5">Setup key</p>
              <div className="flex items-center gap-1.5">
                <code className="block w-full truncate rounded-sm border border-border bg-surface-2 px-2 py-1.5 font-mono text-xs text-ink">
                  {setup.secret}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copySecret}
                  aria-label="Copy setup key"
                >
                  <Copy className="size-3.5" aria-hidden />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-ink-3">
                The key is shown once — save it in your password manager.
              </p>
            </div>
          </div>

          <Button className="w-full" onClick={() => setPhase("confirm")}>
            I&apos;ve scanned it — continue
          </Button>
        </div>
      ) : null}
    </AuthShell>
  );
}
