"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import { api } from "@/lib/api/client";
import { Can } from "@/components/ui/can";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { rolesApi } from "@/features/roles/api";
import { usePermission } from "@/hooks/use-permission";

const ENTRA_SCOPES = "openid profile email User.Read GroupMember.Read.All";

type IdentitySettings = {
  mode: string;
  enforceSso: boolean;
  allowLocalBreakGlass: boolean;
  disableLocalTotpWhenFederated: boolean;
  jitProvisioningEnabled: boolean;
  defaultRoleName: string | null;
};

type IdentitySettingsDraft = Partial<
  Pick<
    IdentitySettings,
    | "mode"
    | "enforceSso"
    | "allowLocalBreakGlass"
    | "jitProvisioningEnabled"
    | "defaultRoleName"
  >
>;

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

type GroupRoleMap = {
  id: string;
  providerId: string;
  externalGroupId: string;
  externalGroupName: string | null;
  roleId: string;
  role: { id: string; name: string };
  provider: { id: string; name: string; type: string };
};

export function IdentitySettingsPanel() {
  const hasPermission = usePermission();
  return hasPermission(PERMISSIONS.IDENTITY_READ) ? (
    <IdentitySettingsPanelContent />
  ) : null;
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
  const mapsQuery = useQuery({
    queryKey: ["identity", "group-maps"],
    queryFn: () => api<GroupRoleMap[]>("/identity/group-maps"),
  });
  const rolesQuery = useQuery({
    queryKey: ["roles", "identity-maps"],
    queryFn: () => rolesApi.list({ page: 1, pageSize: 50 }),
  });

  const [settingsDraft, setSettingsDraft] = useState<IdentitySettingsDraft>({});
  const mode = settingsDraft.mode ?? settingsQuery.data?.mode ?? "LOCAL";
  const enforceSso =
    settingsDraft.enforceSso ?? settingsQuery.data?.enforceSso ?? false;
  const allowBreakGlass =
    settingsDraft.allowLocalBreakGlass ??
    settingsQuery.data?.allowLocalBreakGlass ??
    true;
  const jit =
    settingsDraft.jitProvisioningEnabled ??
    settingsQuery.data?.jitProvisioningEnabled ??
    false;
  const defaultRoleName =
    settingsDraft.defaultRoleName ??
    settingsQuery.data?.defaultRoleName ??
    "MEMBER";

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [mapProviderId, setMapProviderId] = useState("");
  const [mapGroupId, setMapGroupId] = useState("");
  const [mapGroupName, setMapGroupName] = useState("");
  const [mapRoleId, setMapRoleId] = useState("");

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

  useEffect(() => {
    const first = providersQuery.data?.[0];
    if (first && !mapProviderId) setMapProviderId(first.id);
  }, [providersQuery.data, mapProviderId]);

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
          defaultRoleName: defaultRoleName || null,
        },
      }),
    onSuccess: async () => {
      setMessage("Identity settings saved.");
      setError(null);
      setSettingsDraft({});
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

  const createMap = useMutation({
    mutationFn: () =>
      api("/identity/group-maps", {
        method: "POST",
        body: {
          providerId: mapProviderId,
          externalGroupId: mapGroupId.trim(),
          externalGroupName: mapGroupName.trim() || null,
          roleId: mapRoleId,
        },
      }),
    onSuccess: async () => {
      setMessage("Group → role map saved. Sign in again (or Sync) to apply.");
      setError(null);
      setMapGroupId("");
      setMapGroupName("");
      await qc.invalidateQueries({ queryKey: ["identity", "group-maps"] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not save group map");
    },
  });

  const deleteMap = useMutation({
    mutationFn: (id: string) =>
      api(`/identity/group-maps/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setMessage("Group map removed.");
      setError(null);
      await qc.invalidateQueries({ queryKey: ["identity", "group-maps"] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not remove group map");
    },
  });

  const syncDirectory = useMutation({
    mutationFn: () =>
      api<{ usersUpdated: number; errorMessage: string | null }>("/identity/sync", {
        method: "POST",
      }),
    onSuccess: async (data) => {
      setMessage(
        `Directory sync updated ${data.usersUpdated} user(s)${data.errorMessage ? `. ${data.errorMessage}` : "."}`,
      );
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Directory sync failed");
    },
  });

  const enableGroupScopes = useMutation({
    mutationFn: () => api("/identity/entra/group-scopes", { method: "POST" }),
    onSuccess: async () => {
      setMessage(
        "Entra provider now requests GroupMember.Read.All. Sign in with Microsoft again.",
      );
      setError(null);
      await qc.invalidateQueries({ queryKey: ["identity", "providers"] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not update Entra scopes");
    },
  });

  const roles = rolesQuery.data?.items ?? [];
  const providers = providersQuery.data ?? [];

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
        <Field label="Default role for JIT users" htmlFor="id-default-role">
          <Select
            id="id-default-role"
            value={defaultRoleName}
            onChange={(e) =>
              setSettingsDraft((current) => ({
                ...current,
                defaultRoleName: e.target.value,
              }))
            }
          >
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-3 space-y-2 text-sm text-ink">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enforceSso}
            onChange={(e) =>
              setSettingsDraft((current) => ({
                ...current,
                enforceSso: e.target.checked,
              }))
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
          {providers.map((p) => (
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
          {providers.length === 0 ? <li>No providers yet.</li> : null}
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
            <div className="flex flex-wrap gap-2">
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
                    scopes: ENTRA_SCOPES,
                  })
                }
              >
                Save Entra provider
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={enableGroupScopes.isPending}
                onClick={() => enableGroupScopes.mutate()}
              >
                Enable group scopes
              </Button>
            </div>
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

      <div className="mt-6 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-ink">Directory group → DPDPOS role</h3>
        <p className="mt-1 text-xs text-ink-2">
          Map an Entra security group object ID (or display name) or an LDAP
          group CN to a DPDPOS role. Applied on login, and when you run Sync
          for Entra users.
        </p>
        <ul className="mt-3 space-y-2 text-xs text-ink-2">
          {(mapsQuery.data ?? []).map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-3">
              <span className="font-mono">
                {row.provider.name} · {row.externalGroupName || row.externalGroupId} →{" "}
                {row.role.name}
              </span>
              <Can perm={PERMISSIONS.IDENTITY_UPDATE}>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={deleteMap.isPending}
                  onClick={() => deleteMap.mutate(row.id)}
                >
                  Remove
                </Button>
              </Can>
            </li>
          ))}
          {(mapsQuery.data ?? []).length === 0 ? (
            <li>No group maps yet.</li>
          ) : null}
        </ul>

        <Can perm={PERMISSIONS.IDENTITY_UPDATE}>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Provider" htmlFor="map-provider">
              <Select
                id="map-provider"
                value={mapProviderId}
                onChange={(e) => setMapProviderId(e.target.value)}
              >
                <option value="">Select provider</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.type} · {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="DPDPOS role" htmlFor="map-role">
              <Select
                id="map-role"
                value={mapRoleId}
                onChange={(e) => setMapRoleId(e.target.value)}
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Entra group object ID or LDAP CN" htmlFor="map-group-id">
              <Input
                id="map-group-id"
                placeholder="e.g. aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee or DPDPOS-DPO"
                value={mapGroupId}
                onChange={(e) => setMapGroupId(e.target.value)}
              />
            </Field>
            <Field label="Group display name (optional)" htmlFor="map-group-name">
              <Input
                id="map-group-name"
                placeholder="DPDPOS-DPO"
                value={mapGroupName}
                onChange={(e) => setMapGroupName(e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={
                createMap.isPending || !mapProviderId || !mapGroupId || !mapRoleId
              }
              onClick={() => createMap.mutate()}
            >
              Save group map
            </Button>
            <Can perm={PERMISSIONS.IDENTITY_SYNC}>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={syncDirectory.isPending}
                onClick={() => syncDirectory.mutate()}
              >
                {syncDirectory.isPending ? "Syncing…" : "Sync Entra groups now"}
              </Button>
            </Can>
          </div>
        </Can>
      </div>
    </section>
  );
}
