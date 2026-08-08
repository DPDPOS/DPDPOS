"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { requirementsApi, type ListRequirementsQuery } from "./api";

export function useRequirements(filter: ListRequirementsQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.requirements(filter),
    queryFn: () => requirementsApi.list(filter),
    enabled,
  });
}

export function useMapRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, controlId }: { id: string; controlId: string }) =>
      requirementsApi.map(id, controlId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.requirements() });
      // Mapped obligations change a control's coverage footprint.
      void queryClient.invalidateQueries({ queryKey: queryKeys.controls() });
    },
  });
}
