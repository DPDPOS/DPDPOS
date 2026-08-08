import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { ProcessingView } from "./processing-view";

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

describe("ProcessingView (§9.4)", () => {
  beforeEach(reset);

  it("renders activities with asset names and DPIA chips on high-risk rows", async () => {
    renderWithProviders(<ProcessingView />);

    const table = await screen.findByRole("table");
    expect(await within(table).findByText("Payroll administration")).toBeInTheDocument();
    expect(within(table).getByText("Customer support ticketing")).toBeInTheDocument();
    expect(within(table).getByText("Trial outcome processing")).toBeInTheDocument();

    // Asset names resolve from the inventory.
    expect(within(table).getByText("Employee records")).toBeInTheDocument();
    expect(within(table).getByText("Clinical trial data")).toBeInTheDocument();

    // Only HIGH/CRITICAL activities carry the DPIA advisory chip.
    expect(within(table).getAllByText("DPIA likely").length).toBe(2);
    expect(screen.getByText("3 processing activities")).toBeInTheDocument();
  });

  it("filters to DPIA-required activities", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProcessingView />);
    await screen.findByText("Payroll administration");

    await user.click(screen.getByRole("button", { name: "DPIA required" }));

    expect(await screen.findByText("Payroll administration")).toBeInTheDocument();
    expect(screen.getByText("Trial outcome processing")).toBeInTheDocument();
    expect(screen.queryByText("Customer support ticketing")).not.toBeInTheDocument();
  });

  it("shows the DPIA banner when creating an activity on a high-risk asset", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProcessingView />);
    await screen.findByText("Payroll administration");

    await user.click(screen.getByRole("button", { name: "New activity" }));
    const drawer = screen.getByRole("dialog", { name: "New processing activity" });

    await user.type(within(drawer).getByLabelText("Purpose"), "Biometric access control");
    await user.selectOptions(
      within(drawer).getByLabelText("Data asset"),
      "a0000000-0000-4000-8000-000000000003",
    );

    // HIGH/CRITICAL selection surfaces the DPIA advisory.
    expect(
      await within(drawer).findByText("High-risk processing detected"),
    ).toBeInTheDocument();

    await user.click(
      within(drawer).getByRole("button", { name: "Create activity" }),
    );

    const table = await screen.findByRole("table");
    expect(
      await within(table).findByText("Biometric access control"),
    ).toBeInTheDocument();
  });

  it("removes an activity with the soft-delete confirm", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProcessingView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Payroll administration");

    await user.click(
      screen.getByRole("button", { name: "Delete Payroll administration" }),
    );
    expect(screen.getByText(/soft-deleted/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove activity" }));

    await waitForTableChange(table);
    expect(within(table).queryByText("Payroll administration")).not.toBeInTheDocument();
  });
});

async function waitForTableChange(table: HTMLElement) {
  // The refetch swaps rows asynchronously — poll until the row count drops.
  await vi.waitFor(() => {
    expect(
      Array.from(table.querySelectorAll("tbody tr")).some((row) =>
        row.textContent?.includes("Payroll administration"),
      ),
    ).toBe(false);
  });
}
