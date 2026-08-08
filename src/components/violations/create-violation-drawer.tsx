"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import { VIOLATION_SEVERITIES } from "@/features/violations/types";
import {
  createViolationSchema,
  type CreateViolationFormValues,
} from "@/features/violations/schemas";
import { useCreateViolation } from "@/features/violations/hooks";
import { useUsers } from "@/features/users/hooks";

interface CreateViolationDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CreateViolationDrawer({ open, onClose }: CreateViolationDrawerProps) {
  const { data: users } = useUsers();
  const createMutation = useCreateViolation();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateViolationFormValues>({
    resolver: zodResolver(createViolationSchema),
    defaultValues: {
      severity: "MEDIUM",
      title: "",
      description: "",
      assignedTo: "",
    },
  });

  const severity = useWatch({ control, name: "severity" }) ?? "MEDIUM";

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload: CreateViolationFormValues = {
        ...values,
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        assignedTo: values.assignedTo || undefined,
        dueAt: values.dueAt || undefined,
      };
      await createMutation.mutateAsync(payload);
      reset();
      onClose();
    } catch {
      // Surfaced through createMutation.isError below.
    }
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New violation"
      description="Log a non-compliance finding — from a validation failure or manually."
    >
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
        <Field
          label="Title"
          htmlFor="new-violation-title"
          error={errors.title?.message}
        >
          <Input
            id="new-violation-title"
            placeholder="What failed, in one line"
            maxLength={255}
            {...register("title")}
          />
        </Field>

        <Field
          label="Severity"
          htmlFor="new-violation-severity"
          error={errors.severity?.message}
        >
          <div
            id="new-violation-severity"
            role="radiogroup"
            aria-label="Severity"
            className="grid grid-cols-4 gap-1.5"
          >
            {VIOLATION_SEVERITIES.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={severity === option}
                onClick={() => setValue("severity", option, { shouldValidate: true })}
                className={`focus-ring rounded-sm border px-2 py-1.5 text-xs font-medium transition-colors ${
                  severity === option
                    ? "border-border-strong bg-surface-2 text-ink"
                    : "border-border bg-surface text-ink-2 hover:text-ink"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Description" htmlFor="new-violation-description" error={errors.description?.message}>
          <Textarea
            id="new-violation-description"
            rows={4}
            maxLength={4000}
            placeholder="Context, impact, and any evidence pointers"
            {...register("description")}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Assignee" htmlFor="new-violation-assignee" error={errors.assignedTo?.message}>
            <Select id="new-violation-assignee" {...register("assignedTo")}>
              <option value="">Unassigned</option>
              {(users?.items ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due date" htmlFor="new-violation-due" error={errors.dueAt?.message}>
            <Input id="new-violation-due" type="date" {...register("dueAt")} />
          </Field>
        </div>

        {createMutation.isError ? (
          <p role="alert" className="text-xs text-fail">
            {createMutation.error instanceof ApiError
              ? createMutation.error.message
              : "Could not create the violation"}
          </p>
        ) : null}

        <footer className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create violation"}
          </Button>
        </footer>
      </form>
    </Drawer>
  );
}
