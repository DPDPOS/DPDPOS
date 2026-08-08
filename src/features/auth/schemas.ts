import { z } from "zod";

/**
 * Client-side mirrors of dpdpos_backend/src/modules/auth/dto/auth.dto.ts.
 * Field names, rules, and .strict() behaviour match the backend exactly so
 * client and server validation cannot drift.
 */

const uuid = z.string().uuid({ message: "Enter a valid organization ID" });

export const loginSchema = z
  .object({
    organizationId: uuid,
    email: z
      .string({ message: "Email is required" })
      .trim()
      .email({ message: "Enter a valid email address" })
      .max(320),
    password: z
      .string({ message: "Password is required" })
      .min(1, { message: "Password is required" })
      .max(200),
  })
  .strict();

export const mfaVerifySchema = z
  .object({
    mfaToken: z.string().min(1),
    code: z
      .string({ message: "Enter the 6-digit code" })
      .trim()
      .min(6, { message: "Enter the 6-digit code" })
      .max(8),
  })
  .strict();

export const mfaConfirmSchema = z
  .object({
    code: z
      .string({ message: "Enter the 6-digit code" })
      .trim()
      .min(6, { message: "Enter the 6-digit code" })
      .max(8),
  })
  .strict();

export const acceptInviteSchema = z
  .object({
    organizationId: uuid,
    email: z
      .string({ message: "Email is required" })
      .trim()
      .email({ message: "Enter a valid email address" })
      .max(320),
    inviteToken: z
      .string({ message: "Invite token is required" })
      .min(1, { message: "Invite token is required" }),
    password: z
      .string({ message: "Password is required" })
      .min(8, { message: "Use at least 8 characters" })
      .max(200),
    // Client-only: mirrors the confirm field rendered by the accept-invite
    // form. Never sent to the backend — the API schema is exactly the 4 fields
    // above (dpdpos_backend/src/modules/auth/dto/auth.dto.ts).
    confirmPassword: z.string({ message: "Confirm your password" }).min(1),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export const refreshSchema = z
  .object({ refreshToken: z.string().min(1) })
  .strict();

export const logoutSchema = refreshSchema;

export type LoginFormValues = z.infer<typeof loginSchema>;
export type MfaCodeValues = Pick<z.infer<typeof mfaVerifySchema>, "code">;
export type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>;
