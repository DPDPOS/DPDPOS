import { describe, expect, it } from "vitest";
import {
  VIOLATION_STATUSES,
  isViolationTerminal,
  violationActionsFor,
} from "./types";

describe("violation lifecycle mirror (§9.8)", () => {
  it("mirrors the backend canonical chain action-for-action", () => {
    expect(violationActionsFor("OPEN").map((a) => [a.action, a.to])).toEqual([
      ["triage", "TRIAGE"],
      ["assign", "ASSIGNED"],
      ["archive", "ARCHIVED"],
    ]);
    expect(violationActionsFor("TRIAGE").map((a) => [a.action, a.to])).toEqual([
      ["assign", "ASSIGNED"],
      ["start", "IN_PROGRESS"],
      ["archive", "ARCHIVED"],
    ]);
    expect(violationActionsFor("ASSIGNED").map((a) => [a.action, a.to])).toEqual([
      ["start", "IN_PROGRESS"],
      ["archive", "ARCHIVED"],
    ]);
    expect(violationActionsFor("IN_PROGRESS").map((a) => [a.action, a.to])).toEqual([
      ["request_evidence", "PENDING_EVIDENCE"],
      ["validate", "VALIDATED"],
      ["archive", "ARCHIVED"],
    ]);
    expect(
      violationActionsFor("PENDING_EVIDENCE").map((a) => [a.action, a.to]),
    ).toEqual([
      ["submit_evidence", "IN_PROGRESS"],
      ["validate", "VALIDATED"],
      ["archive", "ARCHIVED"],
    ]);
    expect(violationActionsFor("VALIDATED").map((a) => [a.action, a.to])).toEqual([
      ["close", "CLOSED"],
      ["archive", "ARCHIVED"],
    ]);
  });

  it("CLOSED is only reachable from VALIDATED", () => {
    const canClose = (from: string) =>
      violationActionsFor(from).some((a) => a.to === "CLOSED");
    expect(canClose("VALIDATED")).toBe(true);
    for (const from of VIOLATION_STATUSES) {
      if (from !== "VALIDATED") {
        expect(canClose(from)).toBe(false);
      }
    }
  });

  it("ARCHIVED is reachable from every non-terminal state", () => {
    for (const from of VIOLATION_STATUSES) {
      if (!isViolationTerminal(from)) {
        expect(violationActionsFor(from).some((a) => a.to === "ARCHIVED")).toBe(true);
      }
    }
  });

  it("terminal states expose no actions and are immutable", () => {
    expect(violationActionsFor("CLOSED")).toEqual([]);
    expect(violationActionsFor("ARCHIVED")).toEqual([]);
    expect(isViolationTerminal("CLOSED")).toBe(true);
    expect(isViolationTerminal("ARCHIVED")).toBe(true);
    expect(isViolationTerminal("IN_PROGRESS")).toBe(false);
  });

  it("unknown statuses degrade to no actions", () => {
    expect(violationActionsFor("BOGUS" as string)).toEqual([]);
    expect(isViolationTerminal("BOGUS")).toBe(false);
  });
});
