/** Mirrors UserResponse in dpdpos_backend users/types. */
export interface UserResponse {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  status: string;
  roleIds: string[];
  roleNames: string[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const USER_STATUSES = ["ACTIVE", "INVITED", "DISABLED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** Mirrors createUserDtoSchema (invite). */
export interface CreateUserPayload {
  email: string;
  name: string;
  roleIds?: string[];
}

/** Mirrors updateUserDtoSchema. */
export interface UpdateUserPayload {
  name?: string;
  status?: UserStatus;
}
