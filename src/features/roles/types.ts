/** Mirrors RoleResponse in dpdpos_backend roles/types. */
export interface RoleResponse {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors createRoleDtoSchema. */
export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions: string[];
}

/** Mirrors updateRolePermissionsDtoSchema. */
export interface UpdateRolePermissionsPayload {
  permissions: string[];
}
