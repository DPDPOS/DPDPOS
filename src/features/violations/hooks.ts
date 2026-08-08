"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { violationsApi } from "./api";
import type {
  CloseViolationPayload,
  CreateViolationPayload,
  ListViolationsQuery,
  UpdateViolationPayload,
} from "./types";

export function useViolations(filter: ListViolationsQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.violations(filter),
    queryFn: () => violationsApi.list(filter),
    enabled,
    retry: 0,
  });
}

/** Full flat list — used to index violations by validationResultId (§9.7). */
export function useAllViolations(enabled = true) {
  return useQuery({
    queryKey: queryKeys.violations(),
    queryFn: () => violationsApi.list(),
    enabled,
    retry: 0,
  });
}

export function useViolation(id: string | null) {
  return useQuery({
    queryKey: queryKeys.violation(id ?? ""),
    queryFn: () => violationsApi.getById(id as string),
    enabled: Boolean(id),
    retry: 0,
  });
}

function useInvalidateViolations() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.violations() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.violationBreakdown });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    // Linked remediation tasks live inside the violation detail (§9.8).
    void queryClient.invalidateQueries({ queryKey: queryKeys.remediation() });
  };
}

export function useCreateViolation() {
  const invalidate = useInvalidateViolations();
  return useMutation({
    mutationFn: (body: CreateViolationPayload) => violationsApi.create(body),
    onSuccess: invalidate,
  });
}

export function useUpdateViolation() {
  const invalidate = useInvalidateViolations();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateViolationPayload }) =>
      violationsApi.update(id, body),
    onSuccess: invalidate,
  });
}

export function useCloseViolation() {
  const invalidate = useInvalidateViolations();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CloseViolationPayload }) =>
      violationsApi.close(id, body),
    onSuccess: invalidate,
  });
}
