"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { remediationApi } from "./api";
import type {
  CloseRemediationTaskPayload,
  CreateRemediationTaskPayload,
  ListRemediationTasksQuery,
  UpdateRemediationTaskPayload,
} from "./types";

export function useRemediationTasks(
  filter: ListRemediationTasksQuery = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.remediation(filter),
    queryFn: () => remediationApi.list(filter),
    enabled,
    retry: 0,
  });
}

export function useRemediationTask(id: string | null) {
  return useQuery({
    queryKey: queryKeys.remediation(id ? { detail: id } : undefined),
    queryFn: () => remediationApi.getById(id as string),
    enabled: Boolean(id),
    retry: 0,
  });
}

function useInvalidateRemediation() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.remediation() });
    // The task list lives on the violation detail (§9.8).
    void queryClient.invalidateQueries({ queryKey: queryKeys.violations() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
}

export function useCreateRemediationTask() {
  const invalidate = useInvalidateRemediation();
  return useMutation({
    mutationFn: (body: CreateRemediationTaskPayload) =>
      remediationApi.create(body),
    onSuccess: invalidate,
  });
}

export function useUpdateRemediationTask() {
  const invalidate = useInvalidateRemediation();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateRemediationTaskPayload;
    }) => remediationApi.update(id, body),
    onSuccess: invalidate,
  });
}

export function useCloseRemediationTask() {
  const invalidate = useInvalidateRemediation();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: CloseRemediationTaskPayload;
    }) => remediationApi.close(id, body),
    onSuccess: invalidate,
  });
}
