"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import { authApi } from "../api";
import { authErrorMessage, applyFieldErrors } from "../error-utils";
import { acceptInviteSchema, type AcceptInviteFormValues } from "../schemas";
import { FormAlert } from "./form-alert";

export function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token") ?? "";
  const urlOrg = searchParams.get("org") ?? "";

  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      organizationId: urlOrg,
      email: "",
      inviteToken: urlToken,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setServerError(null);
    try {
      await authApi.acceptInvite({
        organizationId: values.organizationId,
        email: values.email,
        inviteToken: values.inviteToken,
        password: values.password,
      });
      setAccepted(true);
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

  if (accepted) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-sm border border-pass/20 bg-pass-bg/50 p-3">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-pass" aria-hidden />
          <div>
            <p className="text-sm font-medium text-pass">Account activated</p>
            <p className="mt-0.5 text-[13px] text-ink-2">
              Your invite is accepted and your password is set. Sign in to
              continue — you&apos;ll need your organization ID.
            </p>
          </div>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {serverError ? <FormAlert message={serverError} /> : null}

      <Field
        label="Organization ID"
        htmlFor="invite-org"
        error={errors.organizationId?.message}
      >
        <Input
          id="invite-org"
          placeholder="00000000-0000-4000-8000-000000000001"
          aria-invalid={errors.organizationId ? true : undefined}
          {...register("organizationId")}
        />
      </Field>

      <Field label="Email" htmlFor="invite-email" error={errors.email?.message}>
        <Input
          id="invite-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.in"
          aria-invalid={errors.email ? true : undefined}
          {...register("email")}
        />
      </Field>

      <Field
        label="Invite token"
        htmlFor="invite-token"
        error={errors.inviteToken?.message}
        hint={urlToken ? "Filled from your invite link." : "Paste the token from your invite email."}
      >
        <Input
          id="invite-token"
          className="font-mono"
          aria-invalid={errors.inviteToken ? true : undefined}
          {...register("inviteToken")}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="invite-password"
        error={errors.password?.message}
        hint="At least 8 characters."
      >
        <Input
          id="invite-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          {...register("password")}
        />
      </Field>

      <Field
        label="Confirm password"
        htmlFor="invite-confirm"
        error={errors.confirmPassword?.message}
      >
        <Input
          id="invite-confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? true : undefined}
          {...register("confirmPassword")}
        />
      </Field>

      <div className="pt-1">
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Activating…" : "Activate account"}
        </Button>
      </div>
    </form>
  );
}
