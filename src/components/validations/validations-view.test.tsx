import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { ValidationsView } from "./validations-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const reset = () => {
  window.localStorage.clear();
  resetTestFixtures();
  useSessionStore.setState({
    status: "authenticated",
    accessToken: "at-demo",
    user: adminUser,
  });
};

describe("ValidationsView (§9.7)", () => {
  beforeEach(reset);

  it("renders the runs tab with status chips, triggers and durations", async () => {
    renderWithProviders(<ValidationsView />);

    const table = await screen.findByRole("table");
    const body = table.querySelector("tbody") as HTMLElement;
    await within(body).findByText("Completed");
    expect(within(body).getByText("Pending")).toBeInTheDocument();
    // Trigger chips — both runs are MANUAL.
    expect(within(body).getAllByText("Manual").length).toBe(2);
    // 102000 ms → "1m 42s"; the queued run has no duration yet.
    expect(within(body).getByText("1m 42s")).toBeInTheDocument();
    expect(within(body).getByText("—")).toBeInTheDocument();
  });

  it("queues a new validation run from the header action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ValidationsView />);
    const table = await screen.findByRole("table");
    const body = table.querySelector("tbody") as HTMLElement;
    await within(body).findByText("Completed");

    await user.click(
      screen.getByRole("button", { name: "Run validation" }),
    );

    // POST /validation-runs → invalidate → the queue now shows two PENDING rows.
    expect(
      (await within(body).findAllByText("Pending")).length,
    ).toBe(2);
  });

  it("opens a run and drives the create-violation chain from a FAIL result", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ValidationsView />);
    const table = await screen.findByRole("table");
    const body = table.querySelector("tbody") as HTMLElement;
    await within(body).findByText("Completed");

    await user.click(within(body).getByText("1m 42s"));

    const drawer = await screen.findByRole("dialog", { name: "Validation run" });
    // Results for the completed run — PASS, FAIL ×2, SKIPPED.
    await within(drawer).findByText("RET-001");
    expect(within(drawer).getByText("NOT-003")).toBeInTheDocument();
    expect(within(drawer).getByText("CONS-001")).toBeInTheDocument();
    // StatusChip humanizes the enums: FAIL → Fail, SKIPPED → Skipped.
    expect(within(drawer).getAllByText("Fail").length).toBe(2);
    expect(within(drawer).getByText("Skipped")).toBeInTheDocument();
    // Evidence required flagged on both failures.
    expect(within(drawer).getAllByText("Evidence required").length).toBe(2);
    // "Why it failed" detail blocks on each FAIL.
    expect(within(drawer).getAllByText("Why it failed").length).toBe(2);
    // Two create-violation actions + the hint line.
    expect(
      within(drawer).getAllByRole("button", { name: "Create violation" })
        .length,
    ).toBe(2);
    expect(
      within(drawer).getByText(/2 failed results/),
    ).toBeInTheDocument();

    // Create a violation for the first FAIL (NOT-003).
    await user.click(
      within(drawer).getAllByRole("button", { name: "Create violation" })[0],
    );

    // Invalidation reloads the violations index → badge replaces the action.
    expect(
      await within(drawer).findByText(
        /Violation created — Privacy notice published for processing/,
      ),
    ).toBeInTheDocument();
    // The other FAIL still offers its action.
    expect(
      within(drawer).getAllByRole("button", { name: "Create violation" })
        .length,
    ).toBe(1);
  });

  it("shows the rule library and toggles a rule with the version-locked PATCH", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ValidationsView />);
    const table = await screen.findByRole("table");
    await within(table.querySelector("tbody") as HTMLElement).findByText(
      "Completed",
    );

    await user.click(screen.getByRole("radio", { name: "Rules" }));

    const rulesTable = await screen.findByRole("table");
    const body = rulesTable.querySelector("tbody") as HTMLElement;
    await within(body).findByText("RET-001");
    expect(within(body).getByText("NOT-003")).toBeInTheDocument();
    expect(within(body).getByText("CONS-001")).toBeInTheDocument();
    // Category + severity chips humanized (two rules are RETENTION).
    expect(within(body).getAllByText("Retention").length).toBe(2);
    expect(within(body).getByText("Critical")).toBeInTheDocument();

    // RET-001 is active → toggle sends { version: 2, activeFlag: false }.
    const toggle = within(body).getByRole("switch", {
      name: "Deactivate RET-001",
    });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await user.click(toggle);

    expect(
      await within(body).findByRole("switch", { name: "Activate RET-001" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("filters the library to active rules only", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ValidationsView />);
    const table = await screen.findByRole("table");
    await within(table.querySelector("tbody") as HTMLElement).findByText(
      "Completed",
    );

    await user.click(screen.getByRole("radio", { name: "Rules" }));
    const rulesTable = await screen.findByRole("table");
    const body = rulesTable.querySelector("tbody") as HTMLElement;
    await within(body).findByText("RET-001");
    // RET-004 is seeded inactive → visible by default.
    expect(within(body).getByText("RET-004")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Active only" }));

    expect(
      await within(body).findByRole("switch", { name: "Deactivate CONS-001" }),
    ).toBeInTheDocument();
    expect(within(body).queryByText("RET-004")).not.toBeInTheDocument();
  });

  it("creates a new rule from the library", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ValidationsView />);
    const table = await screen.findByRole("table");
    await within(table.querySelector("tbody") as HTMLElement).findByText(
      "Completed",
    );

    await user.click(screen.getByRole("radio", { name: "Rules" }));
    const rulesTable = await screen.findByRole("table");
    await within(rulesTable.querySelector("tbody") as HTMLElement).findByText(
      "RET-001",
    );

    await user.click(screen.getByRole("button", { name: "New rule" }));

    const drawer = screen.getByRole("dialog", { name: "New validation rule" });
    await user.type(within(drawer).getByLabelText("Rule code"), "TEST-001");
    await user.type(
      within(drawer).getByLabelText("Title"),
      "Custom rule from the test",
    );
    await user.click(
      within(drawer).getByRole("button", { name: "Create rule" }),
    );

    // POST → invalidate → the library refetches with the new row.
    expect(
      await within(rulesTable).findByText("TEST-001"),
    ).toBeInTheDocument();
  });
});
