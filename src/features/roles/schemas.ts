import { z } from "zod";

/** Mirrors createRoleDtoSchema. */
export const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  permissions: z.array(z.string().min(1)).default([]),
});
export type CreateRoleFormValues = z.infer<typeof createRoleSchema>;

/** Mirrors updateRolePermissionsDtoSchema. */
export const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.string().min(1)),
});
export type UpdateRolePermissionsFormValues = z.infer<
  typeof updateRolePermissionsSchema
>;
