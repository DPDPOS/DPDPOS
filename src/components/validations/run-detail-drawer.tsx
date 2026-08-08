"use client";

import { AlertTriangle, Paperclip } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { ValidationResultResponse } from "@/features/validations/types";
import { useValidationRun } from "@/features/validations/hooks";
import { useValidationRules } from "@/features/validations/hooks";
import { formatDuration } from "@/features/validations/utils";
import { useControls } from "@/features/controls/hooks";
import { useUsers } from "@/features/users/hooks";
import { useCreateViolation, useViolations } from "@/features/violations/hooks";
import type { ViolationSeverity } from "@/features/violations/types";

interface RunDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  runId: string | null;
}

export function RunDetailDrawer({ open, onClose, runId }: RunDetailDrawerProps) {
  const { data: run, isPending, isError, error, refetch } = useValidationRun(
    runId,
    open,
  );
  // Lookup caches are only needed while the drawer is open (§4.3 fetch gating).
  const { data: rules } = useValidationRules({}, open);
  const { data: violations } = useViolations({}, open);
  const { data: controls } = useControls({ pageSize: 200 }, open);
  const { data: users } = useUsers(open);
  const createViolationMutation = useCreateViolation();

  const [conflictOpen, setConflictOpen] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const ruleById = useMemo(
    () => new Map((rules ?? []).map((rule) => [rule.id, rule])),
    [rules],
  );
  const violationByResultId = useMemo(
    () =>
      new Map(
        (violations ?? [])
          .filter((v) => v.validationResultId)
          .map((v) => [v.validationResultId as string, v]),
      ),
    [violations],
  );
  const controlById = useMemo(
    () =>
      new Map(
        (controls?.items ?? []).map((control) => [control.id, control.code]),
      ),
    [controls],
  );
  const userById = useMemo(
    () => new Map((users?.items ?? []).map((user) => [user.id, user.name])),
    [users],
  );

  if (!open) {
    return (
      <Drawer open={false} onClose={onClose} title="Validation run">
        {null}
      </Drawer>
    );
  }

  if (isPending) {
    return (
      <Drawer open onClose={onClose} title="Validation run">
        <div className="space-y-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Drawer>
    );
  }

  if (isError || !run) {
    return (
      <Drawer open onClose={onClose} title="Validation run">
        <ErrorState
          message={error instanceof ApiError ? error.message : "Could not load the run"}
          retry={() => void refetch()}
        />
      </Drawer>
    );
  }

  const createViolation = (result: ValidationResultResponse) => {
    setInlineError(null);
    const rule = ruleById.get(result.ruleId);
    createViolationMutation.mutate(
      {
        validationResultId: result.id,
        severity: (rule?.severity as ViolationSeverity) ?? "MEDIUM",
        title: rule?.title ?? `Violation: ${result.ruleCode}`,
      },
      {
        onError: (err) => {
          if (err instanceof ApiError && err.code === "CONFLICT") {
            // One violation per result — someone else created it first.
            setConflictOpen(true);
            void refetch();
            return;
          }
          setInlineError(
            err instanceof ApiError ? err.message : "Could not create the violation",
          );
        },
      },
    );
  };

  const failResults = run.results.filter((result) => result.resultStatus === "FAIL");

  return (
    <Drawer
      open
      onClose={onClose}
      title="Validation run"
      description={run.triggerType === "MANUAL" ? "Manual trigger" : "Scheduled trigger"}
    >
      <div className="space-y-6">
        {/* Run meta */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={run.status} />
          <Badge variant="outline">{run.triggerType}</Badge>
          <span className="text-xs text-ink-2">
            {userById.get(run.triggeredBy ?? "") ?? "System"}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-xs text-ink-2">
          <div>
            <dt className="uppercase tracking-wider text-ink-3">Started</dt>
            <dd className="tabular">{formatDateTime(run.startedAt)}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider text-ink-3">Duration</dt>
            <dd className="tabular">{formatDuration(run.durationMs)}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider text-ink-3">Finished</dt>
            <dd className="tabular">{formatDateTime(run.finishedAt)}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider text-ink-3">Results</dt>
            <dd className="tabular">{run.results.length}</dd>
          </div>
        </dl>

        {/* Results */}
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-2">
            Results
          </h3>
          {run.results.length === 0 ? (
            <p className="text-[13px] text-ink-2">
              No results recorded for this run.
            </p>
          ) : (
            <ul className="space-y-2">
              {run.results.map((result) => {
                const rule = ruleById.get(result.ruleId);
                const existingViolation = violationByResultId.get(result.id);
                const controlCode = result.controlId
                  ? controlById.get(result.controlId)
                  : undefined;
                return (
                  <li
                    key={result.id}
                    className={cn(
                      "rounded-md border border-border bg-surface-2/50 p-3",
                      result.resultStatus === "FAIL" && "border-fail/30",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip status={result.resultStatus} />
                      <span className="font-mono text-[13px] text-ink">
                        {result.ruleCode}
                      </span>
                      {rule ? (
                        <span className="text-[13px] text-ink-2">{rule.title}</span>
                      ) : null}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-2">
                      {result.score !== null ? (
                        <span className="tabular">score {result.score}</span>
                      ) : null}
                      {result.evidenceRequiredFlag ? (
                        <span className="inline-flex items-center gap-1 text-warn">
                          <Paperclip className="size-3" aria-hidden />
                          Evidence required
                        </span>
                      ) : null}
                      {controlCode ? (
                        <span className="font-mono">{controlCode}</span>
                      ) : null}
                    </div>

                    {result.resultStatus === "FAIL" ||
                    result.resultStatus === "ERROR" ? (
                      <div className="mt-2 space-y-2">
                        <details className="group">
                          <summary className="focus-ring inline-flex cursor-pointer items-center gap-1 rounded-sm text-xs font-medium text-ink-2 transition-colors hover:text-ink">
                            <AlertTriangle className="size-3" aria-hidden />
                            Why it {result.resultStatus === "FAIL" ? "failed" : "errored"}
                          </summary>
                          <p className="mt-2 whitespace-pre-wrap rounded-sm border border-border bg-surface p-2.5 text-[13px] leading-relaxed text-ink">
                            {result.explanation ?? "No explanation recorded."}
                          </p>
                        </details>

                        {result.resultStatus === "FAIL" ? (
                          <div className="flex items-center gap-2">
                            {existingViolation ? (
                              <Badge variant="accent">
                                Violation created — {existingViolation.title}
                              </Badge>
                            ) : (
                              <Can perm="violation:create">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => createViolation(result)}
                                  disabled={createViolationMutation.isPending}
                                >
                                  <AlertTriangle className="size-3.5" aria-hidden />
                                  Create violation
                                </Button>
                              </Can>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {inlineError ? (
          <p role="alert" className="text-xs text-fail">
            {inlineError}
          </p>
        ) : null}

        {failResults.length > 0 ? (
          <p className="text-xs text-ink-3">
            {failResults.length} failed result{failResults.length === 1 ? "" : "s"} —
            create a violation to start the remediation chain (§10.3).
          </p>
        ) : null}
      </div>

      <Dialog
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        title="Violation already exists"
        description="A violation for this result was created in another session — the run was reloaded."
        footer={
          <Button size="sm" onClick={() => setConflictOpen(false)}>
            Got it
          </Button>
        }
      >
        <AlertTriangle className="size-4 text-warn" aria-hidden />
      </Dialog>
    </Drawer>
  );
}
