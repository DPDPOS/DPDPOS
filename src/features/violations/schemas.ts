import { z } from "zod";
import { VIOLATION_SEVERITIES, VIOLATION_STATUSES } from "./types";

/** Mirrors createViolationDtoSchema. */
export const createViolationSchema = z.object({
  validationResultId: z.string().uuid().optional(),
  severity: z.enum(VIOLATION_SEVERITIES),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(4000).optional(),
  assignedTo: z.string().optional(),
  dueAt: z.string().optional(),
});
export type CreateViolationFormValues = z.infer<typeof createViolationSchema>;

/** Mirrors closeViolationBodySchema. */
export const closeViolationSchema = z.object({
  version: z.number().int().min(1),
  resolutionSummary: z.string().trim().min(1).max(4000),
});
export type CloseViolationFormValues = z.infer<typeof closeViolationSchema>;

/** Mirrors updateViolationDtoSchema incl. the ≥1-field refine. */
export const updateViolationSchema = z
  .object({
    version: z.number().int().min(1),
    severity: z.enum(VIOLATION_SEVERITIES).optional(),
    status: z.enum(VIOLATION_STATUSES).optional(),
    assignedTo: z.string().nullable().optional(),
    dueAt: z.string().nullable().optional(),
    resolutionSummary: z.string().trim().max(4000).nullable().optional(),
  })
  .refine(
    (data) =>
      data.severity !== undefined ||
      data.status !== undefined ||
      data.assignedTo !== undefined ||
      data.dueAt !== undefined ||
      data.resolutionSummary !== undefined,
    { message: "Nothing to update — choose at least one field" },
  );
export type UpdateViolationFormValues = z.infer<typeof updateViolationSchema>;
