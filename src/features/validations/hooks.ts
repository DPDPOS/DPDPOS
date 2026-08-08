"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { validationsApi } from "./api";
import { isRunTerminal } from "./types";
import type {
  CreateValidationRulePayload,
  ListValidationRulesQuery,
  ListValidationRunsQuery,
  UpdateValidationRulePayload,
} from "./types";

/**
 * Run list — polls every 3 s while any row is PENDING/RUNNING, then settles
 * (§7.7 async resources; same pattern as reports).
 */
export function useValidationRuns(
  query: ListValidationRunsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.validationRuns(query),
    queryFn: () => validationsApi.runs(query),
    enabled,
    refetchInterval: (queryState) =>
      (queryState.state.data ?? []).some((run) => !isRunTerminal(run.status))
        ? 3000
        : false,
  });
}

/** Run detail — polls at 2 s while the run itself is still non-terminal. */
export function useValidationRun(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.validationRuns(id ? { detail: id } : undefined),
    queryFn: () => validationsApi.run(id as string),
    enabled: Boolean(id) && enabled,
    refetchInterval: (queryState) =>
      queryState.state.data && !isRunTerminal(queryState.state.data.status)
        ? 2000
        : false,
  });
}

function useInvalidateRuns() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.validationRuns() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.validationSummary });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
}

export function useTriggerValidationRun() {
  const invalidate = useInvalidateRuns();
  return useMutation({
    mutationFn: () => validationsApi.triggerRun(),
    onSuccess: invalidate,
  });
}

export function useValidationRules(
  query: ListValidationRulesQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.validationRules(query),
    queryFn: () => validationsApi.rules(query),
    enabled,
  });
}

function useInvalidateRules() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.validationRules() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
}

export function useCreateValidationRule() {
  const invalidate = useInvalidateRules();
  return useMutation({
    mutationFn: (body: CreateValidationRulePayload) =>
      validationsApi.createRule(body),
    onSuccess: invalidate,
  });
}

export function useUpdateValidationRule() {
  const invalidate = useInvalidateRules();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateValidationRulePayload;
    }) => validationsApi.updateRule(id, body),
    onSuccess: invalidate,
    // A 409 means the rule changed under us — resync to the server truth so
    // the stale toggle never sticks.
    onError: invalidate,
  });
}
