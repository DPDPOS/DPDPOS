import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { adminUser, testUser } from "@/test/msw/fixtures";
import { RequirePermission } from "./require-permission";
import { RequireRoutePermission } from "./require-route-permission";

const routeState = vi.hoisted(() => ({ pathname: "/dashboard" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => routeState.pathname,
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
  routeState.pathname = "/dashboard";
  useSessionStore.setState({
    status: "authenticated",
    accessToken: "at-demo",
    user: adminUser,
  });
};

describe("RequirePermission (§6.4)", () => {
  beforeEach(reset);

  it("renders children when the user holds the permission", () => {
    render(
      <RequirePermission perm="analytics:read">
        <p>Secret board</p>
      </RequirePermission>,
    );
    expect(screen.getByText("Secret board")).toBeInTheDocument();
    expect(
      screen.queryByText(/You don't have access to this area/),
    ).not.toBeInTheDocument();
  });

  it("renders the 403 screen naming the missing permission", () => {
    useSessionStore.setState({ user: testUser });
    render(
      <RequirePermission perm="analytics:read">
        <p>Secret board</p>
      </RequirePermission>,
    );
    expect(
      screen.getByText("You don't have access to this area"),
    ).toBeInTheDocument();
    expect(screen.getByText("analytics:read")).toBeInTheDocument();
    expect(screen.queryByText("Secret board")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
  });

  it("protects direct navigation using the route catalog", () => {
    routeState.pathname = "/audit";
    useSessionStore.setState({ user: testUser });

    render(
      <RequireRoutePermission>
        <p>Audit contents</p>
      </RequireRoutePermission>,
    );

    expect(screen.getByText("You don't have access to this area")).toBeInTheDocument();
    expect(screen.getByText("audit:read")).toBeInTheDocument();
    expect(screen.queryByText("Audit contents")).not.toBeInTheDocument();
  });
});
