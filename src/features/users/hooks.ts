"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { usersApi } from "./api";

/** Directory for owner/assignee comboboxes — up to 100 rows in one call. */
export function useUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users({ page: 1, pageSize: 100 }),
    queryFn: () => usersApi.list({ page: 1, pageSize: 100 }),
    enabled,
    retry: 0,
  });
}
