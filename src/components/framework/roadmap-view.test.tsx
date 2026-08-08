import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { RoadmapView } from "./roadmap-view";

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
  useSessionStore.setState({
    status: "authenticated",
    accessToken: "at-demo",
    user: adminUser,
  });
};

describe("RoadmapView (§9.3)", () => {
  beforeEach(reset);

  it("renders the phase stepper with due dates from the roadmap", async () => {
    renderWithProviders(<RoadmapView />);

    expect(await screen.findByText("Foundation")).toBeInTheDocument();
    expect(screen.getByText("Significant Fiduciary")).toBeInTheDocument();
    expect(screen.getByText("CTRL-NOTICE")).toBeInTheDocument();
    expect(screen.getByText("Appoint Data Protection Officer")).toBeInTheDocument();
    // Summary line uses real roadmap counts.
    expect(screen.getByText(/3 controls across 2 phases/)).toBeInTheDocument();
  });

  it("shows the build CTA when no framework exists", async () => {
    server.use(
      http.get("/api/framework/roadmap", () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "No framework found" },
          },
          { status: 404 },
        ),
      ),
    );
    renderWithProviders(<RoadmapView />);

    expect(await screen.findByText("No roadmap yet")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Build your framework/ }),
    ).toHaveAttribute("href", "/framework");
  });
});
