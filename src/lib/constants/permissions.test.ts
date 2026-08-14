import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSIONS,
  permissionLabel,
} from "./permissions";

/**
 * The catalog is frozen: any new backend permission must land in both files.
 * This test compares against the exact backend strings so the role editor can
 * never drift from the server's permission checks (§9.14).
 */
const BACKEND_CATALOG = [
  // organizations
  "organization:create",
  "organization:read",
  "organization:update",
  // users
  "user:create",
  "user:read",
  "user:update",
  "user:invite",
  // roles
  "role:create",
  "role:read",
  "role:update_permissions",
  "role:assign",
  // departments
  "department:create",
  "department:read",
  "department:update",
  // framework / controls / requirements
  "framework:generate",
  "framework:read",
  "framework:publish",
  "control:create",
  "control:read",
  "control:update",
  "requirement:create",
  "requirement:read",
  // inventory
  "data_asset:create",
  "data_asset:read",
  "data_asset:update",
  "data_asset:delete",
  "processing_activity:create",
  "processing_activity:read",
  "processing_activity:update",
  "processing_activity:delete",
  // notices & consent
  "notice:create",
  "notice:read",
  "notice:delete",
  "consent:create",
  "consent:read",
  "consent:withdraw",
  // rights
  "rights_request:create",
  "rights_request:read",
  "rights_request:update",
  // validations / violations / remediation
  "validation:run",
  "validation:read",
  "violation:create",
  "violation:read",
  "violation:assign",
  "violation:close",
  "remediation:read",
  "remediation:update",
  // evidence / reports / analytics
  "evidence:create",
  "evidence:read",
  "evidence:approve",
  "evidence:export",
  "report:generate",
  "report:read",
  "analytics:read",
  // notifications / ai / audit
  "notification:read",
  "notification:update_preferences",
  "ai:explain",
  "ai:draft",
  "audit:read",
  "audit:export",
  // assessment / CLI spine
  "assessment:create",
  "assessment:read",
  "assessment:update",
  "assessment:evaluate",
  "assessment:cli_token",
  // identity / directory federation
  "identity:read",
  "identity:update",
  "identity:sync",
];

describe("permission catalog mirror (§9.14)", () => {
  it("contains exactly the 68 backend permission strings", () => {
    expect(BACKEND_CATALOG).toHaveLength(68);
    expect([...ALL_PERMISSIONS].sort()).toEqual([...BACKEND_CATALOG].sort());
  });

  it("has no duplicates and every string is a resource:action pair", () => {
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
    for (const permission of ALL_PERMISSIONS) {
      const [resource, action] = permission.split(":");
      expect(resource.length).toBeGreaterThan(0);
      expect(action.length).toBeGreaterThan(0);
    }
  });

  it("groups every catalog string under exactly one editor group", () => {
    const grouped = PERMISSION_GROUPS.flatMap((group) => group.permissions);
    expect([...grouped].sort()).toEqual([...ALL_PERMISSIONS].sort());
    // No group overlaps another.
    const ids = grouped.map((permission) => permission);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("labels permissions readably — data_asset:read → Read data asset", () => {
    expect(permissionLabel(PERMISSIONS.DATA_ASSET_READ)).toBe("Read data asset");
    expect(permissionLabel(PERMISSIONS.ROLE_UPDATE_PERMISSIONS)).toBe(
      "Update permissions role",
    );
  });
});
