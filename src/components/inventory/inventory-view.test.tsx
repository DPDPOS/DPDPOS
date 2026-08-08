import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { InventoryView } from "./inventory-view";

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

describe("InventoryView (§9.4)", () => {
  beforeEach(reset);

  it("renders the register with sensitivity chips, departments and owners", async () => {
    renderWithProviders(<InventoryView />);

    const table = await screen.findByRole("table");
    expect(await within(table).findByText("Employee records")).toBeInTheDocument();
    expect(within(table).getByText("Customer CRM")).toBeInTheDocument();
    expect(within(table).getByText("Clinical trial data")).toBeInTheDocument();

    // Sensitivity tones: HIGH/CRITICAL render warn/fail chips.
    expect(within(table).getByText("High")).toBeInTheDocument();
    expect(within(table).getByText("Critical")).toBeInTheDocument();

    // Department + owner names resolve from the directory.
    expect(
      await within(table).findByText("Human Resources"),
    ).toBeInTheDocument();
    expect(within(table).getAllByText("Arjun Mehta").length).toBeGreaterThan(0);
    expect(within(table).getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getByText("3 data assets")).toBeInTheDocument();
  });

  it("creates an asset from the drawer", async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryView />);
    await screen.findByText("3 data assets");

    await user.click(screen.getByRole("button", { name: "New asset" }));
    const drawer = screen.getByRole("dialog", { name: "New data asset" });

    await user.type(within(drawer).getByLabelText("Asset name"), "Support tickets");
    await user.type(within(drawer).getByLabelText("Asset type"), "SaaS");
    await user.type(within(drawer).getByLabelText("Category"), "Support");
    await user.click(
      within(drawer).getByRole("button", { name: "Create asset" }),
    );

    const table = await screen.findByRole("table");
    expect(await within(table).findByText("Support tickets")).toBeInTheDocument();
    expect(screen.getByText("4 data assets")).toBeInTheDocument();
  });

  it("archives an asset via the soft-delete confirm", async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Employee records");

    await user.click(screen.getByRole("button", { name: "Archive Employee records" }));
    expect(
      screen.getByText(/archived, not deleted/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Archive asset" }));

    expect(await within(table).findByText("Archived")).toBeInTheDocument();
  });

  it("opens the asset detail drawer with linked processing activities", async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Clinical trial data");

    await user.click(
      within(table).getByRole("button", { name: "View Clinical trial data" }),
    );
    const drawer = screen.getByRole("dialog", { name: "Clinical trial data" });

    expect(within(drawer).getByText("Trial outcome processing")).toBeInTheDocument();
    // High-risk asset → the linked activity carries the DPIA advisory.
    expect(within(drawer).getByText("DPIA likely")).toBeInTheDocument();
    expect(within(drawer).getByText("1 linked")).toBeInTheDocument();
  });

  it("creates a processing activity from the asset detail drawer (locked asset)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<InventoryView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Employee records");

    await user.click(
      within(table).getByRole("button", { name: "View Employee records" }),
    );
    const drawer = screen.getByRole("dialog", { name: "Employee records" });
    await within(drawer).findByText("Payroll administration");

    await user.click(
      within(drawer).getByRole("button", { name: "New activity" }),
    );
    const activityDrawer = screen.getByRole("dialog", {
      name: "New processing activity",
    });

    // The asset is locked to the detail row (also echoed in the DPIA banner).
    expect(
      within(activityDrawer).getAllByText("Employee records").length,
    ).toBeGreaterThan(0);
    // HIGH sensitivity → the DPIA advisory shows immediately.
    expect(
      within(activityDrawer).getByText("High-risk processing detected"),
    ).toBeInTheDocument();

    await user.type(
      within(activityDrawer).getByLabelText("Purpose"),
      "Exit interviews",
    );
    await user.click(
      within(activityDrawer).getByRole("button", { name: "Create activity" }),
    );

    expect(
      await within(drawer).findByText("Exit interviews"),
    ).toBeInTheDocument();
    expect(within(drawer).getByText("2 linked")).toBeInTheDocument();
  });
});
