import { apiClient } from "@/lib/api/client";
import type {
  CreateValidationRulePayload,
  ListValidationRunsQuery,
  ListValidationRulesQuery,
  UpdateValidationRulePayload,
  ValidationRuleResponse,
  ValidationRunDetail,
  ValidationRunResponse,
} from "./types";

/**
 * Runs + rules under /api/v1/validation-runs and /api/v1/validation-rules.
 * Both lists are unpaginated bare arrays.
 */
export const validationsApi = {
  runs: (query?: ListValidationRunsQuery) =>
    apiClient.get<ValidationRunResponse[]>("/validation-runs", query),
  run: (id: string) =>
    apiClient.get<ValidationRunDetail>(`/validation-runs/${id}`),
  triggerRun: () =>
    apiClient.post<ValidationRunResponse>("/validation-runs", {
      triggerType: "MANUAL",
    }),

  rules: (query?: ListValidationRulesQuery) =>
    apiClient.get<ValidationRuleResponse[]>("/validation-rules", query),
  createRule: (body: CreateValidationRulePayload) =>
    apiClient.post<ValidationRuleResponse>("/validation-rules", body),
  updateRule: (id: string, body: UpdateValidationRulePayload) =>
    apiClient.patch<ValidationRuleResponse>(`/validation-rules/${id}`, body),
};

