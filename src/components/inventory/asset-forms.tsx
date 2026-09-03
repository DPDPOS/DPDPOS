"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Archive } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { ApiError } from "@/lib/api/errors";
import {
  DATA_SENSITIVITIES,
  type DataAssetResponse,
} from "@/features/dataAssets/types";
import {
  cleanOptional,
  parseCountries,
  assetFormSchema,
  type AssetFormValues,
} from "@/features/dataAssets/schemas";
import {
  useArchiveDataAsset,
  useCreateDataAsset,
  useUpdateDataAsset,
} from "@/features/dataAssets/hooks";
import { useDepartments } from "@/features/departments/hooks";
import { useUsers } from "@/features/users/hooks";

/* Shared field block -------------------------------------------------------- */

function AssetFormFields({ form }: { form: ReturnType<typeof useForm<AssetFormValues>> }) {
  const { register, control, formState } = form;
  const departments = useDepartments();
  const users = useUsers();

  return (
    <div className="space-y-4">
      <Field label="Asset name" htmlFor="da-name" error={formState.errors.assetName?.message} hint="e.g. HR employee records">
        <Input id="da-name" placeholder="Employee records" {...register("assetName")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Asset type" htmlFor="da-type" error={formState.errors.assetType?.message} hint="e.g. Database, Spreadsheet, SaaS">
          <Input id="da-type" placeholder="Database" {...register("assetType")} />
        </Field>
        <Field label="Category" htmlFor="da-category" error={formState.errors.category?.message} hint="e.g. HR, Finance, Marketing">
          <Input id="da-category" placeholder="HR" {...register("category")} />
        </Field>
      </div>

      <Field label="Sensitivity" htmlFor="da-sensitivity" error={formState.errors.sensitivity?.message}>
        <Controller
          control={control}
          name="sensitivity"
          render={({ field }) => (
            <Segmented
              name="Sensitivity"
              value={field.value}
              onChange={field.onChange}
              options={DATA_SENSITIVITIES.map((value) => ({
                value,
                label:
                  value.charAt(0) + value.slice(1).toLowerCase(),
              }))}
            />
          )}
        />
      </Field>

      <Field label="Description" htmlFor="da-desc" error={formState.errors.description?.message}>
        <textarea
          id="da-desc"
          rows={3}
          className="w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-[13px] text-ink outline-none transition-colors focus-ring placeholder:text-ink-3 hover:border-border-strong"
          placeholder="What this asset holds, where it comes from…"
          {...register("description")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Department" htmlFor="da-department">
          <Controller
            control={control}
            name="departmentId"
            render={({ field }) => (
              <Select
                id="da-department"
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value || undefined)}
                aria-label="Department"
              >
                <option value="">Unassigned</option>
                {departments.data?.items.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </Select>
            )}
          />
        </Field>
        <Field label="Owner" htmlFor="da-owner">
          <Controller
            control={control}
            name="ownerUserId"
            render={({ field }) => (
              <Select
                id="da-owner"
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value || undefined)}
                aria-label="Owner"
              >
                <option value="">Unassigned</option>
                {users.data?.items.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            )}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Storage location" htmlFor="da-storage" hint="e.g. EU West (AWS eu-west-1)">
          <Input id="da-storage" placeholder="AWS eu-west-1" {...register("storageLocation")} />
        </Field>
        <Field label="Retention period" htmlFor="da-retention" hint="e.g. 36 months after termination">
          <Input id="da-retention" placeholder="36 months" {...register("retentionPeriod")} />
        </Field>
      </div>

      <Field
        label="Countries (ISO)"
        htmlFor="da-countries"
        hint="Where data is stored/replicated, e.g. IN, SG"
      >
        <Input id="da-countries" placeholder="IN, SG" {...register("countriesText")} />
      </Field>
    </div>
  );
}

/* Create drawer -------------------------------------------------------------- */

export function CreateAssetDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const create = useCreateDataAsset();
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: { sensitivity: "MEDIUM" },
  });

  const submit = form.handleSubmit(async (values) => {
    await create.mutateAsync({
      assetName: values.assetName,
      assetType: values.assetType,
      category: values.category,
      sensitivity: values.sensitivity,
      description: cleanOptional(values.description),
      storageLocation: cleanOptional(values.storageLocation),
      retentionPeriod: cleanOptional(values.retentionPeriod),
      countries: parseCountries(values.countriesText),
      departmentId: cleanOptional(values.departmentId),
      ownerUserId: cleanOptional(values.ownerUserId),
    });
    form.reset();
    onClose();
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New data asset"
      description="Record what personal data exists — its sensitivity, owner and retention."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create asset"}
          </Button>
        </>
      }
    >
      <form id="create-asset-form" onSubmit={submit} noValidate>
        <AssetFormFields form={form} />
        {create.isError ? (
          <p role="alert" className="mt-4 rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
            {create.error instanceof ApiError
              ? create.error.message.includes("departmentId")
                ? "Selected department is invalid for this organisation. Pick a department from the list."
                : create.error.message.includes("ownerUserId")
                  ? "Selected owner is invalid for this organisation. Pick a user from the list."
                  : create.error.message
              : "Create failed."}
          </p>
        ) : null}
      </form>
    </Drawer>
  );
}

/* Edit drawer ---------------------------------------------------------------- */

export function EditAssetDrawer({
  asset,
  onClose,
}: {
  asset: DataAssetResponse | null;
  onClose: () => void;
}) {
  const update = useUpdateDataAsset();
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    values: asset
      ? {
          assetName: asset.assetName,
          assetType: asset.assetType,
          category: asset.category,
          sensitivity: asset.sensitivity as AssetFormValues["sensitivity"],
          description: asset.description ?? "",
          storageLocation: asset.storageLocation ?? "",
          retentionPeriod: asset.retentionPeriod ?? "",
          countriesText: (asset.countries ?? []).join(", "),
          departmentId: asset.departmentId ?? "",
          ownerUserId: asset.ownerUserId ?? "",
        }
      : undefined,
  });

  const submit = form.handleSubmit(async (values) => {
    if (!asset) return;
    await update.mutateAsync({
      id: asset.id,
      body: {
        assetName: values.assetName,
        assetType: values.assetType,
        category: values.category,
        sensitivity: values.sensitivity,
        description: cleanOptional(values.description),
        storageLocation: cleanOptional(values.storageLocation),
        retentionPeriod: cleanOptional(values.retentionPeriod),
        countries: parseCountries(values.countriesText) ?? [],
        departmentId: cleanOptional(values.departmentId),
        ownerUserId: cleanOptional(values.ownerUserId),
      },
    });
    onClose();
  });

  return (
    <Drawer
      open={!!asset}
      onClose={onClose}
      title={`Edit ${asset?.assetName ?? "asset"}`}
      description={asset?.category}
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
      {asset ? (
        <form id="edit-asset-form" onSubmit={submit} noValidate>
          <AssetFormFields form={form} />
          {update.isError ? (
            <p role="alert" className="mt-4 rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
              {update.error instanceof ApiError
                ? update.error.message.includes("departmentId")
                  ? "Selected department is invalid for this organisation. Pick a department from the list."
                  : update.error.message.includes("ownerUserId")
                    ? "Selected owner is invalid for this organisation. Pick a user from the list."
                    : update.error.message
                : "Save failed."}
            </p>
          ) : null}
        </form>
      ) : null}
    </Drawer>
  );
}

/* Archive confirm ------------------------------------------------------------- */

export function ArchiveAssetDialog({
  asset,
  onClose,
}: {
  asset: DataAssetResponse | null;
  onClose: () => void;
}) {
  const archive = useArchiveDataAsset();

  const submit = async () => {
    if (!asset) return;
    await archive.mutateAsync(asset.id);
    onClose();
  };

  return (
    <Dialog
      open={!!asset}
      onClose={onClose}
      title="Archive data asset?"
      description="This action can't be undone from this screen."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={archive.isPending}
            variant="danger"
          >
            {archive.isPending ? "Archiving…" : "Archive asset"}
          </Button>
        </>
      }
    >
      {asset ? (
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-ink-2">
            <span className="font-medium text-ink">{asset.assetName}</span> will
            be marked archived.
          </p>
          <p className="flex items-start gap-2 rounded-sm border border-info/20 bg-info-bg/40 px-3 py-2 text-xs leading-relaxed text-ink-2">
            <Archive className="mt-0.5 size-3.5 shrink-0 text-info" aria-hidden />
            The record is <span className="font-medium text-ink">archived, not
            deleted</span> — it stays in the register with its history so audit
            traceability is preserved.
          </p>
          {archive.isError ? (
            <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
              {archive.error instanceof ApiError ? archive.error.message : "Archive failed."}
            </p>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}
