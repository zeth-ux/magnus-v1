/**
 * The one production address. A sign-in only lives on the address it happened
 * on (cookies are per site), and the Vercel-Supabase integration keeps setting
 * Supabase's Site URL to the longer team address. So on production the proxy
 * sends any other host to Vercel's own production domain
 * (VERCEL_PROJECT_PRODUCTION_URL, set by Vercel for the domain that serves this
 * project), and sign-in emails link there too: one source of truth.
 * Previews and local development are never redirected.
 */
type VercelEnv = { VERCEL_ENV?: string; VERCEL_PROJECT_PRODUCTION_URL?: string };

/** "https://magnus-v1.vercel.app" on production, otherwise null. */
export function productionOrigin(env: VercelEnv): string | null {
  if (env.VERCEL_ENV !== "production") return null;
  const host = (env.VERCEL_PROJECT_PRODUCTION_URL ?? "").trim().toLowerCase();
  // A bare hostname, as Vercel sets it ("magnus-v1.vercel.app").
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return null;
  return `https://${host}`;
}

/**
 * Where to send a production request that arrived on another host, or null to
 * carry on. `host` is the Host header the visitor asked for (not
 * request.nextUrl, which can hold the server's own name: that would redirect
 * the main address to itself forever).
 */
export function canonicalRedirect(host: string | null, pathAndQuery: string, env: VercelEnv): string | null {
  const origin = productionOrigin(env);
  if (!origin || !host) return null;
  if (host.trim().toLowerCase().replace(/:\d+$/, "") === new URL(origin).hostname) return null;
  return `${origin}${pathAndQuery}`;
}
