import { z } from "zod";
import { REMEDIATION_TASK_STATUSES } from "./types";

/** Mirrors createRemediationTaskDtoSchema. */
export const createRemediationTaskSchema = z.object({
  violationId: z.string().min(1, "Violation is required"),
  taskTitle: z.string().trim().min(1).max(255),
  taskDescription: z.string().trim().max(4000).optional(),
  assignedTo: z.string().optional(),
  dueAt: z.string().optional(),
});
export type CreateRemediationTaskFormValues = z.infer<
  typeof createRemediationTaskSchema
>;

/** Mirrors closeRemediationTaskBodySchema. */
export const closeRemediationTaskSchema = z.object({
  version: z.number().int().min(1),
  resolutionSummary: z.string().trim().min(1).max(4000),
});
export type CloseRemediationTaskFormValues = z.infer<
  typeof closeRemediationTaskSchema
>;

/** Mirrors updateRemediationTaskDtoSchema incl. the ≥1-field refine. */
export const updateRemediationTaskSchema = z
  .object({
    version: z.number().int().min(1),
    status: z.enum(REMEDIATION_TASK_STATUSES).optional(),
    assignedTo: z.string().nullable().optional(),
    dueAt: z.string().nullable().optional(),
    verificationNotes: z.string().trim().max(4000).nullable().optional(),
    resolutionSummary: z.string().trim().max(4000).nullable().optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.assignedTo !== undefined ||
      data.dueAt !== undefined ||
      data.verificationNotes !== undefined ||
      data.resolutionSummary !== undefined,
    { message: "Nothing to update — choose at least one field" },
  );
export type UpdateRemediationTaskFormValues = z.infer<
  typeof updateRemediationTaskSchema
>;
