import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { useUiStore } from "@/state/ui";
import { renderWithProviders } from "@/test/render";
import { adminUser, testUser } from "@/test/msw/fixtures";
import { Topbar } from "./topbar";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
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
  useUiStore.setState({ sidebarCollapsed: false, mobileNavOpen: false });
};

describe("Topbar", () => {
  beforeEach(() => {
    reset();
    useSessionStore.setState({
      status: "authenticated",
      accessToken: "at-demo",
      user: adminUser,
    });
  });

  it("shows breadcrumbs for the current route", () => {
    renderWithProviders(<Topbar />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("polls the unread count and shows the dot", async () => {
    renderWithProviders(<Topbar />);
    // Seeds: 4 rows are not READ (SENT ×3 + FAILED ×1).
    expect(
      await screen.findByLabelText("Notifications (4 unread)"),
    ).toBeInTheDocument();
  });

  it("opens the notification panel listing recent alerts with mark-read", async () => {
    renderWithProviders(<Topbar />);
    fireEvent.click(
      await screen.findByLabelText("Notifications (4 unread)"),
    );
    // The panel lists the inbox feed (backend-shaped rows).
    expect(
      await screen.findByText("New Violation: Retention gap in HR data"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Validation run found 3 failures"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View all notifications" }),
    ).toHaveAttribute("href", "/notifications");
  });

  it("hides the dot without notification:read", async () => {
    useSessionStore.setState({ user: testUser });
    renderWithProviders(<Topbar />);
    // testUser lacks notification:read → the bell is present but undotted.
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  });

  it("refreshes the open notification list after marking all notifications read", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Topbar />);
    await user.click(await screen.findByLabelText("Notifications (4 unread)"));
    await screen.findByText("New Violation: Retention gap in HR data");

    await user.click(screen.getByRole("button", { name: "Mark all read" }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("button", { name: "Read" })).not.toBeInTheDocument();
    });
  });

  it("opens the user menu with session identity", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Topbar />);
    await user.click(screen.getByLabelText("Account menu"));

    // The name appears in the trigger button and the panel.
    expect(screen.getAllByText("Arjun Mehta").length).toBeGreaterThan(0);
    expect(screen.getByText("admin@demo.dpdpos.local")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
  });

  it("opens the search palette with the / shortcut and filters pages", async () => {
    renderWithProviders(<Topbar />);
    fireEvent.keyDown(window, { key: "/" });

    const input = screen.getByLabelText("Search pages");
    expect(input).toBeInTheDocument();

    await userEvent.type(input, "obligation");
    expect(await screen.findByRole("link", { name: /Obligations/i })).toBeInTheDocument();
    expect(screen.queryByText("Soon")).not.toBeInTheDocument();
    expect(screen.queryByText("AI assistant")).not.toBeInTheDocument();
  });
});
