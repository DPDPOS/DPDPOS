"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { rolesApi } from "./api";
import type { CreateRolePayload, UpdateRolePermissionsPayload } from "./types";

/** Role catalog — up to 100 rows; small enough for a single page. */
export function useRoles(page = 1, pageSize = 100, enabled = true) {
  return useQuery({
    queryKey: queryKeys.roles,
    queryFn: () => rolesApi.list({ page, pageSize }),
    enabled,
    retry: 0,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRolePayload) => rolesApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.roles });
    },
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateRolePermissionsPayload;
    }) => rolesApi.updatePermissions(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      // Permission changes affect every user's effective permission set.
      void queryClient.invalidateQueries({ queryKey: queryKeys.users() });
    },
  });
}
