"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuestionnaireQuestion } from "@/features/assessments/types";
import { authApi } from "@/features/auth/api";
import { fileToBase64 } from "@/features/onboarding/api";
import {
  useCompleteOnboarding,
  useDownloadOnboardingTemplate,
  useImportOnboardingExcel,
  useOnboardingQuestionnaire,
  useSaveOnboardingAnswers,
  useUpdateOnboardingProfile,
} from "@/features/onboarding/hooks";
import {
  onboardingProfileSchema,
  type OnboardingProfileFormValues,
} from "@/features/onboarding/schemas";
import { useOrganization } from "@/features/organizations/hooks";
import { INDUSTRY_DOMAIN_OPTIONS } from "@/features/organizations/industry-domains";
import { ApiError } from "@/lib/api/errors";
import { useSessionStore } from "@/state/session";

const MATURITY_OPTIONS = [
  "Initial",
  "Developing",
  "Defined",
  "Managed",
  "Optimizing",
] as const;

type AnswerTab = "fill" | "upload";

function isQuestionVisible(
  q: QuestionnaireQuestion,
  answers: Record<string, string | boolean>,
): boolean {
  if (!q.showIf) return true;
  return answers[q.showIf.code] === q.showIf.equals;
}

function formatAnswerValue(value: string | boolean | undefined): string {
  if (value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value.replaceAll("_", " ");
}

export function OnboardingView() {
  const router = useRouter();
  const setUser = useSessionStore((s) => s.setUser);
  const organizationId = useSessionStore((s) => s.user?.organizationId ?? null);

  const {
    data: questionnaire,
    isPending,
    isError,
    error,
    refetch,
  } = useOnboardingQuestionnaire();
  const { data: org } = useOrganization(organizationId);

  const updateProfile = useUpdateOnboardingProfile();
  const saveAnswers = useSaveOnboardingAnswers();
  const importExcel = useImportOnboardingExcel();
  const completeMutation = useCompleteOnboarding();
  const downloadTemplate = useDownloadOnboardingTemplate();

  const [tab, setTab] = useState<AnswerTab>("fill");
  const [answerMap, setAnswerMap] = useState<Record<string, string | boolean>>({});
  const [profileSaved, setProfileSaved] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [savingCode, setSavingCode] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<OnboardingProfileFormValues>({
    resolver: zodResolver(onboardingProfileSchema),
    defaultValues: {
      industry: "",
      companySize: "",
      operatingRegion: "",
      companyType: "",
      maturityLevel: "",
      isSignificantDataFiduciary: false,
    },
  });

  const isSdf = useWatch({ control, name: "isSignificantDataFiduciary" }) ?? false;

  useEffect(() => {
    if (!org) return;
    reset({
      industry: org.industry ?? "",
      companySize: org.companySize ?? "",
      operatingRegion: org.operatingRegion ?? "",
      companyType: org.companyType ?? "",
      maturityLevel: org.maturityLevel ?? "",
      isSignificantDataFiduciary: org.isSignificantDataFiduciary,
    });
  }, [org, reset]);

  useEffect(() => {
    if (!questionnaire?.answers) return;
    const next: Record<string, string | boolean> = {};
    for (const row of questionnaire.answers) {
      const v = row.value;
      if (typeof v === "boolean" || typeof v === "string") next[row.questionCode] = v;
    }
    setAnswerMap(next);
  }, [questionnaire?.answers]);

  const visibleQuestions = useMemo(() => {
    const questions = questionnaire?.questions ?? [];
    return questions.filter((q) => isQuestionVisible(q, answerMap));
  }, [questionnaire?.questions, answerMap]);

  const status = questionnaire?.status;
  const canComplete =
    Boolean(status?.profileComplete) &&
    Boolean(status) &&
    status!.missingQuestionCodes.length === 0;

  const onSaveProfile = handleSubmit(async (values) => {
    setProfileSaved(false);
    setCompleteError(null);
    try {
      await updateProfile.mutateAsync({
        industry: values.industry,
        companySize: values.companySize,
        operatingRegion: values.operatingRegion,
        companyType: values.companyType,
        maturityLevel: values.maturityLevel,
        isSignificantDataFiduciary: values.isSignificantDataFiduciary ?? false,
      });
      setProfileSaved(true);
      window.setTimeout(() => setProfileSaved(false), 2000);
    } catch {
      // Surfaced via mutation error.
    }
  });

  const commitAnswer = async (code: string, value: string | boolean) => {
    setSavingCode(code);
    setCompleteError(null);
    setAnswerMap((prev) => ({ ...prev, [code]: value }));
    try {
      await saveAnswers.mutateAsync({
        answers: [{ questionCode: code, value }],
      });
    } catch {
      // Keep local map; user can retry.
    } finally {
      setSavingCode(null);
    }
  };

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setImportMessage(null);
    setCompleteError(null);
    try {
      const contentBase64 = await fileToBase64(file);
      const result = await importExcel.mutateAsync({
        contentBase64,
        fileName: file.name,
      });
      setImportMessage(`Imported ${result.saved} answer(s).`);
    } catch (err) {
      setImportMessage(
        err instanceof ApiError ? err.message : "Could not import the spreadsheet.",
      );
    }
  };

  const onComplete = async () => {
    setCompleteError(null);
    try {
      await completeMutation.mutateAsync();
      const me = await authApi.me();
      setUser(me);
      router.replace("/dashboard");
    } catch (err) {
      setCompleteError(
        err instanceof ApiError
          ? err.message
          : "Could not finish onboarding. Check required fields and answers.",
      );
    }
  };

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !questionnaire) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ErrorState
          message={
            error instanceof ApiError ? error.message : "Could not load onboarding"
          }
          retry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-lg font-semibold text-ink">Organization setup</h1>
        <p className="mt-0.5 text-[13px] text-ink-2">
          Complete your profile and DPDP discovery questionnaire once. You won&apos;t
          be asked again after you finish.
        </p>
        {status ? (
          <p className="mt-2 text-xs text-ink-3">
            Profile {status.profileComplete ? "ready" : "incomplete"} · Answers{" "}
            {status.answeredRequiredCount}/{status.requiredAnswerCount} required
          </p>
        ) : null}
      </header>

      <section className="rounded-md border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Organization profile</h2>
        <p className="mt-0.5 text-xs text-ink-2">
          Industry drives which questionnaire items apply.
        </p>

        <Can
          perm="organization:update"
          fallback={
            <p className="mt-3 text-[13px] text-ink-2">
              You need organization update permission to edit the profile.
            </p>
          }
        >
          <form
            onSubmit={(event) => void onSaveProfile(event)}
            className="mt-4 space-y-4"
            noValidate
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Industry" htmlFor="ob-industry" error={errors.industry?.message}>
                <Select id="ob-industry" {...register("industry")}>
                  <option value="">Select industry…</option>
                  {INDUSTRY_DOMAIN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Company size"
                htmlFor="ob-size"
                error={errors.companySize?.message}
              >
                <Input
                  id="ob-size"
                  placeholder="e.g. 1–100"
                  maxLength={60}
                  {...register("companySize")}
                />
              </Field>
              <Field
                label="Operating region"
                htmlFor="ob-region"
                error={errors.operatingRegion?.message}
              >
                <Input
                  id="ob-region"
                  placeholder="e.g. India"
                  maxLength={60}
                  {...register("operatingRegion")}
                />
              </Field>
              <Field
                label="Company type"
                htmlFor="ob-type"
                error={errors.companyType?.message}
              >
                <Input
                  id="ob-type"
                  placeholder="e.g. private limited"
                  maxLength={60}
                  {...register("companyType")}
                />
              </Field>
              <Field
                label="Maturity level"
                htmlFor="ob-maturity"
                error={errors.maturityLevel?.message}
              >
                <Select id="ob-maturity" {...register("maturityLevel")}>
                  <option value="">Select…</option>
                  {MATURITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-surface-2/60 p-3">
              <input
                type="checkbox"
                checked={isSdf}
                onChange={(event) => {
                  setValue("isSignificantDataFiduciary", event.target.checked, {
                    shouldDirty: true,
                  });
                }}
                className="mt-0.5 size-4 accent-accent"
              />
              <span>
                <span className="block text-[13px] font-medium text-ink">
                  Significantly large data fiduciary
                </span>
                <span className="mt-0.5 block text-xs text-ink-2">
                  Enables additional DPDP obligations for SDF classification.
                </span>
              </span>
            </label>

            {updateProfile.isError ? (
              <p role="alert" className="text-xs text-fail">
                {updateProfile.error instanceof ApiError
                  ? updateProfile.error.message
                  : "Could not save profile"}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-3">
              {profileSaved ? (
                <span className="text-xs font-medium text-pass">Saved</span>
              ) : null}
              <Button
                type="submit"
                size="sm"
                disabled={updateProfile.isPending || !isDirty}
              >
                {updateProfile.isPending ? "Saving…" : "Save profile"}
              </Button>
            </div>
          </form>
        </Can>
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Questionnaire</h2>
            <p className="mt-0.5 text-xs text-ink-2">
              {questionnaire.purpose ??
                "Answer the discovery questions or upload a completed Excel template."}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={downloadTemplate.isPending}
            onClick={() => void downloadTemplate.mutateAsync()}
          >
            <Download className="size-3.5" aria-hidden />
            {downloadTemplate.isPending ? "Downloading…" : "Download template"}
          </Button>
        </div>

        <Segmented
          name="Questionnaire mode"
          value={tab}
          onChange={setTab}
          options={[
            { value: "fill", label: "Fill questionnaire" },
            { value: "upload", label: "Upload Excel" },
          ]}
          className="mb-4 max-w-md"
        />

        {tab === "fill" ? (
          <Can
            perm="organization:update"
            fallback={
              <p className="text-[13px] text-ink-2">
                You need organization update permission to answer questions.
              </p>
            }
          >
            <div className="space-y-3">
              {visibleQuestions.length === 0 ? (
                <p className="text-[13px] text-ink-3">
                  Save your industry profile to load applicable questions.
                </p>
              ) : (
                visibleQuestions.map((q) => (
                  <div
                    key={q.code}
                    className="rounded-sm border border-border bg-surface-2/40 p-4"
                  >
                    <p className="text-[13px] font-medium text-ink">{q.label}</p>
                    {q.helpText ? (
                      <p className="mt-1 text-xs leading-relaxed text-ink-2">
                        {q.helpText}
                      </p>
                    ) : null}
                    <p className="mt-1 font-mono text-[10px] text-ink-3">
                      {q.stageLabel} · {q.code}
                      {q.required ? " · required" : ""}
                    </p>

                    <div className="mt-3">
                      {q.valueType === "boolean" ? (
                        <div className="flex flex-wrap gap-2">
                          {[true, false].map((val) => (
                            <Button
                              key={String(val)}
                              type="button"
                              size="sm"
                              disabled={savingCode === q.code}
                              variant={
                                answerMap[q.code] === val ? "primary" : "secondary"
                              }
                              onClick={() => void commitAnswer(q.code, val)}
                            >
                              {val ? "Yes" : "No"}
                            </Button>
                          ))}
                        </div>
                      ) : q.options?.length ? (
                        <Select
                          value={String(answerMap[q.code] ?? "")}
                          disabled={savingCode === q.code}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            void commitAnswer(q.code, value);
                          }}
                        >
                          <option value="">Select…</option>
                          {q.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt.replaceAll("_", " ")}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <div className="flex max-w-md gap-2">
                          <Input
                            value={String(answerMap[q.code] ?? "")}
                            onChange={(e) =>
                              setAnswerMap((prev) => ({
                                ...prev,
                                [q.code]: e.target.value,
                              }))
                            }
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={
                              savingCode === q.code ||
                              !String(answerMap[q.code] ?? "").trim()
                            }
                            onClick={() =>
                              void commitAnswer(
                                q.code,
                                String(answerMap[q.code] ?? "").trim(),
                              )
                            }
                          >
                            Save
                          </Button>
                        </div>
                      )}
                    </div>

                    {answerMap[q.code] !== undefined ? (
                      <p className="mt-2 text-[11px] text-ink-3">
                        Current: {formatAnswerValue(answerMap[q.code])}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Can>
        ) : (
          <Can
            perm="organization:update"
            fallback={
              <p className="text-[13px] text-ink-2">
                You need organization update permission to import answers.
              </p>
            }
          >
            <div className="space-y-3 rounded-sm border border-dashed border-border p-5">
              <div className="flex items-start gap-3">
                <Upload className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
                <div className="space-y-2">
                  <p className="text-[13px] text-ink-2">
                    Upload a filled template (.xlsx). Answers replace matching
                    question codes.
                  </p>
                  <Input
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    disabled={importExcel.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      void onUpload(file);
                      e.target.value = "";
                    }}
                  />
                  {importExcel.isPending ? (
                    <p className="text-xs text-ink-3">Importing…</p>
                  ) : null}
                  {importMessage ? (
                    <p
                      className={`text-xs ${
                        importExcel.isError ? "text-fail" : "text-ink-2"
                      }`}
                    >
                      {importMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </Can>
        )}
      </section>

      <footer className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-3">
          {canComplete
            ? "All required items are complete."
            : "Finish the profile and required answers to continue."}
        </p>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {completeError ? (
            <p role="alert" className="text-xs text-fail">
              {completeError}
            </p>
          ) : null}
          <Button
            type="button"
            disabled={!canComplete || completeMutation.isPending}
            onClick={() => void onComplete()}
          >
            {completeMutation.isPending ? "Finishing…" : "Complete setup"}
          </Button>
        </div>
      </footer>
    </div>
  );
}
