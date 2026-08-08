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

    // Upcoming routes render disabled with a phase chip.
    const controls = screen.getByText("Controls");
    expect(controls.closest("[aria-disabled='true']")).not.toBeNull();
    expect(screen.getAllByText("P3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("P5").length).toBeGreaterThan(0);
  });

  it("hides whole areas the user cannot read", () => {
    useSessionStore.setState({ user: testUser });
    render(<Sidebar />);

    // testUser holds no read permissions — only the permission-free items.
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.queryByText("Programme")).not.toBeInTheDocument();
    expect(screen.queryByText("Controls")).not.toBeInTheDocument();
    expect(screen.queryByText("System")).not.toBeInTheDocument();
    // The gallery stays reachable from the footer.
    expect(
      screen.getByRole("link", { name: "Component gallery" }),
    ).toBeInTheDocument();
  });

  it("collapses to icons with tooltips instead of labels", () => {
    useUiStore.setState({ sidebarCollapsed: true });
    render(<Sidebar />);

    expect(screen.queryByText("Controls")).not.toBeInTheDocument();
    expect(screen.getByTitle("Controls — arriving in Phase 3")).toBeInTheDocument();
    expect(screen.getByTitle(/Dashboard/)).toBeInTheDocument();
  });
});
