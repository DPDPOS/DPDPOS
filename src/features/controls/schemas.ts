import { z } from "zod";
import { CONTROL_STATUSES } from "./types";

/**
 * Form mirrors of createControlDtoSchema / updateControlDtoSchema. dueAt is a
 * yyyy-mm-dd string from the date input, converted to ISO on submit.
 */
export const createControlFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Control code is required")
    .max(50)
    .transform((value) => value.toUpperCase()),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(4000).optional(),
  ownerUserId: z.string().optional(),
  dueAt: z.string().optional(),
  legalBasisRef: z.string().trim().max(200).optional(),
  status: z.enum(CONTROL_STATUSES).optional(),
});

export type CreateControlFormValues = z.infer<typeof createControlFormSchema>;

export const updateControlFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(4000).optional(),
  ownerUserId: z.string().optional(),
  dueAt: z.string().optional(),
  legalBasisRef: z.string().trim().max(200).optional(),
  status: z.enum(CONTROL_STATUSES),
});

export type UpdateControlFormValues = z.infer<typeof updateControlFormSchema>;

/** yyyy-mm-dd input value from an ISO timestamp (or ""). */
export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

/** "" → undefined so the backend keeps the field unset. */
export function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
