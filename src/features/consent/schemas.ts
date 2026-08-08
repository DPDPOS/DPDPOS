import { z } from "zod";

/** Mirror of createConsentRecordDtoSchema for the create drawer. */
export const consentRecordFormSchema = z.object({
  dataSubjectIdentifier: z
    .string()
    .trim()
    .min(1, "Data subject identifier is required")
    .max(500),
  noticeId: z.string().optional(),
  dataAssetId: z.string().optional(),
  purpose: z.string().trim().min(1, "Purpose is required").max(255),
  // yyyy-mm-ddTHH:mm from the datetime-local input; converted to ISO.
  grantedAt: z.string().optional(),
  proofFileId: z.string().trim().max(255).optional(),
});

export type ConsentRecordFormValues = z.infer<typeof consentRecordFormSchema>;

/** "" → undefined so the backend keeps the field unset. */
export function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
