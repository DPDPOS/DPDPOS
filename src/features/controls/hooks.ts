"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { controlsApi, type ListControlsQuery } from "./api";
import type { CreateControlPayload, UpdateControlPayload } from "./types";

export function useControls(filter: ListControlsQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.controls(filter),
    queryFn: () => controlsApi.list(filter),
    enabled,
  });
}

export function useCreateControl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateControlPayload) => controlsApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.controls() });
    },
  });
}

export function useUpdateControl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateControlPayload }) =>
      controlsApi.update(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.controls() });
    },
  });
}
