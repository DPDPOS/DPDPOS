"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createAssessmentSchema } from "@/features/assessments/schemas";
import { useCreateAssessment } from "@/features/assessments/hooks";

type FormValues = z.infer<typeof createAssessmentSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export function CreateAssessmentDrawer({ open, onClose, onCreated }: Props) {
  const createMutation = useCreateAssessment();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createAssessmentSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createMutation.mutateAsync({
        name: values.name.trim(),
      });
      reset();
      onCreated?.(created.id);
      onClose();
    } catch {
      // error shown below
    }
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New assessment"
      description="Opens the full-page onboarding flow: questionnaire → CLI → evaluate → version."
    >
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <Field label="Name" htmlFor="assessment-name" error={errors.name?.message}>
          <Input
            id="assessment-name"
            placeholder="e.g. Evaluator Assessment 2026"
            {...register("name")}
          />
        </Field>
        {createMutation.isError ? (
          <p className="text-[12px] text-fail">
            {(createMutation.error as Error)?.message ?? "Could not create assessment"}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
            Create
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
