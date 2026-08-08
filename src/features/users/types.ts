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
