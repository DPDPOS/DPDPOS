import { describe, expect, it } from "vitest";
import {
  REMEDIATION_TASK_STATUSES,
  isRemediationTerminal,
  remediationActionsFor,
} from "./types";

describe("remediation lifecycle mirror (§9.9)", () => {
  it("mirrors the backend canonical chain action-for-action", () => {
    expect(remediationActionsFor("PENDING").map((a) => [a.action, a.to])).toEqual([
      ["start", "IN_PROGRESS"],
      ["cancel", "CANCELLED"],
    ]);
    expect(
      remediationActionsFor("IN_PROGRESS").map((a) => [a.action, a.to]),
    ).toEqual([
      ["submit", "PENDING_VERIFICATION"],
      ["cancel", "CANCELLED"],
    ]);
    expect(
      remediationActionsFor("PENDING_VERIFICATION").map((a) => [a.action, a.to]),
    ).toEqual([
      ["rework", "IN_PROGRESS"],
      ["verify", "VERIFIED"],
      ["cancel", "CANCELLED"],
    ]);
    expect(remediationActionsFor("VERIFIED").map((a) => [a.action, a.to])).toEqual([
      ["close", "CLOSED"],
      ["cancel", "CANCELLED"],
    ]);
  });

  it("CLOSED is only reachable from VERIFIED (verification before closure)", () => {
    const canClose = (from: string) =>
      remediationActionsFor(from).some((a) => a.to === "CLOSED");
    expect(canClose("VERIFIED")).toBe(true);
    for (const from of REMEDIATION_TASK_STATUSES) {
      if (from !== "VERIFIED") {
        expect(canClose(from)).toBe(false);
      }
    }
  });

  it("CANCELLED is reachable from every non-terminal state", () => {
    for (const from of REMEDIATION_TASK_STATUSES) {
      if (!isRemediationTerminal(from)) {
        expect(
          remediationActionsFor(from).some((a) => a.to === "CANCELLED"),
        ).toBe(true);
      }
    }
  });

  it("rework sends PENDING_VERIFICATION back to IN_PROGRESS", () => {
    expect(
      remediationActionsFor("PENDING_VERIFICATION").some(
        (a) => a.action === "rework" && a.to === "IN_PROGRESS",
      ),
    ).toBe(true);
  });

  it("terminal states expose no actions and are immutable", () => {
    expect(remediationActionsFor("CLOSED")).toEqual([]);
    expect(remediationActionsFor("CANCELLED")).toEqual([]);
    expect(isRemediationTerminal("CLOSED")).toBe(true);
    expect(isRemediationTerminal("CANCELLED")).toBe(true);
    expect(isRemediationTerminal("IN_PROGRESS")).toBe(false);
  });

  it("unknown statuses degrade to no actions", () => {
    expect(remediationActionsFor("BOGUS" as string)).toEqual([]);
    expect(isRemediationTerminal("BOGUS")).toBe(false);
  });
});
