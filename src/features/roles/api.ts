import { apiClient } from "@/lib/api/client";
import type { CreateRolePayload, RoleResponse, UpdateRolePermissionsPayload } from "./types";

/**
 * GET/POST /api/v1/roles, PATCH /:id/permissions.
 * GET is paginated — `{ items, meta }` via apiClient.list.
 */
export const rolesApi = {
  list: (query?: { page?: number; pageSize?: number }) =>
    apiClient.list<RoleResponse>("/roles", query),
  create: (body: CreateRolePayload) =>
    apiClient.post<RoleResponse>("/roles", body),
  updatePermissions: (id: string, body: UpdateRolePermissionsPayload) =>
    apiClient.patch<RoleResponse>(`/roles/${id}/permissions`, body),
};
