import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { NoticesView } from "./notices-view";

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

describe("NoticesView (§9.5)", () => {
  beforeEach(reset);

  it("renders the register with version badges and effective dates", async () => {
    renderWithProviders(<NoticesView />);

    const table = await screen.findByRole("table");
    expect(
      await within(table).findByText("Customer data privacy notice"),
    ).toBeInTheDocument();
    expect(within(table).getByText("Marketing communications notice")).toBeInTheDocument();

    // Version column renders mono badges.
    expect(within(table).getAllByText(/^v\d+$/).length).toBeGreaterThan(0);
    expect(within(table).getByText("v2")).toBeInTheDocument();
    expect(screen.getByText("2 privacy notices")).toBeInTheDocument();
  });

  it("creates a notice with the character counter", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NoticesView />);
    await screen.findByText("2 privacy notices");

    await user.click(screen.getByRole("button", { name: "New notice" }));
    const drawer = screen.getByRole("dialog", { name: "New privacy notice" });

    await user.type(
      within(drawer).getByLabelText("Title"),
      "Beta feature notice",
    );
    const content = within(drawer).getByLabelText("Content");
    await user.type(content, "We may process your data for beta features.");
    expect(within(drawer).getByText(/\/ 20,000/)).toBeInTheDocument();

    await user.click(
      within(drawer).getByRole("button", { name: "Publish notice" }),
    );

    const table = await screen.findByRole("table");
    expect(
      await within(table).findByText("Beta feature notice"),
    ).toBeInTheDocument();
    expect(screen.getByText("3 privacy notices")).toBeInTheDocument();
  });

  it("opens the detail drawer with content and linked consent count", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NoticesView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Marketing communications notice");

    await user.click(
      screen.getByRole("button", { name: "View Marketing communications notice" }),
    );
    const drawer = screen.getByRole("dialog", {
      name: "Marketing communications notice",
    });

    expect(
      within(drawer).getByText(/withdraw this consent at any time/i),
    ).toBeInTheDocument();
    // Two records reference the marketing notice.
    expect(await within(drawer).findByText("2 consent records")).toBeInTheDocument();
  });

  it("deletes a notice with the soft-delete confirm", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NoticesView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Marketing communications notice");

    await user.click(
      screen.getByRole("button", { name: "Delete Marketing communications notice" }),
    );
    expect(screen.getByText(/soft-deleted/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete notice" }));

    await vi.waitFor(() => {
      expect(
        Array.from(table.querySelectorAll("tbody tr")).some((row) =>
          row.textContent?.includes("Marketing communications notice"),
        ),
      ).toBe(false);
    });
  });
});
