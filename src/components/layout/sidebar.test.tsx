import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { useUiStore } from "@/state/ui";
import { adminUser, testUser } from "@/test/msw/fixtures";
import { Sidebar } from "./sidebar";

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

describe("Sidebar", () => {
  beforeEach(() => {
    reset();
    useSessionStore.setState({
      status: "authenticated",
      accessToken: "at-demo",
      user: adminUser,
    });
  });

  it("renders nav groups and marks upcoming items with phase chips", () => {
    render(<Sidebar />);

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    for (const group of [
      "Overview",
      "Programme",
      "Operations",
      "Enforcement",
      "Proof",
      "System",
    ]) {
      expect(screen.getByText(group)).toBeInTheDocument();
    }

    // Live routes render as links without a chip.
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    // Phases 3–6 shipped the programme, inventory, transparency and proof screens.
    expect(screen.getByRole("link", { name: "Controls" })).toHaveAttribute(
      "href",
      "/controls",
    );
    expect(screen.getByRole("link", { name: "Obligations" })).toHaveAttribute(
      "href",
      "/requirements",
    );
    expect(screen.getByRole("link", { name: "Inventory" })).toHaveAttribute(
      "href",
      "/inventory",
    );
    expect(screen.getByRole("link", { name: "Processing" })).toHaveAttribute(
      "href",
      "/processing",
    );
    expect(screen.getByRole("link", { name: "Notices" })).toHaveAttribute(
      "href",
      "/notices",
    );
    expect(screen.getByRole("link", { name: "Consent" })).toHaveAttribute(
      "href",
      "/consent",
    );
    expect(screen.getByRole("link", { name: "Evidence" })).toHaveAttribute(
      "href",
      "/evidence",
    );
    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute(
      "href",
      "/reports",
    );

    // Every remaining planned screen is within the build horizon, so they all
    // say "Soon" — nothing is past the phase horizon any more.
    expect(screen.getAllByText("Soon").length).toBeGreaterThan(0);
    expect(screen.queryByText(/^P[1-9]$/)).not.toBeInTheDocument();
  });

  it("hides whole areas the user cannot read", () => {
    useSessionStore.setState({ user: testUser });
    render(<Sidebar />);

    // testUser holds no read permissions — only the permission-free items.
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.queryByText("Programme")).not.toBeInTheDocument();
    expect(screen.queryByText("Controls")).not.toBeInTheDocument();
    expect(screen.queryByText("System")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Component gallery" }),
    ).not.toBeInTheDocument();
  });

  it("collapses to icons with tooltips instead of labels", () => {
    useUiStore.setState({ sidebarCollapsed: true });
    render(<Sidebar />);

    expect(screen.queryByText("Controls")).not.toBeInTheDocument();
    // AI assistant is still upcoming — phases 1-10 are all shipped.
    expect(
      screen.getByTitle("AI assistant — arriving in Phase 5"),
    ).toBeInTheDocument();
    expect(screen.getByTitle(/Dashboard/)).toBeInTheDocument();
  });
});
