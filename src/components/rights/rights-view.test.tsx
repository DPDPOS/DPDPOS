import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { RightsView } from "./rights-view";

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

describe("RightsView (§9.6)", () => {
  beforeEach(reset);

  it("renders the queue with requester refs, status chips and SLA timers", async () => {
    renderWithProviders(<RightsView />);

    const table = await screen.findByRole("table");
    await within(table).findByText("DS-2026-0192");
    expect(within(table).getByText("GR-2026-0044")).toBeInTheDocument();
    expect(within(table).getByText("DS-2026-0145")).toBeInTheDocument();

    // Status chips humanized from the backend enums.
    const body = table.querySelector("tbody") as HTMLElement;
    expect(within(body).getAllByText("In Progress").length).toBe(2);
    expect(within(body).getByText("Assigned")).toBeInTheDocument();
    expect(within(body).getByText("Rejected")).toBeInTheDocument();
    expect(within(body).getByText("Closed")).toBeInTheDocument();
    // Type chips too.
    expect(within(body).getAllByText("Access").length).toBe(2);

    // Every row carries an SLA countdown (clock-independent title).
    expect(within(table).getAllByTitle(/SLA window/).length).toBe(7);
    // Seeded rows 4–7 are due before the demo date → overdue.
    expect(within(table).getAllByText(/Overdue/).length).toBeGreaterThanOrEqual(1);
  });

  it("filters the queue by status", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RightsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("DS-2026-0192");

    await user.click(screen.getByRole("button", { name: "IN PROGRESS" }));

    expect(await within(table).findByText("DS-2026-0210")).toBeInTheDocument();
    expect(within(table).queryByText("DS-2026-0192")).not.toBeInTheDocument();
    expect(within(table).queryByText("DS-2026-0110")).not.toBeInTheDocument();
  });

  it("opens the detail drawer with the lifecycle stepper and status-gated actions", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RightsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("DS-2026-0192");

    await user.click(within(table).getByText("DS-2026-0192"));

    const drawer = await screen.findByRole("dialog", { name: "Request detail" });
    expect(within(drawer).getByText("DS-2026-0192")).toBeInTheDocument();

    // Stepper chain — SUBMITTED appears twice (status chip + step), and is current.
    expect(within(drawer).getAllByText("Submitted").length).toBeGreaterThanOrEqual(1);
    expect(within(drawer).getByText("Current")).toBeInTheDocument();

    // SUBMITTED → assign select + Start + Reject (no Respond/Close yet).
    expect(
      within(drawer).getByRole("combobox", { name: "Assignee" }),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByRole("button", { name: "Start" }),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByRole("button", { name: "Reject" }),
    ).toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: "Respond" }),
    ).not.toBeInTheDocument();
  });

  it("assigns a SUBMITTED request from the drawer", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RightsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("DS-2026-0192");

    await user.click(within(table).getByText("DS-2026-0192"));
    const drawer = await screen.findByRole("dialog", { name: "Request detail" });

    await user.selectOptions(
      within(drawer).getByRole("combobox", { name: "Assignee" }),
      "usr_demo_admin",
    );

    // PATCH succeeded → the refetched request carries assignedTo, so the
    // select's *selected option* flips from "Unassigned" to "Arjun Mehta"
    // (getByDisplayValue on a <select> matches the selected option's text,
    // so this is real persistence proof — not the always-present option).
    expect(
      await within(drawer).findByDisplayValue("Arjun Mehta"),
    ).toBeInTheDocument();
  });

  it("rejects a request — summary is required and becomes part of the audit trail", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RightsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("DS-2026-0192");

    await user.click(within(table).getByText("DS-2026-0192"));
    const drawer = await screen.findByRole("dialog", { name: "Request detail" });
    await user.click(within(drawer).getByRole("button", { name: "Reject" }));

    const dialog = screen.getByRole("dialog", { name: "Reject request" });
    const confirm = within(dialog).getByRole("button", {
      name: "Reject request",
    });
    // Summary is mandatory — disabled until typed.
    expect(confirm).toBeDisabled();

    await user.type(
      within(dialog).getByLabelText("Resolution summary"),
      "Identity could not be verified against records.",
    );
    await user.click(confirm);

    // Terminal state after the PATCH → refetch shows Rejected.
    expect(
      await within(drawer).findByText("Terminal state — no further actions."),
    ).toBeInTheDocument();
  });

  it("shows a terminal CLOSED request without actions but with its resolution", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RightsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("DS-2026-0110");

    await user.click(within(table).getByText("DS-2026-0110"));

    const drawer = await screen.findByRole("dialog", { name: "Request detail" });
    expect(
      within(drawer).getByText("Terminal state — no further actions."),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText("Completed record delivered within SLA."),
    ).toBeInTheDocument();
  });

  it("gates actions on the exact status — IN_PROGRESS gets respond/reject, no assign", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RightsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("DS-2026-0210");

    await user.click(within(table).getByText("DS-2026-0210"));

    const drawer = await screen.findByRole("dialog", { name: "Request detail" });
    // IN_PROGRESS actions — respond + reject, no assignee select.
    expect(
      within(drawer).getByRole("button", { name: "Respond" }),
    ).toBeInTheDocument();
    expect(
      within(drawer).queryByRole("combobox", { name: "Assignee" }),
    ).not.toBeInTheDocument();
  });

  it("submits a new request — the SLA clock starts at the backend-computed due date", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RightsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("DS-2026-0192");

    await user.click(
      screen.getByRole("button", { name: "Submit request" }),
    );
    const drawer = screen.getByRole("dialog", { name: "Submit rights request" });
    await user.type(
      within(drawer).getByLabelText("Requester reference"),
      "DS-2026-TEST-1",
    );
    await user.click(
      within(drawer).getByRole("button", { name: "Submit request" }),
    );

    // Drawer closes on success and the queue refetches with the new row.
    expect(
      await within(table).findByText("DS-2026-TEST-1"),
    ).toBeInTheDocument();
  });

  it("hides assignee selection when the user directory is not readable", async () => {
    const user = userEvent.setup();
    useSessionStore.setState({
      user: {
        ...adminUser,
        permissions: adminUser.permissions.filter((permission) => permission !== "user:read"),
      },
    });
    renderWithProviders(<RightsView />);
    await screen.findByRole("table");

    await user.click(screen.getByRole("button", { name: "Submit request" }));
    const drawer = screen.getByRole("dialog", { name: "Submit rights request" });
    expect(within(drawer).queryByLabelText("Assignee")).not.toBeInTheDocument();
  });
});
