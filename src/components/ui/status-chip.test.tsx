import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusChip } from "./status-chip";

describe("StatusChip", () => {
  it("humanizes underscore enum values", () => {
    render(<StatusChip status="PENDING_VERIFICATION" />);
    expect(screen.getByText("Pending Verification")).toBeInTheDocument();
  });

  it("applies the tone classes for a known status", () => {
    const { container } = render(<StatusChip status="FAIL" />);
    const chip = container.firstElementChild;
    expect(chip).toHaveClass("text-fail");
    expect(chip).toHaveClass("bg-fail-bg");
  });

  it("falls back to neutral for unknown statuses", () => {
    const { container } = render(<StatusChip status="SOMETHING_NEW" />);
    const chip = container.firstElementChild;
    expect(chip).toHaveClass("text-neutral");
    expect(chip).toHaveClass("bg-neutral-bg");
  });

  it("maps each control status to a tone", () => {
    const { container, rerender } = render(<StatusChip status="NOT_STARTED" />);
    expect(container.firstElementChild).toHaveClass("text-neutral");

    rerender(<StatusChip status="IN_PROGRESS" />);
    expect(container.firstElementChild).toHaveClass("text-info");

    rerender(<StatusChip status="VERIFIED" />);
    expect(container.firstElementChild).toHaveClass("text-pass");
  });
});
