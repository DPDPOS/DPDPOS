import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser } from "@/test/msw/fixtures";
import { FrameworkWizard } from "./framework-wizard";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push }),
}));

const reset = () => {
  window.localStorage.clear();
  useSessionStore.setState({
    status: "authenticated",
    accessToken: "at-demo",
    user: adminUser,
  });
};

function renderWizard() {
  renderWithProviders(
    <FrameworkWizard open mode="create" onClose={vi.fn()} />,
  );
}

describe("FrameworkWizard (§9.3)", () => {
  beforeEach(reset);

  it("generates a real roadmap preview from the profile and publishes", async () => {
    const user = userEvent.setup();
    renderWizard();

    // Step 1 — profile: pick an industry, keep the rest of the defaults.
    expect(screen.getByText("Step 1 of 3 — describe your organisation; the programme is generated from it.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "healthcare" }));
    await user.click(screen.getByRole("button", { name: "Generate preview" }));

    // Step 2 — preview renders the backend-built roadmap (real phases/controls).
    expect(await screen.findByText("Draft generated")).toBeInTheDocument();
    expect(screen.getByText("Foundation")).toBeInTheDocument();
    expect(screen.getByText("Significant Fiduciary")).toBeInTheDocument();
    expect(screen.getByText("CTRL-NOTICE")).toBeInTheDocument();
    expect(screen.getByText("Privacy notice program")).toBeInTheDocument();
    expect(screen.getByText(/3 controls · 4 obligations · 2 phases/)).toBeInTheDocument();

    // Step 3 — publish.
    await user.click(screen.getByRole("button", { name: "Publish programme" }));
    expect(await screen.findByText("Programme published")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go to controls" }));
    expect(push).toHaveBeenCalledWith("/controls");
  });

  it("validates the profile before generating", async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(screen.getByRole("button", { name: "Generate preview" }));
    expect(
      await screen.findByText("Describe your industry (e.g. healthcare, education)"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Draft generated")).not.toBeInTheDocument();
  });
});
