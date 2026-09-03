"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils/format";
import type { ConsentRecordResponse } from "@/features/consent/types";
import {
  useConsentRecords,
  useCreateConsentRecord,
  useWithdrawConsent,
} from "@/features/consent/hooks";
import {
  cleanOptional,
  consentRecordFormSchema,
  parsePurposes,
  type ConsentRecordFormValues,
} from "@/features/consent/schemas";
import { useEvidenceList } from "@/features/evidence/hooks";
import { useNotices } from "@/features/notices/hooks";
import { useDataAssets } from "@/features/dataAssets/hooks";
import { cn } from "@/lib/utils/cn";

type StateFilter = "ALL" | "GRANTED" | "WITHDRAWN";

const FILTERS: { value: StateFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "GRANTED", label: "Granted" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

const PAGE_SIZE = 10;

export function ConsentView() {
  const records = useConsentRecords({});
  const notices = useNotices();
  const assets = useDataAssets();
  const [filter, setFilter] = useState<StateFilter>("ALL");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [withdrawing, setWithdrawing] = useState<ConsentRecordResponse | null>(null);

  const noticeById = useMemo(
    () => new Map((notices.data ?? []).map((notice) => [notice.id, notice])),
    [notices.data],
  );
  const assetById = useMemo(
    () => new Map((assets.data ?? []).map((asset) => [asset.id, asset])),
    [assets.data],
  );

  const rows = useMemo(() => {
    const all = records.data ?? [];
    return all.filter((record) => {
      if (filter !== "ALL" && record.consentState !== filter) return false;
      if (
        search &&
        !record.dataSubjectIdentifier.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [records.data, filter, search]);

  const columns: TableColumn<ConsentRecordResponse>[] = [
    {
      key: "subject",
      header: "Data subject",
      accessor: (row) => (
        <span className="block max-w-[220px]">
          <span className="block truncate font-mono text-xs font-medium text-accent">
            {row.dataSubjectIdentifier}
          </span>
        </span>
      ),
      sortValue: (row) => row.dataSubjectIdentifier,
      sortable: true,
    },
    {
      key: "purpose",
      header: "Purpose",
      accessor: (row) => {
        const labels =
          row.purposes?.length > 0 ? row.purposes : row.purpose ? [row.purpose] : [];
        return (
          <span className="block max-w-md truncate text-[13px] font-medium text-ink">
            {labels.join(", ") || "—"}
          </span>
        );
      },
      sortValue: (row) =>
        (row.purposes?.length ? row.purposes : [row.purpose]).join(", "),
      sortable: true,
    },
    {
      key: "notice",
      header: "Notice",
      accessor: (row) => {
        const notice = row.noticeId ? noticeById.get(row.noticeId) : undefined;
        return (
          <span className="flex flex-col">
            <span className="max-w-[200px] truncate text-[13px] text-ink-2">
              {notice?.title ?? "—"}
            </span>
            {notice ? (
              <span className="font-mono text-[11px] text-ink-3">v{notice.version}</span>
            ) : null}
          </span>
        );
      },
      sortValue: (row) => noticeById.get(row.noticeId ?? "")?.title ?? "",
      sortable: true,
      className: "hidden lg:table-cell",
    },
    {
      key: "asset",
      header: "Asset",
      accessor: (row) => (
        <span className="font-mono text-xs text-ink-2">
          {row.dataAssetId ? (assetById.get(row.dataAssetId)?.assetName ?? row.dataAssetId.slice(0, 8)) : "—"}
        </span>
      ),
      sortValue: (row) => assetById.get(row.dataAssetId ?? "")?.assetName ?? "",
      sortable: true,
      className: "hidden xl:table-cell",
    },
    {
      key: "state",
      header: "State",
      accessor: (row) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-xs font-medium",
            row.consentState === "WITHDRAWN"
              ? "border-warn/20 bg-warn-bg text-warn"
              : "border-neutral/20 bg-neutral-bg text-neutral",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              row.consentState === "WITHDRAWN" ? "bg-warn" : "bg-neutral",
            )}
          />
          {row.consentState === "WITHDRAWN" ? "Withdrawn" : "Granted"}
        </span>
      ),
      sortValue: (row) => row.consentState,
      sortable: true,
    },
    {
      key: "grantedAt",
      header: "Granted",
      accessor: (row) => (
        <span className="tabular text-xs text-ink-2">
          {row.grantedAt ? formatDate(row.grantedAt) : "—"}
        </span>
      ),
      sortValue: (row) => row.grantedAt,
      sortable: true,
      className: "hidden md:table-cell",
    },
    {
      key: "withdrawnAt",
      header: "Withdrawn",
      accessor: (row) =>
        row.withdrawnAt ? (
          <span className="tabular text-xs text-warn">
            Withdrawn · {formatDate(row.withdrawnAt)}
          </span>
        ) : (
          <span className="text-xs text-ink-3">—</span>
        ),
      sortValue: (row) => row.withdrawnAt ?? "",
      sortable: true,
      className: "hidden md:table-cell",
    },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="micro-label">Operations · Transparency</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Consent
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            {records.isLoading
              ? "Loading…"
              : `${records.data?.length ?? 0} consent records`}
          </p>
        </div>
        <Can perm="consent:create">
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-3.5" aria-hidden />
            New consent record
          </Button>
        </Can>
      </header>

      {/* Filters -------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter by consent state"
        >
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={cn(
                "focus-ring rounded-sm border px-2.5 py-1 text-[13px] font-medium transition-colors",
                filter === item.value
                  ? "border-accent/40 bg-accent-soft text-accent"
                  : "border-border bg-surface text-ink-2 hover:border-border-strong hover:text-ink",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Search data subjects"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search data subjects…"
            className="pl-8"
          />
        </div>
      </div>

      {records.isError ? (
        <ErrorState
          title="Couldn't load consent records"
          message={records.error instanceof ApiError ? records.error.message : undefined}
          retry={() => void records.refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          loading={records.isLoading || notices.isLoading}
          defaultPageSize={PAGE_SIZE}
          rowClassName={(row) =>
            row.consentState === "WITHDRAWN" ? "opacity-60" : undefined
          }
          emptyTitle={
            filter !== "ALL" || search
              ? "No matching consent records"
              : "No consent records yet"
          }
          emptyBody={
            filter !== "ALL" || search
              ? "Try a different filter or search term."
              : "Record the first grant — identifier, purpose and the notice it falls under."
          }
          emptyAction={
            filter === "ALL" && !search ? (
              <Can perm="consent:create">
                <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
                  <Plus className="size-3.5" aria-hidden />
                  New consent record
                </Button>
              </Can>
            ) : undefined
          }
          rowActions={(row) =>
            row.consentState === "GRANTED" ? (
              <Can perm="consent:withdraw">
                <button
                  type="button"
                  onClick={() => setWithdrawing(row)}
                  className="focus-ring flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-xs font-medium text-ink-2 opacity-0 transition-opacity hover:border-warn/40 hover:text-warn group-hover:opacity-100"
                >
                  <Undo2 className="size-3" aria-hidden />
                  Withdraw
                </button>
              </Can>
            ) : null
          }
        />
      )}

      <CreateConsentRecordDrawer open={creating} onClose={() => setCreating(false)} />
      <WithdrawConsentDialog record={withdrawing} onClose={() => setWithdrawing(null)} />
    </div>
  );
}

/* Create drawer --------------------------------------------------------------- */

function CreateConsentRecordDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const create = useCreateConsentRecord();
  const notices = useNotices();
  const assets = useDataAssets();
  const evidence = useEvidenceList({ pageSize: 50 }, open);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ConsentRecordFormValues>({
    resolver: zodResolver(consentRecordFormSchema),
    defaultValues: {
      dataSubjectIdentifier: "",
      noticeId: "",
      dataAssetId: "",
      purposes: "",
      grantedAt: toDateTimeLocal(new Date()),
      expiresAt: "",
      proofFileId: "",
    },
  });
  const purposesValue =
    (useWatch({ control, name: "purposes" }) as string | undefined) ?? "";
  const purposeChips = parsePurposes(purposesValue);

  const submit = handleSubmit(async (values) => {
    const purposes = parsePurposes(values.purposes);
    await create.mutateAsync({
      dataSubjectIdentifier: values.dataSubjectIdentifier,
      noticeId: cleanOptional(values.noticeId),
      dataAssetId: cleanOptional(values.dataAssetId),
      purpose: purposes[0]!,
      purposes,
      grantedAt: values.grantedAt
        ? new Date(values.grantedAt).toISOString()
        : undefined,
      expiresAt: values.expiresAt
        ? new Date(`${values.expiresAt}T23:59:59`).toISOString()
        : undefined,
      proofFileId: cleanOptional(values.proofFileId),
    });
    onClose();
  });

  const evidenceItems = evidence.data?.items ?? [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New consent record"
      description="A verifiable grant — identifier, purpose and the notice it falls under."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create record"}
          </Button>
        </>
      }
    >
      <form id="create-consent-form" onSubmit={submit} noValidate className="space-y-4">
        <Field
          label="Data subject identifier"
          htmlFor="c-subject"
          error={errors.dataSubjectIdentifier?.message}
          hint="e.g. email, customer ID, or reference"
        >
          <Input
            id="c-subject"
            placeholder="user@example.com"
            {...register("dataSubjectIdentifier")}
          />
        </Field>

        <Field
          label="Purposes"
          htmlFor="c-purpose"
          error={errors.purposes?.message}
          hint="Comma-separated; first purpose is primary"
        >
          <Input
            id="c-purpose"
            placeholder="Marketing emails, Analytics"
            {...register("purposes")}
          />
          {purposeChips.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5" aria-live="polite">
              {purposeChips.map((purpose) => (
                <span
                  key={purpose}
                  className="inline-flex max-w-full truncate rounded-sm border border-accent/30 bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent"
                >
                  {purpose}
                </span>
              ))}
            </div>
          ) : null}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Notice" htmlFor="c-notice">
            <Controller
              control={control}
              name="noticeId"
              render={({ field }) => (
                <Select
                  id="c-notice"
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value || undefined)}
                  aria-label="Notice"
                >
                  <option value="">No notice</option>
                  {notices.data?.map((notice) => (
                    <option key={notice.id} value={notice.id}>
                      {notice.title} · v{notice.version}
                    </option>
                  ))}
                </Select>
              )}
            />
          </Field>
          <Field label="Data asset" htmlFor="c-asset">
            <Controller
              control={control}
              name="dataAssetId"
              render={({ field }) => (
                <Select
                  id="c-asset"
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value || undefined)}
                  aria-label="Data asset"
                >
                  <option value="">No asset</option>
                  {assets.data?.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.assetName}
                    </option>
                  ))}
                </Select>
              )}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Granted at" htmlFor="c-granted" hint="Defaults to now.">
            <Input id="c-granted" type="datetime-local" {...register("grantedAt")} />
          </Field>
          <Field label="Expires at" htmlFor="c-expires" hint="Optional consent expiry date">
            <Input id="c-expires" type="date" {...register("expiresAt")} />
          </Field>
        </div>

        <Field
          label="Evidence file ID (proof)"
          htmlFor="c-proof"
          error={errors.proofFileId?.message}
          hint="Optional proof from the evidence vault"
        >
          {evidenceItems.length > 0 ? (
            <Controller
              control={control}
              name="proofFileId"
              render={({ field }) => (
                <Select
                  id="c-proof"
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value || "")}
                  aria-label="Evidence file ID (proof)"
                >
                  <option value="">No proof file</option>
                  {evidenceItems.map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.fileName}
                    </option>
                  ))}
                </Select>
              )}
            />
          ) : (
            <Input
              id="c-proof"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              {...register("proofFileId")}
            />
          )}
        </Field>

        {create.isError ? (
          <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
            {create.error instanceof ApiError ? create.error.message : "Create failed."}
          </p>
        ) : null}
      </form>
    </Drawer>
  );
}

/* Withdraw confirm -------------------------------------------------------------- */

function WithdrawConsentDialog({
  record,
  onClose,
}: {
  record: ConsentRecordResponse | null;
  onClose: () => void;
}) {
  const withdraw = useWithdrawConsent();

  const submit = async () => {
    if (!record) return;
    await withdraw.mutateAsync(record.id);
    onClose();
  };

  return (
    <Dialog
      open={!!record}
      onClose={onClose}
      title="Withdraw consent?"
      description="This action can't be undone from this screen."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={withdraw.isPending}
            variant="danger"
          >
            {withdraw.isPending ? "Withdrawing…" : "Withdraw consent"}
          </Button>
        </>
      }
    >
      {record ? (
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-ink-2">
            Consent for <span className="font-medium text-ink">{record.purpose}</span>{" "}
            by{" "}
            <span className="font-mono text-[13px] text-ink">
              {record.dataSubjectIdentifier}
            </span>{" "}
            will be withdrawn.
          </p>
          <p className="flex items-start gap-2 rounded-sm border border-warn/20 bg-warn-bg/40 px-3 py-2 text-xs leading-relaxed text-ink-2">
            <Undo2 className="mt-0.5 size-3.5 shrink-0 text-warn" aria-hidden />
            The record is <span className="font-medium text-ink">not deleted</span> —
            the withdrawal is timestamped and kept, so you can evidence that
            processing ceased promptly after the choice was made (DPDP Act
            s.6(4)).
          </p>
          {withdraw.isError ? (
            <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
              {withdraw.error instanceof ApiError ? withdraw.error.message : "Withdraw failed."}
            </p>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}

/** datetime-local value ("YYYY-MM-DDTHH:mm") for a Date. */
function toDateTimeLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
