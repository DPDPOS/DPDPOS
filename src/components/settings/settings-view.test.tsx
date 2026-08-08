import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { renderWithProviders } from "@/test/render";
import { adminUser, resetTestFixtures } from "@/test/msw/fixtures";
import { SettingsView } from "./settings-view";

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

describe("SettingsView (§9.14)", () => {
  beforeEach(reset);

  it("loads the org profile into the form and shows the session section", async () => {
    renderWithProviders(<SettingsView />);

    const name = await screen.findByLabelText("Name");
    expect(name).toHaveValue("Demo Data Fiduciary Pvt Ltd");
    expect(screen.getByLabelText("Industry")).toHaveValue("healthcare");
    expect(screen.getByLabelText("Company size")).toHaveValue("1–100");
    expect(screen.getByLabelText("Operating region")).toHaveValue("India");

    // SDF checkbox reflects the seeded flag.
    expect(
      screen.getByLabelText("Significantly large data fiduciary"),
    ).toBeChecked();

    // Session & security — the signed-in user with MFA status.
    expect(screen.getByText("Arjun Mehta")).toBeInTheDocument();
    expect(screen.getByText("admin@demo.dpdpos.local")).toBeInTheDocument();
    expect(screen.getByText("ORG_ADMIN")).toBeInTheDocument();
  });

  it("saves an org profile change — disabled until the form is dirty", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsView />);

    await screen.findByLabelText("Name");
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();

    await user.clear(screen.getByLabelText("Company size"));
    await user.type(screen.getByLabelText("Company size"), "101–500");
    expect(save).toBeEnabled();

    await user.click(save);

    expect(
      await screen.findByText("Saved"),
    ).toBeInTheDocument();
  });

  it("shows the SDF consequence before the flag can change the framework", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsView />);

    await screen.findByLabelText("Name");
    // The explainer text about additional obligations is always visible.
    expect(
      screen.getByText(/additional obligations apply under the DPDP Act/),
    ).toBeInTheDocument();

    // Untoggling the SDF flag makes the form dirty and enables saving.
    const sdf = screen.getByLabelText("Significantly large data fiduciary");
    await user.click(sdf);
    expect(sdf).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: "Save changes" }),
    ).toBeEnabled();
  });

  it("shows the MFA and permission scope rows from the session", async () => {
    renderWithProviders(<SettingsView />);

    await screen.findByLabelText("Name");
    expect(
      screen.getByText("MFA is enabled on your account."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You hold \d+ of the frozen catalog permissions\./),
    ).toBeInTheDocument();
  });
});
