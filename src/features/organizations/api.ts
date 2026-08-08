import { apiClient } from "@/lib/api/client";
import type { OrganizationResponse, UpdateOrganizationPayload } from "./types";

/** GET/PATCH /api/v1/organizations/:id — read/update gated by organization:* */
export const organizationsApi = {
  getById: (id: string) =>
    apiClient.get<OrganizationResponse>(`/organizations/${id}`),
  update: (id: string, body: UpdateOrganizationPayload) =>
    apiClient.patch<OrganizationResponse>(`/organizations/${id}`, body),
};
