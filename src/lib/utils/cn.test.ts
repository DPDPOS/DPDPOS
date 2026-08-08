import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("skips falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("resolves conflicting tailwind utilities (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("bg-surface", "bg-pass-bg")).toBe("bg-pass-bg");
  });

  it("keeps non-conflicting utilities", () => {
    expect(cn("p-2", "text-sm", "hover:opacity-100")).toBe(
      "p-2 text-sm hover:opacity-100",
    );
  });
});
