"use client";

import { Play, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { ApiError } from "@/lib/api/errors";
import { humanizeStatus } from "@/lib/constants/status-maps";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  RUN_STATUSES,
  RULE_CATEGORIES,
  type ValidationRuleResponse,
  type ValidationRunResponse,
} from "@/features/validations/types";
import { formatDuration } from "@/features/validations/utils";
import {
  useTriggerValidationRun,
  useUpdateValidationRule,
  useValidationRules,
  useValidationRuns,
} from "@/features/validations/hooks";
import { useUsers } from "@/features/users/hooks";
import { RuleFormDrawer } from "./rule-form-drawer";
import { RunDetailDrawer } from "./run-detail-drawer";

type Tab = "runs" | "rules";

export function ValidationsView() {
  const [tab, setTab] = useState<Tab>("runs");
  const [runStatus, setRunStatus] = useState<string>("ALL");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [ruleCategory, setRuleCategory] = useState<string>("ALL");
  const [activeOnly, setActiveOnly] = useState(false);
  const [ruleDrawer, setRuleDrawer] = useState<
    { mode: "create" } | { mode: "edit"; rule: ValidationRuleResponse } | null
  >(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const runsQuery = useValidationRuns(
    runStatus === "ALL" ? {} : { status: runStatus as (typeof RUN_STATUSES)[number] },
  );
  const rulesQuery = useValidationRules({
    ...(ruleCategory !== "ALL"
      ? { category: ruleCategory as (typeof RULE_CATEGORIES)[number] }
      : {}),
    ...(activeOnly ? { activeOnly: true } : {}),
  });
  const triggerMutation = useTriggerValidationRun();
  const updateRuleMutation = useUpdateValidationRule();
  const { data: users } = useUsers();

  const userById = new Map((users?.items ?? []).map((user) => [user.id, user.name]));
  const pendingToggleId = updateRuleMutation.isPending
    ? updateRuleMutation.variables?.id
    : null;

  const toggleActive = (rule: ValidationRuleResponse) => {
    setToggleError(null);
    updateRuleMutation.mutate(
      { id: rule.id, body: { version: rule.version, activeFlag: !rule.activeFlag } },
      {
        onError: (err) =>
          setToggleError(
            err instanceof ApiError
              ? err.code === "CONFLICT"
                ? "Rule changed elsewhere — state reloaded, please retry."
                : err.message
              : "Could not toggle the rule",
          ),
      },
    );
  };

  const runColumns: TableColumn<ValidationRunResponse>[] = [
    {
      key: "started",
      header: "Started",
      accessor: (row) => (
        <span className="tabular text-[13px]">{formatDateTime(row.startedAt)}</span>
      ),
      sortValue: (row) => row.startedAt,
      sortable: true,
    },
    {
      key: "trigger",
      header: "Trigger",
      accessor: (row) => <StatusChip status={row.triggerType} />,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => <StatusChip status={row.status} />,
    },
    {
      key: "duration",
      header: "Duration",
      accessor: (row) => (
        <span className="tabular text-[13px] text-ink-2">
          {formatDuration(row.durationMs)}
        </span>
      ),
    },
    {
      key: "triggeredBy",
      header: "Triggered by",
      accessor: (row) => userById.get(row.triggeredBy ?? "") ?? "System",
    },
  ];

  const ruleColumns: TableColumn<ValidationRuleResponse>[] = [
    {
      key: "ruleCode",
      header: "Rule",
      accessor: (row) => <span className="font-mono text-[13px]">{row.ruleCode}</span>,
      sortValue: (row) => row.ruleCode,
      sortable: true,
    },
    {
      key: "title",
      header: "Title",
      accessor: (row) => <span className="text-[13px]">{row.title}</span>,
    },
    {
      key: "category",
      header: "Category",
      accessor: (row) => <StatusChip status={row.category} />,
    },
    {
      key: "severity",
      header: "Severity",
      accessor: (row) => <StatusChip status={row.severity} />,
    },
    {
      key: "active",
      header: "Active",
      accessor: (row) => (
        <button
          type="button"
          role="switch"
          aria-checked={row.activeFlag}
          aria-label={`${row.activeFlag ? "Deactivate" : "Activate"} ${row.ruleCode}`}
          onClick={() => toggleActive(row)}
          disabled={pendingToggleId === row.id}
          className={cn(
            "focus-ring inline-flex h-5 w-9 items-center rounded-full border px-0.5 transition-colors",
            row.activeFlag
              ? "justify-end border-pass bg-pass"
              : "justify-start border-border bg-surface-2",
            pendingToggleId === row.id && "opacity-60",
          )}
        >
          <span
            className={cn(
              "size-3.5 rounded-full transition-colors",
              row.activeFlag ? "bg-white" : "bg-ink-3",
            )}
            aria-hidden
          />
        </button>
      ),
    },
    {
      key: "version",
      header: "V",
      align: "right",
      accessor: (row) => <Badge variant="outline">v{row.version}</Badge>,
    },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Validations</h1>
          <p className="mt-0.5 text-[13px] text-ink-2">
            Deterministic compliance checks — runs and the rule library.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Can perm="validation:run">
            {tab === "runs" ? (
              <Button
                size="sm"
                onClick={() => triggerMutation.mutate()}
                disabled={triggerMutation.isPending}
              >
                <Play className="size-3.5" aria-hidden />
                {triggerMutation.isPending ? "Queuing…" : "Run validation"}
              </Button>
            ) : (
              <Button size="sm" onClick={() => setRuleDrawer({ mode: "create" })}>
                <Plus className="size-3.5" aria-hidden />
                New rule
              </Button>
            )}
          </Can>
        </div>
      </header>

      <Segmented
        name="Validations view"
        value={tab}
        onChange={setTab}
        className="max-w-xs"
        options={[
          { value: "runs", label: "Runs" },
          { value: "rules", label: "Rules" },
        ]}
      />

      {tab === "runs" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter runs by status">
            <button
              type="button"
              onClick={() => setRunStatus("ALL")}
              aria-pressed={runStatus === "ALL"}
              className={`focus-ring rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors ${
                runStatus === "ALL"
                  ? "border-border-strong bg-surface-2 text-ink"
                  : "border-border bg-surface text-ink-2 hover:text-ink"
              }`}
            >
              All
            </button>
            {RUN_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setRunStatus(status)}
                aria-pressed={runStatus === status}
                className={`focus-ring rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors ${
                  runStatus === status
                    ? "border-border-strong bg-surface-2 text-ink"
                    : "border-border bg-surface text-ink-2 hover:text-ink"
                }`}
              >
                {humanizeStatus(status)}
              </button>
            ))}
          </div>

          {runsQuery.isError ? (
            <ErrorState
              message={
                runsQuery.error instanceof ApiError
                  ? runsQuery.error.message
                  : "Could not load runs"
              }
              retry={() => void runsQuery.refetch()}
            />
          ) : (
            <DataTable
              columns={runColumns}
              rows={runsQuery.data ?? []}
              rowKey={(row) => row.id}
              loading={runsQuery.isPending}
              defaultPageSize={10}
              emptyTitle="No validation runs yet"
              emptyBody="Run the full check suite against your programme."
              emptyAction={
                <Can perm="validation:run">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => triggerMutation.mutate()}
                    disabled={triggerMutation.isPending}
                  >
                    <Play className="size-3.5" aria-hidden />
                    Run validation
                  </Button>
                </Can>
              }
              onRowClick={(row) => setSelectedRunId(row.id)}
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              aria-label="Filter rules by category"
              value={ruleCategory}
              onChange={(event) => setRuleCategory(event.target.value)}
              className="w-48"
            >
              <option value="ALL">All categories</option>
              {RULE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {humanizeStatus(category)}
                </option>
              ))}
            </Select>
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-ink-2">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(event) => setActiveOnly(event.target.checked)}
                className="accent-accent"
              />
              Active only
            </label>
            {toggleError ? (
              <p role="alert" className="text-xs text-fail">
                {toggleError}
              </p>
            ) : null}
          </div>

          {rulesQuery.isError ? (
            <ErrorState
              message={
                rulesQuery.error instanceof ApiError
                  ? rulesQuery.error.message
                  : "Could not load rules"
              }
              retry={() => void rulesQuery.refetch()}
            />
          ) : rulesQuery.data && rulesQuery.data.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="No rules in the library"
              body="Create a validation rule to start building the check suite."
              action={
                <Can perm="validation:run">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setRuleDrawer({ mode: "create" })}
                  >
                    New rule
                  </Button>
                </Can>
              }
            />
          ) : (
            <DataTable
              columns={ruleColumns}
              rows={rulesQuery.data ?? []}
              rowKey={(row) => row.id}
              loading={rulesQuery.isPending}
              defaultPageSize={10}
              onRowClick={(row) => setRuleDrawer({ mode: "edit", rule: row })}
            />
          )}
        </div>
      )}

      <RunDetailDrawer
        open={selectedRunId !== null}
        onClose={() => setSelectedRunId(null)}
        runId={selectedRunId}
      />
      <RuleFormDrawer
        key={ruleDrawer?.mode === "edit" ? ruleDrawer.rule.id : "create"}
        open={ruleDrawer !== null}
        onClose={() => setRuleDrawer(null)}
        rule={ruleDrawer?.mode === "edit" ? ruleDrawer.rule : null}
      />
    </div>
  );
}
