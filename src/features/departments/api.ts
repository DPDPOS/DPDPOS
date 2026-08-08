import { apiClient } from "@/lib/api/client";
import type { CreateDepartmentPayload, DepartmentResponse } from "./types";

/** GET /api/v1/departments — gated by department:read. */
export const departmentsApi = {
  list: (query?: { page?: number; pageSize?: number }) =>
    apiClient.list<DepartmentResponse>("/departments", query),
  /** POST /departments — gated by department:create. */
  create: (body: CreateDepartmentPayload) =>
    apiClient.post<DepartmentResponse>("/departments", body),
};
