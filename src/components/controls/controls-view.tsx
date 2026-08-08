"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { ApiError } from "@/lib/api/errors";
import { humanizeStatus } from "@/lib/constants/status-maps";
import {
  CONTROL_STATUSES,
  type ControlResponse,
  type ControlStatus,
} from "@/features/controls/types";
import { useControls, useCreateControl, useUpdateControl } from "@/features/controls/hooks";
import {
  cleanOptional,
  createControlFormSchema,
  toDateInputValue,
  updateControlFormSchema,
  type CreateControlFormValues,
  type UpdateControlFormValues,
} from "@/features/controls/schemas";
import { useFrameworkRoadmap } from "@/features/framework/hooks";
import { useUsers } from "@/features/users/hooks";
import { dueState, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type StatusFilter = ControlStatus | "ALL";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  ...CONTROL_STATUSES.map((status) => ({
    value: status as StatusFilter,
    label: humanizeStatus(status),
  })),
];

const PAGE_SIZE = 20;

export function ControlsView() {
  const framework = useFrameworkRoadmap();
  const frameworkId = framework.data?.id;
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ControlResponse | null>(null);

  const controls = useControls(
    {
      ...(frameworkId ? { frameworkId } : {}),
      ...(status !== "ALL" ? { status } : {}),
      page,
      pageSize: PAGE_SIZE,
    },
    !framework.isLoading,
  );

  const setFilter = (next: StatusFilter) => {
    setStatus(next);
    setPage(1);
  };

  const columns: TableColumn<ControlResponse>[] = [
    {
      key: "code",
      header: "Code",
      accessor: (row) => (
        <span className="font-mono text-xs font-medium text-accent">{row.code}</span>
      ),
      sortValue: (row) => row.code,
      sortable: true,
    },
    {
      key: "title",
      header: "Title",
      accessor: (row) => (
        <span className="block max-w-md">
          <span className="block truncate text-[13px] font-medium text-ink">
            {row.title}
          </span>
          {row.description ? (
            <span className="block truncate text-xs text-ink-3">
              {row.description}
            </span>
          ) : null}
        </span>
      ),
      sortValue: (row) => row.title,
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => <StatusChip status={row.status} />,
      sortValue: (row) => row.status,
      sortable: true,
    },
    {
      key: "owner",
      header: "Owner",
      accessor: (row) => <OwnerName ownerUserId={row.ownerUserId} />,
    },
    {
      key: "due",
      header: "Due",
      accessor: (row) => {
        const due = dueState(row.dueAt);
        return (
          <span className="flex flex-col">
            <span className="tabular text-[13px] text-ink">
              {formatDate(row.dueAt)}
            </span>
            <span
              className={cn(
                "text-xs",
                due.tone === "overdue"
                  ? "text-fail"
                  : due.tone === "due-soon"
                    ? "text-warn"
                    : "text-ink-3",
              )}
            >
              {due.label}
            </span>
          </span>
        );
      },
      sortValue: (row) => row.dueAt ?? "",
      sortable: true,
      className: "hidden md:table-cell",
    },
    {
      key: "legalBasis",
      header: "Legal basis",
      accessor: (row) => (
        <span className="font-mono text-xs text-ink-2">
          {row.legalBasisRef ?? "—"}
        </span>
      ),
      className: "hidden xl:table-cell",
    },
  ];

  const noFramework = !framework.isLoading && !frameworkId;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="micro-label">Programme · Controls</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Controls
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            {controls.isLoading
              ? "Loading…"
              : `${controls.data?.meta.total ?? 0} total · page ${controls.data?.meta.page ?? 1} of ${controls.data?.meta.totalPages ?? 1}`}
          </p>
        </div>
        <Can perm="control:create">
          <Button
            onClick={() => setCreating(true)}
            disabled={noFramework}
            title={
              noFramework ? "Generate a framework before adding controls" : undefined
            }
          >
            <Plus className="size-3.5" aria-hidden />
            New control
          </Button>
        </Can>
      </header>

      {/* Status filter chips ------------------------------------------------- */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            aria-pressed={status === filter.value}
            onClick={() => setFilter(filter.value)}
            className={cn(
              "focus-ring rounded-sm border px-2.5 py-1 text-[13px] font-medium transition-colors",
              status === filter.value
                ? "border-accent/40 bg-accent-soft text-accent"
                : "border-border bg-surface text-ink-2 hover:border-border-strong hover:text-ink",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {controls.isError ? (
        <ErrorState
          title="Couldn't load controls"
          message={controls.error instanceof ApiError ? controls.error.message : undefined}
          retry={() => void controls.refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={controls.data?.items ?? []}
          rowKey={(row) => row.id}
          loading={controls.isLoading || framework.isLoading}
          pagination={
            controls.data
              ? {
                  page: controls.data.meta.page,
                  pageSize: controls.data.meta.pageSize,
                  total: controls.data.meta.total,
                  totalPages: controls.data.meta.totalPages,
                  onPageChange: setPage,
                }
              : undefined
          }
          emptyTitle={noFramework ? "Generate your framework first" : "No controls yet"}
          emptyBody={
            noFramework
              ? "Controls are generated with the framework and can then be customised here."
              : "Create the first control manually, or regenerate the framework from your profile."
          }
          emptyAction={
            <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-3.5" aria-hidden />
              New control
            </Button>
          }
          rowActions={(row) => (
            <button
              type="button"
              onClick={() => setEditing(row)}
              className="focus-ring rounded-sm p-1 text-ink-3 opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
              aria-label={`Edit ${row.code}`}
            >
              <Pencil className="size-3.5" aria-hidden />
            </button>
          )}
        />
      )}

      <CreateControlDialog
        open={creating}
        onClose={() => setCreating(false)}
        frameworkId={frameworkId}
      />

      <EditControlDrawer
        control={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

/* Owner --------------------------------------------------------------------- */

function OwnerName({ ownerUserId }: { ownerUserId: string | null }) {
  const users = useUsers();
  const user = users.data?.items.find((u) => u.id === ownerUserId);
  if (!ownerUserId) return <span className="text-xs text-ink-3">Unassigned</span>;
  if (!user) return <span className="font-mono text-xs text-ink-2">{ownerUserId.slice(0, 8)}</span>;
  return <span className="text-[13px] text-ink">{user.name}</span>;
}

function OwnerSelect({
  value,
  onChange,
  invalid,
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  invalid?: boolean;
}) {
  const users = useUsers();
  return (
    <Select
      value={value ?? ""}
      invalid={invalid}
      onChange={(event) => onChange(event.target.value || undefined)}
      aria-label="Owner"
    >
      <option value="">Unassigned</option>
      {users.data?.items.map((user) => (
        <option key={user.id} value={user.id}>
          {user.name} · {user.email}
        </option>
      ))}
    </Select>
  );
}

/* Create dialog -------------------------------------------------------------- */

function CreateControlDialog({
  open,
  onClose,
  frameworkId,
}: {
  open: boolean;
  onClose: () => void;
  frameworkId?: string;
}) {
  const create = useCreateControl();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateControlFormValues>({
    resolver: zodResolver(createControlFormSchema),
    defaultValues: { status: "NOT_STARTED" },
  });

  const submit = handleSubmit(async (values) => {
    if (!frameworkId) return;
    await create.mutateAsync({
      frameworkId,
      code: values.code,
      title: values.title,
      description: cleanOptional(values.description),
      ownerUserId: cleanOptional(values.ownerUserId),
      dueAt: values.dueAt ? new Date(`${values.dueAt}T00:00:00`).toISOString() : undefined,
      legalBasisRef: cleanOptional(values.legalBasisRef),
      status: values.status,
    });
    reset();
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New control"
      description="A control is a measurable safeguard mapped to one or more legal obligations."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create control"}
          </Button>
        </>
      }
    >
      <form id="create-control-form" onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" htmlFor="cc-code" error={errors.code?.message} hint="Auto-uppercased, e.g. CTRL-CUSTOM">
            <Input id="cc-code" placeholder="CTRL-CUSTOM" {...register("code")} />
          </Field>
          <Field label="Status" htmlFor="cc-status">
            <Select id="cc-status" {...register("status")}>
              {CONTROL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {humanizeStatus(status)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Title" htmlFor="cc-title" error={errors.title?.message}>
          <Input id="cc-title" placeholder="e.g. Access review for HR records" {...register("title")} />
        </Field>

        <Field label="Description" htmlFor="cc-desc" error={errors.description?.message}>
          <textarea
            id="cc-desc"
            rows={3}
            className="w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-[13px] text-ink outline-none transition-colors focus-ring placeholder:text-ink-3 hover:border-border-strong"
            placeholder="What this control requires in practice…"
            {...register("description")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Owner" htmlFor="cc-owner">
            <Controller
              control={control}
              name="ownerUserId"
              render={({ field }) => (
                <OwnerSelect value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
          </Field>
          <Field label="Due date" htmlFor="cc-due" hint="Optional target date.">
            <Input id="cc-due" type="date" {...register("dueAt")} />
          </Field>
        </div>

        <Field label="Legal basis" htmlFor="cc-legal" error={errors.legalBasisRef?.message} hint="e.g. DPDP Act 2023 s.8(5)">
          <Input id="cc-legal" placeholder="Reference (optional)" {...register("legalBasisRef")} />
        </Field>

        {create.isError ? (
          <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
            {create.error instanceof ApiError ? create.error.message : "Create failed."}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

/* Edit drawer ---------------------------------------------------------------- */

function EditControlDrawer({
  control,
  onClose,
}: {
  control: ControlResponse | null;
  onClose: () => void;
}) {
  const update = useUpdateControl();
  const {
    register,
    handleSubmit,
    control: formControl,
    formState: { errors },
  } = useForm<UpdateControlFormValues>({
    resolver: zodResolver(updateControlFormSchema),
    values: control
      ? {
          title: control.title,
          description: control.description ?? "",
          ownerUserId: control.ownerUserId ?? "",
          dueAt: toDateInputValue(control.dueAt),
          legalBasisRef: control.legalBasisRef ?? "",
          status: (control.status as ControlStatus) ?? "NOT_STARTED",
        }
      : undefined,
  });

  const submit = handleSubmit(async (values) => {
    if (!control) return;
    await update.mutateAsync({
      id: control.id,
      body: {
        title: values.title,
        description: cleanOptional(values.description),
        ownerUserId: cleanOptional(values.ownerUserId),
        dueAt: values.dueAt ? new Date(`${values.dueAt}T00:00:00`).toISOString() : null,
        legalBasisRef: cleanOptional(values.legalBasisRef),
        status: values.status,
      },
    });
    onClose();
  });

  return (
    <Drawer
      open={!!control}
      onClose={onClose}
      title={`Edit ${control?.code ?? "control"}`}
      description={control?.title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      {control ? (
        <form id="edit-control-form" onSubmit={submit} noValidate className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{control.code}</Badge>
            <Badge variant="default">{humanizeStatus(control.status)}</Badge>
          </div>

          <Field label="Title" htmlFor="ec-title" error={errors.title?.message}>
            <Input id="ec-title" {...register("title")} />
          </Field>

          <Field label="Description" htmlFor="ec-desc">
            <textarea
              id="ec-desc"
              rows={4}
              className="w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-[13px] text-ink outline-none transition-colors focus-ring placeholder:text-ink-3 hover:border-border-strong"
              {...register("description")}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" htmlFor="ec-status">
              <Select id="ec-status" {...register("status")}>
                {CONTROL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeStatus(status)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due date" htmlFor="ec-due">
              <Input id="ec-due" type="date" {...register("dueAt")} />
            </Field>
          </div>

          <Field label="Owner" htmlFor="ec-owner">
            <Controller
              control={formControl}
              name="ownerUserId"
              render={({ field }) => (
                <OwnerSelect value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
          </Field>

          <Field label="Legal basis" htmlFor="ec-legal">
            <Input id="ec-legal" placeholder="e.g. DPDP Act 2023 s.8(5)" {...register("legalBasisRef")} />
          </Field>

          {update.isError ? (
            <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
              {update.error instanceof ApiError ? update.error.message : "Save failed."}
            </p>
          ) : null}
        </form>
      ) : null}
    </Drawer>
  );
}
