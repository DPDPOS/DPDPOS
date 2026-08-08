import { z } from "zod";
import { REQUEST_STATUSES, REQUEST_TYPES } from "./types";

/** Mirrors createDataSubjectRequestDtoSchema. */
export const createRightsRequestSchema = z.object({
  requestType: z.enum(REQUEST_TYPES),
  requesterReference: z.string().trim().min(1).max(500),
  assignedTo: z.string().optional(),
});
export type CreateRightsRequestFormValues = z.infer<
  typeof createRightsRequestSchema
>;

/** Mirrors updateDataSubjectRequestDtoSchema incl. the ≥1-field refine. */
export const updateRightsRequestSchema = z
  .object({
    version: z.number().int().min(1),
    assignedTo: z.string().nullable().optional(),
    status: z.enum(REQUEST_STATUSES).optional(),
    resolutionSummary: z.string().trim().max(4000).nullable().optional(),
  })
  .refine(
    (data) =>
      data.assignedTo !== undefined ||
      data.status !== undefined ||
      data.resolutionSummary !== undefined,
    { message: "Nothing to update — choose at least one field" },
  );
export type UpdateRightsRequestFormValues = z.infer<
  typeof updateRightsRequestSchema
>;
