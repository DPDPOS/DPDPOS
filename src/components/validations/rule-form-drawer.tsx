"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import { humanizeStatus } from "@/lib/constants/status-maps";
import {
  RULE_CATEGORIES,
  RULE_SEVERITIES,
  type ValidationRuleResponse,
} from "@/features/validations/types";
import {
  validationRuleFormSchema,
  type ValidationRuleFormValues,
} from "@/features/validations/schemas";
import {
  useCreateValidationRule,
  useUpdateValidationRule,
} from "@/features/validations/hooks";

interface RuleFormDrawerProps {
  open: boolean;
  onClose: () => void;
  /** null = create; a rule = edit (ruleCode + category are immutable). */
  rule: ValidationRuleResponse | null;
}

export function RuleFormDrawer({ open, onClose, rule }: RuleFormDrawerProps) {
  const createMutation = useCreateValidationRule();
  const updateMutation = useUpdateValidationRule();
  const editing = rule !== null;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ValidationRuleFormValues>({
    resolver: zodResolver(validationRuleFormSchema),
    defaultValues: {
      ruleCode: rule?.ruleCode ?? "",
      title: rule?.title ?? "",
      description: rule?.description ?? "",
      legalBasisRef: rule?.legalBasisRef ?? "",
      severity: (rule?.severity as ValidationRuleFormValues["severity"]) ?? undefined,
      category: (rule?.category as ValidationRuleFormValues["category"]) ?? undefined,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        ruleCode: rule?.ruleCode ?? "",
        title: rule?.title ?? "",
        description: rule?.description ?? "",
        legalBasisRef: rule?.legalBasisRef ?? "",
        severity: (rule?.severity as ValidationRuleFormValues["severity"]) ?? undefined,
        category: (rule?.category as ValidationRuleFormValues["category"]) ?? undefined,
      });
    }
  }, [open, reset, rule]);

  const mutation = editing ? updateMutation : createMutation;
  const pending = mutation.isPending;

  const onSubmit = (values: ValidationRuleFormValues) => {
    if (editing && rule) {
      updateMutation.mutate(
        {
          id: rule.id,
          body: {
            version: rule.version,
            title: values.title,
            description: values.description?.trim() ? values.description : null,
            legalBasisRef: values.legalBasisRef?.trim()
              ? values.legalBasisRef
              : null,
            severity: values.severity,
          },
        },
        { onSuccess: onClose },
      );
      return;
    }
    createMutation.mutate(
      {
        ruleCode: values.ruleCode,
        title: values.title,
        ...(values.description?.trim() ? { description: values.description } : {}),
        ...(values.legalBasisRef?.trim()
          ? { legalBasisRef: values.legalBasisRef }
          : {}),
        ...(values.severity ? { severity: values.severity } : {}),
        ...(values.category ? { category: values.category } : {}),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Edit validation rule" : "New validation rule"}
      description={
        editing
          ? "Rule code and category are immutable. Edits are version-locked."
          : "Add a deterministic check to the library."
      }
    >
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="space-y-4">
        {editing ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-2/60 p-2.5">
            <span className="font-mono text-[13px] text-ink">{rule!.ruleCode}</span>
            <StatusChipInline status={rule!.category} />
            <span className="ml-auto text-xs text-ink-3">v{rule!.version}</span>
          </div>
        ) : (
          <Field
            label="Rule code"
            htmlFor="rule-code"
            hint="Short unique identifier, e.g. NOT-003"
            error={errors.ruleCode?.message}
          >
            <Input
              id="rule-code"
              className="font-mono"
              placeholder="RET-001"
              {...register("ruleCode")}
            />
          </Field>
        )}

        <Field label="Title" htmlFor="rule-title" error={errors.title?.message}>
          <Input
            id="rule-title"
            placeholder="What this check verifies"
            {...register("title")}
          />
        </Field>

        <Field label="Description" htmlFor="rule-description">
          <Textarea
            id="rule-description"
            rows={4}
            maxLength={4000}
            placeholder="Optional — what the rule inspects and why"
            {...register("description")}
          />
        </Field>

        <Field
          label="Legal basis reference"
          htmlFor="rule-legal-basis"
          hint="Optional clause reference, e.g. DPDP Act §8(2)"
        >
          <Input
            id="rule-legal-basis"
            className="font-mono"
            placeholder="DPDP Act §8(2)"
            {...register("legalBasisRef")}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Severity" htmlFor="rule-severity">
            <Controller
              control={control}
              name="severity"
              render={({ field }) => (
                <Select
                  id="rule-severity"
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(
                      (event.target.value || undefined) as
                        | ValidationRuleFormValues["severity"]
                        | undefined,
                    )
                  }
                >
                  <option value="">—</option>
                  {RULE_SEVERITIES.map((severity) => (
                    <option key={severity} value={severity}>
                      {humanizeStatus(severity)}
                    </option>
                  ))}
                </Select>
              )}
            />
          </Field>
          <Field label="Category" htmlFor="rule-category">
            {editing ? (
              <div className="flex h-9 items-center text-[13px] text-ink-2">
                {humanizeStatus(rule!.category)}
              </div>
            ) : (
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    id="rule-category"
                    value={field.value ?? ""}
                    onChange={(event) =>
                      field.onChange(
                        (event.target.value || undefined) as
                          | ValidationRuleFormValues["category"]
                          | undefined,
                      )
                    }
                  >
                    <option value="">—</option>
                    {RULE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {humanizeStatus(category)}
                      </option>
                    ))}
                  </Select>
                )}
              />
            )}
          </Field>
        </div>

        {mutation.isError ? (
          <p role="alert" className="text-xs text-fail">
            {mutation.error instanceof ApiError
              ? mutation.error.code === "CONFLICT"
                ? "Saved by someone else — the rule reloaded, please retry."
                : mutation.error.message
              : "Could not save the rule"}
          </p>
        ) : null}

        <footer className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={pending}>
            {pending
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Create rule"}
          </Button>
        </footer>
      </form>
    </Drawer>
  );
}

/** Tiny inline chip so the immutable category reads like the table's. */
function StatusChipInline({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-border px-1.5 py-0.5 text-xs font-medium text-ink-2">
      {humanizeStatus(status)}
    </span>
  );
}
