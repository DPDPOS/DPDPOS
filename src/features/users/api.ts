import { apiClient } from "@/lib/api/client";
import type { CreateUserPayload, UpdateUserPayload, UserResponse } from "./types";

/** GET /api/v1/users — gated by user:read. */
export const usersApi = {
  list: (query?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.list<UserResponse>("/users", query),
  /** Invite — POST /users, gated by user:create. */
  invite: (body: CreateUserPayload) => apiClient.post<UserResponse>("/users", body),
  /** PATCH /users/:id — gated by user:update. */
  update: (id: string, body: UpdateUserPayload) =>
    apiClient.patch<UserResponse>(`/users/${id}`, body),
};
