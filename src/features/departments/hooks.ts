"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { departmentsApi } from "./api";

/** Directory list (one 100-row page covers typical orgs). */
export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => departmentsApi.list({ pageSize: 100 }),
  });
}
