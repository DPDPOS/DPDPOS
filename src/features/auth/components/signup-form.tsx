"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { INDUSTRY_DOMAIN_OPTIONS } from "@/features/organizations/industry-domains";
import { ApiError } from "@/lib/api/errors";
import { useSessionStore } from "@/state/session";
import { authApi } from "../api";
import { authErrorMessage, applyFieldErrors } from "../error-utils";
import { postAuthPath } from "../post-auth-path";
import { signupSchema, type SignupFormValues } from "../schemas";
import { FormAlert } from "./form-alert";

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      organizationName: "",
      adminName: "",
      email: "",
      password: "",
      industry: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const industry = values.industry?.trim();
      const result = await authApi.signup({
        organizationName: values.organizationName,
        adminName: values.adminName,
        email: values.email,
        password: values.password,
        ...(industry ? { industry } : {}),
      });

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

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {serverError ? <FormAlert message={serverError} /> : null}

      <Field
        label="Organization name"
        htmlFor="organizationName"
        error={errors.organizationName?.message}
      >
        <Input
          id="organizationName"
          autoComplete="organization"
          placeholder="Acme Privacy Pvt Ltd"
          aria-invalid={errors.organizationName ? true : undefined}
          {...register("organizationName")}
        />
      </Field>

      <Field label="Your name" htmlFor="adminName" error={errors.adminName?.message}>
        <Input
          id="adminName"
          autoComplete="name"
          placeholder="Full name"
          aria-invalid={errors.adminName ? true : undefined}
          {...register("adminName")}
        />
      </Field>

      <Field label="Work email" htmlFor="signup-email" error={errors.email?.message}>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.in"
          aria-invalid={errors.email ? true : undefined}
          {...register("email")}
        />
      </Field>

      <Field label="Industry" htmlFor="signup-industry" hint="Optional — you can set this during onboarding.">
        <Select id="signup-industry" {...register("industry")}>
          <option value="">Select later…</option>
          {INDUSTRY_DOMAIN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Password" htmlFor="signup-password" error={errors.password?.message}>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          {...register("password")}
        />
      </Field>

      <Field
        label="Confirm password"
        htmlFor="signup-confirm"
        error={errors.confirmPassword?.message}
      >
        <Input
          id="signup-confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? true : undefined}
          {...register("confirmPassword")}
        />
      </Field>

      <div className="pt-1">
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Creating account…" : "Create organization"}
        </Button>
      </div>

      <p className="text-center text-[13px] text-ink-2">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
