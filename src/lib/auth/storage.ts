/**
 * Token storage — implementation plan §6.2.
 * Access tokens live only in memory (Zustand session store). The refresh
 * token is the one persisted credential (localStorage); it rotates on every
 * use and is cleared on logout.
 */
const REFRESH_TOKEN_KEY = "dpdpos.refreshToken";

export const tokenStorage = {
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setRefreshToken(token: string): void {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  clearRefreshToken(): void {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
