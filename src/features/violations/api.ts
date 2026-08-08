import { apiClient } from "@/lib/api/client";
import type { CreateViolationPayload, ViolationResponse } from "./types";

/** GET/POST /api/v1/violations — list is a flat unpaginated array. */
export const violationsApi = {
  list: () => apiClient.get<ViolationResponse[]>("/violations"),
  create: (body: CreateViolationPayload) =>
    apiClient.post<ViolationResponse>("/violations", body),
};
