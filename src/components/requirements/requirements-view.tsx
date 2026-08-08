"use client";

import { GitMerge } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import type { RequirementResponse } from "@/features/requirements/types";
import { useMapRequirement, useRequirements } from "@/features/requirements/hooks";
import { useFrameworkRoadmap } from "@/features/framework/hooks";
import { useControls } from "@/features/controls/hooks";
import { cn } from "@/lib/utils/cn";

const PAGE_SIZE = 20;

export function RequirementsView() {
  const framework = useFrameworkRoadmap();
  const frameworkId = framework.data?.id;
  const [unmappedOnly, setUnmappedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [mapping, setMapping] = useState<RequirementResponse | null>(null);

  const requirements = useRequirements(
    {
      ...(frameworkId ? { frameworkId } : {}),
      ...(unmappedOnly ? { unmapped: true } : {}),
      page,
      pageSize: PAGE_SIZE,
    },
    !framework.isLoading,
  );

  // Resolve controlId → code for the "Mapped to" column (controls are cached
  // from the controls register; one 100-row page covers the register).
  const controls = useControls({ frameworkId, page: 1, pageSize: 100 }, !!frameworkId);
  const controlCodeById = new Map(
    (controls.data?.items ?? []).map((control) => [control.id, control.code]),
  );

  const columns: TableColumn<RequirementResponse>[] = [
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
      header: "Obligation",
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
      key: "legalBasis",
      header: "Legal basis",
      accessor: (row) => (
        <span className="font-mono text-xs text-ink-2">
          {row.legalBasisRef ?? "—"}
        </span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      key: "mapping",
      header: "Mapping",
      accessor: (row) => {
        const mappedCode = row.controlId
          ? controlCodeById.get(row.controlId)
          : undefined;
        return row.controlId ? (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-pass/20 bg-pass-bg px-1.5 py-0.5 text-xs font-medium text-pass">
            <span aria-hidden className="size-1.5 rounded-full bg-pass" />
            {mappedCode ?? row.controlId.slice(0, 8)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-warn/20 bg-warn-bg px-1.5 py-0.5 text-xs font-medium text-warn">
            <span aria-hidden className="size-1.5 rounded-full bg-warn" />
            Unmapped
          </span>
        );
      },
    },
  ];

  const noFramework = !framework.isLoading && !frameworkId;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="micro-label">Programme · Obligations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Obligations
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            {requirements.isLoading
              ? "Loading…"
              : `${requirements.data?.meta.total ?? 0} total · page ${requirements.data?.meta.page ?? 1} of ${requirements.data?.meta.totalPages ?? 1}`}
          </p>
        </div>

        <label className="flex cursor-pointer select-none items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-label="Unmapped only"
            aria-checked={unmappedOnly}
            onClick={() => {
              setUnmappedOnly((value) => !value);
              setPage(1);
            }}
            className={cn(
              "focus-ring relative h-5 w-9 rounded-full border transition-colors duration-150",
              unmappedOnly ? "border-accent bg-accent" : "border-border bg-surface-2",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-0.5 size-3.5 rounded-full bg-surface shadow-sm transition-transform duration-150",
                unmappedOnly ? "translate-x-4" : "translate-x-0.5",
              )}
            />
          </button>
          <span className="text-[13px] font-medium text-ink">Unmapped only</span>
        </label>
      </header>

      {requirements.isError ? (
        <ErrorState
          title="Couldn't load obligations"
          message={requirements.error instanceof ApiError ? requirements.error.message : undefined}
          retry={() => void requirements.refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={requirements.data?.items ?? []}
          rowKey={(row) => row.id}
          loading={requirements.isLoading || framework.isLoading}
          pagination={
            requirements.data
              ? {
                  page: requirements.data.meta.page,
                  pageSize: requirements.data.meta.pageSize,
                  total: requirements.data.meta.total,
                  totalPages: requirements.data.meta.totalPages,
                  onPageChange: setPage,
                }
              : undefined
          }
          emptyTitle={noFramework ? "Generate your framework first" : "No obligations"}
          emptyBody={
            noFramework
              ? "Obligations are generated alongside the framework controls."
              : unmappedOnly
                ? "Every obligation is mapped to a control."
                : "Obligations arrive with the generated framework."
          }
          rowActions={(row) =>
            row.controlId ? null : (
              <Can perm="requirement:create">
                <button
                  type="button"
                  onClick={() => setMapping(row)}
                  className="focus-ring flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-xs font-medium text-ink-2 opacity-0 transition-opacity hover:border-border-strong hover:text-ink group-hover:opacity-100"
                >
                  <GitMerge className="size-3" aria-hidden />
                  Map
                </button>
              </Can>
            )
          }
        />
      )}

      <MapDrawer
        key={mapping?.id ?? "closed"}
        requirement={mapping}
        controls={controls.data?.items ?? []}
        onClose={() => setMapping(null)}
      />
    </div>
  );
}

function MapDrawer({
  requirement,
  controls,
  onClose,
}: {
  requirement: RequirementResponse | null;
  controls: { id: string; code: string; title: string }[];
  onClose: () => void;
}) {
  const [controlId, setControlId] = useState<string>("");
  const map = useMapRequirement();
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!requirement || !controlId) return;
    setError(null);
    try {
      await map.mutateAsync({ id: requirement.id, controlId });
      onClose();
      setControlId("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mapping failed.");
    }
  };

  return (
    <Drawer
      open={!!requirement}
      onClose={onClose}
      title={`Map ${requirement?.code ?? "obligation"}`}
      description={requirement?.title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!controlId || map.isPending}>
            {map.isPending ? "Mapping…" : "Map obligation"}
          </Button>
        </>
      }
    >
      {requirement ? (
        <div className="space-y-4">
          <div className="rounded-sm border border-border bg-surface-2 px-3 py-2.5">
            <p className="font-mono text-xs font-medium text-accent">
              {requirement.code}
            </p>
            <p className="mt-0.5 text-[13px] text-ink">{requirement.title}</p>
            {requirement.legalBasisRef ? (
              <p className="mt-0.5 font-mono text-xs text-ink-3">
                {requirement.legalBasisRef}
              </p>
            ) : null}
          </div>

          <Field label="Control" htmlFor="map-control" hint="Choose the control that satisfies this obligation.">
            <Select
              id="map-control"
              value={controlId}
              onChange={(event) => setControlId(event.target.value)}
            >
              <option value="">Select a control…</option>
              {controls.map((control) => (
                <option key={control.id} value={control.id}>
                  {control.code} · {control.title}
                </option>
              ))}
            </Select>
          </Field>

          {error ? (
            <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <EmptyState title="Nothing to map" />
      )}
    </Drawer>
  );
}
