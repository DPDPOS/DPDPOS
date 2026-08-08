import { describe, expect, it } from "vitest";
import {
  formatSlaRemaining,
  slaDaysFor,
  slaDueFor,
  slaProgress,
} from "./sla";

describe("rights SLA utils (§9.6)", () => {
  it("maps SLA days per request type (45 for grievance redressal)", () => {
    expect(slaDaysFor("ACCESS")).toBe(30);
    expect(slaDaysFor("ERASURE")).toBe(30);
    expect(slaDaysFor("GRIEVANCE_REDRESSAL")).toBe(45);
    expect(slaDaysFor("UNKNOWN_TYPE")).toBe(30);
  });

  it("prefers the server-computed dueAt", () => {
    const request = {
      requestType: "ACCESS",
      openedAt: "2026-07-20T09:00:00.000Z",
      dueAt: "2026-08-19T09:00:00.000Z",
    };
    expect(slaDueFor(request).toISOString()).toBe("2026-08-19T09:00:00.000Z");
  });

  it("falls back to openedAt + SLA days when dueAt is missing", () => {
    const request = {
      requestType: "ERASURE",
      openedAt: "2026-07-01T09:00:00.000Z",
      dueAt: null,
    };
    expect(slaDueFor(request).toISOString()).toBe("2026-07-31T09:00:00.000Z");
  });

  it("reports overdue once now passes the due date", () => {
    const request = {
      requestType: "ACCESS",
      openedAt: "2026-06-01T09:00:00.000Z",
      dueAt: "2026-07-01T09:00:00.000Z",
    };
    const now = new Date("2026-07-10T09:00:00.000Z").getTime();
    const progress = slaProgress(request, now);
    expect(progress.overdue).toBe(true);
    expect(progress.pct).toBe(1);
    expect(progress.remainingMs).toBeLessThan(0);
  });

  it("reports ~50% elapsed halfway through the window", () => {
    const request = {
      requestType: "ACCESS",
      openedAt: "2026-07-01T09:00:00.000Z",
      dueAt: "2026-07-31T09:00:00.000Z",
    };
    const now = new Date("2026-07-16T09:00:00.000Z").getTime();
    const progress = slaProgress(request, now);
    expect(progress.overdue).toBe(false);
    expect(progress.pct).toBeCloseTo(0.5, 1);
  });

  it("formats remaining time compactly", () => {
    expect(formatSlaRemaining(12 * 86_400_000 + 4 * 3_600_000)).toBe("12d 4h");
    expect(formatSlaRemaining(3 * 3_600_000 + 20 * 60_000)).toBe("3h 20m");
    expect(formatSlaRemaining(45 * 60_000)).toBe("45m");
  });
});
