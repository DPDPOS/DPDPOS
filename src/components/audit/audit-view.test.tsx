import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { AuditView } from "./audit-view";

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

describe("AuditView (§9.12)", () => {
  beforeEach(reset);

  it("renders the immutable trail with humanized actions, actors and entity refs", async () => {
    renderWithProviders(<AuditView />);

    // Actions humanized from CamelCase event names.
    expect(await screen.findByText("Violation Created")).toBeInTheDocument();
    expect(screen.getByText("Evidence Approved")).toBeInTheDocument();
    expect(screen.getByText("Framework Published")).toBeInTheDocument();

    // Actor resolved from the users directory — scoped to the log stream so
    // the actor filter dropdown options don't collide.
    const stream = screen.getByRole("list");
    expect(within(stream).getByText("Arjun Mehta")).toBeInTheDocument();
    expect(within(stream).getByText("Priya Nair")).toBeInTheDocument();
    // A system event shows as System.
    expect(within(stream).getByText("System")).toBeInTheDocument();

    // Entity refs link into the timeline (ids render truncated to 8 chars).
    expect(within(stream).getByText(/^Violation:vln-0000/)).toBeInTheDocument();
  });

  it("filters the stream by entity type", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuditView />);
    await screen.findByText("Violation Created");

    await user.type(screen.getByLabelText("Entity type"), "EvidenceFile");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(await screen.findByText("Evidence Approved")).toBeInTheDocument();
    expect(screen.queryByText("Violation Created")).not.toBeInTheDocument();
    expect(screen.queryByText("Framework Published")).not.toBeInTheDocument();
  });

  it("opens the entity timeline with a JsonDiff of the change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuditView />);
    await screen.findByText("Violation Created");

    await user.click(screen.getByText(/^Violation:vln-0000/));

    const drawer = await screen.findByRole("dialog", { name: "Entity history" });
    expect(
      within(drawer).getByText(/^Violation:vln-0000/),
    ).toBeInTheDocument();
    // The diff shows the recorded after-state fields.
    expect(await within(drawer).findByText("severity")).toBeInTheDocument();
    expect(within(drawer).getByText("HIGH")).toBeInTheDocument();
  });

  it("loads more rows with cursor pagination and marks the end", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuditView />);
    // First page (limit 4) — the oldest rows are out of view.
    await screen.findByText("Violation Created");
    expect(screen.queryByText("User Invited")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load more" }));

    // Appended page dedupes and reaches the end marker.
    expect(
      await screen.findByText("User Invited"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("End of the audit trail"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Load more" }),
    ).not.toBeInTheDocument();
  });

  it("hides the export button without audit:export", () => {
    useSessionStore.setState({
      status: "authenticated",
      accessToken: "at-demo",
      user: { ...adminUser, permissions: adminUser.permissions.filter((p) => p !== "audit:export") },
    });

    renderWithProviders(<AuditView />);
    expect(
      screen.queryByRole("button", { name: "Export" }),
    ).not.toBeInTheDocument();
  });

  it("opens the export dialog with format options when permitted", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuditView />);
    await screen.findByText("Violation Created");

    await user.click(screen.getByRole("button", { name: "Export" }));

    const dialog = await screen.findByRole("dialog", { name: "Export audit log" });
    expect(within(dialog).getByLabelText("Format")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Download export" }),
    ).toBeInTheDocument();
  });
});
