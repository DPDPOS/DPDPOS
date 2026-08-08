/** Mirrors DepartmentResponse in department.types.ts. */
export interface DepartmentResponse {
  id: string;
  organizationId: string;
  name: string;
  headUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors createDepartmentDtoSchema. */
export interface CreateDepartmentPayload {
  name: string;
  headUserId?: string;
}
