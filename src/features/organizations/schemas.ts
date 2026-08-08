import { z } from "zod";

/** Mirrors updateOrganizationDtoSchema incl. the ≥1-field refine. */
export const updateOrganizationSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    industry: z.string().trim().min(1).max(120).nullable().optional(),
    companySize: z.string().trim().min(1).max(60).nullable().optional(),
    operatingRegion: z.string().trim().min(1).max(60).nullable().optional(),
    companyType: z.string().trim().min(1).max(60).nullable().optional(),
    maturityLevel: z.string().trim().min(1).max(60).nullable().optional(),
    isSignificantDataFiduciary: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field is required" },
  );
export type UpdateOrganizationFormValues = z.infer<
  typeof updateOrganizationSchema
>;
