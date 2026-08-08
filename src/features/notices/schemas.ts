import { z } from "zod";

/** Content limit mirroring createNoticeDtoSchema. */
export const NOTICE_CONTENT_MAX = 20_000;

/** Mirror of createNoticeDtoSchema for the create drawer. */
export const noticeFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  content: z
    .string()
    .trim()
    .min(1, "Notice content is required")
    .max(NOTICE_CONTENT_MAX, `Keep the notice under ${NOTICE_CONTENT_MAX.toLocaleString()} characters`),
  // yyyy-mm-dd from the date input; converted to ISO on submit.
  effectiveFrom: z.string().optional(),
});

export type NoticeFormValues = z.infer<typeof noticeFormSchema>;
