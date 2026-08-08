"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import {
  RIGHTS_REQUEST_TYPE_HINTS,
  RIGHTS_REQUEST_TYPE_LABELS,
  REQUEST_TYPES,
} from "@/features/rights/types";
import {
  createRightsRequestSchema,
  type CreateRightsRequestFormValues,
} from "@/features/rights/schemas";
import { useCreateRightsRequest } from "@/features/rights/hooks";
import { useUsers } from "@/features/users/hooks";

interface SubmitRequestDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SubmitRequestDrawer({
  open,
  onClose,
}: SubmitRequestDrawerProps) {
  const { data: users } = useUsers();
  const createMutation = useCreateRightsRequest();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRightsRequestFormValues>({
    resolver: zodResolver(createRightsRequestSchema),
    defaultValues: {
      requestType: "ACCESS",
      requesterReference: "",
      assignedTo: undefined,
    },
  });

  const requestType = useWatch({ control, name: "requestType" });

  // Fresh form per open — the drawer stays mounted for the transition.
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const onSubmit = (values: CreateRightsRequestFormValues) => {
    createMutation.mutate(
      {
        requestType: values.requestType,
        requesterReference: values.requesterReference,
        ...(values.assignedTo ? { assignedTo: values.assignedTo } : {}),
      },
      {
        onSuccess: onClose,
      },
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Submit rights request"
      description="Log a Data Principal request — the SLA clock starts now."
    >
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="space-y-4">
        <Field
          label="Request type"
          htmlFor="rights-request-type"
          error={errors.requestType?.message}
        >
          <Controller
            control={control}
            name="requestType"
            render={({ field }) => (
              <Select
                id="rights-request-type"
                {...field}
                onChange={(event) => field.onChange(event.target.value)}
              >
                {REQUEST_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {RIGHTS_REQUEST_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            )}
          />
        </Field>

        {errors.requestType?.message ? null : (
          <p className="-mt-2 text-xs text-ink-3">
            {RIGHTS_REQUEST_TYPE_HINTS[requestType]}
          </p>
        )}

        <Field
          label="Requester reference"
          htmlFor="rights-requester"
          hint="Your internal identifier for the principal (no PII — the audit trail excludes it)."
          error={errors.requesterReference?.message}
        >
          <Input
            id="rights-requester"
            className="font-mono"
            placeholder="e.g. DS-2026-0417"
            {...register("requesterReference")}
          />
        </Field>

        <Field label="Assignee" htmlFor="rights-submit-assignee" hint="Optional for now.">
          <Controller
            control={control}
            name="assignedTo"
            render={({ field }) => (
              <Select
                id="rights-submit-assignee"
                value={field.value ?? ""}
                onChange={(event) =>
                  field.onChange(event.target.value || undefined)
                }
              >
                <option value="">Unassigned</option>
                {(users?.items ?? []).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            )}
          />
        </Field>

        {createMutation.isError ? (
          <p role="alert" className="text-xs text-fail">
            {createMutation.error instanceof ApiError
              ? createMutation.error.message
              : "Could not submit the request"}
          </p>
        ) : null}

        <footer className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Submitting…" : "Submit request"}
          </Button>
        </footer>
      </form>
    </Drawer>
  );
}
