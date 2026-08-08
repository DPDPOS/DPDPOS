import { beforeEach, describe, expect, it } from "vitest";
import { testTokens, testUser } from "@/test/msw/fixtures";
import { tokenStorage } from "@/lib/auth/storage";
import { useSessionStore } from "./session";

const resetStore = () =>
  useSessionStore.setState({ status: "idle", accessToken: null, user: null });

describe("session store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    resetStore();
  });

  it("starts idle without a user", () => {
    const state = useSessionStore.getState();
    expect(state.status).toBe("idle");
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("markAuthenticated keeps tokens in memory and persists the refresh token", () => {
    useSessionStore.getState().markAuthenticated(testTokens, testUser);
    const state = useSessionStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.accessToken).toBe(testTokens.accessToken);
    expect(state.user).toBe(testUser);
    expect(tokenStorage.getRefreshToken()).toBe(testTokens.refreshToken);
  });

  it("setTokens rotates tokens without changing the user", () => {
    useSessionStore.getState().markAuthenticated(testTokens, testUser);
    useSessionStore
      .getState()
      .setTokens({ ...testTokens, accessToken: "at-2", refreshToken: "rt-2" });
    const state = useSessionStore.getState();
    expect(state.accessToken).toBe("at-2");
    expect(state.user).toBe(testUser);
    expect(tokenStorage.getRefreshToken()).toBe("rt-2");
  });

  it("markBootstrapped promotes a restored session", () => {
    useSessionStore.getState().markAuthenticating();
    useSessionStore.getState().markBootstrapped(testUser);
    const state = useSessionStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.user).toBe(testUser);
  });

  it("markSessionRestored keeps a session whose profile fetch failed transiently", () => {
    useSessionStore.getState().markAuthenticating();
    useSessionStore.getState().markSessionRestored();
    const state = useSessionStore.getState();
    expect(state.status).toBe("authenticated");
    // No profile was fetched — the user stays null until the next retry.
    expect(state.user).toBeNull();
  });

  it("clear wipes memory and the persisted refresh token", () => {
    useSessionStore.getState().markAuthenticated(testTokens, testUser);
    useSessionStore.getState().clear();
    const state = useSessionStore.getState();
    expect(state.status).toBe("unauthenticated");
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });
});
