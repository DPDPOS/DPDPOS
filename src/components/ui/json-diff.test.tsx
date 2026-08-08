import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JsonDiff } from "./json-diff";

describe("JsonDiff (§9.12)", () => {
  it("shows a created badge and entries when before is null", () => {
    render(<JsonDiff before={null} after={{ severity: "HIGH", title: "Retention gap" }} />);

    expect(screen.getByText(/record created/)).toBeInTheDocument();
    // A created record expands into its fields.
    expect(screen.getByText("severity")).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getAllByText("added")).toHaveLength(2);
  });

  it("renders changed fields as before/after pairs", () => {
    render(
      <JsonDiff
        before={{ status: "UNDER_REVIEW", priority: "LOW" }}
        after={{ status: "APPROVED", priority: "LOW" }}
      />,
    );

    expect(screen.getByText("1 change")).toBeInTheDocument();
    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
    expect(screen.getByText("UNDER_REVIEW")).toBeInTheDocument();
    expect(screen.getByText("APPROVED")).toBeInTheDocument();
    // Unchanged fields are omitted.
    expect(screen.queryByText("priority")).not.toBeInTheDocument();
  });

  it("marks removed fields", () => {
    render(<JsonDiff before={{ legacyFlag: true }} after={{}} />);

    expect(screen.getByText("legacyFlag")).toBeInTheDocument();
    expect(screen.getByText("removed")).toBeInTheDocument();
  });

  it("expands nested object changes inline", () => {
    render(
      <JsonDiff
        before={{ owner: { id: "a", name: "Old" }, count: 1 }}
        after={{ owner: { id: "b", name: "New" }, count: 1 }}
      />,
    );

    // Nested entries surface as dotted paths with inline before/after pairs.
    expect(screen.getByText("owner.id")).toBeInTheDocument();
    expect(screen.getByText("owner.name")).toBeInTheDocument();
    expect(screen.queryByText("count")).not.toBeInTheDocument();
    expect(screen.getByText("Old")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("reports no changes when the values match", () => {
    render(<JsonDiff before={{ a: 1 }} after={{ a: 1 }} />);
    expect(screen.getByText(/No field changes/)).toBeInTheDocument();
    expect(screen.queryByText("added")).not.toBeInTheDocument();
  });
});
