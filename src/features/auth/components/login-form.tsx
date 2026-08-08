"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import { useSessionStore } from "@/state/session";
import { authApi } from "../api";
import { DEMO_AVAILABLE, DEMO_CREDENTIALS } from "../demo-credentials";
import { authErrorMessage, applyFieldErrors } from "../error-utils";
import { clearMfaChallenge, startMfaChallenge } from "../mfa-constants";
import { loginSchema, type LoginFormValues } from "../schemas";
import { FormAlert } from "./form-alert";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { organizationId: "", email: "", password: "" },
  });

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
      router.replace(result.mfaEnrollmentRequired ? "/mfa?step=enroll" : "/dashboard");
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

  const fillDemo = () => {
    setValue("organizationId", DEMO_CREDENTIALS.organizationId, { shouldValidate: true });
    setValue("email", DEMO_CREDENTIALS.email, { shouldValidate: true });
    setValue("password", DEMO_CREDENTIALS.password, { shouldValidate: true });
    setServerError(null);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {serverError ? <FormAlert message={serverError} /> : null}

      <Field label="Organization ID" htmlFor="organizationId" error={errors.organizationId?.message}>
        <Input
          id="organizationId"
          autoComplete="organization"
          placeholder="00000000-0000-4000-8000-000000000001"
          aria-invalid={errors.organizationId ? true : undefined}
          {...register("organizationId")}
        />
      </Field>

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.in"
          aria-invalid={errors.email ? true : undefined}
          {...register("email")}
        />
      </Field>

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
    </form>
  );
}
