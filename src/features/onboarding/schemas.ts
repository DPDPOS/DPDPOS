import { z } from "zod";

export const onboardingProfileSchema = z
  .object({
    industry: z.string().trim().min(1, { message: "Industry is required" }).max(120),
    companySize: z
      .string()
      .trim()
      .min(1, { message: "Company size is required" })
      .max(60),
    operatingRegion: z
      .string()
      .trim()
      .min(1, { message: "Operating region is required" })
      .max(60),
    companyType: z
      .string()
      .trim()
      .min(1, { message: "Company type is required" })
      .max(60),
    maturityLevel: z
      .string()
      .trim()
      .min(1, { message: "Maturity level is required" })
      .max(60),
    isSignificantDataFiduciary: z.boolean().optional(),
  })
  .strict();

export type OnboardingProfileFormValues = z.infer<typeof onboardingProfileSchema>;
