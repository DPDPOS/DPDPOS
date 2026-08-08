import { apiClient } from "@/lib/api/client";
import type { RequirementResponse } from "./types";

export type ListRequirementsQuery = {
  frameworkId?: string;
  unmapped?: boolean;
  page?: number;
  pageSize?: number;
};

/** GET /api/v1/requirements, POST /api/v1/requirements/:id/map. */
export const requirementsApi = {
  list: (query: ListRequirementsQuery) =>
    apiClient.list<RequirementResponse>("/requirements", query),
  map: (id: string, controlId: string) =>
    apiClient.post<RequirementResponse>(`/requirements/${id}/map`, {
      controlId,
    }),
};
