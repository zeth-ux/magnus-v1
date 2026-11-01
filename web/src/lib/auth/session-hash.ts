/**
 * Email sign-in links use Supabase's "implicit" flow: after the link is
 * checked, Supabase sends the reader back with the session in the URL hash
 * (#access_token=...&refresh_token=...). Unlike the PKCE flow, that needs
 * nothing saved in the browser that asked for the link, so it works when the
 * phone opens the link somewhere else (Gmail's own browser, Safari).
 * The hash never reaches a server, and the page removes it straight away.
 */
const JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const REFRESH = /^[A-Za-z0-9_-]{8,200}$/;

export type SessionHash = { accessToken: string; refreshToken: string };

/** The session tokens from a sign-in hash, or null if the hash isn't one (or looks wrong). */
export function parseSessionHash(hash: string): SessionHash | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = params.get("access_token") ?? "";
  const refreshToken = params.get("refresh_token") ?? "";
  if (!JWT.test(accessToken) || accessToken.length > 4096 || !REFRESH.test(refreshToken)) return null;
  return { accessToken, refreshToken };
}
