"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { organizationsApi } from "./api";
import type { UpdateOrganizationPayload } from "./types";

export function useOrganization(id: string | null) {
  return useQuery({
    queryKey: queryKeys.organization(id ?? ""),
    queryFn: () => organizationsApi.getById(id as string),
    enabled: Boolean(id),
    retry: 0,
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateOrganizationPayload }) =>
      organizationsApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.organization(id) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentQuestionnaireCatalog,
      });
    },
  });
}
