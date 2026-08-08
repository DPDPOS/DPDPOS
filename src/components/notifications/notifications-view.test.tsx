import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { NotificationsView } from "./notifications-view";

const render = (ui: React.ReactElement) => renderWithProviders(ui);

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

describe("NotificationsView (§9.13)", () => {
  beforeEach(reset);

  it("renders the inbox with status chips, types and received times", async () => {
    renderWithProviders(<NotificationsView />);

    const table = await screen.findByRole("table");
    await within(table).findByText("New Violation: Retention gap in HR data");
    expect(
      within(table).getByText("Evidence Approved: consent-log.csv"),
    ).toBeInTheDocument();
    expect(
      within(table).getByText("Validation run found 3 failures"),
    ).toBeInTheDocument();

    const body = table.querySelector("tbody") as HTMLElement;
    expect(within(body).getByText("Violation Created")).toBeInTheDocument();
    // Status chips: SENT rows show "Sent", READ rows "Read", the
    // FAILED (email) row "Failed" — three SENT + two READ rows total.
    expect(within(body).getAllByText("Sent")).toHaveLength(3);
    expect(within(body).getAllByText("Read")).toHaveLength(2);
    expect(within(body).getByText("Failed")).toBeInTheDocument();
  });

  it("filters the inbox by status chip", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("New Violation: Retention gap in HR data");

    await user.click(screen.getByRole("button", { name: "Failed" }));

    expect(await within(table).findByText("SLA Warning")).toBeInTheDocument();
    expect(
      within(table).queryByText("New Violation: Retention gap in HR data"),
    ).not.toBeInTheDocument();
  });

  it("marks a single notification read — the row loses its unread weight", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("New Violation: Retention gap in HR data");

    const row = within(table)
      .getByText("New Violation: Retention gap in HR data")
      .closest("tr") as HTMLElement;
    await user.click(within(row).getByRole("button", { name: "Mark read" }));

    // After the PATCH + refetch the row shows the read glyph, not the action.
    expect(
      await within(row).findByTitle("Read"),
    ).toBeInTheDocument();
    expect(
      within(row).queryByRole("button", { name: "Mark read" }),
    ).not.toBeInTheDocument();
  });

  it("marks all read from the header action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("New Violation: Retention gap in HR data");

    await user.click(screen.getByRole("button", { name: "Mark all read" }));

    // Every row flips to the read glyph.
    expect(
      await within(table).findAllByTitle("Read"),
    ).toHaveLength(6);
    expect(
      screen.queryByRole("button", { name: "Mark read" }),
    ).not.toBeInTheDocument();
  });

  it("deep-links a notification with a related record", async () => {
    renderWithProviders(<NotificationsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("New Violation: Retention gap in HR data");

    const row = within(table)
      .getByText("New Violation: Retention gap in HR data")
      .closest("tr") as HTMLElement;
    expect(
      within(row).getByRole("link", { name: "View related" }),
    ).toHaveAttribute("href", "/violations");
  });

  it("toggles preferences optimistically", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("New Violation: Retention gap in HR data");

    await user.click(screen.getByRole("button", { name: "Preferences" }));
    const dialog = await screen.findByRole("dialog", { name: "Notification preferences" });

    // Seeded defaults: inApp on, email off.
    expect(
      within(dialog).getByRole("switch", { name: "In-app notifications" }),
    ).toHaveAttribute("aria-checked", "true");
    const email = within(dialog).getByRole("switch", { name: "Email notifications" });
    expect(email).toHaveAttribute("aria-checked", "false");

    await user.click(email);
    expect(email).toHaveAttribute("aria-checked", "true");
    expect(await within(dialog).findByText(/Saved/)).toBeInTheDocument();
  });

  it("gates preferences behind notification:update_preferences", () => {
    useSessionStore.setState({
      status: "authenticated",
      accessToken: "at-demo",
      user: {
        ...adminUser,
        permissions: adminUser.permissions.filter((p) => p !== "notification:update_preferences"),
      },
    });

    render(<NotificationsView />);
    expect(
      screen.queryByRole("button", { name: "Preferences" }),
    ).not.toBeInTheDocument();
  });
});
