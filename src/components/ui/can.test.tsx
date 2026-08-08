import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useSessionStore } from "@/state/session";
import { testUser } from "@/test/msw/fixtures";
import { Can } from "./can";

const userWith = (permissions: string[]) => ({ ...testUser, permissions });

describe("Can", () => {
  beforeEach(() => {
    useSessionStore.setState({
      status: "authenticated",
      accessToken: "at",
      user: userWith(["violations:create"]),
    });
  });

  it("renders children when the permission is held", () => {
    render(<Can perm="violations:create">visible</Can>);
    expect(screen.getByText("visible")).toBeInTheDocument();
  });

  it("renders the fallback when the permission is missing", () => {
    render(
      <Can perm="users:create" fallback={<span>blocked</span>}>
        visible
      </Can>,
    );
    expect(screen.queryByText("visible")).not.toBeInTheDocument();
    expect(screen.getByText("blocked")).toBeInTheDocument();
  });

  it("renders nothing when the permission is missing and no fallback is given", () => {
    render(<Can perm="users:create">visible</Can>);
    expect(screen.queryByText("visible")).not.toBeInTheDocument();
  });

  it("renders the fallback when the user is signed out", () => {
    useSessionStore.setState({
      status: "unauthenticated",
      accessToken: null,
      user: null,
    });
    render(
      <Can perm="violations:create" fallback={<span>sign in</span>}>
        visible
      </Can>,
    );
    expect(screen.queryByText("visible")).not.toBeInTheDocument();
    expect(screen.getByText("sign in")).toBeInTheDocument();
  });
});
