import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
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
  // Wait for a real request. When Next prefetches a signed-in page ahead of
  // time, supabase-js checks the session's expiry against the clock, and
  // Next stops any prerender that reads the time ("unstable value
  // Date.now()"), logging an error and cutting off calls like the waiting
  // badge. Stopping the prefetch here avoids both; the page still renders
  // in full when the reader opens it.
  await connection();
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
