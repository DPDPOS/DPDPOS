import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { tokenStorage } from "@/lib/auth/storage";
import { testTokens, testUser } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { useSessionStore } from "@/state/session";
import { ApiError } from "./errors";
import { api, buildQuery } from "./client";

const resetSession = () =>
  useSessionStore.setState({ status: "idle", accessToken: null, user: null });

describe("buildQuery", () => {
  it("skips undefined, null, and empty values", () => {
    expect(buildQuery({ a: "1", b: undefined, c: null, d: "" })).toBe("?a=1");
  });

  it("serializes numbers and booleans", () => {
    expect(buildQuery({ page: 2, active: true })).toBe("?page=2&active=true");
  });

  it("returns empty string for no params", () => {
    expect(buildQuery()).toBe("");
    expect(buildQuery({})).toBe("");
  });
});

describe("api", () => {
  it("unwraps the success envelope", async () => {
    const data = await api<{ status: string }>("/healthz");
    expect(data).toEqual({ status: "ok" });
  });

  it("throws ApiError with the backend error code on failures", async () => {
    const error = await api("/not-found").catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("NOT_FOUND");
    expect((error as ApiError).status).toBe(404);
    expect((error as ApiError).message).toBe("Resource not found");
  });

  it("carries validation fieldErrors through", async () => {
    const error = await api("/validation-error").catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("VALIDATION_ERROR");
    expect((error as ApiError).details).toEqual({
      formErrors: [],
      fieldErrors: { email: ["Invalid email address"] },
    });
  });

  it("normalizes network failures to NETWORK_ERROR", async () => {
    server.use(
      http.get("/api/healthz", () => HttpResponse.error()),
    );
    const error = await api("/healthz").catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("NETWORK_ERROR");
  });

  it("POST serializes JSON bodies", async () => {
    server.use(
      http.post("/api/echo", async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ success: true, data: body });
      }),
    );
    const data = await api<{ name: string }>("/echo", {
      method: "POST",
      body: { name: "control" },
    });
    expect(data).toEqual({ name: "control" });
  });
});

describe("401 silent refresh", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetSession();
  });

  it("attaches the bearer token from the session store", async () => {
    useSessionStore
      .getState()
      .markAuthenticated(testTokens, testUser);
    const data = await api<{ ok: boolean }>("/session-protected");
    expect(data).toEqual({ ok: true });
  });

  it("refreshes once and replays the request on 401", async () => {
    useSessionStore
      .getState()
      .markAuthenticated({ ...testTokens, accessToken: "expired-access" }, testUser);

    const data = await api<{ ok: boolean }>("/session-protected");
    expect(data).toEqual({ ok: true });
    expect(useSessionStore.getState().accessToken).toBe("refreshed-access");
    expect(tokenStorage.getRefreshToken()).toBe("refreshed-rt");
  });

  it("hard-logs-out when the refresh token is rejected", async () => {
    // Sign in first, then corrupt the persisted refresh token (as the server
    // would when it revoked/rotated it out from under the client).
    useSessionStore
      .getState()
      .markAuthenticated({ ...testTokens, accessToken: "expired-access" }, testUser);
    tokenStorage.setRefreshToken("dead-refresh");

    const error = await api("/session-protected").catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("UNAUTHORIZED");
    expect(useSessionStore.getState().status).toBe("unauthenticated");
    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it("does not attempt refresh for /auth/ endpoints", async () => {
    useSessionStore
      .getState()
      .markAuthenticated({ ...testTokens, accessToken: "expired-access" }, testUser);
    const error = await api("/auth/me").catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("UNAUTHORIZED");
    // Refresh must not have rotated the token.
    expect(useSessionStore.getState().accessToken).toBe("expired-access");
  });

  it("single-flights concurrent 401s into exactly one refresh call", async () => {
    let refreshCalls = 0;
    server.use(
      http.post("/api/auth/refresh", async () => {
        refreshCalls += 1;
        return HttpResponse.json({
          success: true,
          data: {
            accessToken: "refreshed-access",
            refreshToken: "refreshed-rt",
            tokenType: "Bearer",
            expiresIn: 900,
          },
        });
      }),
    );
    useSessionStore
      .getState()
      .markAuthenticated({ ...testTokens, accessToken: "expired-access" }, testUser);

    const [first, second] = await Promise.all([
      api<{ ok: boolean }>("/session-protected"),
      api<{ ok: boolean }>("/session-protected"),
    ]);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(refreshCalls).toBe(1);
  });

  it("clears the session when the replayed request still 401s", async () => {
    server.use(
      http.get("/api/session-protected", () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Session expired" },
          },
          { status: 401 },
        ),
      ),
    );
    useSessionStore
      .getState()
      .markAuthenticated({ ...testTokens, accessToken: "expired-access" }, testUser);

    const error = await api("/session-protected").catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("UNAUTHORIZED");
    expect(useSessionStore.getState().status).toBe("unauthenticated");
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });
});
