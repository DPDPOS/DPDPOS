import { z } from "zod";

/** Mirror of createProcessingActivityDtoSchema for the create/edit drawers. */
export const activityFormSchema = z.object({
  dataAssetId: z.string().min(1, "Pick a data asset"),
  purpose: z.string().trim().min(1, "Purpose is required").max(255),
  sourceSystem: z.string().trim().max(100).optional(),
  recipientType: z.string().trim().max(100).optional(),
  processorName: z.string().trim().max(255).optional(),
  legalBasis: z.string().trim().max(255).optional(),
  retentionRule: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type ActivityFormValues = z.infer<typeof activityFormSchema>;
