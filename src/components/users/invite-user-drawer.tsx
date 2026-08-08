"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import { useRoles } from "@/features/roles/hooks";
import { inviteUserSchema, type InviteUserFormValues } from "@/features/users/schemas";
import { useInviteUser } from "@/features/users/hooks";

interface InviteUserDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function InviteUserDrawer({ open, onClose }: InviteUserDrawerProps) {
  const { data: roles } = useRoles(1, 100, open);
  const inviteMutation = useInviteUser();
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [invited, setInvited] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: "", name: "", roleIds: [] },
  });

  const toggleRole = (id: string) => {
    setRoleIds((current) =>
      current.includes(id) ? current.filter((r) => r !== id) : [...current, id],
    );
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await inviteMutation.mutateAsync({
        email: values.email.trim(),
        name: values.name.trim(),
        roleIds: roleIds.length > 0 ? roleIds : undefined,
      });
      setInvited(true);
    } catch {
      // Surfaced through inviteMutation.isError below.
    }
  });

  const close = () => {
    setInvited(false);
    setRoleIds([]);
    reset();
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={close}
      title={invited ? "Invitation sent" : "Invite user"}
      description="A sign-up link is emailed to the address below."
    >
      {invited ? (
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-surface-2/60 p-4">
            <MailCheck className="size-5 text-pass" aria-hidden />
            <p className="mt-2 text-[13px] font-medium text-ink">Invitation sent</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-2">
              The invite link has been emailed. They will sign in with their own
              password once they accept. You can invite again to resend.
            </p>
          </div>
          <footer className="flex justify-end gap-2 border-t border-border pt-3">
            <Button size="sm" onClick={close}>
              Done
            </Button>
          </footer>
        </div>
      ) : (
        <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
          <Field label="Email" htmlFor="invite-email" error={errors.email?.message}>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              autoComplete="off"
              {...register("email")}
            />
          </Field>

          <Field label="Name" htmlFor="invite-name" error={errors.name?.message}>
            <Input
              id="invite-name"
              placeholder="Full name"
              maxLength={200}
              {...register("name")}
            />
          </Field>

          <Can perm="role:read">
            <Field
              label="Roles"
              htmlFor="invite-roles"
              hint="Optional — unassigned users get no permissions."
            >
              <div
                id="invite-roles"
                className="max-h-56 space-y-1 overflow-y-auto rounded-sm border border-border bg-surface p-1"
              >
                {(roles?.items ?? []).map((role) => (
                  <label
                    key={role.id}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] text-ink transition-colors hover:bg-surface-2"
                  >
                    <input
                      type="checkbox"
                      checked={roleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      aria-label={`Assign role ${role.name}`}
                      className="size-3.5 accent-accent"
                    />
                    <span className="flex-1">{role.name}</span>
                    {role.isSystemRole ? (
                      <span className="text-xs text-ink-3">System</span>
                    ) : null}
                  </label>
                ))}
                {(roles?.items ?? []).length === 0 ? (
                  <p className="px-2 py-2 text-xs text-ink-3">No roles found</p>
                ) : null}
              </div>
            </Field>
          </Can>

          {inviteMutation.isError ? (
            <p role="alert" className="text-xs text-fail">
              {inviteMutation.error instanceof ApiError
                ? inviteMutation.error.message
                : "Could not send the invitation"}
            </p>
          ) : null}

          <footer className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="secondary" size="sm" onClick={close} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send invite"}
            </Button>
          </footer>
        </form>
      )}
    </Drawer>
  );
}
