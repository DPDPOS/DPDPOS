"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { processingActivitiesApi } from "./api";
import type {
  CreateProcessingActivityPayload,
  UpdateProcessingActivityPayload,
} from "./types";

export function useProcessingActivities(dataAssetId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.processingActivities(dataAssetId),
    queryFn: () => processingActivitiesApi.list({ dataAssetId }),
    enabled,
  });
}

export function useCreateProcessingActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProcessingActivityPayload) =>
      processingActivitiesApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.processingActivities(),
      });
    },
  });
}

export function useUpdateProcessingActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateProcessingActivityPayload;
    }) => processingActivitiesApi.update(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.processingActivities(),
      });
    },
  });
}

export function useDeleteProcessingActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => processingActivitiesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.processingActivities(),
      });
    },
  });
}
