import { parseSessionHash } from "./session-hash";
import { safeRedirectPath } from "@/lib/safe-redirect";

/** The parts of the Supabase browser client this needs (so tests can fake it). */
export type SignInClient = {
  getUser(): Promise<{ data: { user: { id: string } | null } }>;
  setSession(s: { access_token: string; refresh_token: string }): Promise<{ error: unknown }>;
  refreshSession(): Promise<{ error: unknown }>;
};

export type Nav = {
  /** Change the address bar without loading anything (wipes the tokens). */
  replaceUrl(url: string): void;
  /** Go to another page. */
  go(url: string): void;
};

const CODE = /^[A-Za-z0-9_-]{6,200}$/;
const OTP_TYPES = new Set(["email", "magiclink", "signup", "invite"]);

/**
 * The account a token claims (the JWT's `sub`), read WITHOUT verifying it.
 * Only for choosing what to tell the reader: never as a security check
 * (setSession doesn't verify an expired access token either).
 */
export function tokenSubject(jwt: string): string | null {
  try {
    const payload = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const sub = (JSON.parse(atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "="))) as { sub?: unknown }).sub;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}

/**
 * Finishes a sign-in that lands on the landing page (the Site URL, where
 * Supabase sends readers whenever the return address isn't on its list):
 *   #access_token=...&refresh_token=...  an email link (implicit flow)
 *   ?code=...                            a PKCE code (Google): to /auth/callback
 *   ?token_hash=...&type=...             a custom-template link: to /auth/callback
 *   #error=...                           expired, used or old link: /login explains
 * Returns true when it took over the page.
 */
export async function finishSignInFromUrl(
  loc: { pathname: string; search: string; hash: string },
  /** Called only when there are tokens to use, so ordinary landing visits load no auth client. */
  getClient: () => SignInClient | null,
  nav: Nav,
): Promise<boolean> {
  const params = new URLSearchParams(loc.search);
  const fail = () => nav.go("/login?error=link");

  if (/[#&]access_token=/.test(loc.hash)) {
    // Tokens out of the address bar and history before anything else.
    nav.replaceUrl(loc.pathname + loc.search);
    const session = parseSessionHash(loc.hash);
    const client = session ? getClient() : null;
    if (!session || !client) return fail(), true;
    const next = safeRedirectPath(params.get("next"));
    try {
      // A browser that's already signed in never takes a session from a link:
      // anyone can send a link carrying their own tokens, and the token's
      // account can't be trusted before Supabase checks it. Same account (the
      // usual "tapped the link twice") just carries on.
      const { data } = await client.getUser().catch(() => ({ data: { user: null } }));
      if (data.user) {
        return nav.go(data.user.id === tokenSubject(session.accessToken) ? next : "/login?error=account"), true;
      }
      const { error } = await client.setSession({ access_token: session.accessToken, refresh_token: session.refreshToken });
      if (error) return fail(), true;
      // Rotate at once, so the refresh token that travelled in the URL is dead.
      await client.refreshSession().catch(() => undefined);
      nav.go(next);
    } catch {
      fail();
    }
    return true;
  }

  const code = params.get("code");
  const nextParam = encodeURIComponent(safeRedirectPath(params.get("next")));
  if (code && CODE.test(code)) return nav.go(`/auth/callback?code=${encodeURIComponent(code)}&next=${nextParam}`), true;

  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (tokenHash && CODE.test(tokenHash) && type && OTP_TYPES.has(type)) {
    return nav.go(`/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${type}&next=${nextParam}`), true;
  }

  if (/[#&]error(_code)?=/.test(loc.hash)) return fail(), true;
  return false;
}
