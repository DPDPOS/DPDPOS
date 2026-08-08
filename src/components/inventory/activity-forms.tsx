"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import { useDataAssets } from "@/features/dataAssets/hooks";
import type { ProcessingActivityResponse } from "@/features/processingActivities/types";
import {
  activityFormSchema,
  type ActivityFormValues,
} from "@/features/processingActivities/schemas";
import {
  useCreateProcessingActivity,
  useUpdateProcessingActivity,
} from "@/features/processingActivities/hooks";
import { dpiaRequiredFor } from "@/features/processingActivities/types";
import { DpiaBanner } from "./dpia";

function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/* Shared field block --------------------------------------------------------- */

function ActivityFormFields({
  form,
  lockedAssetId,
  lockedAssetName,
}: {
  form: ReturnType<typeof useForm<ActivityFormValues>>;
  lockedAssetId?: string;
  lockedAssetName?: string;
}) {
  const { register, control, formState } = form;
  const assets = useDataAssets();
  const selectedAssetId = form.watch("dataAssetId") || lockedAssetId;
  const selectedAsset = assets.data?.find((asset) => asset.id === selectedAssetId);
  const dpiaRelevant = dpiaRequiredFor(selectedAsset?.sensitivity);

  return (
    <div className="space-y-4">
      {dpiaRelevant ? <DpiaBanner assetName={selectedAsset?.assetName} /> : null}

      <Field
        label="Purpose"
        htmlFor="pa-purpose"
        error={formState.errors.purpose?.message}
        hint="Why is this data processed? e.g. Payroll administration"
      >
        <Input
          id="pa-purpose"
          placeholder="Payroll administration"
          {...register("purpose")}
        />
      </Field>

      <Field
        label="Data asset"
        htmlFor="pa-asset"
        error={formState.errors.dataAssetId?.message}
      >
        {lockedAssetId ? (
          <div className="flex h-9 items-center gap-2 rounded-sm border border-border bg-surface-2 px-2.5 text-sm text-ink">
            <Lock className="size-3.5 text-ink-3" aria-hidden />
            <span className="truncate">{lockedAssetName ?? lockedAssetId}</span>
          </div>
        ) : (
          <Controller
            control={control}
            name="dataAssetId"
            render={({ field }) => (
              <Select
                id="pa-asset"
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value || undefined)}
                aria-label="Data asset"
                invalid={Boolean(formState.errors.dataAssetId)}
              >
                <option value="">Select an asset…</option>
                {assets.data?.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.assetName} · {asset.sensitivity}
                  </option>
                ))}
              </Select>
            )}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Source system" htmlFor="pa-source" hint="e.g. SAP HR">
          <Input id="pa-source" placeholder="SAP HR" {...register("sourceSystem")} />
        </Field>
        <Field label="Recipient type" htmlFor="pa-recipient" hint="e.g. Internal, Processor, Third party">
          <Input id="pa-recipient" placeholder="Internal" {...register("recipientType")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Processor" htmlFor="pa-processor" hint="Named processor if any">
          <Input id="pa-processor" placeholder="Acme Payroll Pvt Ltd" {...register("processorName")} />
        </Field>
        <Field label="Legal basis" htmlFor="pa-legal" hint="e.g. Consent, Contract, Legal obligation">
          <Input id="pa-legal" placeholder="Contract" {...register("legalBasis")} />
        </Field>
      </div>

      <Field label="Retention rule" htmlFor="pa-retention" hint="e.g. Deleted 36 months after termination">
        <Input id="pa-retention" placeholder="36 months after termination" {...register("retentionRule")} />
      </Field>

      <Field label="Notes" htmlFor="pa-notes">
        <textarea
          id="pa-notes"
          rows={3}
          className="w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-[13px] text-ink outline-none transition-colors focus-ring placeholder:text-ink-3 hover:border-border-strong"
          placeholder="Anything worth remembering…"
          {...register("notes")}
        />
      </Field>
    </div>
  );
}

/* Create drawer --------------------------------------------------------------- */

export function CreateActivityDrawer({
  open,
  onClose,
  /** Lock the asset field (opened from an asset's detail). */
  defaultAssetId,
}: {
  open: boolean;
  onClose: () => void;
  defaultAssetId?: string;
}) {
  const create = useCreateProcessingActivity();
  const assets = useDataAssets();
  const lockedAsset = assets.data?.find((asset) => asset.id === defaultAssetId);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: { dataAssetId: defaultAssetId ?? "" },
  });

  const submit = form.handleSubmit(async (values) => {
    await create.mutateAsync({
      dataAssetId: values.dataAssetId || defaultAssetId || "",
      purpose: values.purpose,
      sourceSystem: cleanOptional(values.sourceSystem),
      recipientType: cleanOptional(values.recipientType),
      processorName: cleanOptional(values.processorName),
      legalBasis: cleanOptional(values.legalBasis),
      retentionRule: cleanOptional(values.retentionRule),
      notes: cleanOptional(values.notes),
    });
    form.reset({ dataAssetId: defaultAssetId ?? "" });
    onClose();
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New processing activity"
      description="Map how the asset's data flows — purpose, processors and retention."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create activity"}
          </Button>
        </>
      }
    >
      <form id="create-activity-form" onSubmit={submit} noValidate>
        <ActivityFormFields
          form={form}
          lockedAssetId={defaultAssetId}
          lockedAssetName={lockedAsset?.assetName}
        />
        {create.isError ? (
          <p role="alert" className="mt-4 rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
            {create.error instanceof ApiError ? create.error.message : "Create failed."}
          </p>
        ) : null}
      </form>
    </Drawer>
  );
}

/* Edit drawer ------------------------------------------------------------------ */

export function EditActivityDrawer({
  activity,
  onClose,
}: {
  activity: ProcessingActivityResponse | null;
  onClose: () => void;
}) {
  const update = useUpdateProcessingActivity();

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    values: activity
      ? {
          dataAssetId: activity.dataAssetId,
          purpose: activity.purpose,
          sourceSystem: activity.sourceSystem ?? "",
          recipientType: activity.recipientType ?? "",
          processorName: activity.processorName ?? "",
          legalBasis: activity.legalBasis ?? "",
          retentionRule: activity.retentionRule ?? "",
          notes: activity.notes ?? "",
        }
      : undefined,
  });

  const submit = form.handleSubmit(async (values) => {
    if (!activity) return;
    await update.mutateAsync({
      id: activity.id,
      body: {
        dataAssetId: values.dataAssetId,
        purpose: values.purpose,
        sourceSystem: cleanOptional(values.sourceSystem),
        recipientType: cleanOptional(values.recipientType),
        processorName: cleanOptional(values.processorName),
        legalBasis: cleanOptional(values.legalBasis),
        retentionRule: cleanOptional(values.retentionRule),
        notes: cleanOptional(values.notes),
      },
    });
    onClose();
  });

  return (
    <Drawer
      open={!!activity}
      onClose={onClose}
      title={`Edit ${activity?.purpose ?? "activity"}`}
      description="Keep the processing map accurate."
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
      {activity ? (
        <form id="edit-activity-form" onSubmit={submit} noValidate>
          <ActivityFormFields form={form} />
          {update.isError ? (
            <p role="alert" className="mt-4 rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
              {update.error instanceof ApiError ? update.error.message : "Save failed."}
            </p>
          ) : null}
        </form>
      ) : null}
    </Drawer>
  );
}
