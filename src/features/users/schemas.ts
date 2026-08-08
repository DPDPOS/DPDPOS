import { z } from "zod";
import { USER_STATUSES } from "./types";

/** Mirrors createUserDtoSchema (invite). */
export const inviteUserSchema = z.object({
  email: z.string().trim().email().max(320),
  name: z.string().trim().min(1).max(200),
  roleIds: z.array(z.string()).optional(),
});
export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

/** Mirrors updateUserDtoSchema incl. the ≥1-field refine. */
export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    status: z.enum(USER_STATUSES).optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.status !== undefined,
    { message: "At least one field is required" },
  );
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
