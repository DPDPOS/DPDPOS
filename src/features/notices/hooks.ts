"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { noticesApi } from "./api";
import type { CreateNoticePayload } from "./types";

export function useNotices() {
  return useQuery({
    queryKey: queryKeys.notices,
    queryFn: () => noticesApi.list(),
  });
}

export function useCreateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateNoticePayload) => noticesApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notices });
      void queryClient.invalidateQueries({ queryKey: queryKeys.consentRecords() });
    },
  });
}

export function useDeleteNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => noticesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notices });
    },
  });
}
