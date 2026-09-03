import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, testUser } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { DashboardView } from "./dashboard-view";

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
  useSessionStore.setState({
    status: "authenticated",
    accessToken: "at-demo",
    user: adminUser,
  });
};

describe("DashboardView", () => {
  beforeEach(reset);

  it("renders live metrics from the analytics overview", async () => {
    renderWithProviders(<DashboardView />);

    // Compliance score row.
    expect(await screen.findByText("Compliance score")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("69 of 96 rules")).toBeInTheDocument();

    // Violations: 5 OPEN + 3 TRIAGE + 4 IN_PROGRESS = 12 active.
    expect(screen.getByText("Open violations")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();

    // Evidence coverage + rights.
    expect(screen.getByText("Evidence coverage")).toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument();
    expect(screen.getByText("Rights requests")).toBeInTheDocument();
    expect(screen.getByText("of 11 total · 5 responded")).toBeInTheDocument();

    // Breakdowns.
    expect(screen.getByText("Violation breakdown")).toBeInTheDocument();
    expect(screen.getByText("Rights requests by type")).toBeInTheDocument();
    expect(screen.getByText("Consent pulse")).toBeInTheDocument();
    expect(screen.getByText("Latest validation run")).toBeInTheDocument();
    // Severity appears in both the metric chips and the breakdown bars.
    expect(screen.getAllByText("Critical").length).toBeGreaterThan(0);
  });

  it("shows a reduced workspace view without analytics:read", async () => {
    useSessionStore.setState({ user: testUser });
    renderWithProviders(<DashboardView />);

    expect(await screen.findByText("Dashboard access")).toBeInTheDocument();
    expect(screen.getByText(/analytics:read/)).toBeInTheDocument();
    expect(screen.queryByText("Compliance score")).not.toBeInTheDocument();
    expect(screen.queryByText("Consent pulse")).not.toBeInTheDocument();
  });

  it("renders skeletons while the overview is pending", () => {
    server.use(
      http.get("/api/analytics/dashboard", () => new Promise<Response>(() => {})),
    );
    const { container } = renderWithProviders(<DashboardView />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    // The header refresh button reflects the in-flight state.
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  it("surfaces a retryable error state when the endpoint fails", async () => {
    server.use(
      http.get("/api/analytics/dashboard", () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: "SERVICE_UNAVAILABLE", message: "Backend is busy" },
          },
          { status: 503 },
        ),
      ),
    );
    renderWithProviders(<DashboardView />);

    expect(
      await screen.findByText("Couldn't load the dashboard"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows the build-programme empty state for an empty organisation", async () => {
    server.use(
      http.get("/api/analytics/dashboard", () =>
        HttpResponse.json({
          success: true,
          data: {
            complianceScore: { score: 0, totalRules: 0, passed: 0, failed: 0 },
            violations: { total: 0, byStatus: {}, bySeverity: {} },
            evidence: { totalControls: 0, controlsWithEvidence: 0, coveragePercent: 0 },
            rightsRequests: {
              total: 0,
              open: 0,
              closed: 0,
              avgResolutionDays: null,
              byType: {},
            },
            consent: { totalRecords: 0, granted: 0, withdrawn: 0, grantedThisMonth: 0, withdrawnThisMonth: 0, expired: 0, expiringSoon: 0 },
          },
        }),
      ),
    );
    renderWithProviders(<DashboardView />);

    expect(
      await screen.findByText("Your compliance programme hasn't been built yet"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Compliance score")).not.toBeInTheDocument();
  });
});
