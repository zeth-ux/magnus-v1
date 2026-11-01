/**
 * The site's origin from NEXT_PUBLIC_SITE_URL, cleaned up: trims spaces and
 * quotes, adds https:// when the scheme is missing, and drops any path or
 * trailing slash (the app adds /auth/callback itself; hosting under a sub-path
 * isn't supported). Supabase only accepts a sign-in return address that matches
 * its Redirect URLs list, so "magnus-v1.vercel.app" or "https://magnus-v1.vercel.app/ "
 * would quietly send readers to the Site URL.
 * Returns null when the value isn't a usable address, so the caller can say so
 * loudly instead of sending a broken link.
 */
export function normaliseSiteOrigin(value: string | undefined): string | null {
  const raw = (value ?? "").trim().replace(/^["']|["']$/g, "").trim();
  if (!raw) return null;
  // A scheme-like start without "://" (https:/x, https//x, mailto:x) is a typo, not a host.
  if (!/^[a-z]+:\/\//i.test(raw) && /^[a-z]+(:|\/\/)/i.test(raw) && !/^localhost:\d+/i.test(raw)) return null;
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.username || url.password) return null;
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol === "http:" && !isLocal) return null;
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!isLocal && !url.hostname.includes(".")) return null;
    return url.origin;
  } catch {
    return null;
  }
}
