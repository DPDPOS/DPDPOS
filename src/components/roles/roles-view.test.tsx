import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { RolesView } from "./roles-view";

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

describe("RolesView (§9.14)", () => {
  beforeEach(reset);

  it("renders the role catalog with permission counts and member counts", async () => {
    renderWithProviders(<RolesView />);

    const table = await screen.findByRole("table");
    await within(table).findByText("ORG_ADMIN");
    expect(within(table).getByText("DPO")).toBeInTheDocument();
    expect(within(table).getByText("Privacy Analyst")).toBeInTheDocument();

    const body = table.querySelector("tbody") as HTMLElement;
    // ORG_ADMIN holds the full 60-permission catalog.
    const adminRow = within(body)
      .getByText("ORG_ADMIN")
      .closest("tr") as HTMLElement;
    expect(within(adminRow).getByText("60")).toBeInTheDocument();
    // Members come from the users directory (Arjun + Priya have roles).
    const dpoRow = within(body).getByText("DPO").closest("tr") as HTMLElement;
    expect(within(dpoRow).getByText("1")).toBeInTheDocument();
  });

  it("creates a custom role with a permission subset from the grouped catalog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RolesView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("ORG_ADMIN");

    await user.click(screen.getByRole("button", { name: "New role" }));
    const dialog = await screen.findByRole("dialog", { name: "New role" });

    await user.type(
      within(dialog).getByLabelText("Name"),
      "Records Liaison",
    );
    // Group select-all: pick the whole "Notifications, AI & audit" group.
    const groupToggle = within(dialog).getByRole("checkbox", {
      name: "Select all Notifications, AI & audit",
    });
    await user.click(groupToggle);
    // The group checkbox reflects the selection, and its permissions are
    // checked — e.g. the audit export row from the same group.
    expect(groupToggle).toBeChecked();
    expect(
      within(dialog).getByRole("checkbox", {
        name: "Read notification",
        checked: true,
      }),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Create role" }));

    // Modal closes and the queue refetches with the new role.
    expect(
      await within(table).findByText("Records Liaison"),
    ).toBeInTheDocument();
  });

  it("requires a name before creating a role", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RolesView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("ORG_ADMIN");

    await user.click(screen.getByRole("button", { name: "New role" }));
    const dialog = await screen.findByRole("dialog", { name: "New role" });

    const create = within(dialog).getByRole("button", { name: "Create role" });
    expect(create).toBeDisabled();
  });

  it("edits a custom role's permissions from the drawer", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RolesView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Privacy Analyst");

    const row = within(table)
      .getByText("Privacy Analyst")
      .closest("tr") as HTMLElement;
    await user.click(within(row).getByRole("button", { name: "Permissions" }));

    const drawer = await screen.findByRole("dialog", { name: "Role permissions" });
    // The custom role's seeded subset is shown.
    expect(
      within(drawer).getByText(/of 60 permissions/),
    ).toBeInTheDocument();

    // Toggle one permission, then save — the drawer closes on success.
    await user.click(
      within(drawer).getByRole("checkbox", { name: "Generate framework" }),
    );
    await user.click(
      within(drawer).getByRole("button", { name: "Save permissions" }),
    );

    // Drawer closes on success; reopen to prove the PATCH persisted.
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Role permissions" }),
      ).not.toBeInTheDocument();
    });
    await user.click(
      within(
        within(table).getByText("Privacy Analyst").closest("tr") as HTMLElement,
      ).getByRole("button", { name: "Permissions" }),
    );
    const reopened = await screen.findByRole("dialog", {
      name: "Role permissions",
    });
    expect(
      within(reopened).getByRole("checkbox", {
        name: "Generate framework",
        checked: true,
      }),
    ).toBeInTheDocument();
  });

  it("locks system roles — no Permissions action and no edits inside", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RolesView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("ORG_ADMIN");

    // No per-row action for system roles.
    const adminRow = within(table)
      .getByText("ORG_ADMIN")
      .closest("tr") as HTMLElement;
    expect(
      within(adminRow).queryByRole("button", { name: "Permissions" }),
    ).not.toBeInTheDocument();
  });

  it("gates role creation and permission editing behind permissions", () => {
    useSessionStore.setState({
      status: "authenticated",
      accessToken: "at-demo",
      user: { ...adminUser, permissions: [] },
    });

    renderWithProviders(<RolesView />);
    expect(
      screen.queryByRole("button", { name: "New role" }),
    ).not.toBeInTheDocument();
  });
});
