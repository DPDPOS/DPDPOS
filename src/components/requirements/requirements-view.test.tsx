import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { RequirementsView } from "./requirements-view";

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

describe("RequirementsView (§9.3)", () => {
  beforeEach(reset);

  it("renders mapped and unmapped obligations", async () => {
    renderWithProviders(<RequirementsView />);

    expect(await screen.findByText("REQ-NOTICE-01")).toBeInTheDocument();
    expect(screen.getByText("Privacy notice content")).toBeInTheDocument();
    expect(screen.getByText("REQ-CONSENT-01")).toBeInTheDocument();
    // Mapped row shows the resolved control code; unmapped shows the chip.
    expect(screen.getByText("CTRL-NOTICE")).toBeInTheDocument();
    expect(screen.getAllByText("Unmapped").length).toBeGreaterThan(0);
    expect(screen.getByText("3 total · page 1 of 1")).toBeInTheDocument();
  });

  it("filters to unmapped obligations only", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RequirementsView />);
    await screen.findByText("REQ-NOTICE-01");

    await user.click(screen.getByRole("switch", { name: "Unmapped only" }));

    expect(await screen.findByText("2 total · page 1 of 1")).toBeInTheDocument();
    expect(screen.getByText("REQ-CONSENT-01")).toBeInTheDocument();
    expect(screen.queryByText("REQ-NOTICE-01")).not.toBeInTheDocument();
  });

  it("maps an unmapped obligation onto a control", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RequirementsView />);
    await screen.findByText("REQ-CONSENT-01");

    const mapButtons = await screen.findAllByRole("button", { name: "Map" });
    await user.click(mapButtons[0]);
    const drawer = screen.getByRole("dialog", { name: "Map REQ-CONSENT-01" });

    await user.selectOptions(
      within(drawer).getByLabelText("Control"),
      "c0000000-0000-4000-8000-000000000002",
    );
    await user.click(
      within(drawer).getByRole("button", { name: "Map obligation" }),
    );

    // After refetch the row now carries the mapped control code.
    expect(await screen.findByText("CTRL-CONSENT")).toBeInTheDocument();
  });
});
