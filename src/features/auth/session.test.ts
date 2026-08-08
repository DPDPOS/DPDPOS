import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { tokenStorage } from "@/lib/auth/storage";
import { server } from "@/test/msw/server";
import { useSessionStore } from "@/state/session";
import { bootstrapSession } from "./session";

const reset = () => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useSessionStore.setState({ status: "idle", accessToken: null, user: null });
};

describe("bootstrapSession", () => {
  beforeEach(reset);

  it("restores the session by rotating the refresh token and fetching the profile", async () => {
    tokenStorage.setRefreshToken("rt-1");
    await bootstrapSession();

    const state = useSessionStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.accessToken).toBe("refreshed-access");
    expect(state.user?.email).toBe("admin@demo.dpdpos.local");
    expect(tokenStorage.getRefreshToken()).toBe("refreshed-rt");
  });

  it("marks the session unauthenticated when there is no refresh token", async () => {
    await bootstrapSession();
    expect(useSessionStore.getState().status).toBe("unauthenticated");
  });

  it("clears the session when the refresh token is rejected", async () => {
    tokenStorage.setRefreshToken("dead-refresh");
    await bootstrapSession();

    const state = useSessionStore.getState();
    expect(state.status).toBe("unauthenticated");
    expect(state.accessToken).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it("keeps the session when the profile fetch fails transiently", async () => {
    server.use(
      http.get("/api/auth/me", () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Database unavailable" },
          },
          { status: 500 },
        ),
      ),
    );
    tokenStorage.setRefreshToken("rt-1");
    await bootstrapSession();

    const state = useSessionStore.getState();
    // Tokens were rotated and persisted — the session survives the blip.
    expect(state.status).toBe("authenticated");
    expect(state.accessToken).toBe("refreshed-access");
    expect(tokenStorage.getRefreshToken()).toBe("refreshed-rt");
  });

  it("clears the session when the profile fetch is rejected with 401", async () => {
    server.use(
      http.get("/api/auth/me", () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
          },
          { status: 401 },
        ),
      ),
    );
    tokenStorage.setRefreshToken("rt-1");
    await bootstrapSession();

    const state = useSessionStore.getState();
    expect(state.status).toBe("unauthenticated");
    expect(state.accessToken).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });
});
