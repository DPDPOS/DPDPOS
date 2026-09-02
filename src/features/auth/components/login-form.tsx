"use client";

/**
 * Login form with email → organization lookup.
 * Org UUID can still be entered manually when lookup finds nothing.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import { useSessionStore } from "@/state/session";
import { authApi } from "../api";
import { DEMO_AVAILABLE, DEMO_CREDENTIALS } from "../demo-credentials";
import { authErrorMessage, applyFieldErrors } from "../error-utils";
import { clearMfaChallenge, startMfaChallenge } from "../mfa-constants";
import { postAuthPath } from "../post-auth-path";
import { loginSchema, type LoginFormValues } from "../schemas";
import type { LookupOrganization } from "../types";
import { FormAlert } from "./form-alert";

type IdentityOptions = Awaited<ReturnType<typeof authApi.identityOptions>>;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [identity, setIdentity] = useState<{
    organizationId: string;
    options: IdentityOptions | null;
  } | null>(null);
  const [ldapMode, setLdapMode] = useState(false);
  const [ldapUsername, setLdapUsername] = useState("");
  const [ldapPassword, setLdapPassword] = useState("");
  const [matchedOrgs, setMatchedOrgs] = useState<LookupOrganization[] | null>(null);
  const [lookupEmail, setLookupEmail] = useState<string | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { organizationId: "", email: "", password: "" },
  });

  const organizationId = useWatch({ control, name: "organizationId" });
  const email = useWatch({ control, name: "email" });
  const normalizedOrganizationId = organizationId?.trim() ?? "";
  const activeIdentity =
    identity?.organizationId === normalizedOrganizationId ? identity.options : null;

  useEffect(() => {
    const id = normalizedOrganizationId;
    if (!id || id.length < 36) {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void authApi
        .identityOptions(id)
        .then((opts) => {
          if (!cancelled) setIdentity({ organizationId: id, options: opts });
        })
        .catch(() => {
          if (!cancelled) setIdentity({ organizationId: id, options: null });
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedOrganizationId]);

  useEffect(() => {
    const trimmed = email?.trim() ?? "";
    if (!trimmed || !isValidEmail(trimmed)) {
      setMatchedOrgs(null);
      setLookupEmail(null);
      return;
    }

    let cancelled = false;
    setLookupBusy(true);
    const timer = window.setTimeout(() => {
      void authApi
        .lookupOrganizations(trimmed)
        .then((result) => {
          if (cancelled) return;
          setMatchedOrgs(result.organizations);
          setLookupEmail(trimmed);
          if (result.organizations.length === 1) {
            setValue("organizationId", result.organizations[0].id, {
              shouldValidate: true,
            });
          }
        })
        .catch(() => {
          if (cancelled) return;
          setMatchedOrgs(null);
          setLookupEmail(trimmed);
        })
        .finally(() => {
          if (!cancelled) setLookupBusy(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      setLookupBusy(false);
    };
  }, [email, setValue]);

  const hidePassword =
    Boolean(activeIdentity?.enforceSso) && !activeIdentity?.allowLocalBreakGlass;

  const showOrgPicker = Boolean(
    matchedOrgs && matchedOrgs.length > 1 && lookupEmail === email?.trim(),
  );

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const result = await authApi.login(values);
      if (result.mfaRequired) {
        clearMfaChallenge();
        startMfaChallenge(result.mfaToken, result.expiresIn);
        router.replace("/mfa?step=challenge");
        return;
      }

      useSessionStore.getState().markAuthenticated(result.tokens, result.user);
      router.replace(
        result.mfaEnrollmentRequired ? "/mfa?step=enroll" : postAuthPath(result.user),
      );
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        applyFieldErrors(err, setError);
      } else if (err instanceof ApiError) {
        setServerError(authErrorMessage(err));
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  });

  const startMicrosoft = async () => {
    const id = organizationId?.trim();
    if (!id) {
      setServerError("Enter your Organization ID first.");
      return;
    }
    setSsoLoading(true);
    setServerError(null);
    try {
      const { authorizationUrl } = await authApi.oidcStart(id);
      window.location.href = authorizationUrl;
    } catch (err) {
      if (err instanceof ApiError) setServerError(authErrorMessage(err));
      else setServerError("Could not start Microsoft sign-in.");
      setSsoLoading(false);
    }
  };

  const submitLdap = async () => {
    const id = organizationId?.trim();
    if (!id || !ldapUsername || !ldapPassword) {
      setServerError("Organization ID, username, and password are required.");
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const result = await authApi.ldapLogin({
        organizationId: id,
        username: ldapUsername,
        password: ldapPassword,
      });
      useSessionStore.getState().markAuthenticated(result.tokens, result.user);
      router.replace(
        result.mfaEnrollmentRequired ? "/mfa?step=enroll" : postAuthPath(result.user),
      );
    } catch (err) {
      if (err instanceof ApiError) setServerError(authErrorMessage(err));
      else setServerError("Directory sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setValue("organizationId", DEMO_CREDENTIALS.organizationId, { shouldValidate: true });
    setValue("email", DEMO_CREDENTIALS.email, { shouldValidate: true });
    setValue("password", DEMO_CREDENTIALS.password, { shouldValidate: true });
    setServerError(null);
  };

  const emailRegister = register("email");

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {serverError ? <FormAlert message={serverError} /> : null}

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.in"
          aria-invalid={errors.email ? true : undefined}
          {...emailRegister}
        />
      </Field>

      {showOrgPicker ? (
        <Field
          label="Organization"
          htmlFor="organizationPicker"
          hint="Multiple organizations match this email."
        >
          <Select
            id="organizationPicker"
            value={normalizedOrganizationId}
            onChange={(event) => {
              setValue("organizationId", event.target.value, { shouldValidate: true });
            }}
          >
            <option value="">Select organization…</option>
            {matchedOrgs!.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
                {org.onboardingCompleted ? "" : " (setup incomplete)"}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field
        label="Organization ID"
        htmlFor="organizationId"
        error={errors.organizationId?.message}
        hint={
          lookupBusy
            ? "Looking up organizations…"
            : matchedOrgs?.length === 1
              ? `Matched ${matchedOrgs[0].name}`
              : matchedOrgs?.length === 0
                ? "No organizations found for this email — enter your UUID."
                : "UUID, or pick from the list when multiple match."
        }
      >
        <Input
          id="organizationId"
          autoComplete="organization"
          placeholder="Your organization UUID"
          aria-invalid={errors.organizationId ? true : undefined}
          {...register("organizationId")}
        />
      </Field>

      {activeIdentity?.oidcEnabled ? (
        <div className="space-y-2 rounded-md border border-border bg-surface-2/50 p-3">
          <p className="text-xs text-ink-2">
            This organization accepts Microsoft Entra / 365 sign-in.
          </p>
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={ssoLoading}
            onClick={() => void startMicrosoft()}
          >
            {ssoLoading ? "Redirecting…" : "Sign in with Microsoft"}
          </Button>
        </div>
      ) : null}

      {activeIdentity?.ldapEnabled ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setLdapMode((v) => !v)}
          >
            {ldapMode ? "Hide Windows AD login" : "Sign in with Windows AD"}
          </Button>
          {ldapMode ? (
            <div className="space-y-3 rounded-md border border-border p-3">
              <Field label="AD username" htmlFor="ldap-user">
                <Input
                  id="ldap-user"
                  value={ldapUsername}
                  onChange={(e) => setLdapUsername(e.target.value)}
                  autoComplete="username"
                />
              </Field>
              <Field label="AD password" htmlFor="ldap-pass">
                <Input
                  id="ldap-pass"
                  type="password"
                  value={ldapPassword}
                  onChange={(e) => setLdapPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </Field>
              <Button
                type="button"
                className="w-full"
                disabled={submitting}
                onClick={() => void submitLdap()}
              >
                {submitting ? "Signing in…" : "Sign in with AD"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!hidePassword ? (
        <>
          {(activeIdentity?.oidcEnabled || activeIdentity?.ldapEnabled) && (
            <p className="text-center text-xs uppercase tracking-wide text-ink-3">
              or password
            </p>
          )}

          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              {...register("password")}
            />
          </Field>

          <div className="pt-1">
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        </>
      ) : (
        <p className="text-xs text-ink-2">
          Password login is disabled for this organization. Use directory SSO above.
        </p>
      )}

      {DEMO_AVAILABLE ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={fillDemo}
        >
          Fill demo credentials
        </Button>
      ) : null}

      <p className="text-center text-[13px] text-ink-2">
        New organization?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
