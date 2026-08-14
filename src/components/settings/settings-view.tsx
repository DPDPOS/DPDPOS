"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils/format";
import { useSessionStore } from "@/state/session";
import {
  updateOrganizationSchema,
  type UpdateOrganizationFormValues,
} from "@/features/organizations/schemas";
import { useOrganization, useUpdateOrganization } from "@/features/organizations/hooks";
import { INDUSTRY_DOMAIN_OPTIONS } from "@/features/organizations/industry-domains";
import { IdentitySettingsPanel } from "@/components/settings/identity-settings-panel";

const MATURITY_OPTIONS = ["basic", "intermediate", "advanced"];

export function SettingsView() {
  const organizationId = useSessionStore((state) => state.user?.organizationId ?? null);
  const user = useSessionStore((state) => state.user);

  const { data: org, isPending, isError, error, refetch } = useOrganization(organizationId);
  const updateMutation = useUpdateOrganization();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isDirty, errors },
  } = useForm<UpdateOrganizationFormValues>({
    resolver: zodResolver(updateOrganizationSchema),
  });

  const isSdf = watch("isSignificantDataFiduciary") ?? false;

  // Hydrate the form when the org loads or changes.
  useEffect(() => {
    if (!org) return;
    reset({
      name: org.name,
      industry: org.industry ?? undefined,
      companySize: org.companySize ?? undefined,
      operatingRegion: org.operatingRegion ?? undefined,
      companyType: org.companyType ?? undefined,
      maturityLevel: org.maturityLevel ?? undefined,
      isSignificantDataFiduciary: org.isSignificantDataFiduciary,
    });
  }, [org, reset]);

  if (!organizationId) return null;

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !org) {
    return (
      <ErrorState
        message={error instanceof ApiError ? error.message : "Could not load organization"}
        retry={() => void refetch()}
      />
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setSaved(false);
    try {
      await updateMutation.mutateAsync({ id: org.id, body: values });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch {
      // Surfaced through updateMutation.isError below.
    }
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-semibold text-ink">Settings</h1>
        <p className="mt-0.5 text-[13px] text-ink-2">
          Organization profile and your session. Updates are audited.
        </p>
      </header>

      {/* Organization profile */}
      <section className="rounded-md border border-border bg-surface p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-ink">Organization profile</h2>
          <p className="mt-0.5 text-xs text-ink-2">
            {org.name} · {org.status.toLowerCase()} · created {formatDate(org.createdAt)}
          </p>
        </div>

        <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Name" htmlFor="org-name" error={errors.name?.message}>
              <Input id="org-name" {...register("name")} maxLength={200} />
            </Field>
            <Field label="Industry" htmlFor="org-industry" error={errors.industry?.message}>
              <Select id="org-industry" {...register("industry")}>
                <option value="">Select industry…</option>
                {INDUSTRY_DOMAIN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Company size" htmlFor="org-size" error={errors.companySize?.message}>
              <Input
                id="org-size"
                placeholder="e.g. 1–100"
                maxLength={60}
                {...register("companySize")}
              />
            </Field>
            <Field
              label="Operating region"
              htmlFor="org-region"
              error={errors.operatingRegion?.message}
            >
              <Input
                id="org-region"
                placeholder="e.g. India"
                maxLength={60}
                {...register("operatingRegion")}
              />
            </Field>
            <Field label="Company type" htmlFor="org-type" error={errors.companyType?.message}>
              <Input
                id="org-type"
                placeholder="e.g. private limited"
                maxLength={60}
                {...register("companyType")}
              />
            </Field>
            <Field label="Maturity level" htmlFor="org-maturity" error={errors.maturityLevel?.message}>
              <Select id="org-maturity" {...register("maturityLevel")}>
                <option value="">Unset</option>
                {MATURITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {/* SDF explainer */}
          <div className="rounded-md border border-border bg-surface-2/60 p-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={isSdf}
                onChange={(event) => {
                  setValue("isSignificantDataFiduciary", event.target.checked, {
                    shouldDirty: true,
                  });
                }}
                aria-label="Significantly large data fiduciary"
                className="mt-0.5 size-4 accent-accent"
              />
              <span>
                <span className="block text-[13px] font-medium text-ink">
                  Significantly large data fiduciary
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-2">
                  Classifying the organization as an SDF changes what the
                  framework requires — additional obligations apply under the
                  DPDP Act. Review before enabling.
                </span>
              </span>
            </label>
          </div>

          {updateMutation.isError ? (
            <p role="alert" className="text-xs text-fail">
              {updateMutation.error instanceof ApiError
                ? updateMutation.error.message
                : "Could not save the profile"}
            </p>
          ) : null}

          <footer className="flex items-center justify-end gap-3 border-t border-border pt-3">
            {saved ? (
              <span className="text-xs font-medium text-pass">Saved</span>
            ) : null}
            <Button type="submit" size="sm" disabled={updateMutation.isPending || !isDirty}>
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </footer>
        </form>
      </section>

      <IdentitySettingsPanel />

      {/* Session & security */}
      <section className="rounded-md border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Session &amp; security</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <p className="text-[13px] font-medium text-ink">{user?.name}</p>
              <p className="font-mono text-xs text-ink-2">{user?.email}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              {(user?.roles ?? []).map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-ink">Multi-factor authentication</p>
              <p className="text-xs text-ink-2">
                {user?.mfaEnabled
                  ? "MFA is enabled on your account."
                  : "MFA is not enabled. Enrollment is offered at sign-in."}
              </p>
            </div>
            <StatusChip status={user?.mfaEnabled ? "ENABLED" : "NOT_ENABLED"} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-ink">Permission scope</p>
              <p className="text-xs text-ink-2">
                You hold {user?.permissions.length ?? 0} of the frozen catalog
                permissions.
              </p>
            </div>
            <ShieldCheck className="size-4 text-ink-3" aria-hidden />
          </div>
        </div>
      </section>
    </div>
  );
}
