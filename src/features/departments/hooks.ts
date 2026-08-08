"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { departmentsApi } from "./api";
import type { CreateDepartmentPayload } from "./types";

/** Directory list (one 100-row page covers typical orgs). */
export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => departmentsApi.list({ pageSize: 100 }),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDepartmentPayload) => departmentsApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
  });
}
