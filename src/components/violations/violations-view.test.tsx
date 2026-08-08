import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { ViolationsView } from "./violations-view";

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
  // The board/table view preference lives in the URL (?view=) — clear it so a
  // prior test's board toggle does not leak into the next render.
  window.history.replaceState({}, "", "/");
  resetTestFixtures();
  useSessionStore.setState({
    status: "authenticated",
    accessToken: "at-demo",
    user: adminUser,
  });
};

describe("ViolationsView (§9.8)", () => {
  beforeEach(reset);

  it("renders the queue with severity/status chips and assignees", async () => {
    renderWithProviders(<ViolationsView />);

    const table = await screen.findByRole("table");
    await within(table).findByText("Retention overrun on HR records");
    expect(
      within(table).getByText("Unencrypted backup of customer data"),
    ).toBeInTheDocument();

    // Status chips humanized from the backend enums — one row per state.
    const body = table.querySelector("tbody") as HTMLElement;
    expect(within(body).getByText("Open")).toBeInTheDocument();
    expect(within(body).getByText("Triage")).toBeInTheDocument();
    expect(within(body).getByText("Assigned")).toBeInTheDocument();
    expect(within(body).getByText("In Progress")).toBeInTheDocument();
    expect(within(body).getByText("Pending Evidence")).toBeInTheDocument();
    expect(within(body).getByText("Validated")).toBeInTheDocument();
    expect(within(body).getByText("Closed")).toBeInTheDocument();
    expect(within(body).getByText("Archived")).toBeInTheDocument();

    // Severity chips.
    expect(within(body).getByText("Critical")).toBeInTheDocument();
    expect(within(body).getAllByText("High").length).toBe(2);
    expect(within(body).getAllByText("Medium").length).toBe(3);
    expect(within(body).getAllByText("Low").length).toBe(2);

    // Assignee resolved from the directory.
    expect(within(body).getAllByText("Arjun Mehta").length).toBeGreaterThan(0);
  });

  it("filters the queue by status chip", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ViolationsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Retention overrun on HR records");

    await user.click(screen.getByRole("button", { name: "OPEN" }));

    expect(
      await within(table).findByText("Retention overrun on HR records"),
    ).toBeInTheDocument();
    expect(
      within(table).queryByText("Consent not re-verified on renewal"),
    ).not.toBeInTheDocument();
    expect(
      within(table).queryByText("Duplicated notice records"),
    ).not.toBeInTheDocument();
  });

  it("switches to the board view and opens a card", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ViolationsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Retention overrun on HR records");

    await user.click(screen.getByRole("radio", { name: "Board" }));

    // Columns per non-terminal status + a collapsed terminal column.
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Triage")).toBeInTheDocument();
    expect(screen.getByText("Pending Evidence")).toBeInTheDocument();
    expect(screen.getByText("Closed / Archived")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    // Card click opens the detail drawer.
    await user.click(screen.getByText("Retention overrun on HR records"));
    expect(
      await screen.findByRole("dialog", { name: "Violation detail" }),
    ).toBeInTheDocument();
  });

  it("opens the detail drawer with the stepper and status-gated actions (OPEN)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ViolationsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Retention overrun on HR records");

    await user.click(within(table).getByText("Retention overrun on HR records"));

    const drawer = await screen.findByRole("dialog", { name: "Violation detail" });
    expect(within(drawer).getByText("Current")).toBeInTheDocument();

    // OPEN actions — triage + assign (assignee select) + archive. No validate/close yet.
    expect(within(drawer).getByRole("button", { name: "Triage" })).toBeInTheDocument();
    expect(
      within(drawer).getByRole("combobox", { name: "Assignee" }),
    ).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "Archive" })).toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: "Validate" }),
    ).not.toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: "Close violation" }),
    ).not.toBeInTheDocument();
  });

  it("gates Close behind VALIDATED — IN_PROGRESS has no close button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ViolationsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Consent not re-verified on renewal");

    await user.click(within(table).getByText("Consent not re-verified on renewal"));

    const drawer = await screen.findByRole("dialog", { name: "Violation detail" });
    expect(
      within(drawer).queryByRole("button", { name: "Close violation" }),
    ).not.toBeInTheDocument();
    // IN_PROGRESS → request evidence + validate are the forward actions.
    expect(
      within(drawer).getByRole("button", { name: "Request evidence" }),
    ).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "Validate" })).toBeInTheDocument();
  });

  it("closes a VALIDATED violation — summary is required and the record goes terminal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ViolationsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Stale DPO designation on the notice");

    await user.click(within(table).getByText("Stale DPO designation on the notice"));

    const drawer = await screen.findByRole("dialog", { name: "Violation detail" });
    await user.click(
      within(drawer).getByRole("button", { name: "Close violation" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Close violation" });
    const confirm = within(dialog).getByRole("button", { name: "Close violation" });
    expect(confirm).toBeDisabled();

    await user.type(
      within(dialog).getByLabelText("Resolution summary"),
      "DPO details corrected and re-published.",
    );
    await user.click(confirm);

    expect(
      await within(drawer).findByText(
        "Terminal state — the record is immutable.",
        {},
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });

  it("shows terminal violations as immutable with their resolution", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ViolationsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Duplicated notice records");

    await user.click(within(table).getByText("Duplicated notice records"));

    const drawer = await screen.findByRole("dialog", { name: "Violation detail" });
    expect(
      within(drawer).getByText("Terminal state — the record is immutable."),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText("Merged the records and archived the duplicate."),
    ).toBeInTheDocument();
  });

  it("links the source validation result and the evidence requirement", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ViolationsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Validation failed: Notice version mismatch");

    await user.click(within(table).getByText("Validation failed: Notice version mismatch"));

    const drawer = await screen.findByRole("dialog", { name: "Violation detail" });
    expect(
      within(drawer).getByRole("link", { name: "From validation result" }),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByRole("link", { name: "Evidence required" }),
    ).toHaveAttribute("href", "/evidence?violationId=vio-00000000-0000-4000-8000-000000000005");
  });

  it("lists linked remediation tasks inside the violation drawer", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ViolationsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Retention overrun on HR records");

    await user.click(within(table).getByText("Retention overrun on HR records"));

    const drawer = await screen.findByRole("dialog", { name: "Violation detail" });
    expect(
      within(drawer).getByText("Remediation tasks · 2"),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText("Remediation required: Retention overrun on HR records"),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText("Archive HR records past retention"),
    ).toBeInTheDocument();
  });

  it("creates a violation from the header action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ViolationsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Retention overrun on HR records");

    await user.click(screen.getByRole("button", { name: "New violation" }));
    const drawer = screen.getByRole("dialog", { name: "New violation" });
    await user.type(
      within(drawer).getByLabelText("Title"),
      "Test incident opened manually",
    );
    await user.click(within(drawer).getByRole("button", { name: "Create violation" }));

    expect(
      await within(table).findByText("Test incident opened manually"),
    ).toBeInTheDocument();
  });
});
