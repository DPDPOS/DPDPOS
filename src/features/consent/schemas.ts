import { z } from "zod";

/** Split a comma-separated purposes string (or array) into trimmed tokens. */
export function parsePurposes(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const parts = Array.isArray(value) ? value : value.split(",");
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** Mirror of createConsentRecordDtoSchema for the create drawer. */
export const consentRecordFormSchema = z.object({
  dataSubjectIdentifier: z
    .string()
    .trim()
    .min(1, "Data subject identifier is required")
    .max(500),
  noticeId: z.string().optional(),
  dataAssetId: z.string().optional(),
  /** Comma-separated purposes — split to `purposes[]` on submit. */
  purposes: z
    .string()
    .trim()
    .min(1, "At least one purpose is required")
    .superRefine((value, ctx) => {
      const purposes = parsePurposes(value);
      if (purposes.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one purpose is required",
        });
        return;
      }
      if (purposes.length > 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At most 20 purposes",
        });
      }
      for (const purpose of purposes) {
        if (purpose.length > 255) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Each purpose must be 255 characters or fewer",
          });
          break;
        }
      }
    }),
  // yyyy-mm-ddTHH:mm from the datetime-local input; converted to ISO.
  grantedAt: z.string().optional(),
  // yyyy-mm-dd from the date input; converted to ISO on submit.
  expiresAt: z.string().optional(),
  proofFileId: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || z.string().uuid().safeParse(value).success,
      { message: "Evidence file ID must be a UUID" },
    ),
});

export type ConsentRecordFormValues = z.infer<typeof consentRecordFormSchema>;

/** "" → undefined so the backend keeps the field unset. */
export function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
