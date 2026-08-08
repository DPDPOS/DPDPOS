"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { ApiError } from "@/lib/api/errors";
import { useGenerateFramework, usePublishFramework } from "@/features/framework/hooks";
import {
  wizardProfileSchema,
  type WizardProfileValues,
} from "@/features/framework/schemas";
import type { FrameworkResponse } from "@/features/framework/types";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { RoadmapPhases } from "./roadmap-phases";

const INDUSTRY_SUGGESTIONS = [
  "education",
  "healthcare",
  "gaming",
  "social media",
  "financial services",
  "e-commerce",
  "technology",
];

type Step = "profile" | "preview" | "done";

export interface FrameworkWizardProps {
  open: boolean;
  onClose: () => void;
  /** "create" from the empty state; "regenerate" from an existing draft. */
  mode: "create" | "regenerate";
}

/**
 * Framework generator (plan §9.3) — profile → preview → publish. The preview
 * is real: it calls POST /framework/generate with publish:false and renders
 * the backend-built roadmap (phases + controls + due dates).
 */
export function FrameworkWizard({ open, onClose, mode }: FrameworkWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [generated, setGenerated] = useState<FrameworkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useGenerateFramework();
  const publish = usePublishFramework();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<WizardProfileValues>({
    resolver: zodResolver(wizardProfileSchema),
    defaultValues: {
      industryProfile: "",
      maturityLevel: "basic",
      dataSensitivity: "medium",
      departmentCount: 0,
      processorCount: 0,
      isSdf: false,
    },
  });

  const close = () => {
    onClose();
    // Reset for next open.
    window.setTimeout(() => {
      setStep("profile");
      setGenerated(null);
      setError(null);
    }, 200);
  };

  const onSubmitProfile = handleSubmit(async (profile) => {
    setError(null);
    try {
      const framework = await generate.mutateAsync({
        ...profile,
        name: profile.name || `${capitalize(profile.industryProfile)} programme`,
        publish: false,
      });
      setGenerated(framework);
      setStep("preview");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Generation failed. Try again.",
      );
    }
  });

  const onPublish = async () => {
    if (!generated) return;
    setError(null);
    try {
      await publish.mutateAsync(generated.id);
      setStep("done");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Publishing failed. Try again.",
      );
    }
  };

  const roadmap = generated?.roadmapJson;

  return (
    <Dialog
      open={open}
      onClose={close}
      title={mode === "create" ? "Build your framework" : "Regenerate framework"}
      description={
        step === "profile"
          ? "Step 1 of 3 — describe your organisation; the programme is generated from it."
          : step === "preview"
            ? "Step 2 of 3 — this is the real roadmap the backend built for your profile."
            : "Step 3 of 3 — publishing locks the programme and lights up the registers."
      }
      className="max-w-2xl"
    >
      {/* Step indicator ---------------------------------------------------- */}
      <div className="mb-4 flex items-center gap-1.5" aria-hidden>
        {(["profile", "preview", "done"] as const).map((s, index) => (
          <div key={s} className="flex flex-1 items-center gap-1.5">
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-sm border font-mono text-[10px] font-semibold",
                step === s
                  ? "border-accent bg-accent text-white"
                  : index < stepOrder(s)
                    ? "border-pass/40 bg-pass-bg text-pass"
                    : "border-border bg-surface text-ink-3",
              )}
            >
              {index + 1}
            </span>
            {index < 2 ? (
              <span className="h-px flex-1 bg-border" />
            ) : null}
          </div>
        ))}
      </div>

      {step === "profile" ? (
        <form onSubmit={onSubmitProfile} noValidate className="space-y-4">
          <Field
            label="Programme name"
            htmlFor="fw-name"
            hint="Optional — defaults to your industry profile."
            error={errors.name?.message}
          >
            <Input
              id="fw-name"
              placeholder="e.g. DPDP compliance programme 2026"
              {...register("name")}
            />
          </Field>

          <Field
            label="Industry profile"
            htmlFor="fw-industry"
            error={errors.industryProfile?.message}
          >
            <Controller
              control={control}
              name="industryProfile"
              render={({ field }) => (
                <>
                  <Input
                    id="fw-industry"
                    placeholder="e.g. healthcare, education, e-commerce"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {INDUSTRY_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => field.onChange(suggestion)}
                        className={cn(
                          "focus-ring rounded-sm border px-1.5 py-0.5 text-xs transition-colors",
                          field.value === suggestion
                            ? "border-accent/40 bg-accent-soft text-accent"
                            : "border-border bg-surface text-ink-2 hover:border-border-strong hover:text-ink",
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </>
              )}
            />
          </Field>

          <Field label="Maturity level" htmlFor="fw-maturity">
            <Controller
              control={control}
              name="maturityLevel"
              render={({ field }) => (
                <Segmented
                  name="Maturity level"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "basic", label: "Basic" },
                    { value: "intermediate", label: "Intermediate" },
                    { value: "advanced", label: "Advanced" },
                  ]}
                />
              )}
            />
          </Field>

          <Field label="Data sensitivity" htmlFor="fw-sensitivity">
            <Controller
              control={control}
              name="dataSensitivity"
              render={({ field }) => (
                <Segmented
                  name="Data sensitivity"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                  ]}
                />
              )}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Departments"
              htmlFor="fw-departments"
              error={errors.departmentCount?.message}
            >
              <Input
                id="fw-departments"
                type="number"
                min={0}
                placeholder="0"
                {...register("departmentCount", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Data processors"
              htmlFor="fw-processors"
              error={errors.processorCount?.message}
              hint="Third parties you share personal data with."
            >
              <Input
                id="fw-processors"
                type="number"
                min={0}
                placeholder="0"
                {...register("processorCount", { valueAsNumber: true })}
              />
            </Field>
          </div>

          <Controller
            control={control}
            name="isSdf"
            render={({ field }) => (
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-sm border p-3 transition-colors",
                  field.value
                    ? "border-accent/40 bg-accent-soft/40"
                    : "border-border bg-surface hover:border-border-strong",
                )}
              >
                <input
                  type="checkbox"
                  className="focus-ring mt-0.5 size-4 accent-[--color-accent]"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
                <span>
                  <span className="block text-[13px] font-medium text-ink">
                    Significant Data Fiduciary (SDF)
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-2">
                    SDFs carry stricter duties under DPDP Act s.10 — appoint a DPO,
                    run independent data audits, and perform DPIAs for high-risk
                    processing. This adds the Significant Fiduciary phase.
                  </span>
                </span>
              </label>
            )}
          />

          {error ? (
            <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={generate.isPending}>
              {generate.isPending ? "Generating…" : "Generate preview"}
              <ArrowRight className="size-3.5" aria-hidden />
            </Button>
          </div>
        </form>
      ) : null}

      {step === "preview" && generated && roadmap ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-accent/20 bg-accent-soft px-2 py-1 text-xs font-medium text-accent">
              <Sparkles className="size-3.5" aria-hidden />
              Draft generated
            </span>
            <span className="micro-label text-ink-3">
              {roadmap.summary.controlCount} controls ·{" "}
              {roadmap.summary.requirementCount} obligations ·{" "}
              {roadmap.summary.phaseCount} phases · generated{" "}
              {formatDate(roadmap.generatedAt)}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto pr-1">
            <RoadmapPhases roadmap={roadmap} />
          </div>

          {error ? (
            <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
            <Button variant="ghost" onClick={() => setStep("profile")}>
              <ArrowLeft className="size-3.5" aria-hidden />
              Back
            </Button>
            <Button onClick={() => void onPublish()} disabled={publish.isPending}>
              {publish.isPending ? "Publishing…" : "Publish programme"}
              <Check className="size-3.5" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex size-10 items-center justify-center rounded-full border border-pass/30 bg-pass-bg text-pass">
            <Check className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              {mode === "create" ? "Programme published" : "Programme regenerated"}
            </p>
            <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-2">
              The controls register, obligations and roadmap are live. The
              dashboard score updates from the next validation run.
            </p>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                close();
                router.push("/controls");
              }}
            >
              Go to controls
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                close();
                router.push("/framework/roadmap");
              }}
            >
              View roadmap
            </Button>
            <Button variant="ghost" size="sm" onClick={close}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

function stepOrder(step: Step): number {
  return step === "profile" ? 0 : step === "preview" ? 1 : 2;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
