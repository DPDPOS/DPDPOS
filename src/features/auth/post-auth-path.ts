import type { AuthMeResponse } from "./types";

/** Where to send the user after a successful session is established. */
export function postAuthPath(user: AuthMeResponse): string {
  if (user.requiresOnboarding) return "/onboarding";
  return "/dashboard";
}
