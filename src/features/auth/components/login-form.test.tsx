import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/state/session";
import { DEMO_CREDENTIALS } from "../demo-credentials";
import { MFA_EXPIRES_AT_KEY, MFA_TOKEN_KEY } from "../mfa-constants";
import { LoginForm } from "./login-form";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const reset = () => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  replace.mockClear();
  useSessionStore.setState({ status: "idle", accessToken: null, user: null });
};

async function fillLogin(
  user: { email: string; password: string } = {
    email: DEMO_CREDENTIALS.email,
    password: DEMO_CREDENTIALS.password,
  },
) {
  const interaction = userEvent.setup();
  await interaction.type(screen.getByLabelText("Email"), user.email);
  // Lookup prefills a single matching org; wait then set password.
  await waitFor(() => {
    expect(screen.getByLabelText("Organization ID")).toHaveValue(
      DEMO_CREDENTIALS.organizationId,
    );
  });
  await interaction.type(screen.getByLabelText("Password"), user.password);
  return interaction;
}

describe("LoginForm", () => {
  beforeEach(reset);

  it("signs in and routes to the dashboard on success", async () => {
    render(<LoginForm />);
    const user = await fillLogin();
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/dashboard");
    });
    expect(useSessionStore.getState().status).toBe("authenticated");
    expect(useSessionStore.getState().user?.email).toBe(DEMO_CREDENTIALS.email);
  });

  it("routes to the MFA challenge and stashes the short-lived token in sessionStorage", async () => {
    render(<LoginForm />);
    const user = await fillLogin({
      email: "mfa@demo.dpdpos.local",
      password: "ChangeMe123!",
    });
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/mfa?step=challenge");
    });
    expect(window.sessionStorage.getItem(MFA_TOKEN_KEY)).toBe("mfa-tok-1");
    expect(window.sessionStorage.getItem(MFA_EXPIRES_AT_KEY)).not.toBeNull();
    // Not authenticated until the challenge passes.
    expect(useSessionStore.getState().status).not.toBe("authenticated");
  });

  it("surfaces invalid-credential errors from the server", async () => {
    render(<LoginForm />);
    const interaction = userEvent.setup();
    await interaction.type(screen.getByLabelText("Email"), "nobody@example.com");
    await waitFor(() => {
      expect(screen.getByText(/No organizations found/i)).toBeInTheDocument();
    });
    await interaction.type(
      screen.getByLabelText("Organization ID"),
      DEMO_CREDENTIALS.organizationId,
    );
    await interaction.type(screen.getByLabelText("Password"), "WrongPass1!");
    await interaction.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("validates on the client before submitting", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid organization ID")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
