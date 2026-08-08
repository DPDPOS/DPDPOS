import { apiClient } from "@/lib/api/client";
import type { UserResponse } from "./types";

/** GET /api/v1/users — gated by user:read. */
export const usersApi = {
  list: (query?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.list<UserResponse>("/users", query),
};
