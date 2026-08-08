import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, remediationTaskRows, resetTestFixtures } from "@/test/msw/fixtures";
import { RemediationView } from "./remediation-view";

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
  window.history.replaceState({}, "", "/");
  resetTestFixtures();
  useSessionStore.setState({
    status: "authenticated",
    accessToken: "at-demo",
    user: adminUser,
  });
};

describe("RemediationView (§9.9)", () => {
  beforeEach(reset);

  it("renders the queue with source/status chips and violation titles", async () => {
    renderWithProviders(<RemediationView />);

    const table = await screen.findByRole("table");
    await within(table).findByText(
      "Remediation required: Retention overrun on HR records",
    );
    expect(within(table).getByText("Encrypt the backup pipeline")).toBeInTheDocument();

    const body = table.querySelector("tbody") as HTMLElement;
    // Status chips humanized from the backend enums — one row per state.
    expect(within(body).getByText("Pending")).toBeInTheDocument();
    expect(within(body).getByText("In Progress")).toBeInTheDocument();
    expect(within(body).getByText("Pending Verification")).toBeInTheDocument();
    expect(within(body).getByText("Verified")).toBeInTheDocument();
    expect(within(body).getByText("Closed")).toBeInTheDocument();
    expect(within(body).getByText("Cancelled")).toBeInTheDocument();
    // Source chips.
    expect(within(body).getByText("Auto")).toBeInTheDocument();
    expect(within(body).getAllByText("Manual").length).toBeGreaterThanOrEqual(5);
    // Violation titles resolved from the violations directory.
    expect(
      within(body).getAllByText("Retention overrun on HR records").length,
    ).toBe(2);
  });

  it("marks AUTO tasks with the auto-created tooltip", async () => {
    renderWithProviders(<RemediationView />);
    const table = await screen.findByRole("table");
    await within(table).findByText(
      "Remediation required: Retention overrun on HR records",
    );
    const body = table.querySelector("tbody") as HTMLElement;
    expect(
      within(body).getByTitle("Auto-created from a validation failure"),
    ).toBeInTheDocument();
  });

  it("filters the queue by status chip", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RemediationView />);
    const table = await screen.findByRole("table");
    await within(table).findByText(
      "Remediation required: Retention overrun on HR records",
    );

    await user.click(screen.getByRole("button", { name: "PENDING VERIFICATION" }));

    expect(
      await within(table).findByText(
        "Re-run consent verification for renewal cohort",
      ),
    ).toBeInTheDocument();
    expect(
      within(table).queryByText("Encrypt the backup pipeline"),
    ).not.toBeInTheDocument();
    expect(
      within(table).queryByText(
        "Remediation required: Retention overrun on HR records",
      ),
    ).not.toBeInTheDocument();
  });

  it("opens the detail drawer with the stepper and status-gated actions (PENDING)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RemediationView />);
    const table = await screen.findByRole("table");
    await within(table).findByText(
      "Remediation required: Retention overrun on HR records",
    );

    await user.click(
      within(table).getByText("Remediation required: Retention overrun on HR records"),
    );

    const drawer = await screen.findByRole("dialog", { name: "Task detail" });
    expect(within(drawer).getByText("Current")).toBeInTheDocument();

    // PENDING actions — start + cancel only; no verify/close yet.
    expect(within(drawer).getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(
      within(drawer).getByRole("button", { name: "Cancel task" }),
    ).toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: "Verify" }),
    ).not.toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: "Close task" }),
    ).not.toBeInTheDocument();
  });

  it("PENDING_VERIFICATION offers verify + rework, never close", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RemediationView />);
    const table = await screen.findByRole("table");
    await within(table).findByText(
      "Re-run consent verification for renewal cohort",
    );

    await user.click(
      within(table).getByText("Re-run consent verification for renewal cohort"),
    );

    const drawer = await screen.findByRole("dialog", { name: "Task detail" });
    expect(within(drawer).getByRole("button", { name: "Verify" })).toBeInTheDocument();
    expect(
      within(drawer).getByRole("button", { name: "Send back for rework" }),
    ).toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: "Close task" }),
    ).not.toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: "Start" }),
    ).not.toBeInTheDocument();
  });

  // The flow spans four PATCH round-trips with refetches — generous timeout
  // so it stays green under parallel suite load.
  it(
    "verifies then closes — the close summary is required",
    { timeout: 30000 },
    async () => {
      const user = userEvent.setup();
    renderWithProviders(<RemediationView />);
    const table = await screen.findByRole("table");
    await within(table).findByText(
      "Re-run consent verification for renewal cohort",
    );

    await user.click(
      within(table).getByText("Re-run consent verification for renewal cohort"),
    );
    const drawer = await screen.findByRole("dialog", { name: "Task detail" });

    // Verify (notes optional) — the detail loads async, so await the button.
    const verifyButton = await within(drawer).findByRole("button", {
      name: "Verify",
    }, { timeout: 10000 });
    await user.click(verifyButton);
    const verifyDialog = screen.getByRole("dialog", { name: "Verify task" });
    await user.type(
      within(verifyDialog).getByLabelText("Verification notes"),
      "Renewal cohort re-verified against the current notice.",
    );
    await user.click(
      within(verifyDialog).getByRole("button", { name: "Verify task" }),
    );

    // VERIFIED → Close is now available (refetch after PATCH — generous
    // timeout so the suite stays green under parallel load).
    const closeButton = await within(drawer).findByRole("button", {
      name: "Close task",
    }, { timeout: 10000 });
    await user.click(closeButton);

    const closeDialog = screen.getByRole("dialog", { name: "Close task" });
    const confirm = within(closeDialog).getByRole("button", { name: "Close task" });
    expect(confirm).toBeDisabled();

    await user.type(
      within(closeDialog).getByLabelText("Resolution summary"),
      "Verification passed; consent flows re-certified.",
    );
    await user.click(confirm);

      expect(
        await within(drawer).findByText(
          "Terminal state — the task is immutable.",
          {},
          { timeout: 10000 },
        ),
      ).toBeInTheDocument();
    },
  );

  it("recovers from a stale version — the conflict dialog offers reload", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RemediationView />);
    const table = await screen.findByRole("table");
    await within(table).findByText(
      "Re-run consent verification for renewal cohort",
    );

    await user.click(
      within(table).getByText("Re-run consent verification for renewal cohort"),
    );
    const drawer = await screen.findByRole("dialog", { name: "Task detail" });

    // Wait for the task to load (drawer fetches the detail async), then someone
    // else bumps the version server-side — the PATCH carries the now-stale
    // version → 409 → the recovery dialog appears (§7.6).
    const verifyButton = await within(drawer).findByRole("button", {
      name: "Verify",
    }, { timeout: 10000 });
    const task = remediationTaskRows.find(
      (t) => t.id === "rem-00000000-0000-4000-8000-000000000003",
    );
    if (task) task.version += 1;

    await user.click(verifyButton);
    const verifyDialog = screen.getByRole("dialog", { name: "Verify task" });
    await user.click(
      within(verifyDialog).getByRole("button", { name: "Verify task" }),
    );

    expect(
      await screen.findByRole("dialog", { name: "Changed by someone else" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("dialog", { name: "Changed by someone else" }))
        .getByRole("button", { name: "Reload" }),
    ).toBeInTheDocument();
  });

  it("shows cancelled tasks as terminal with their reason", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RemediationView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Refresh notice-consent version mapping");

    await user.click(within(table).getByText("Refresh notice-consent version mapping"));

    const drawer = await screen.findByRole("dialog", { name: "Task detail" });
    expect(
      within(drawer).getByText("Terminal state — the task is immutable."),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText("Superseded by the evidence upload path."),
    ).toBeInTheDocument();
  });

  it("creates a remediation task against a chosen violation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RemediationView />);
    const table = await screen.findByRole("table");
    await within(table).findByText(
      "Remediation required: Retention overrun on HR records",
    );

    await user.click(screen.getByRole("button", { name: "New task" }));
    const drawer = screen.getByRole("dialog", { name: "New remediation task" });
    await user.selectOptions(
      within(drawer).getByLabelText("Violation"),
      "vio-00000000-0000-4000-8000-000000000001",
    );
    await user.type(
      within(drawer).getByLabelText("Task title"),
      "Manual follow-up on retention",
    );
    await user.click(within(drawer).getByRole("button", { name: "Create task" }));

    expect(
      await within(table).findByText("Manual follow-up on retention"),
    ).toBeInTheDocument();
  });
});
