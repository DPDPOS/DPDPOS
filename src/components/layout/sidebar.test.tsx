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

  it("renders nav groups for shipped screens only", () => {
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

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
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
    expect(screen.queryByText("AI assistant")).not.toBeInTheDocument();
    expect(screen.queryByText(/Phase/)).not.toBeInTheDocument();
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
    expect(screen.queryByText("Soon")).not.toBeInTheDocument();
  });

  it("hides whole areas the user cannot read", () => {
    useSessionStore.setState({ user: testUser });
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.queryByText("Programme")).not.toBeInTheDocument();
    expect(screen.queryByText("Controls")).not.toBeInTheDocument();
    expect(screen.queryByText("System")).not.toBeInTheDocument();
  });

  it("collapses to icons with tooltips instead of labels", () => {
    useUiStore.setState({ sidebarCollapsed: true });
    render(<Sidebar />);

    expect(screen.queryByText("Controls")).not.toBeInTheDocument();
    expect(screen.getByTitle(/Dashboard/)).toBeInTheDocument();
  });
});
