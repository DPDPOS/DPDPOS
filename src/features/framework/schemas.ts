import { z } from "zod";

/**
 * Mirrors generateFrameworkDtoSchema in framework.dto.ts, plus the wizard
 * profile form (the API fields minus the publish flag, which the wizard
 * controls explicitly). Field names match the backend 1:1.
 */
export const wizardProfileSchema = z.object({
  // Mirrors the backend (trimmed, ≤200) minus the min(1) guard: an untouched
  // optional field is "" after trim, which would otherwise block validation
  // (zod's .optional() only permits undefined, not ""). The wizard fills in
  // a fallback name from the industry profile before calling the API.
  name: z.string().trim().max(200).optional(),
  industryProfile: z
    .string()
    .trim()
    .min(1, "Describe your industry (e.g. healthcare, education)")
    .max(100),
  maturityLevel: z.enum(["basic", "intermediate", "advanced"], {
    message: "Pick a maturity level",
  }),
  dataSensitivity: z.enum(["low", "medium", "high"]),
  departmentCount: z
    .number({ error: "Whole number" })
    .int()
    .min(0, "At least 0")
    .max(10_000),
  processorCount: z
    .number({ error: "Whole number" })
    .int()
    .min(0, "At least 0")
    .max(10_000),
  isSdf: z.boolean(),
});

export type WizardProfileValues = z.infer<typeof wizardProfileSchema>;

export interface GenerateFrameworkPayload {
  name?: string;
  industryProfile: string;
  maturityLevel: "basic" | "intermediate" | "advanced";
  dataSensitivity: "low" | "medium" | "high";
  departmentCount: number;
  processorCount: number;
  isSdf: boolean;
  publish: boolean;
}
