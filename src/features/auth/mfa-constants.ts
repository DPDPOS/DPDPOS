/**
 * The MFA challenge token is short-lived (300 s server-side). It is kept in
 * sessionStorage — NOT the URL — so it never lands in history or server logs.
 */
export const MFA_TOKEN_KEY = "dpdpos.mfaToken";
export const MFA_EXPIRES_AT_KEY = "dpdpos.mfaExpiresAt";

/** Starts an MFA challenge, stamping the server-side expiry as a client deadline. */
export function startMfaChallenge(token: string, expiresInSeconds: number): void {
  window.sessionStorage.setItem(MFA_TOKEN_KEY, token);
  window.sessionStorage.setItem(
    MFA_EXPIRES_AT_KEY,
    String(Date.now() + expiresInSeconds * 1000),
  );
}

export function clearMfaChallenge(): void {
  window.sessionStorage.removeItem(MFA_TOKEN_KEY);
  window.sessionStorage.removeItem(MFA_EXPIRES_AT_KEY);
}
