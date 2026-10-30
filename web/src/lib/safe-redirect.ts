/**
 * Turns an untrusted `next` value (from a URL or a form) into a safe,
 * same-site path to redirect to after sign-in.
 *
 * Why: without this, a link like `/auth/callback?next=https://evil.example`
 * would send a freshly signed-in user to another website (an "open redirect"),
 * which phishing pages love.
 */
export const DEFAULT_AFTER_LOGIN = "/welcome";

export function safeRedirectPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_AFTER_LOGIN,
): string {
  if (!next) return fallback;

  // Only plain paths on this site: must start with a single "/".
  if (!next.startsWith("/")) return fallback;
  // "//evil.example" and "/\evil.example" are treated by browsers as other hosts.
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  // Control characters (tabs, newlines) can sneak past naive checks.
  if (/[\u0000-\u001F\u007F]/.test(next)) return fallback;

  // Final check: resolving against a dummy origin must stay on that origin.
  try {
    const url = new URL(next, "http://bayu.invalid");
    if (url.origin !== "http://bayu.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
