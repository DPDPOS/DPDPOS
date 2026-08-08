import { z } from "zod";
import { DATA_SENSITIVITIES } from "./types";

/** Mirror of createDataAssetDtoSchema for the create/edit drawers. */
export const assetFormSchema = z.object({
  assetName: z.string().trim().min(1, "Asset name is required").max(255),
  assetType: z.string().trim().min(1, "Asset type is required").max(100),
  category: z.string().trim().min(1, "Category is required").max(100),
  sensitivity: z.enum(DATA_SENSITIVITIES, { message: "Pick a sensitivity" }),
  description: z.string().trim().max(2000).optional(),
  storageLocation: z.string().trim().max(255).optional(),
  retentionPeriod: z.string().trim().max(255).optional(),
  departmentId: z.string().optional(),
  ownerUserId: z.string().optional(),
});

export type AssetFormValues = z.infer<typeof assetFormSchema>;

/** "" → undefined so the backend keeps the field unset. */
export function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
