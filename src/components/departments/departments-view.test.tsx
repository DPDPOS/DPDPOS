import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { DepartmentsView } from "./departments-view";

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

describe("DepartmentsView (§9.14)", () => {
  beforeEach(reset);

  it("renders the department queue with heads resolved from the directory", async () => {
    renderWithProviders(<DepartmentsView />);

    const table = await screen.findByRole("table");
    await within(table).findByText("Human Resources");
    expect(within(table).getByText("Finance")).toBeInTheDocument();
    expect(within(table).getByText("Research")).toBeInTheDocument();
    expect(within(table).getByText("Sales")).toBeInTheDocument();

    // HR is headed by the demo admin — the name resolves from the users list.
    expect(within(table).getByText("Arjun Mehta")).toBeInTheDocument();
    // Departments without a head show an em dash.
    expect(within(table).getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });

  it("creates a department with an optional head from the directory", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DepartmentsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Human Resources");

    await user.click(screen.getByRole("button", { name: "New department" }));
    const dialog = await screen.findByRole("dialog", { name: "New department" });

    await user.type(
      within(dialog).getByLabelText("Name"),
      "Legal & Privacy",
    );
    await user.selectOptions(
      within(dialog).getByLabelText("Head"),
      "usr_demo_dpo",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Create department" }),
    );

    // Modal closes and the queue refetches with the new row + resolved head.
    expect(
      await within(table).findByText("Legal & Privacy"),
    ).toBeInTheDocument();
    expect(within(table).getByText("Priya Nair")).toBeInTheDocument();
  });

  it("requires a name before creating a department", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DepartmentsView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Human Resources");

    await user.click(screen.getByRole("button", { name: "New department" }));
    const dialog = await screen.findByRole("dialog", { name: "New department" });

    const create = within(dialog).getByRole("button", {
      name: "Create department",
    });
    expect(create).toBeDisabled();
  });

  it("gates the create action behind permissions", () => {
    useSessionStore.setState({
      status: "authenticated",
      accessToken: "at-demo",
      user: { ...adminUser, permissions: [] },
    });

    renderWithProviders(<DepartmentsView />);
    expect(
      screen.queryByRole("button", { name: "New department" }),
    ).not.toBeInTheDocument();
  });
});
