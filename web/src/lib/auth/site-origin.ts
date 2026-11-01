/**
 * The site's origin from NEXT_PUBLIC_SITE_URL, cleaned up: trims spaces and
 * quotes, adds https:// when the scheme is missing, and drops any path or
 * trailing slash. Supabase only accepts a sign-in return address that matches
 * its Redirect URLs list exactly, so "magnus-v1.vercel.app" or
 * "https://magnus-v1.vercel.app/ " would quietly send readers to the Site URL.
 * Returns null when the value isn't a usable http(s) address.
 */
export function normaliseSiteOrigin(value: string | undefined): string | null {
  const raw = (value ?? "").trim().replace(/^["']|["']$/g, "").trim();
  if (!raw) return null;
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}
