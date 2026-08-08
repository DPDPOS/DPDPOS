/** Mirrors DataSensitivity in the Prisma schema. */
export const DATA_SENSITIVITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type DataSensitivity = (typeof DATA_SENSITIVITIES)[number];

/** Mirrors DataAssetStatus in the Prisma schema. */
export const DATA_ASSET_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export type DataAssetStatus = (typeof DATA_ASSET_STATUSES)[number];

/** Mirrors DataAssetResponse in data-asset.types.ts. */
export interface DataAssetResponse {
  id: string;
  assetName: string;
  assetType: string;
  category: string;
  sensitivity: string;
  description: string | null;
  storageLocation: string | null;
  retentionPeriod: string | null;
  departmentId: string | null;
  ownerUserId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors createDataAssetDtoSchema. */
export interface CreateDataAssetPayload {
  assetName: string;
  assetType: string;
  category: string;
  sensitivity: DataSensitivity;
  description?: string;
  storageLocation?: string;
  retentionPeriod?: string;
  departmentId?: string;
  ownerUserId?: string;
}

/** Mirrors updateDataAssetDtoSchema (partial). */
export type UpdateDataAssetPayload = Partial<CreateDataAssetPayload>;

export function humanizeSensitivity(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
