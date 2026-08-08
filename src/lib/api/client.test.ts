import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { ApiError } from "./errors";
import { api, buildQuery } from "./client";

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
