"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { usersApi } from "./api";
import type { CreateUserPayload, UpdateUserPayload } from "./types";

/** Directory for owner/assignee comboboxes — up to 100 rows in one call. */
export function useUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users({ page: 1, pageSize: 100 }),
    queryFn: () => usersApi.list({ page: 1, pageSize: 100 }),
    enabled,
    retry: 0,
  });
}

/** Server-paginated page for the People screen (§9.14). */
export function useUsersPage(page: number, pageSize: number) {
  return useQuery({
    queryKey: queryKeys.users({ page, pageSize }),
    queryFn: () => usersApi.list({ page, pageSize }),
    retry: 0,
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.roles });
  };
}

export function useInviteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (body: CreateUserPayload) => usersApi.invite(body),
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserPayload }) =>
      usersApi.update(id, body),
    onSuccess: invalidate,
  });
}
