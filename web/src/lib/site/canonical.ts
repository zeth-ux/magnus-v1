/**
 * Where a production request should be sent so everyone uses one address.
 * A sign-in only lives on the address it happened on (cookies are per site),
 * and the Vercel-Supabase integration keeps setting Supabase's Site URL to the
 * longer team address. So on production, any other host is sent to Vercel's
 * own production domain (VERCEL_PROJECT_PRODUCTION_URL), keeping the path,
 * query and hash. Previews and local development are never redirected.
 * `host` is the Host header the visitor asked for (not request.nextUrl, which
 * can hold the server's own name: that would redirect the main address to
 * itself forever). Returns the target URL, or null to carry on.
 */
export function canonicalRedirect(
  host: string | null,
  pathAndQuery: string,
  env: { VERCEL_ENV?: string; VERCEL_PROJECT_PRODUCTION_URL?: string },
): string | null {
  if (env.VERCEL_ENV !== "production" || !host) return null;
  const target = (env.VERCEL_PROJECT_PRODUCTION_URL ?? "").trim().toLowerCase();
  // A bare hostname, as Vercel sets it ("magnus-v1.vercel.app").
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(target)) return null;
  if (host.trim().toLowerCase().replace(/:\d+$/, "") === target) return null;
  return `https://${target}${pathAndQuery}`;
}
