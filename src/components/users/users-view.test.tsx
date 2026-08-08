import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { UsersView } from "./users-view";

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

describe("UsersView (§9.14)", () => {
  beforeEach(reset);

  it("renders the people queue with status chips, roles and last login", async () => {
    renderWithProviders(<UsersView />);

    const table = await screen.findByRole("table");
    await within(table).findByText("Arjun Mehta");
    expect(within(table).getByText("admin@demo.dpdpos.local")).toBeInTheDocument();
    expect(within(table).getByText("Priya Nair")).toBeInTheDocument();
    expect(within(table).getByText("DPO")).toBeInTheDocument();
    expect(within(table).getByText("COMPLIANCE_OFFICER")).toBeInTheDocument();

    // Status chips humanized — INVITED and DISABLED both present.
    const body = table.querySelector("tbody") as HTMLElement;
    expect(within(body).getAllByText("Active").length).toBeGreaterThanOrEqual(3);
    expect(within(body).getByText("Invited")).toBeInTheDocument();
    expect(within(body).getByText("Disabled")).toBeInTheDocument();
    // Never-signed-in users show an em dash for last login.
    expect(within(body).getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("invites a user with roles — the invite drawer closes and the row joins the queue", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UsersView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Arjun Mehta");

    await user.click(screen.getByRole("button", { name: "Invite user" }));
    const drawer = await screen.findByRole("dialog", { name: "Invite user" });

    await user.type(
      within(drawer).getByLabelText("Email"),
      "neha@demo.dpdpos.local",
    );
    await user.type(within(drawer).getByLabelText("Name"), "Neha Gupta");
    // Grant a role from the seeded catalog.
    await user.click(
      within(drawer).getByRole("checkbox", { name: "Assign role DPO" }),
    );
    await user.click(
      within(drawer).getByRole("button", { name: "Send invite" }),
    );

    // Success state flips the drawer (its title becomes "Invitation sent").
    expect(
      await within(drawer).findByText(/The invite link has been emailed/),
    ).toBeInTheDocument();
    expect(
      await within(table).findByText("Neha Gupta"),
    ).toBeInTheDocument();
    // Her row shows the INVITED status and the granted DPO role.
    const nehaRow = within(table)
      .getByText("Neha Gupta")
      .closest("tr") as HTMLElement;
    expect(within(nehaRow).getByText("Invited")).toBeInTheDocument();
    expect(within(nehaRow).getByText("DPO")).toBeInTheDocument();
  });

  it("rejects a duplicate email with the backend conflict message", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UsersView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Arjun Mehta");

    await user.click(screen.getByRole("button", { name: "Invite user" }));
    const drawer = await screen.findByRole("dialog", { name: "Invite user" });

    await user.type(
      within(drawer).getByLabelText("Email"),
      "priya@demo.dpdpos.local",
    );
    await user.type(within(drawer).getByLabelText("Name"), "Duplicate");
    await user.click(
      within(drawer).getByRole("button", { name: "Send invite" }),
    );

    expect(
      await within(drawer).findByText(
        "A user with this email already exists",
      ),
    ).toBeInTheDocument();
  });

  it("edits a user — disabling requires the confirm dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UsersView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Priya Nair");

    const row = within(table).getByText("Priya Nair").closest("tr") as HTMLElement;
    await user.click(within(row).getByRole("button", { name: "Edit" }));

    const drawer = await screen.findByRole("dialog", { name: "Edit user" });
    await user.selectOptions(
      within(drawer).getByLabelText("Status"),
      "DISABLED",
    );
    await user.click(
      within(drawer).getByRole("button", { name: "Save changes" }),
    );

    // Confirm dialog explains the consequence before applying.
    const confirm = await screen.findByRole("dialog", { name: "Disable user" });
    expect(
      within(confirm).getByText(/will not be able to sign in/),
    ).toBeInTheDocument();
    await user.click(
      within(confirm).getByRole("button", { name: "Disable account" }),
    );

    // PATCH applied → Priya's row now shows the disabled chip.
    const priyaRow = within(table).getByText("Priya Nair").closest("tr") as HTMLElement;
    expect(
      await within(priyaRow).findByText("Disabled"),
    ).toBeInTheDocument();
  });

  it("gates the invite and edit actions behind permissions", async () => {
    // Render with a permission-less user — the buttons must not exist.
    useSessionStore.setState({
      status: "authenticated",
      accessToken: "at-demo",
      user: { ...adminUser, permissions: [] },
    });

    renderWithProviders(<UsersView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("Arjun Mehta");

    expect(
      screen.queryByRole("button", { name: "Invite user" }),
    ).not.toBeInTheDocument();

    const row = within(table).getByText("Arjun Mehta").closest("tr") as HTMLElement;
    expect(within(row).queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });
});
