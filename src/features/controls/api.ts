import { apiClient } from "@/lib/api/client";
import type {
  ControlResponse,
  CreateControlPayload,
  UpdateControlPayload,
} from "./types";

export type ListControlsQuery = {
  frameworkId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

/** GET/POST /api/v1/controls, PATCH /api/v1/controls/:id. */
export const controlsApi = {
  list: (query: ListControlsQuery) =>
    apiClient.list<ControlResponse>("/controls", query),
  create: (body: CreateControlPayload) =>
    apiClient.post<ControlResponse>("/controls", body),
  update: (id: string, body: UpdateControlPayload) =>
    apiClient.patch<ControlResponse>(`/controls/${id}`, body),
};
