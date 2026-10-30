import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/**
 * A Supabase client for Server Components, Server Actions and Route Handlers.
 * Create a new one per request (never share it between requests).
 * Returns null when Supabase isn't configured yet.
 */
export async function createSupabaseServerClient() {
  // Read cookies first: it marks the caller as per-request (never baked in at
  // build time), whether or not Supabase is configured yet.
  const cookieStore = await cookies();
  const env = getSupabaseEnv();
  if (!env) return null;

  return createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components can't set cookies. That's fine: the proxy
          // (src/proxy.ts) refreshes the session on every request.
        }
      },
    },
  });
}
