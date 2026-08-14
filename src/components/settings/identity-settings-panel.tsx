"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import { api } from "@/lib/api/client";
import { Can } from "@/components/ui/can";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { usePermission } from "@/hooks/use-permission";

type IdentitySettings = {
  mode: string;
  enforceSso: boolean;
  allowLocalBreakGlass: boolean;
  disableLocalTotpWhenFederated: boolean;
  jitProvisioningEnabled: boolean;
  defaultRoleName: string | null;
};

type IdentityProvider = {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  issuer: string | null;
  clientId: string | null;
  hasClientSecret: boolean;
  tenantId: string | null;
  ldapHost: string | null;
  ldapPort: number | null;
  ldapUseTls: boolean | null;
};

type IdentitySettingsDraft = Pick<
  IdentitySettings,
  "mode" | "enforceSso" | "allowLocalBreakGlass" | "jitProvisioningEnabled"
>;

export function IdentitySettingsPanel() {
  const hasPermission = usePermission();
  return hasPermission(PERMISSIONS.IDENTITY_READ) ? <IdentitySettingsPanelContent /> : null;
}

function IdentitySettingsPanelContent() {
  const qc = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["identity", "settings"],
    queryFn: () => api<IdentitySettings>("/identity/settings"),
  });
  const providersQuery = useQuery({
    queryKey: ["identity", "providers"],
    queryFn: () => api<IdentityProvider[]>("/identity/providers"),
  });

  const [settingsDraft, setSettingsDraft] = useState<Partial<IdentitySettingsDraft>>({});
  const mode = settingsDraft.mode ?? settingsQuery.data?.mode ?? "LOCAL";
  const enforceSso = settingsDraft.enforceSso ?? settingsQuery.data?.enforceSso ?? false;
  const allowBreakGlass =
    settingsDraft.allowLocalBreakGlass ?? settingsQuery.data?.allowLocalBreakGlass ?? true;
  const jit =
    settingsDraft.jitProvisioningEnabled ?? settingsQuery.data?.jitProvisioningEnabled ?? false;
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [entraName, setEntraName] = useState("Microsoft Entra ID");
  const [issuer, setIssuer] = useState(
    "https://login.microsoftonline.com/{tenant}/v2.0",
  );
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [tenantId, setTenantId] = useState("");

  const [ldapName, setLdapName] = useState("Windows AD");
  const [ldapHost, setLdapHost] = useState("");
  const [ldapPort, setLdapPort] = useState("389");
  const [ldapUseTls, setLdapUseTls] = useState(false);
  const [ldapBaseDn, setLdapBaseDn] = useState("");
  const [ldapFilter, setLdapFilter] = useState(
    "(&(objectClass=inetOrgPerson)(uid={username}))",
  );
  const [ldapBindDn, setLdapBindDn] = useState("");
  const [ldapBindPassword, setLdapBindPassword] = useState("");

  const saveSettings = useMutation({
    mutationFn: () =>
      api<IdentitySettings>("/identity/settings", {
        method: "PATCH",
        body: {
          mode,
          enforceSso,
          allowLocalBreakGlass: allowBreakGlass,
          jitProvisioningEnabled: jit,
          disableLocalTotpWhenFederated: true,
        },
      }),
    onSuccess: async () => {
      setMessage("Identity settings saved.");
      setError(null);
      await qc.invalidateQueries({ queryKey: ["identity"] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Save failed");
    },
  });

  const createProvider = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api("/identity/providers", { method: "POST", body }),
    onSuccess: async () => {
      setMessage("Provider saved.");
      setError(null);
      setClientSecret("");
      setLdapBindPassword("");
      await qc.invalidateQueries({ queryKey: ["identity", "providers"] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Provider save failed");
    },
  });

  const deleteProvider = useMutation({
    mutationFn: (id: string) =>
      api(`/identity/providers/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setMessage("Provider removed.");
      setError(null);
      await qc.invalidateQueries({ queryKey: ["identity", "providers"] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not remove provider");
    },
  });

  return (
    <section className="rounded-md border border-border bg-surface p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-ink">Directory identity</h2>
          <p className="mt-0.5 text-xs text-ink-2">
            Windows AD, Microsoft Entra ID, and Entra with Microsoft 365. Local
            password login remains available unless you enforce SSO.
          </p>
        </div>

        {message ? <p className="mb-3 text-xs text-pass">{message}</p> : null}
        {error ? <p className="mb-3 text-xs text-fail">{error}</p> : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Mode" htmlFor="id-mode">
            <Select
              id="id-mode"
              value={mode}
              onChange={(e) =>
                setSettingsDraft((current) => ({ ...current, mode: e.target.value }))
              }
            >
              <option value="LOCAL">LOCAL</option>
              <option value="OIDC_ENTRA">OIDC_ENTRA (Entra / 365)</option>
              <option value="LDAP_AD">LDAP_AD (Windows AD)</option>
              <option value="SAML_ADFS">SAML_ADFS</option>
              <option value="HYBRID">HYBRID</option>
            </Select>
          </Field>
        </div>

        <div className="mt-3 space-y-2 text-sm text-ink">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enforceSso}
              onChange={(e) =>
                setSettingsDraft((current) => ({ ...current, enforceSso: e.target.checked }))
              }
            />
            Enforce SSO (block normal password login except break-glass)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowBreakGlass}
              onChange={(e) =>
                setSettingsDraft((current) => ({
                  ...current,
                  allowLocalBreakGlass: e.target.checked,
                }))
              }
            />
            Allow local break-glass admin password
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={jit}
              onChange={(e) =>
                setSettingsDraft((current) => ({
                  ...current,
                  jitProvisioningEnabled: e.target.checked,
                }))
              }
            />
            JIT provision users on first directory login
          </label>
        </div>

        <Can perm={PERMISSIONS.IDENTITY_UPDATE}>
          <div className="mt-4">
            <Button
              type="button"
              size="sm"
              disabled={saveSettings.isPending}
              onClick={() => saveSettings.mutate()}
            >
              Save identity settings
            </Button>
          </div>
        </Can>

        <div className="mt-6 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-ink">Configured providers</h3>
          <ul className="mt-2 space-y-2 text-xs text-ink-2">
            {(providersQuery.data ?? []).map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-3">
                <span className="font-mono">
                  {p.type} · {p.name} · {p.enabled ? "enabled" : "disabled"}
                  {p.issuer ? ` · ${p.issuer}` : ""}
                  {p.ldapHost
                    ? ` · ${p.ldapHost}:${p.ldapPort ?? "?"}${p.ldapUseTls ? " (LDAPS)" : " (LDAP)"}`
                    : ""}
                </span>
                <Can perm={PERMISSIONS.IDENTITY_UPDATE}>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={deleteProvider.isPending}
                    onClick={() => deleteProvider.mutate(p.id)}
                  >
                    Remove
                  </Button>
                </Can>
              </li>
            ))}
            {(providersQuery.data ?? []).length === 0 ? (
              <li>No providers yet.</li>
            ) : null}
          </ul>
        </div>

        <Can perm={PERMISSIONS.IDENTITY_UPDATE}>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-2 rounded-md border border-border p-3">
              <h3 className="text-sm font-semibold">Add Entra / Microsoft 365 (OIDC)</h3>
              <Field label="Display name" htmlFor="entra-name">
                <Input
                  id="entra-name"
                  value={entraName}
                  onChange={(e) => setEntraName(e.target.value)}
                />
              </Field>
              <Field label="Issuer" htmlFor="entra-issuer">
                <Input
                  id="entra-issuer"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                />
              </Field>
              <Field label="Tenant ID" htmlFor="entra-tenant">
                <Input
                  id="entra-tenant"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                />
              </Field>
              <Field label="Client ID" htmlFor="entra-client">
                <Input
                  id="entra-client"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </Field>
              <Field label="Client secret" htmlFor="entra-secret">
                <Input
                  id="entra-secret"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </Field>
              <Button
                type="button"
                size="sm"
                disabled={createProvider.isPending}
                onClick={() =>
                  createProvider.mutate({
                    type: "OIDC",
                    name: entraName,
                    enabled: true,
                    issuer: issuer.replace("{tenant}", tenantId || "common"),
                    clientId,
                    clientSecret,
                    tenantId: tenantId || null,
                    scopes: "openid profile email",
                  })
                }
              >
                Save Entra provider
              </Button>
            </div>

            <div className="space-y-2 rounded-md border border-border p-3">
              <h3 className="text-sm font-semibold">Add Windows AD (LDAP)</h3>
              <Field label="Display name" htmlFor="ldap-name">
                <Input
                  id="ldap-name"
                  value={ldapName}
                  onChange={(e) => setLdapName(e.target.value)}
                />
              </Field>
              <Field label="Host" htmlFor="ldap-host">
                <Input
                  id="ldap-host"
                  placeholder="localhost"
                  value={ldapHost}
                  onChange={(e) => setLdapHost(e.target.value)}
                />
              </Field>
              <Field label="Port" htmlFor="ldap-port">
                <Input
                  id="ldap-port"
                  value={ldapPort}
                  onChange={(e) => setLdapPort(e.target.value)}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={ldapUseTls}
                  onChange={(e) => setLdapUseTls(e.target.checked)}
                />
                Use LDAPS (TLS) — uncheck for local OpenLDAP on port 389
              </label>
              <Field label="Base DN" htmlFor="ldap-base">
                <Input
                  id="ldap-base"
                  value={ldapBaseDn}
                  onChange={(e) => setLdapBaseDn(e.target.value)}
                />
              </Field>
              <Field label="User filter" htmlFor="ldap-filter">
                <Input
                  id="ldap-filter"
                  value={ldapFilter}
                  onChange={(e) => setLdapFilter(e.target.value)}
                />
              </Field>
              <Field label="Bind DN" htmlFor="ldap-bind">
                <Input
                  id="ldap-bind"
                  value={ldapBindDn}
                  onChange={(e) => setLdapBindDn(e.target.value)}
                />
              </Field>
              <Field label="Bind password" htmlFor="ldap-bind-pw">
                <Input
                  id="ldap-bind-pw"
                  type="password"
                  value={ldapBindPassword}
                  onChange={(e) => setLdapBindPassword(e.target.value)}
                />
              </Field>
              <Button
                type="button"
                size="sm"
                disabled={createProvider.isPending}
                onClick={() =>
                  createProvider.mutate({
                    type: "LDAP",
                    name: ldapName,
                    enabled: true,
                    ldapHost,
                    ldapPort: Number.parseInt(ldapPort, 10) || 389,
                    ldapUseTls,
                    ldapBaseDn,
                    ldapUserFilter: ldapFilter,
                    ldapBindDn,
                    ldapBindPassword,
                  })
                }
              >
                Save LDAP provider
              </Button>
            </div>
          </div>
        </Can>
    </section>
  );
}
