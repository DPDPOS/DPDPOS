import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { EvidenceView } from "./evidence-view";

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

describe("EvidenceView (§9.10)", () => {
  beforeEach(reset);

  it("renders the vault with status chips, control codes and file names", async () => {
    renderWithProviders(<EvidenceView />);

    const table = await screen.findByRole("table");
    // Wait for real rows (the table first renders with skeleton rows).
    await within(table).findByText("consent-capture-screenshot.png");
    expect(
      within(table).getByText("dpo-appointment-letter.pdf"),
    ).toBeInTheDocument();

    // Status chips resolved from the lifecycle.
    const body = table.querySelector("tbody") as HTMLElement;
    expect(within(body).getAllByText("Approved").length).toBe(1);
    expect(within(body).getByText("Locked")).toBeInTheDocument();
    // StatusChip humanizes each word: "UNDER_REVIEW" → "Under Review".
    expect(within(body).getByText("Under Review")).toBeInTheDocument();
    expect(within(body).getByText("Uploaded")).toBeInTheDocument();
    // Control codes resolved from the controls register.
    expect(within(table).getByText("CTRL-CONSENT")).toBeInTheDocument();
    expect(within(table).getByText("CTRL-SDF-DPO")).toBeInTheDocument();
    expect(await screen.findByText("5 files in the vault")).toBeInTheDocument();
  });

  it("filters by status", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EvidenceView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("consent-capture-screenshot.png");

    await user.click(
      screen.getByRole("button", { name: "Approved" }),
    );

    expect(
      await within(table).findByText("consent-capture-screenshot.png"),
    ).toBeInTheDocument();
    expect(
      within(table).queryByText("dpo-appointment-letter.pdf"),
    ).not.toBeInTheDocument();
    expect(await screen.findByText("1 files · Approved")).toBeInTheDocument();
  });

  it("uploads a file through the presigned pipeline", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EvidenceView />);
    await screen.findByRole("table");

    await user.click(screen.getByRole("button", { name: "Upload evidence" }));
    const drawer = screen.getByRole("dialog", { name: "Upload evidence" });

    const file = new File(["demo evidence bytes"], "audit-trail-export.csv", {
      type: "text/csv",
    });
    await user.upload(within(drawer).getByLabelText("File"), file);
    await user.type(within(drawer).getByLabelText("Description"), "Trail extract");
    await user.click(
      within(drawer).getByRole("button", { name: "Upload file" }),
    );

    // Initiate → PUT → hash → confirm → the row lands in the table.
    const table = await screen.findByRole("table");
    expect(
      await within(table).findByText("audit-trail-export.csv"),
    ).toBeInTheDocument();
    // The confirm step stored the mime type and byte count from the file
    // ("demo evidence bytes" is 19 characters). Regex matchers — the size
    // cell renders "text/csv · 19 B" as one element.
    expect(await within(table).findByText(/text\/csv/)).toBeInTheDocument();
    expect(await within(table).findByText(/19 B/)).toBeInTheDocument();
    expect(await screen.findByText("6 files in the vault")).toBeInTheDocument();
  });

  it("drives the lifecycle: approve then lock an under-review file", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EvidenceView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("notice-v1-published.html");

    // Open the UNDER_REVIEW record — approve is available (evidence:approve).
    await user.click(within(table).getByText("notice-v1-published.html"));
    const drawer = await screen.findByRole("dialog", {
      name: "notice-v1-published.html",
    });
    await within(drawer).findByText("Under review");
    expect(
      within(drawer).getByRole("button", { name: "Approve" }),
    ).toBeInTheDocument();

    await user.click(within(drawer).getByRole("button", { name: "Approve" }));
    const confirm = screen.getByRole("dialog", {
      name: "Approve this evidence?",
    });
    expect(confirm).toBeInTheDocument();
    await user.click(
      within(confirm).getByRole("button", { name: "Approve evidence" }),
    );

    // The drawer refetches: now Approved, and Lock becomes available.
    await within(drawer).findByText("Approved");
    expect(
      within(drawer).getByRole("button", { name: "Lock" }),
    ).toBeInTheDocument();

    await user.click(within(drawer).getByRole("button", { name: "Lock" }));
    const lockConfirm = screen.getByRole("dialog", {
      name: "Lock this evidence?",
    });
    await user.click(
      within(lockConfirm).getByRole("button", { name: "Lock evidence" }),
    );

    await within(drawer).findByText("Locked");
    // Terminal state — no further transitions offered.
    expect(
      within(drawer).queryByRole("button", { name: "Lock" }),
    ).not.toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
  });

  it("shows no action menu on a locked file", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EvidenceView />);
    const table = await screen.findByRole("table");
    await within(table).findByText("dpo-appointment-letter.pdf");

    await user.click(within(table).getByText("dpo-appointment-letter.pdf"));
    const drawer = await screen.findByRole("dialog", {
      name: "dpo-appointment-letter.pdf",
    });
    await within(drawer).findByText("Locked");

    // Locked is terminal — only Close/Download remain.
    expect(
      within(drawer).queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: "Submit for review" }),
    ).not.toBeInTheDocument();
    expect(
      within(drawer).getByRole("button", { name: "Download" }),
    ).toBeInTheDocument();
  });

  it("queues an export pack and reports the job id", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EvidenceView />);
    await screen.findByRole("table");

    await user.click(screen.getByRole("button", { name: "Export pack" }));
    const dialog = screen.getByRole("dialog", { name: "Export evidence pack" });
    await user.click(
      within(dialog).getByRole("button", { name: "Start export" }),
    );

    // Result state: the footer swaps to "Done" and the job note appears.
    expect(
      await screen.findByRole("button", { name: "Done" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/is queued/)).toBeInTheDocument();
    expect(screen.getByText(/surface in the report center/)).toBeInTheDocument();
  });
});
