"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { violationsApi } from "./api";
import type { CreateViolationPayload } from "./types";

/** Full flat list — used to index violations by validationResultId (§9.7). */
export function useViolations(enabled = true) {
  return useQuery({
    queryKey: queryKeys.violations(),
    queryFn: () => violationsApi.list(),
    enabled,
    retry: 0,
  });
}

export function useCreateViolation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateViolationPayload) => violationsApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.violations() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.violationBreakdown });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
