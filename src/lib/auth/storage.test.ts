import { beforeEach, describe, expect, it } from "vitest";
import { tokenStorage } from "./storage";

describe("tokenStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it("persists and reads the refresh token", () => {
    tokenStorage.setRefreshToken("rt-1");
    expect(tokenStorage.getRefreshToken()).toBe("rt-1");
  });

  it("overwrites on rotation", () => {
    tokenStorage.setRefreshToken("rt-1");
    tokenStorage.setRefreshToken("rt-2");
    expect(tokenStorage.getRefreshToken()).toBe("rt-2");
  });

  it("clears the refresh token", () => {
    tokenStorage.setRefreshToken("rt-1");
    tokenStorage.clearRefreshToken();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });
});
