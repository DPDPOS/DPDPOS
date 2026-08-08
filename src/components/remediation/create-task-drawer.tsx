"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import {
  createRemediationTaskSchema,
  type CreateRemediationTaskFormValues,
} from "@/features/remediation/schemas";
import { useCreateRemediationTask } from "@/features/remediation/hooks";
import { useAllViolations } from "@/features/violations/hooks";
import { useUsers } from "@/features/users/hooks";

interface CreateRemediationTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Preset when opened from the violation detail drawer (§9.8). */
  violationId?: string;
}

export function CreateRemediationTaskDrawer({
  open,
  onClose,
  violationId,
}: CreateRemediationTaskDrawerProps) {
  const { data: violations } = useAllViolations();
  const { data: users } = useUsers();
  const createMutation = useCreateRemediationTask();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRemediationTaskFormValues>({
    resolver: zodResolver(createRemediationTaskSchema),
    defaultValues: {
      violationId: violationId ?? "",
      taskTitle: "",
      taskDescription: "",
      assignedTo: "",
      dueAt: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync({
        violationId: values.violationId,
        taskTitle: values.taskTitle.trim(),
        taskDescription: values.taskDescription?.trim() || undefined,
        assignedTo: values.assignedTo || undefined,
        dueAt: values.dueAt || undefined,
      });
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
      title="New remediation task"
      description="A manual fix-it task against a violation. AUTO tasks come from the ViolationCreated event."
    >
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
        <Field label="Violation" htmlFor="new-task-violation" error={errors.violationId?.message}>
          <Select
            id="new-task-violation"
            disabled={Boolean(violationId)}
            {...register("violationId")}
          >
            <option value="">Select a violation</option>
            {(violations ?? []).map((violation) => (
              <option key={violation.id} value={violation.id}>
                {violation.title}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Task title" htmlFor="new-task-title" error={errors.taskTitle?.message}>
          <Input
            id="new-task-title"
            placeholder="What needs to be fixed"
            maxLength={255}
            {...register("taskTitle")}
          />
        </Field>

        <Field
          label="Description"
          htmlFor="new-task-description"
          error={errors.taskDescription?.message}
        >
          <Textarea
            id="new-task-description"
            rows={4}
            maxLength={4000}
            placeholder="Steps, owners, expected outcome"
            {...register("taskDescription")}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Assignee" htmlFor="new-task-assignee" error={errors.assignedTo?.message}>
            <Select id="new-task-assignee" {...register("assignedTo")}>
              <option value="">Unassigned</option>
              {(users?.items ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due date" htmlFor="new-task-due" error={errors.dueAt?.message}>
            <Input id="new-task-due" type="date" {...register("dueAt")} />
          </Field>
        </div>

        {createMutation.isError ? (
          <p role="alert" className="text-xs text-fail">
            {createMutation.error instanceof ApiError
              ? createMutation.error.message
              : "Could not create the task"}
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
            {isSubmitting ? "Creating…" : "Create task"}
          </Button>
        </footer>
      </form>
    </Drawer>
  );
}
