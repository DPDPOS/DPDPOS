import { apiClient } from "@/lib/api/client";
import type {
  CreateProcessingActivityPayload,
  ProcessingActivityResponse,
  UpdateProcessingActivityPayload,
} from "./types";

/**
 * GET/POST /api/v1/processing-activities, GET/PATCH/DELETE
 * /api/v1/processing-activities/:id. The list endpoint takes an optional
 * `dataAssetId` filter and, like data assets, returns a bare array.
 */
export const processingActivitiesApi = {
  list: (query?: { dataAssetId?: string }) =>
    apiClient.get<ProcessingActivityResponse[]>("/processing-activities", query),
  getById: (id: string) =>
    apiClient.get<ProcessingActivityResponse>(`/processing-activities/${id}`),
  create: (body: CreateProcessingActivityPayload) =>
    apiClient.post<ProcessingActivityResponse>("/processing-activities", body),
  update: (id: string, body: UpdateProcessingActivityPayload) =>
    apiClient.patch<ProcessingActivityResponse>(
      `/processing-activities/${id}`,
      body,
    ),
  remove: (id: string) =>
    apiClient.del<ProcessingActivityResponse>(`/processing-activities/${id}`),
};
