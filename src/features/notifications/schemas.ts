import { z } from "zod";

/** Mirrors updatePreferencesDtoSchema in dpdpos_backend notification.dto.ts. */
export const updatePreferencesSchema = z.object({
  email: z.boolean().optional(),
  inApp: z.boolean().optional(),
  slack: z.boolean().optional(),
});

export type UpdatePreferencesFormValues = z.infer<typeof updatePreferencesSchema>;
