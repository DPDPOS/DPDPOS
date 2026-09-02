"use client";

import {
  Archive,
  Circle,
  ExternalLink,
  Paperclip,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import { humanizeStatus } from "@/lib/constants/status-maps";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  VIOLATION_SEVERITIES,
  VIOLATION_STEP_CHAIN,
  isViolationTerminal,
  violationActionsFor,
  type ViolationStatus,
} from "@/features/violations/types";
import {
  useCloseViolation,
  useUpdateViolation,
  useViolation,
} from "@/features/violations/hooks";
import { useRemediationTasks } from "@/features/remediation/hooks";
import { useUsers } from "@/features/users/hooks";
import { CreateRemediationTaskDrawer } from "../remediation/create-task-drawer";

interface ViolationDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  violationId: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  triage: "Triage",
  assign: "Assign",
  start: "Start work",
  request_evidence: "Request evidence",
  submit_evidence: "Submit evidence",
  validate: "Validate",
  close: "Close",
  archive: "Archive",
};

export function ViolationDetailDrawer({
  open,
  onClose,
  violationId,
}: ViolationDetailDrawerProps) {
  const { data: violation, isPending, isError, error, refetch } =
    useViolation(violationId);
  const { data: users } = useUsers();
  const { data: tasks } = useRemediationTasks(
    violationId ? { violationId } : {},
    Boolean(violationId),
  );

  const updateMutation = useUpdateViolation();
  const closeMutation = useCloseViolation();

  const [closeDialog, setCloseDialog] = useState(false);
  const [summary, setSummary] = useState("");
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  if (!open) {
    return (
      <Drawer open={false} onClose={onClose} title="Violation detail">
        {null}
      </Drawer>
    );
  }

  if (isPending) {
    return (
      <Drawer open onClose={onClose} title="Violation detail">
        <div className="space-y-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Drawer>
    );
  }

  if (isError || !violation) {
    return (
      <Drawer open onClose={onClose} title="Violation detail">
        <ErrorState
          message={
            error instanceof ApiError ? error.message : "Could not load the violation"
          }
          retry={() => void refetch()}
        />
      </Drawer>
    );
  }

  const status = violation.status as ViolationStatus;
  const userById = new Map((users?.items ?? []).map((u) => [u.id, u.name]));
  const actions = violationActionsFor(status);
  const hasAssign = actions.some((a) => a.action === "assign");
  const canEditAssignee = !isViolationTerminal(status) && (hasAssign || violation.assignedTo);
  const currentIndex = VIOLATION_STEP_CHAIN.indexOf(
    status as (typeof VIOLATION_STEP_CHAIN)[number],
  );
  const archived = status === "ARCHIVED";

  const taskList = tasks ?? [];
  const openTasks = taskList.filter(
    (t) => t.status !== "CLOSED" && t.status !== "CANCELLED",
  );
  const daysOpen = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(violation.openedAt).getTime()) /
        (24 * 60 * 60 * 1000),
    ),
  );
  const dueMs = violation.dueAt ? new Date(violation.dueAt).getTime() - Date.now() : null;
  const overdue = dueMs !== null && dueMs < 0;
  const dueSoon = dueMs !== null && dueMs >= 0 && dueMs < 2 * 24 * 60 * 60 * 1000;
  const primaryAction = actions.find((a) => a.action !== "archive") ?? null;
  const canClose =
    status === "VALIDATED" && openTasks.length === 0;

  const handleMutationError = (err: unknown) => {
    if (err instanceof ApiError && err.code === "CONFLICT") {
      setConflictOpen(true);
      return;
    }
    setInlineError(err instanceof ApiError ? err.message : "Something went wrong");
  };

  const transition = (to: ViolationStatus) => {
    setInlineError(null);
    updateMutation.mutate(
      { id: violation.id, body: { version: violation.version, status: to } },
      { onError: handleMutationError },
    );
  };

  const onAssigneeChange = (assignedTo: string) => {
    setInlineError(null);
    const value = assignedTo || null;
    if (hasAssign) {
      updateMutation.mutate(
        {
          id: violation.id,
          body: { version: violation.version, status: "ASSIGNED", assignedTo: value },
        },
        { onError: handleMutationError },
      );
    } else {
      updateMutation.mutate(
        { id: violation.id, body: { version: violation.version, assignedTo: value } },
        { onError: handleMutationError },
      );
    }
  };

  const onSeverityChange = (severity: string) => {
    setInlineError(null);
    updateMutation.mutate(
      {
        id: violation.id,
        body: {
          version: violation.version,
          severity: severity as (typeof VIOLATION_SEVERITIES)[number],
        },
      },
      { onError: handleMutationError },
    );
  };

  const confirmClose = () => {
    if (openTasks.length > 0) {
      setInlineError(
        `${openTasks.length} remediation task(s) still open — close or cancel them first.`,
      );
      return;
    }
    setInlineError(null);
    closeMutation.mutate(
      { id: violation.id, body: { version: violation.version, resolutionSummary: summary.trim() } },
      {
        onError: handleMutationError,
        onSuccess: () => setCloseDialog(false),
      },
    );
  };

  const confirmArchive = () => {
    setInlineError(null);
    updateMutation.mutate(
      { id: violation.id, body: { version: violation.version, status: "ARCHIVED" } },
      {
        onError: handleMutationError,
        onSuccess: () => setArchiveConfirm(false),
      },
    );
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={violation.title}
      description="Case workspace — fix via remediation, then validate and close."
      className="sm:max-w-xl"
    >
      <div className="space-y-5">
        {/* Case header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={violation.severity} />
            <StatusChip status={violation.status} />
            <Badge variant="outline">{daysOpen}d open</Badge>
            {overdue ? (
              <Badge variant="outline" className="border-fail/40 text-fail">
                Overdue
              </Badge>
            ) : dueSoon ? (
              <Badge variant="outline" className="border-warn/40 text-warn">
                Due soon
              </Badge>
            ) : null}
          </div>
          {violation.description ? (
            <p className="text-[13px] leading-relaxed text-ink-2">
              {violation.description}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3 text-xs text-ink-3">
            <span>Opened {formatDate(violation.openedAt)}</span>
            <span>
              Due {violation.dueAt ? formatDate(violation.dueAt) : "not set"}
            </span>
            <span>
              Owner {userById.get(violation.assignedTo ?? "") ?? "Unassigned"}
            </span>
          </div>
        </div>

        {/* Source / evidence */}
        <div className="flex flex-wrap gap-2">
          {violation.validationResultId ? (
            <Link
              href="/validations"
              className="focus-ring inline-flex items-center gap-1 rounded-sm border border-border bg-surface px-2 py-1 text-xs text-ink-2 hover:text-ink"
            >
              <ExternalLink className="size-3" aria-hidden />
              From validation
            </Link>
          ) : null}
          <Link
            href={`/evidence?violationId=${violation.id}`}
            className="focus-ring inline-flex items-center gap-1 rounded-sm border border-border bg-surface px-2 py-1 text-xs text-ink-2 hover:text-ink"
          >
            <Paperclip className="size-3" aria-hidden />
            {violation.evidenceRequiredFlag ? "Evidence required" : "Evidence"}
          </Link>
          <Link
            href={`/remediation?violationId=${violation.id}`}
            className="focus-ring inline-flex items-center gap-1 rounded-sm border border-border bg-surface px-2 py-1 text-xs text-ink-2 hover:text-ink"
          >
            <ShieldAlert className="size-3" aria-hidden />
            Remediation board
          </Link>
        </div>

        {/* Primary CTA */}
        <Can perm="violation:assign">
          {!isViolationTerminal(status) && primaryAction ? (
            <div className="rounded-sm border border-accent/30 bg-accent-soft/40 p-3">
              <p className="text-xs font-medium text-ink">Next step</p>
              <p className="mt-0.5 text-xs text-ink-2">
                {status === "VALIDATED" && openTasks.length > 0
                  ? "Close or cancel remaining remediation tasks before closing this violation."
                  : status === "VALIDATED"
                    ? "All remediations done — close with a resolution summary."
                    : openTasks.length > 0 &&
                        (status === "IN_PROGRESS" || status === "PENDING_EVIDENCE")
                      ? "Work the remediation tasks; completing them can auto-validate this case."
                      : `Advance the case: ${ACTION_LABELS[primaryAction.action] ?? primaryAction.action}.`}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {primaryAction.action === "close" ? (
                  <Button
                    size="sm"
                    disabled={!canClose || closeMutation.isPending}
                    onClick={() => {
                      setSummary("");
                      setCloseDialog(true);
                    }}
                  >
                    Close violation
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={updateMutation.isPending}
                    onClick={() => transition(primaryAction.to)}
                  >
                    {ACTION_LABELS[primaryAction.action] ??
                      humanizeStatus(primaryAction.action)}
                  </Button>
                )}
                {actions
                  .filter((a) => a.action !== primaryAction.action && a.action !== "archive")
                  .map(({ action, to }) => (
                    <Button
                      key={action}
                      size="sm"
                      variant="secondary"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        action === "close"
                          ? (setSummary(""), setCloseDialog(true))
                          : transition(to)
                      }
                    >
                      {ACTION_LABELS[action] ?? humanizeStatus(action)}
                    </Button>
                  ))}
              </div>
            </div>
          ) : null}
        </Can>

        {/* Remediation — primary work surface */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-ink-2">
              Remediation · {taskList.length - openTasks.length}/{taskList.length} done
            </h3>
            <Can perm="remediation:update">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCreateTaskOpen(true)}
                disabled={isViolationTerminal(status)}
              >
                Add task
              </Button>
            </Can>
          </div>
          {taskList.length > 0 ? (
            <ul className="space-y-2">
              {taskList.map((task) => (
                <li
                  key={task.id}
                  className="rounded-md border border-border bg-surface p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">
                        {task.taskTitle}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-3">
                        {userById.get(task.assignedTo ?? "") ?? "Unassigned"}
                        {task.dueAt ? ` · due ${formatDate(task.dueAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusChip status={task.source} />
                      <StatusChip status={task.status} />
                    </div>
                  </div>
                  <MiniStepper status={task.status} />
                  <Link
                    href={`/remediation?taskId=${task.id}`}
                    className="mt-2 inline-flex text-xs text-accent hover:underline"
                  >
                    Open task →
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-md border border-dashed border-border p-3 text-xs text-ink-3">
              No remediation tasks yet. An AUTO task is usually created when the
              violation opens — otherwise add one to start fixing.
            </p>
          )}
        </div>

        {/* Compact ownership controls */}
        <Can perm="violation:assign">
          {!isViolationTerminal(status) ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Severity" htmlFor="violation-severity">
                <Select
                  id="violation-severity"
                  value={violation.severity}
                  onChange={(event) => onSeverityChange(event.target.value)}
                  disabled={updateMutation.isPending}
                >
                  {VIOLATION_SEVERITIES.map((severity) => (
                    <option key={severity} value={severity}>
                      {severity}
                    </option>
                  ))}
                </Select>
              </Field>
              {canEditAssignee ? (
                <Field label="Assignee" htmlFor="violation-assignee">
                  <Select
                    id="violation-assignee"
                    value={violation.assignedTo ?? ""}
                    onChange={(event) => onAssigneeChange(event.target.value)}
                    disabled={updateMutation.isPending}
                  >
                    <option value="">Unassigned</option>
                    {(users?.items ?? []).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}
            </div>
          ) : null}
        </Can>

        {/* Collapsed lifecycle */}
        <details className="rounded-sm border border-border">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium uppercase tracking-wider text-ink-2">
            Lifecycle · {humanizeStatus(status)}
            {archived ? " (archived)" : ""}
          </summary>
          <ol className="space-y-0 border-t border-border px-3 py-2">
            {VIOLATION_STEP_CHAIN.map((step, index) => {
              const done = !archived && currentIndex >= index;
              const current = !archived && currentIndex === index;
              return (
                <li key={step} className="flex items-center gap-2 py-1">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      done || current ? "bg-pass" : "bg-border",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[13px]",
                      current ? "font-medium text-ink" : "text-ink-2",
                    )}
                  >
                    {humanizeStatus(step)}
                    {current ? " · current" : ""}
                  </span>
                </li>
              );
            })}
          </ol>
        </details>

        {violation.resolutionSummary ? (
          <div>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-2">
              Resolution
            </h3>
            <p className="whitespace-pre-wrap rounded-md border border-border bg-surface-2/60 p-3 text-[13px] leading-relaxed text-ink">
              {violation.resolutionSummary}
            </p>
          </div>
        ) : null}

        {inlineError ? (
          <p role="alert" className="text-xs text-fail">
            {inlineError}
          </p>
        ) : null}

        <Can perm="violation:assign">
          {!isViolationTerminal(status) ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setArchiveConfirm(true)}
              disabled={updateMutation.isPending}
            >
              <Archive className="size-3.5" aria-hidden />
              Archive
            </Button>
          ) : (
            <p className="text-xs text-ink-3">Terminal state — record is immutable.</p>
          )}
        </Can>
      </div>

      {/* Close dialog — resolutionSummary required */}
      <Dialog
        open={closeDialog}
        onClose={() => setCloseDialog(false)}
        title="Close violation"
        description={
          openTasks.length > 0
            ? `${openTasks.length} remediation task(s) are still open. Close or cancel them first.`
            : "The resolution summary becomes part of the audit trail."
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCloseDialog(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={confirmClose}
              disabled={
                summary.trim().length === 0 ||
                closeMutation.isPending ||
                openTasks.length > 0
              }
            >
              Close violation
            </Button>
          </>
        }
      >
        <Field
          label="Resolution summary"
          htmlFor="violation-close-summary"
          error={
            summary.trim().length === 0 && closeDialog
              ? "Required to close"
              : undefined
          }
        >
          <Textarea
            id="violation-close-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="How was the violation resolved and verified?"
          />
        </Field>
      </Dialog>

      {/* Archive confirm */}
      <Dialog
        open={archiveConfirm}
        onClose={() => setArchiveConfirm(false)}
        title="Archive violation"
        description="Archiving is terminal and audited. The record stays searchable but no further action is possible."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setArchiveConfirm(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirmArchive} disabled={updateMutation.isPending}>
              Archive violation
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">
          Are you sure this violation should be archived rather than worked to closure?
        </p>
      </Dialog>

      {/* 409 conflict (§7.6) */}
      <Dialog
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        title="Changed by someone else"
        description="This violation was updated in another session. Reload to see the latest state before retrying."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConflictOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setConflictOpen(false);
                void refetch();
              }}
            >
              Reload
            </Button>
          </>
        }
      >
        <Circle className="size-4 text-warn" aria-hidden />
      </Dialog>

      <CreateRemediationTaskDrawer
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        violationId={violation.id}
      />
    </Drawer>
  );
}

/** Compact 5-state stepper for tasks embedded in the violation drawer. */
function MiniStepper({ status }: { status: string }) {
  const chain = ["PENDING", "IN_PROGRESS", "PENDING_VERIFICATION", "VERIFIED", "CLOSED"];
  const cancelled = status === "CANCELLED";
  const index = chain.indexOf(status);
  return (
    <div className="mt-2 flex items-center gap-0" aria-label="Task lifecycle">
      {chain.map((step, i) => {
        const done = !cancelled && index >= i;
        const isLast = i === chain.length - 1;
        return (
          <div key={step} className="flex items-center">
            <span
              className={cn(
                "flex size-2 rounded-full",
                done ? "bg-pass" : "bg-border",
              )}
              aria-hidden
            />
            {!isLast ? <span className={cn("h-px w-4", done ? "bg-pass" : "bg-border")} aria-hidden /> : null}
          </div>
        );
      })}
      {cancelled ? (
        <span className="ml-2 inline-flex items-center gap-1 text-xs text-fail">
          <ShieldAlert className="size-3" aria-hidden />
          Cancelled
        </span>
      ) : null}
    </div>
  );
}
