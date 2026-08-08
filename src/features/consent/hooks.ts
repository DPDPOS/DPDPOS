"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { consentApi } from "./api";
import type {
  CreateConsentRecordPayload,
  ListConsentRecordsQuery,
} from "./types";

export function useConsentRecords(filter: ListConsentRecordsQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.consentRecords(filter),
    queryFn: () => consentApi.list(filter),
    enabled,
  });
}

export function useCreateConsentRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateConsentRecordPayload) => consentApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.consentRecords(),
      });
    },
  });
}

export function useWithdrawConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => consentApi.withdraw(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.consentRecords(),
      });
    },
  });
}
