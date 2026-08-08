import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { ConsentView } from "./consent-view";

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

describe("ConsentView (§9.5)", () => {
  beforeEach(reset);

  it("renders records with state chips, notice versions and assets", async () => {
    renderWithProviders(<ConsentView />);

    const table = await screen.findByRole("table");
    // user@example.com appears on two rows (marketing + newsletter).
    expect(
      (await within(table).findAllByText("user@example.com")).length,
    ).toBe(2);
    expect(within(table).getByText("priya@example.com")).toBeInTheDocument();
    expect(within(table).getByText("Trial participation")).toBeInTheDocument();

    // Granted + withdrawn chips (scoped to the body — the column headers
    // render the same labels); notice version resolved from the notice list.
    const body = table.querySelector("tbody") as HTMLElement;
    expect(within(body).getAllByText("Granted").length).toBe(3);
    expect(within(body).getByText("Withdrawn")).toBeInTheDocument();
    expect(within(body).getAllByText("v2").length).toBe(2);
    expect(within(body).getByText("Customer CRM")).toBeInTheDocument();
    // The withdrawn row is muted.
    expect(
      Array.from(table.querySelectorAll("tbody tr")).some((row) =>
        row.classList.contains("opacity-60"),
      ),
    ).toBe(true);
    expect(screen.getByText("4 consent records")).toBeInTheDocument();
  });

  it("filters by state and searches data subjects", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConsentView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Marketing emails");

    const filterGroup = screen.getByRole("group", {
      name: "Filter by consent state",
    });
    await user.click(
      within(filterGroup).getByRole("button", { name: "Withdrawn" }),
    );

    expect(await within(table).findByText("Newsletter subscription")).toBeInTheDocument();
    expect(within(table).queryByText("Marketing emails")).not.toBeInTheDocument();

    await user.click(within(filterGroup).getByRole("button", { name: "All" }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search data subjects" }),
      "rahul",
    );

    expect(await within(table).findByText("Trial participation")).toBeInTheDocument();
    expect(within(table).queryByText("user@example.com")).not.toBeInTheDocument();
  });

  it("withdraws a granted record with the confirm modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConsentView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Marketing emails");

    const findRow = (label: string) =>
      Array.from(table.querySelectorAll("tbody tr")).find((row) =>
        row.textContent?.includes(label),
      ) as HTMLElement;

    await user.click(
      within(findRow("Marketing emails")).getByRole("button", {
        name: "Withdraw",
      }),
    );
    expect(screen.getByText(/not deleted/i)).toBeInTheDocument();
    expect(screen.getByText(/will be withdrawn/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Withdraw consent" }));

    // The record flips to withdrawn — action gone, chip + tag visible.
    await vi.waitFor(() => {
      const row = findRow("Marketing emails");
      expect(
        within(row).queryByRole("button", { name: "Withdraw" }),
      ).not.toBeInTheDocument();
      expect(within(row).getByText("Withdrawn")).toBeInTheDocument();
      expect(
        within(row).getByText(/Withdrawn · .*/),
      ).toBeInTheDocument();
    });
  });

  it("creates a consent record from the drawer", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConsentView />);
    await screen.findByText("4 consent records");

    await user.click(
      screen.getByRole("button", { name: "New consent record" }),
    );
    const drawer = screen.getByRole("dialog", { name: "New consent record" });

    await user.type(
      within(drawer).getByLabelText("Data subject identifier"),
      "amit@example.com",
    );
    await user.type(within(drawer).getByLabelText("Purpose"), "Product updates");
    await user.selectOptions(
      within(drawer).getByLabelText("Notice"),
      "n0000000-0000-4000-8000-000000000002",
    );
    await user.click(
      within(drawer).getByRole("button", { name: "Create record" }),
    );

    const table = await screen.findByRole("table");
    expect(
      await within(table).findByText("amit@example.com"),
    ).toBeInTheDocument();
    expect(screen.getByText("5 consent records")).toBeInTheDocument();
  });
});
