"use client";

import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/ui/status-chip";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { formatFileSize, sha256Hex } from "@/features/evidence/hash";
import {
  useAssessment,
  useAssessmentAnswers,
  useAssessmentAudit,
  useAssessmentDocuments,
  useAssessmentReport,
  useAssessmentScans,
  useConfirmAssessmentDocument,
  useCreateAssessmentVersion,
  useCreateCliToken,
  useEvaluateAssessment,
  useInitiateAssessmentDocument,
  useQuestionnaireCatalog,
  useSaveAssessmentAnswers,
  useUploadAssessmentDocument,
} from "@/features/assessments/hooks";
import { assessmentsApi } from "@/features/assessments/api";
import type {
  AssessmentDocumentType,
  CliTokenResponse,
  QuestionnaireQuestion,
} from "@/features/assessments/types";

type WorkflowStep =
  | "documents"
  | "questionnaire"
  | "cli"
  | "evaluate"
  | "version";

const STEPS: Array<{
  id: WorkflowStep;
  label: string;
  title: string;
  hint: string;
}> = [
  {
    id: "documents",
    label: "Documents",
    title: "Upload policy documents",
    hint: "Add the files you already have. Optionally paste extracted text for PDFs/scans so evaluation can read them.",
  },
  {
    id: "questionnaire",
    label: "Questionnaire",
    title: "DPDP readiness questionnaire",
    hint: "Answer one question at a time. Each answer saves automatically and advances when ready.",
  },
  {
    id: "cli",
    label: "CLI scan",
    title: "Mint a CLI token and submit scan evidence",
    hint: "Generate a token, run the scanner locally, then refresh until findings appear.",
  },
  {
    id: "evaluate",
    label: "Evaluate",
    title: "Evaluate controls",
    hint: "Score controls from documents, questionnaire answers, and CLI findings.",
  },
  {
    id: "version",
    label: "Version",
    title: "Version and audit trail",
    hint: "Snapshot this run before fixes/rescans. Review the hash-chained audit log.",
  },
];

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
  return value;
}

async function extractPlainText(file: File): Promise<string | undefined> {
  const name = file.name.toLowerCase();
  const textLike =
    file.type.startsWith("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".csv") ||
    name.endsWith(".json") ||
    name.endsWith(".html");
  if (!textLike) return undefined;
  try {
    const text = await file.text();
    return text.slice(0, 200_000);
  } catch {
    return undefined;
  }
}

function stepIncompleteMessage(step: WorkflowStep): string | null {
  switch (step) {
    case "documents":
      return "No ready policy files yet. Upload at least one document, or skip for now.";
    case "questionnaire":
      return "Some required questions are still unanswered. Finish them, or skip for now.";
    case "cli":
      return "No completed scan with findings yet. Run the CLI and refresh, or skip for now.";
    case "evaluate":
      return "No report for this version yet. Run Evaluate, or skip for now.";
    default:
      return null;
  }
}

interface Props {
  assessmentId: string;
}

export function AssessmentWizard({ assessmentId }: Props) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);
  const [softWarn, setSoftWarn] = useState<string | null>(null);
  const resumedForId = useRef<string | null>(null);

  const { data: assessment, isError: assessmentMissing } =
    useAssessment(assessmentId);
  const { data: documents, refetch: refetchDocs } =
    useAssessmentDocuments(assessmentId);
  const { data: answers } = useAssessmentAnswers(assessmentId);
  const { data: catalog } = useQuestionnaireCatalog(true);
  const { data: scans, refetch: refetchScans } =
    useAssessmentScans(assessmentId);
  const { data: report, isError: reportMissing } = useAssessmentReport(
    assessmentId,
    stepIndex >= 3 || assessment?.status === "EVALUATED",
  );
  const { data: audit } = useAssessmentAudit(assessmentId);

  const initiateDoc = useInitiateAssessmentDocument(assessmentId);
  const confirmDoc = useConfirmAssessmentDocument(assessmentId);
  const uploadLegacy = useUploadAssessmentDocument(assessmentId);
  const saveAnswers = useSaveAssessmentAnswers(assessmentId);
  const mintToken = useCreateCliToken(assessmentId);
  const evaluate = useEvaluateAssessment(assessmentId);
  const createVersion = useCreateAssessmentVersion(assessmentId);

  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<AssessmentDocumentType>("PRIVACY_NOTICE");
  const [extractedText, setExtractedText] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [answerMap, setAnswerMap] = useState<Record<string, string | boolean>>(
    {},
  );
  const [wizardIndex, setWizardIndex] = useState(0);
  const [savingAnswer, setSavingAnswer] = useState(false);

  const [cliLabel, setCliLabel] = useState("evaluator-laptop");
  const [minted, setMinted] = useState<CliTokenResponse | null>(null);
  const [versionLabel, setVersionLabel] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const questions = catalog?.questions ?? [];
  const stages = catalog?.stages ?? [];
  const documentTypes = catalog?.documentTypes ?? [];

  const visibleQuestions = useMemo(
    () => questions.filter((q) => isQuestionVisible(q, answerMap)),
    [questions, answerMap],
  );

  const docsComplete = useMemo(
    () => (documents ?? []).some((d) => d.uploadStatus === "READY"),
    [documents],
  );

  const quizComplete = useMemo(() => {
    if (!visibleQuestions.length) return false;
    return visibleQuestions
      .filter((q) => q.required !== false)
      .every((q) => answerMap[q.code] !== undefined);
  }, [visibleQuestions, answerMap]);

  const cliComplete = useMemo(
    () =>
      (scans ?? []).some(
        (s) =>
          s.status === "COMPLETED" ||
          (typeof s.findingsCount === "number" && s.findingsCount > 0),
      ),
    [scans],
  );

  const evaluateComplete = Boolean(report) && !reportMissing;

  const stepComplete = (id: WorkflowStep): boolean => {
    switch (id) {
      case "documents":
        return docsComplete;
      case "questionnaire":
        return quizComplete;
      case "cli":
        return cliComplete;
      case "evaluate":
        return evaluateComplete;
      case "version":
        return true;
    }
  };

  const firstIncompleteIndex = useMemo(() => {
    const idx = STEPS.findIndex((s) => !stepComplete(s.id));
    return idx < 0 ? STEPS.length - 1 : idx;
  }, [docsComplete, quizComplete, cliComplete, evaluateComplete]);

  useEffect(() => {
    if (!answers) return;
    const next: Record<string, string | boolean> = {};
    for (const row of answers) {
      const v = row.valueJson;
      if (typeof v === "boolean" || typeof v === "string") next[row.questionCode] = v;
      else if (typeof v === "number") next[row.questionCode] = String(v);
    }
    setAnswerMap(next);
  }, [answers]);

  useEffect(() => {
    if (!catalog?.questions?.length || !answers) return;
    const next: Record<string, string | boolean> = {};
    for (const row of answers) {
      const v = row.valueJson;
      if (typeof v === "boolean" || typeof v === "string") next[row.questionCode] = v;
      else if (typeof v === "number") next[row.questionCode] = String(v);
    }
    const visible = catalog.questions.filter((q) => isQuestionVisible(q, next));
    const firstUnanswered = visible.findIndex((q) => next[q.code] === undefined);
    setWizardIndex(
      firstUnanswered >= 0 ? firstUnanswered : Math.max(0, visible.length - 1),
    );
  }, [assessmentId, catalog?.questions?.length, answers?.length]);

  useEffect(() => {
    if (resumedForId.current === assessmentId) return;
    if (documents === undefined || answers === undefined || scans === undefined) {
      return;
    }
    resumedForId.current = assessmentId;
    setStepIndex(firstIncompleteIndex);
    setMaxReachedIndex(firstIncompleteIndex);
  }, [assessmentId, documents, answers, scans, firstIncompleteIndex]);

  useEffect(() => {
    if (!visibleQuestions.length) {
      setWizardIndex(0);
      return;
    }
    setWizardIndex((prev) =>
      prev >= visibleQuestions.length ? visibleQuestions.length - 1 : prev,
    );
  }, [visibleQuestions.length]);

  const currentStep = STEPS[stepIndex] ?? STEPS[0];
  const currentQuestion = visibleQuestions[wizardIndex] ?? null;
  const answeredVisible = visibleQuestions.filter(
    (q) => answerMap[q.code] !== undefined,
  );
  const progressPct = visibleQuestions.length
    ? Math.round((answeredVisible.length / visibleQuestions.length) * 100)
    : 0;

  const currentStage = currentQuestion
    ? stages.find((s) => s.stageId === currentQuestion.stageId)
    : null;
  const stageNumber = currentStage
    ? stages.findIndex((s) => s.stageId === currentStage.stageId) + 1
    : 0;

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const latestScan = scans?.[0];

  const commandBlock = useMemo(() => {
    if (!minted) return "";
    return [
      minted.instructions.login,
      minted.instructions.configure,
      "npx tsx src/index.ts scan ./fixtures/sample-app",
      "npx tsx src/index.ts evidence",
      "npx tsx src/index.ts submit",
      "npx tsx src/index.ts status",
    ].join("\n");
  }, [minted]);

  const goToStep = (index: number) => {
    if (index < 0 || index >= STEPS.length) return;
    if (index > maxReachedIndex) return;
    setSoftWarn(null);
    setActionError(null);
    setStepIndex(index);
  };

  const finish = () => {
    router.push("/assessments");
  };

  const advance = (force = false) => {
    const incomplete = !stepComplete(currentStep.id);
    if (incomplete && !force) {
      setSoftWarn(stepIncompleteMessage(currentStep.id));
      return;
    }
    setSoftWarn(null);
    if (stepIndex >= STEPS.length - 1) {
      finish();
      return;
    }
    const next = stepIndex + 1;
    setStepIndex(next);
    setMaxReachedIndex((m) => Math.max(m, next));
  };

  const commitAnswer = async (code: string, value: string | boolean) => {
    setActionError(null);
    setSavingAnswer(true);
    const nextMap = { ...answerMap, [code]: value };
    setAnswerMap(nextMap);
    try {
      await saveAnswers.mutateAsync({
        answers: [{ questionCode: code, value }],
      });
      const nextVisible = questions.filter((q) => isQuestionVisible(q, nextMap));
      const idx = nextVisible.findIndex((q) => q.code === code);
      const following = nextVisible.slice(idx + 1);
      const nextUnanswered = following.find((q) => nextMap[q.code] === undefined);
      if (nextUnanswered) {
        setWizardIndex(nextVisible.findIndex((q) => q.code === nextUnanswered.code));
      } else if (idx >= 0 && idx < nextVisible.length - 1) {
        setWizardIndex(idx + 1);
      } else {
        setWizardIndex(Math.max(0, nextVisible.length - 1));
      }
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Could not save answer",
      );
    } finally {
      setSavingAnswer(false);
    }
  };

  const uploadDocumentFile = async () => {
    const pasted = extractedText.trim();
    if (!docFile && !pasted) {
      setActionError("Choose a file and/or paste extracted text.");
      return;
    }
    setActionError(null);
    setUploadingDoc(true);
    try {
      if (docFile) {
        const mimeType = docFile.type || "application/octet-stream";
        const { document, uploadUrl } = await initiateDoc.mutateAsync({
          fileName: docFile.name,
          mimeType,
          documentType: docType,
        });
        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": mimeType },
          body: docFile,
        });
        if (!put.ok) {
          throw new Error(`Upload to storage failed (HTTP ${put.status})`);
        }
        const fileHash = await sha256Hex(docFile);
        const autoText = await extractPlainText(docFile);
        await confirmDoc.mutateAsync({
          documentId: document.id,
          body: {
            fileHash,
            fileSizeBytes: docFile.size,
            extractedText: pasted || autoText,
          },
        });
      } else {
        await uploadLegacy.mutateAsync({
          fileName: `${docType.toLowerCase()}.txt`,
          fileType: "text/plain",
          documentType: docType,
          extractedText: pasted,
          contentBase64: btoa(unescape(encodeURIComponent(pasted))),
        });
      }
      setDocFile(null);
      setExtractedText("");
      void refetchDocs();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Upload failed",
      );
    } finally {
      setUploadingDoc(false);
    }
  };

  const isLast = stepIndex >= STEPS.length - 1;
  const overallPct = Math.round(((stepIndex + (stepComplete(currentStep.id) ? 1 : 0)) / STEPS.length) * 100);

  if (assessmentMissing) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-ink">Assessment not found</h1>
        <p className="text-[13px] text-ink-2">
          It may have been deleted, or you do not have access.
        </p>
        <Button asChild variant="secondary">
          <Link href="/assessments">Back to assessments</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-8 flex min-h-[calc(100dvh-3.5rem)] flex-col sm:-mx-6">
      <header className="border-b border-border bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <Link
              href="/assessments"
              className="inline-flex items-center gap-1 text-[12px] text-ink-3 hover:text-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              All assessments
            </Link>
            <h1 className="text-xl font-semibold text-ink">
              {assessment?.name ?? "Assessment"}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
              {assessment ? <StatusChip status={assessment.status} /> : null}
              {assessment ? <span>v{assessment.currentVersion}</span> : null}
              <span>
                Step {stepIndex + 1} of {STEPS.length}
              </span>
            </div>
          </div>
          <div className="w-full max-w-xs sm:w-48">
            <div className="mb-1 flex justify-between text-[11px] text-ink-3">
              <span>Progress</span>
              <span>{Math.min(100, overallPct)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${Math.min(100, overallPct)}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:flex-row sm:px-6 lg:gap-10">
        <aside className="shrink-0 sm:w-56 lg:w-64">
          <ol className="flex gap-2 overflow-x-auto pb-1 sm:flex-col sm:gap-1 sm:overflow-visible sm:pb-0">
            {STEPS.map((step, index) => {
              const complete = stepComplete(step.id);
              const active = index === stepIndex;
              const unlocked = index <= maxReachedIndex;
              return (
                <li key={step.id} className="shrink-0 sm:shrink">
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => goToStep(index)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-sm border px-2.5 py-2 text-left transition-colors sm:border-transparent sm:px-2",
                      active && "border-accent bg-accent-soft sm:bg-accent-soft",
                      !active && unlocked && "hover:bg-surface-2",
                      !unlocked && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                        complete && !active
                          ? "bg-pass text-white"
                          : active
                            ? "bg-accent text-white"
                            : "bg-surface-2 text-ink-3",
                      )}
                    >
                      {complete && !active ? (
                        <Check className="size-3.5" aria-hidden />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-[13px] font-medium",
                          active ? "text-ink" : "text-ink-2",
                        )}
                      >
                        {step.label}
                      </span>
                      <span className="hidden text-[11px] text-ink-3 lg:block">
                        {complete ? "Done" : unlocked ? "In progress" : "Locked"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="min-w-0 flex-1 space-y-4 pb-28">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-ink">{currentStep.title}</h2>
            <p className="max-w-2xl text-[13px] leading-relaxed text-ink-2">
              {currentStep.hint}
            </p>
          </div>

          {softWarn ? (
            <p className="rounded-sm border border-warn/30 bg-warn-bg px-3 py-2 text-[12px] text-warn">
              {softWarn}
            </p>
          ) : null}

          {actionError ? (
            <p className="rounded-sm border border-fail/30 bg-fail-bg px-3 py-2 text-[12px] text-fail">
              {actionError}
            </p>
          ) : null}

          {currentStep.id === "documents" ? (
            <div className="space-y-5">
              <Can perm="assessment:update">
                <div className="space-y-4 rounded-sm border border-border bg-surface p-4 sm:p-5">
                  <Field label="Document type" htmlFor="doc-type">
                    <select
                      id="doc-type"
                      className="h-10 w-full rounded-sm border border-border bg-surface px-2 text-[13px]"
                      value={docType}
                      onChange={(e) =>
                        setDocType(e.target.value as AssessmentDocumentType)
                      }
                    >
                      {(documentTypes.length
                        ? documentTypes
                        : [
                            {
                              value: "PRIVACY_NOTICE" as const,
                              label: "Privacy notice",
                            },
                            { value: "OTHER" as const, label: "Other" },
                          ]
                      ).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Policy file"
                    htmlFor="doc-file"
                    hint="Prefer uploading the real PDF/DOCX/TXT. Required unless you only paste text below."
                  >
                    <Input
                      id="doc-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.md,.html,.rtf,application/pdf,text/*"
                      onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                    />
                  </Field>
                  {docFile ? (
                    <p className="text-[12px] text-ink-3">
                      {docFile.name} · {formatFileSize(docFile.size)}
                    </p>
                  ) : null}
                  <Field
                    label="Extracted text (optional)"
                    htmlFor="doc-text"
                    hint="Paste OCR / copied policy text for PDFs and scans so control evaluation can match keywords. Text files are auto-read when left blank."
                  >
                    <Textarea
                      id="doc-text"
                      rows={8}
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      placeholder="Paste privacy notice / retention / breach policy text…"
                    />
                  </Field>
                  <Button
                    type="button"
                    disabled={
                      uploadingDoc || (!docFile && !extractedText.trim())
                    }
                    onClick={() => void uploadDocumentFile()}
                  >
                    {uploadingDoc ? "Uploading…" : "Add document"}
                  </Button>
                </div>
              </Can>
              <ul className="space-y-2">
                {(documents ?? []).map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-start justify-between gap-2 rounded-sm border border-border bg-surface px-3 py-2.5 text-[13px]"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-ink">
                        {doc.fileName}
                      </div>
                      <div className="mt-0.5 text-[11px] text-ink-3">
                        {doc.documentType.replaceAll("_", " ")} ·{" "}
                        {doc.uploadStatus}
                        {doc.fileSizeBytes != null
                          ? ` · ${formatFileSize(doc.fileSizeBytes)}`
                          : ""}{" "}
                        · v{doc.versionNumber}
                      </div>
                    </div>
                    {doc.uploadStatus === "READY" && doc.storageKey ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            const { downloadUrl } =
                              await assessmentsApi.downloadDocument(
                                assessmentId,
                                doc.id,
                              );
                            window.open(
                              downloadUrl,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          } catch (err) {
                            setActionError(
                              err instanceof ApiError
                                ? err.message
                                : "Could not open download",
                            );
                          }
                        }}
                      >
                        Open
                      </Button>
                    ) : null}
                  </li>
                ))}
                {(documents ?? []).length === 0 ? (
                  <p className="text-[13px] text-ink-3">
                    No documents uploaded yet.
                  </p>
                ) : null}
              </ul>
            </div>
          ) : null}

          {currentStep.id === "questionnaire" ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[12px] text-ink-3">
                  <span>
                    {currentStage
                      ? `Stage ${stageNumber}/${stages.length}: ${currentStage.stageLabel}`
                      : "Questionnaire"}
                  </span>
                  <span>
                    {answeredVisible.length}/{visibleQuestions.length} answered ·{" "}
                    {progressPct}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {currentQuestion ? (
                <div className="space-y-4 rounded-sm border border-border bg-surface p-5 sm:p-6">
                  <p className="text-base font-medium leading-snug text-ink">
                    {currentQuestion.label}
                  </p>
                  <p className="text-[13px] leading-relaxed text-ink-2">
                    {currentQuestion.helpText}
                  </p>
                  <p className="font-mono text-[10px] text-ink-3">
                    {currentQuestion.code}
                  </p>

                  <Can perm="assessment:update">
                    {currentQuestion.valueType === "boolean" ? (
                      <div className="flex flex-wrap gap-2">
                        {[true, false].map((val) => (
                          <Button
                            key={String(val)}
                            type="button"
                            disabled={savingAnswer}
                            variant={
                              answerMap[currentQuestion.code] === val
                                ? "primary"
                                : "secondary"
                            }
                            onClick={() =>
                              void commitAnswer(currentQuestion.code, val)
                            }
                          >
                            {val ? "Yes" : "No"}
                          </Button>
                        ))}
                      </div>
                    ) : currentQuestion.options?.length ? (
                      <select
                        className="h-10 w-full max-w-md rounded-sm border border-border bg-surface px-2 text-[13px]"
                        disabled={savingAnswer}
                        value={String(answerMap[currentQuestion.code] ?? "")}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) return;
                          void commitAnswer(currentQuestion.code, value);
                        }}
                      >
                        <option value="">Select…</option>
                        {currentQuestion.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex max-w-md gap-2">
                        <Input
                          value={String(answerMap[currentQuestion.code] ?? "")}
                          onChange={(e) =>
                            setAnswerMap((prev) => ({
                              ...prev,
                              [currentQuestion.code]: e.target.value,
                            }))
                          }
                        />
                        <Button
                          type="button"
                          disabled={
                            savingAnswer ||
                            !String(answerMap[currentQuestion.code] ?? "").trim()
                          }
                          onClick={() =>
                            void commitAnswer(
                              currentQuestion.code,
                              String(
                                answerMap[currentQuestion.code] ?? "",
                              ).trim(),
                            )
                          }
                        >
                          Save
                        </Button>
                      </div>
                    )}
                  </Can>

                  <div className="flex justify-between border-t border-border pt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={wizardIndex <= 0 || savingAnswer}
                      onClick={() => setWizardIndex((i) => Math.max(0, i - 1))}
                    >
                      Previous question
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={
                        wizardIndex >= visibleQuestions.length - 1 ||
                        savingAnswer
                      }
                      onClick={() =>
                        setWizardIndex((i) =>
                          Math.min(visibleQuestions.length - 1, i + 1),
                        )
                      }
                    >
                      Next question
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-ink-3">Loading questions…</p>
              )}

              <div className="space-y-2">
                <h3 className="text-[13px] font-semibold text-ink">
                  Answer history
                </h3>
                {answeredVisible.length === 0 ? (
                  <p className="text-[12px] text-ink-3">
                    Answers appear here as you complete each question.
                  </p>
                ) : (
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {answeredVisible.map((q) => (
                      <li key={q.code}>
                        <button
                          type="button"
                          className="h-full w-full rounded-sm border border-border bg-surface px-3 py-2 text-left text-[12px] hover:bg-surface-2"
                          onClick={() => {
                            const idx = visibleQuestions.findIndex(
                              (v) => v.code === q.code,
                            );
                            if (idx >= 0) setWizardIndex(idx);
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-ink">{q.label}</span>
                            <span className="shrink-0 font-medium text-ink-2">
                              {formatAnswerValue(answerMap[q.code])}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[10px] text-ink-3">
                            {q.stageLabel}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}

          {currentStep.id === "cli" ? (
            <div className="space-y-5">
              <Can perm="assessment:cli_token">
                <div className="flex flex-wrap items-end gap-3 rounded-sm border border-border bg-surface p-4 sm:p-5">
                  <Field label="Token label" htmlFor="cli-label" className="min-w-[220px] flex-1">
                    <Input
                      id="cli-label"
                      value={cliLabel}
                      onChange={(e) => setCliLabel(e.target.value)}
                    />
                  </Field>
                  <Button
                    type="button"
                    disabled={mintToken.isPending}
                    onClick={async () => {
                      setActionError(null);
                      try {
                        const token = await mintToken.mutateAsync({
                          label: cliLabel || "cli",
                        });
                        setMinted(token);
                      } catch (err) {
                        setActionError(
                          err instanceof ApiError
                            ? err.message
                            : "Could not mint CLI token",
                        );
                      }
                    }}
                  >
                    Generate CLI token
                  </Button>
                </div>
              </Can>

              {minted ? (
                <div className="space-y-3 rounded-sm border border-accent/30 bg-accent-soft p-4 sm:p-5">
                  <p className="text-[13px] font-medium text-ink">
                    Copy now — the raw token is shown only once.
                  </p>
                  <code className="block break-all rounded-sm bg-surface px-3 py-2 font-mono text-[12px] text-ink">
                    {minted.token}
                  </code>
                  <pre className="overflow-x-auto rounded-sm bg-surface p-3 font-mono text-[12px] text-ink-2">
                    {commandBlock}
                  </pre>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => void copyText(commandBlock)}
                  >
                    Copy commands
                  </Button>
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-ink">
                    Scan jobs
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void refetchScans()}
                  >
                    Refresh
                  </Button>
                </div>
                {(scans ?? []).length === 0 ? (
                  <p className="text-[13px] text-ink-3">
                    No scans submitted yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {(scans ?? []).map((scan) => (
                      <li
                        key={scan.id}
                        className="rounded-sm border border-border bg-surface px-3 py-2.5 text-[12px]"
                      >
                        <div className="flex items-center gap-2">
                          <StatusChip status={scan.status} />
                          <span className="text-ink-3">
                            {scan.findingsCount} findings · v{scan.versionNumber}
                          </span>
                        </div>
                        <div className="mt-1 truncate text-ink-2">
                          {scan.targetPath}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {latestScan ? (
                  <p className="text-[12px] text-ink-3">
                    Latest: {latestScan.status} ({latestScan.findingsCount}{" "}
                    findings)
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {currentStep.id === "evaluate" ? (
            <div className="space-y-5">
              <Can perm="assessment:evaluate">
                <Button
                  type="button"
                  disabled={evaluate.isPending}
                  onClick={async () => {
                    setActionError(null);
                    try {
                      await evaluate.mutateAsync();
                    } catch (err) {
                      setActionError(
                        err instanceof ApiError
                          ? err.message
                          : "Evaluation failed",
                      );
                    }
                  }}
                >
                  {evaluate.isPending ? "Evaluating…" : "Evaluate controls"}
                </Button>
              </Can>

              {report ? (
                <>
                  <div className="rounded-sm border border-border bg-surface p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                      Compliance score
                    </p>
                    <p className="mt-1 text-4xl font-semibold text-ink">
                      {report.score}
                    </p>
                    <p className="mt-2 text-[13px] text-ink-2">
                      Pass {report.summary.pass} · Partial{" "}
                      {report.summary.partial} · Fail {report.summary.fail} ·
                      Unknown {report.summary.unknown} · N/A{" "}
                      {report.summary.notApplicable}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {report.results.map((r) => (
                      <div
                        key={r.controlCode}
                        className="rounded-sm border border-border bg-surface px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusChip status={r.status} />
                          <span className="font-mono text-[12px] text-ink">
                            {r.controlCode}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] text-ink-2">
                          {r.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : reportMissing ? (
                <p className="text-[13px] text-ink-3">
                  No report yet — run Evaluate after documents, answers, and CLI
                  evidence are in place.
                </p>
              ) : (
                <p className="text-[13px] text-ink-3">
                  Run Evaluate when this step is ready.
                </p>
              )}
            </div>
          ) : null}

          {currentStep.id === "version" ? (
            <div className="space-y-5">
              <Can perm="assessment:update">
                <div className="flex flex-wrap items-end gap-3 rounded-sm border border-border bg-surface p-4 sm:p-5">
                  <Field
                    label="New version label"
                    htmlFor="version-label"
                    className="min-w-[220px] flex-1"
                  >
                    <Input
                      id="version-label"
                      value={versionLabel}
                      onChange={(e) => setVersionLabel(e.target.value)}
                      placeholder="v2-after-fixes"
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={createVersion.isPending}
                    onClick={async () => {
                      setActionError(null);
                      try {
                        await createVersion.mutateAsync({
                          label: versionLabel || undefined,
                        });
                        setVersionLabel("");
                      } catch (err) {
                        setActionError(
                          err instanceof ApiError
                            ? err.message
                            : "Could not create version",
                        );
                      }
                    }}
                  >
                    Create version
                  </Button>
                </div>
              </Can>

              <ul className="space-y-2">
                {(audit ?? []).map((event, index) => (
                  <li
                    key={event.id}
                    className="rounded-sm border border-border bg-surface px-3 py-2.5 text-[12px]"
                  >
                    <div className="font-medium text-ink">
                      {index + 1}. {event.action}
                    </div>
                    <div className="text-ink-3">
                      {event.actorType} · {formatDate(event.createdAt)}
                    </div>
                    <div className="mt-1 break-all font-mono text-[10px] text-ink-3">
                      hash {event.eventHash.slice(0, 16)}…
                      {event.prevEventHash
                        ? ` · prev ${event.prevEventHash.slice(0, 16)}…`
                        : " · genesis"}
                    </div>
                  </li>
                ))}
                {(audit ?? []).length === 0 ? (
                  <p className="text-[13px] text-ink-3">No audit events yet.</p>
                ) : null}
              </ul>
            </div>
          ) : null}
        </section>
      </div>

      <footer className="sticky bottom-0 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={stepIndex <= 0}
            onClick={() => goToStep(stepIndex - 1)}
          >
            Back
          </Button>
          <div className="flex items-center gap-2">
            {softWarn ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => advance(true)}
              >
                Skip for now
              </Button>
            ) : null}
            <Button type="button" onClick={() => advance(false)}>
              {isLast ? "Finish" : "Continue"}
              {!isLast ? <ChevronRight className="size-4" /> : null}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
