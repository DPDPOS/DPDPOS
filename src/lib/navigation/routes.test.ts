import { describe, expect, it } from "vitest";
import {
  accessibleRoutes,
  canAccessRoute,
  routeForPathname,
} from "./routes";

const ALL_PERMISSIONS = [
  "analytics:read",
  "framework:read",
  "control:read",
  "requirement:read",
  "data_asset:read",
  "processing_activity:read",
  "notice:read",
  "consent:read",
  "rights_request:read",
  "validation:read",
  "violation:read",
  "remediation:read",
  "evidence:read",
  "report:read",
  "audit:read",
  "notification:read",
  "ai:explain",
  "user:read",
  "role:read",
  "department:read",
  "organization:read",
];

describe("route map permission gating (§5.2/§6.4)", () => {
  it("shows only permission-free routes to a user with no permissions", () => {
    const routes = accessibleRoutes(undefined);
    expect(routes.map((r) => r.href)).toEqual(["/dashboard"]);
  });

  it("exposes shipped routes to a fully-privileged user", () => {
    const routes = accessibleRoutes(ALL_PERMISSIONS);
    expect(routes.length).toBeGreaterThanOrEqual(20);
    expect(routes.map((r) => r.href)).toContain("/controls");
    expect(routes.map((r) => r.href)).toContain("/framework/roadmap");
    expect(routes.map((r) => r.href)).not.toContain("/ai");
  });

  it("filters by the exact backend permission string", () => {
    const routes = accessibleRoutes(["control:read"]);
    const hrefs = routes.map((r) => r.href);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/controls");
    expect(hrefs).not.toContain("/violations");
    expect(hrefs).not.toContain("/evidence");
  });

  it("omits unshipped routes from navigation", () => {
    const routes = accessibleRoutes(ALL_PERMISSIONS);
    expect(routes.every((r) => r.shipped)).toBe(true);
  });

  it("canAccessRoute gates direct URLs", () => {
    expect(canAccessRoute("/dashboard", undefined)).toBe(true);
    expect(canAccessRoute("/controls", ["control:read"])).toBe(true);
    expect(canAccessRoute("/controls", [])).toBe(false);
    expect(canAccessRoute("/unknown", [])).toBe(false);
  });

  it("routeForPathname resolves exact matches only for now", () => {
    expect(routeForPathname("/dashboard")?.label).toBe("Dashboard");
    expect(routeForPathname("/dashboard/foo")).toBeUndefined();
  });
});
