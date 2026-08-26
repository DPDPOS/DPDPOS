"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { rightsApi } from "./api";
import type {
  CreateRightsRequestPayload,
  ListRightsRequestsQuery,
  UpdateRightsRequestPayload,
} from "./types";

export function useRightsRequests(
  filter: ListRightsRequestsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.rightsRequests(filter),
    queryFn: () => rightsApi.list(filter),
    enabled,
  });
}

export function useRightsRequest(id: string | null) {
  return useQuery({
    queryKey: queryKeys.rightsRequests(id ? { detail: id } : undefined),
    queryFn: () => rightsApi.getById(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateRights() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.rightsRequests() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.rightsMetrics });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
}

export function useCreateRightsRequest() {
  const invalidate = useInvalidateRights();
  return useMutation({
    mutationFn: (body: CreateRightsRequestPayload) => rightsApi.create(body),
    onSuccess: invalidate,
  });
}

export function useUpdateRightsRequest() {
  const invalidate = useInvalidateRights();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateRightsRequestPayload;
    }) => rightsApi.update(id, body),
    onSuccess: invalidate,
  });
}

export function useErasurePack(id: string | null, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.rightsRequests(id ? { detail: id } : undefined), "erasure"],
    queryFn: () => rightsApi.getErasure(id as string),
    enabled: Boolean(id) && enabled,
  });
}

export function useStartErasure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body?: { immediate?: boolean; coolingOffDays?: number };
    }) => rightsApi.startErasure(id, body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.rightsRequests({ detail: vars.id }),
      });
    },
  });
}

export function useConfirmErasureItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: {
        systemKey: string;
        status: "DONE" | "SKIPPED" | "FAILED";
        notes?: string;
      };
    }) => rightsApi.confirmErasureItem(id, body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.rightsRequests({ detail: vars.id }),
      });
    },
  });
}

export function useCompleteErasure() {
  const invalidate = useInvalidateRights();
  return useMutation({
    mutationFn: (id: string) => rightsApi.completeErasure(id),
    onSuccess: invalidate,
  });
}
