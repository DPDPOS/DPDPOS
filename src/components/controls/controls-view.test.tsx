import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { ControlsView } from "./controls-view";

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

describe("ControlsView (§9.3)", () => {
  beforeEach(reset);

  it("renders the register with owners and status chips", async () => {
    renderWithProviders(<ControlsView />);

    const table = await screen.findByRole("table");
    expect(await within(table).findByText("CTRL-NOTICE")).toBeInTheDocument();
    expect(within(table).getByText("Privacy notice program")).toBeInTheDocument();
    // Owner names resolve from the directory — two rows share the admin.
    expect((await within(table).findAllByText("Arjun Mehta")).length).toBeGreaterThan(0);
    // Status chips in the rows — the filter chips render the same labels, so
    // scope to the table body.
    expect(within(table).getAllByText("Implemented").length).toBeGreaterThan(0);
    expect(within(table).getAllByText("In Progress").length).toBeGreaterThan(0);
    expect(screen.getByText("3 total · page 1 of 1")).toBeInTheDocument();
  });

  it("filters by status", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlsView />);
    await screen.findByText("CTRL-NOTICE");

    await user.click(screen.getByRole("button", { name: "Implemented" }));

    expect(await screen.findByText("1 total · page 1 of 1")).toBeInTheDocument();
    expect(screen.getByText("CTRL-NOTICE")).toBeInTheDocument();
    expect(screen.queryByText("CTRL-CONSENT")).not.toBeInTheDocument();
  });

  it("creates a control from the dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlsView />);
    await screen.findByText("CTRL-NOTICE");

    await user.click(screen.getByRole("button", { name: "New control" }));
    const dialog = screen.getByRole("dialog", { name: "New control" });

    await user.type(within(dialog).getByLabelText("Code"), "CTRL-CUSTOM");
    await user.type(
      within(dialog).getByLabelText("Title"),
      "Custom retention review",
    );
    await user.click(within(dialog).getByRole("button", { name: "Create control" }));

    expect(
      await screen.findByText("Custom retention review"),
    ).toBeInTheDocument();
    expect(screen.getByText("CTRL-CUSTOM")).toBeInTheDocument();
  });

  it("edits a control in the drawer", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlsView />);
    await screen.findByText("CTRL-NOTICE");

    await user.click(screen.getByRole("button", { name: "Edit CTRL-NOTICE" }));
    const drawer = screen.getByRole("dialog", { name: "Edit CTRL-NOTICE" });

    await user.selectOptions(within(drawer).getByLabelText("Status"), "VERIFIED");
    await user.click(
      within(drawer).getByRole("button", { name: "Save changes" }),
    );

    // The refetched row shows the new status chip (scoped to the table — the
    // filter chips render the same label).
    const table = await screen.findByRole("table");
    expect(await within(table).findByText("Verified")).toBeInTheDocument();
  });
});
