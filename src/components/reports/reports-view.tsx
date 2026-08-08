"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, Download, FileBarChart2, FileDown, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { reportsApi } from "@/features/reports/api";
import {
  REPORT_FORMATS,
  REPORT_STATUSES,
  REPORT_STATUS_LABELS,
  REPORT_TYPE_DESCRIPTIONS,
  REPORT_TYPE_LABELS,
  REPORT_TYPES,
  type ReportFormat,
  type ReportRecord,
  type ReportStatus,
  type ReportType,
} from "@/features/reports/types";
import {
  generateReportSchema,
  toGeneratePayload,
  type GenerateReportFormValues,
} from "@/features/reports/schemas";
import {
  useCancelReport,
  useGenerateReport,
  useReports,
} from "@/features/reports/hooks";

type StatusFilter = "ALL" | ReportStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  ...REPORT_STATUSES.map((status) => ({
    value: status as StatusFilter,
    label: REPORT_STATUS_LABELS[status],
  })),
];

const PAGE_SIZE = 10;

export function ReportsView() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<ReportType | "">("");
  const [page, setPage] = useState(1);
  const [generating, setGenerating] = useState<ReportType | null>(null);
  const [cancelling, setCancelling] = useState<ReportRecord | null>(null);

  const list = useReports(
    {
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      ...(typeFilter ? { reportType: typeFilter } : {}),
      page,
      pageSize: PAGE_SIZE,
    },
    true,
  );

  const columns: TableColumn<ReportRecord>[] = [
    {
      key: "title",
      header: "Report",
      accessor: (row) => (
        <span className="flex max-w-[280px] flex-col">
          <span className="truncate text-[13px] font-medium text-ink">
            {row.title}
          </span>
          <span className="truncate text-[11px] text-ink-3">
            {REPORT_TYPE_LABELS[row.reportType as ReportType] ?? row.reportType}
          </span>
          {row.status === "FAILED" && row.errorMessage ? (
            <span
              title={row.errorMessage}
              className="truncate text-[11px] text-fail"
            >
              {row.errorMessage}
            </span>
          ) : null}
        </span>
      ),
      sortValue: (row) => row.title,
      sortable: true,
    },
    {
      key: "type",
      header: "Type",
      accessor: (row) => (
        <Badge variant="accent">
          {REPORT_TYPE_LABELS[row.reportType as ReportType] ?? row.reportType}
        </Badge>
      ),
      sortValue: (row) => row.reportType,
      sortable: true,
      className: "hidden xl:table-cell",
    },
    {
      key: "format",
      header: "Format",
      accessor: (row) => <Badge variant="outline">{row.format}</Badge>,
      sortValue: (row) => row.format,
      sortable: true,
      className: "hidden lg:table-cell",
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => <StatusChip status={row.status} />,
      sortValue: (row) => row.status,
      sortable: true,
    },
    {
      key: "requested",
      header: "Requested",
      accessor: (row) => (
        <span className="tabular text-xs text-ink-2">{formatDate(row.createdAt)}</span>
      ),
      sortValue: (row) => row.createdAt,
      sortable: true,
      className: "hidden md:table-cell",
    },
    {
      key: "completed",
      header: "Completed",
      accessor: (row) => (
        <span className="tabular text-xs text-ink-2">
          {row.completedAt ? formatDate(row.completedAt) : "—"}
        </span>
      ),
      sortValue: (row) => row.completedAt ?? "",
      sortable: true,
      className: "hidden lg:table-cell",
    },
  ];

  const rowActions = (row: ReportRecord) => {
    if (row.status === "COMPLETED") {
      return (
        <Can perm="report:read">
          <DownloadReportButton row={row} />
        </Can>
      );
    }      if (row.status === "FAILED") {
        return (
          <Can perm="report:generate">
            <button
              type="button"
              onClick={() => setGenerating(row.reportType as ReportType)}
              className="focus-ring flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-xs font-medium text-ink-2 opacity-0 transition-opacity hover:border-accent/40 hover:text-accent group-hover:opacity-100"
              title="Generate again with the same type"
            >
              <RefreshCw className="size-3" aria-hidden />
              Retry
            </button>
          </Can>
        );
      }
    if (row.status === "PENDING" || row.status === "GENERATING") {
      return (
        <Can perm="report:generate">
          <button
            type="button"
            onClick={() => setCancelling(row)}
            className="focus-ring flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-xs font-medium text-ink-2 opacity-0 transition-opacity hover:border-warn/40 hover:text-warn group-hover:opacity-100"
          >
            <Ban className="size-3" aria-hidden />
            Cancel
          </button>
        </Can>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="micro-label">Proof · Reports</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Reports
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            {list.isLoading
              ? "Loading…"
              : `${list.data?.meta.total ?? 0} reports generated`}
          </p>
        </div>
        <Can perm="report:generate">
          <Button onClick={() => setGenerating("BOARD_PACK")}>
            <FileDown className="size-3.5" aria-hidden />
            Generate report
          </Button>
        </Can>
      </header>

      {/* Filters -------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter by report status"
        >
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={statusFilter === item.value}
              onClick={() => {
                setStatusFilter(item.value);
                setPage(1);
              }}
              className={cn(
                "focus-ring rounded-sm border px-2.5 py-1 text-[13px] font-medium transition-colors",
                statusFilter === item.value
                  ? "border-accent/40 bg-accent-soft text-accent"
                  : "border-border bg-surface text-ink-2 hover:border-border-strong hover:text-ink",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="w-48">
          <Select
            aria-label="Filter by report type"
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value as ReportType | "");
              setPage(1);
            }}
          >
            <option value="">All types</option>
            {REPORT_TYPES.map((type) => (
              <option key={type} value={type}>
                {REPORT_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {list.isError ? (
        <ErrorState
          title="Couldn't load reports"
          message={list.error instanceof ApiError ? list.error.message : undefined}
          retry={() => void list.refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={list.data?.items ?? []}
          rowKey={(row) => row.id}
          loading={list.isLoading}
          pagination={{
            page: list.data?.meta.page ?? page,
            pageSize: PAGE_SIZE,
            total: list.data?.meta.total ?? 0,
            totalPages: list.data?.meta.totalPages ?? 1,
            onPageChange: setPage,
          }}
          rowActions={rowActions}
          emptyTitle="No reports yet"
          emptyBody="Generate the first board pack or compliance summary and it will land here."
          emptyAction={
            <Can perm="report:generate">
              <Button size="sm" onClick={() => setGenerating("BOARD_PACK")}>
                <FileBarChart2 className="size-3.5" aria-hidden />
                Generate report
              </Button>
            </Can>
          }
        />
      )}

      {/* Keyed by preset so the form remounts (and re-defaults) per open. */}
      <GenerateReportDialog
        key={generating ?? "generate"}
        presetType={generating}
        onClose={() => setGenerating(null)}
      />
      <CancelReportDialog
        record={cancelling}
        onClose={() => setCancelling(null)}
      />
    </div>
  );
}

/* Download ------------------------------------------------------------------- */

function DownloadReportButton({ row }: { row: ReportRecord }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  return (
    <button
      type="button"
      disabled={state === "loading"}
      onClick={async () => {
        setState("loading");
        try {
          const { downloadUrl } = await reportsApi.download(row.id);
          window.open(downloadUrl, "_blank", "noopener,noreferrer");
          setState("idle");
        } catch {
          setState("error");
        }
      }}
      className="focus-ring flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-xs font-medium text-ink-2 opacity-0 transition-opacity hover:border-pass/40 hover:text-pass group-hover:opacity-100 disabled:opacity-50"
    >
      {state === "loading" ? (
        <RefreshCw className="size-3 animate-spin" aria-hidden />
      ) : (
        <Download className="size-3" aria-hidden />
      )}
      {state === "error" ? "Failed" : "Download"}
    </button>
  );
}

/* Generate modal -------------------------------------------------------------- */

function GenerateReportDialog({
  presetType,
  onClose,
}: {
  presetType: ReportType | null;
  onClose: () => void;
}) {
  const generate = useGenerateReport();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<GenerateReportFormValues>({
    resolver: zodResolver(generateReportSchema),
    defaultValues: {
      reportType: presetType ?? "BOARD_PACK",
      title: "",
      format: "CSV",
      dateFrom: "",
      dateTo: "",
    },
  });

  const open = presetType !== null;

  const reportType = useWatch({ control, name: "reportType" });

  const submit = handleSubmit(async (values) => {
    await generate.mutateAsync(toGeneratePayload(values));
    reset();
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Generate report"
      description="Queued server-side, generated by the worker, then downloadable."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={generate.isPending}>
            {generate.isPending ? "Queuing…" : "Generate report"}
          </Button>
        </>
      }
    >
      <form id="generate-report-form" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Report type" htmlFor="gr-type" hint={REPORT_TYPE_DESCRIPTIONS[reportType]}>
          <Controller
            control={control}
            name="reportType"
            render={({ field }) => (
              <Select
                id="gr-type"
                value={field.value}
                onChange={(event) => field.onChange(event.target.value as ReportType)}
                aria-label="Report type"
              >
                {REPORT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {REPORT_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            )}
          />
        </Field>

        <Field
          label="Title"
          htmlFor="gr-title"
          hint="Defaults to the report type if left blank."
          error={errors.title?.message}
        >
          <Input
            id="gr-title"
            placeholder="Board pack — Q3 2026"
            {...register("title")}
          />
        </Field>

        <Field label="Format" htmlFor="gr-format">
          <Controller
            control={control}
            name="format"
            render={({ field }) => (
              <Segmented<ReportFormat>
                name="Format"
                options={REPORT_FORMATS.map((format) => ({ value: format, label: format }))}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From" htmlFor="gr-from" hint="Optional date range">
            <Input id="gr-from" type="date" {...register("dateFrom")} />
          </Field>
          <Field label="To" htmlFor="gr-to" error={errors.dateTo?.message}>
            <Input id="gr-to" type="date" {...register("dateTo")} />
          </Field>
        </div>

        {generate.isError ? (
          <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
            {generate.error instanceof ApiError
              ? generate.error.message
              : "Could not queue the report."}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

/* Cancel confirm -------------------------------------------------------------- */

function CancelReportDialog({
  record,
  onClose,
}: {
  record: ReportRecord | null;
  onClose: () => void;
}) {
  const cancel = useCancelReport();
  if (!record) return null;

  return (
    <Dialog
      open={!!record}
      onClose={onClose}
      title="Cancel this report?"
      description="The queued job will be removed — it won't complete."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Keep it
          </Button>
          <Button
            variant="danger"
            disabled={cancel.isPending}
            onClick={() =>
              void cancel.mutateAsync(record.id).then(onClose)
            }
          >
            {cancel.isPending ? "Cancelling…" : "Cancel report"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[13px] leading-relaxed text-ink-2">
          <span className="font-medium text-ink">{record.title}</span> is currently{" "}
          <span className="font-medium text-ink">
            {record.status === "GENERATING" ? "generating" : "queued"}
          </span>
          . Cancelling is immediate and can&apos;t be undone.
        </p>
        {cancel.isError ? (
          <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
            {cancel.error instanceof ApiError ? cancel.error.message : "Cancel failed."}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
