import { z } from "zod";
import { REPORT_FORMATS, REPORT_TYPES } from "./types";

export const generateReportSchema = z
  .object({
    reportType: z.enum(REPORT_TYPES),
    title: z.string().trim().max(120, "Keep the title under 120 characters."),
    format: z.enum(REPORT_FORMATS),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.dateFrom && values.dateTo && values.dateTo < values.dateFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateTo"],
        message: "End date must be on or after the start date.",
      });
    }
  });

export type GenerateReportFormValues = z.infer<typeof generateReportSchema>;

export function toGeneratePayload(
  values: GenerateReportFormValues,
): {
  reportType: GenerateReportFormValues["reportType"];
  title?: string;
  format: GenerateReportFormValues["format"];
  parameters?: { dateFrom?: string; dateTo?: string };
} {
  const parameters =
    values.dateFrom || values.dateTo
      ? {
          ...(values.dateFrom ? { dateFrom: new Date(values.dateFrom).toISOString() } : {}),
          ...(values.dateTo ? { dateTo: new Date(values.dateTo).toISOString() } : {}),
        }
      : undefined;
  return {
    reportType: values.reportType,
    ...(values.title ? { title: values.title.trim() } : {}),
    format: values.format,
    ...(parameters ? { parameters } : {}),
  };
}
