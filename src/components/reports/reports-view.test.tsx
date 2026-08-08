import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { ReportsView } from "./reports-view";

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

describe("ReportsView (§9.11)", () => {
  beforeEach(reset);

  it("renders reports with type, format and status chips", async () => {
    renderWithProviders(<ReportsView />);

    const table = await screen.findByRole("table");
    // Wait for real rows (the table first renders with skeleton rows).
    await within(table).findByText("Board pack — July 2026");
    expect(within(table).getByText("Compliance summary — Q3")).toBeInTheDocument();

    // Status chips — completed/generating/failed labels (scoped to the body;
    // the header buttons carry the same words).
    const body = table.querySelector("tbody") as HTMLElement;
    expect(within(body).getByText("Completed")).toBeInTheDocument();
    expect(within(body).getByText("Generating")).toBeInTheDocument();
    expect(within(body).getByText("Failed")).toBeInTheDocument();
    // Type + format chips — "Compliance summary" appears in the title sub-line
    // and the type badge, so assert with getAllByText.
    expect(within(table).getAllByText("Compliance summary").length).toBeGreaterThan(0);
    expect(within(table).getAllByText("PDF").length).toBeGreaterThan(0);
    expect(await screen.findByText("3 reports generated")).toBeInTheDocument();
  });

  it("generates a report from the modal and it appears as queued", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsView />);
    await screen.findByRole("table");

    await user.click(screen.getByRole("button", { name: "Generate report" }));
    const dialog = screen.getByRole("dialog", { name: "Generate report" });

    await user.selectOptions(
      within(dialog).getByLabelText("Report type"),
      "CONSENT_REPORT",
    );
    await user.type(within(dialog).getByLabelText("Title"), "Consent — August");
    await user.click(
      within(dialog).getByRole("button", { name: "Generate report" }),
    );

    const table = await screen.findByRole("table");
    expect(
      await within(table).findByText("Consent — August"),
    ).toBeInTheDocument();
    // The fresh PENDING row's chip humanizes to "Pending".
    expect(within(table).getAllByText("Pending").length).toBeGreaterThan(0);
  });

  it("cancels a queued report with the confirm modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Compliance summary — Q3");

    const findRow = (label: string) =>
      Array.from(table.querySelectorAll("tbody tr")).find((row) =>
        row.textContent?.includes(label),
      ) as HTMLElement;

    await user.click(
      within(findRow("Compliance summary — Q3")).getByRole("button", {
        name: "Cancel",
      }),
    );
    const dialog = screen.getByRole("dialog", { name: "Cancel this report?" });
    await user.click(
      within(dialog).getByRole("button", { name: "Cancel report" }),
    );

    await vi.waitFor(() => {
      expect(
        within(table).queryByText("Compliance summary — Q3"),
      ).not.toBeInTheDocument();
    });
  });

  it("opens the download URL for a completed report", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const user = userEvent.setup();
    renderWithProviders(<ReportsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Board pack — July 2026");

    const findRow = (label: string) =>
      Array.from(table.querySelectorAll("tbody tr")).find((row) =>
        row.textContent?.includes(label),
      ) as HTMLElement;

    await user.click(
      within(findRow("Board pack — July 2026")).getByRole("button", {
        name: "Download",
      }),
    );

    await vi.waitFor(() => {
      expect(open).toHaveBeenCalledWith(
        expect.stringContaining("reports-bucket.mock"),
        "_blank",
        "noopener,noreferrer",
      );
    });
    open.mockRestore();
  });

  it("offers retry on a failed report", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("EXCEL");

    const findRow = (label: string) =>
      Array.from(table.querySelectorAll("tbody tr")).find((row) =>
        row.textContent?.includes(label),
      ) as HTMLElement;

    await user.click(
      within(findRow("EXCEL")).getByRole("button", { name: "Retry" }),
    );

    // Retry prefills the generate modal with the failed report's type.
    const dialog = screen.getByRole("dialog", { name: "Generate report" });
    expect(within(dialog).getByLabelText("Report type")).toHaveValue(
      "VIOLATION_REPORT",
    );
  });
});
