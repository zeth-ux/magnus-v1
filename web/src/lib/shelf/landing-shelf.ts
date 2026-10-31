import "server-only";
import { cacheLife } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { composeShelf, type PublicShelfRow } from "./dress";

/**
 * The books on the public landing shelf: the newest available copies (via
 * public_shelf(), which never returns owners' names), topped up with samples.
 * Revalidated every minute (cacheLife "minutes"), so the landing page stays
 * static and fast. A failure (samples only) is cached the same way. Uses
 * no cookies (an anonymous client), so it can be part of the static shell.
 */
export async function getLandingShelf() {
  "use cache";
  cacheLife("minutes");
  const env = getSupabaseEnv();
  if (!env) return composeShelf([]);
  try {
    const supabase = createClient(env.url, env.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Give up quickly: a hanging request would otherwise stall the build (prerender times out at 50 s).
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000) }) },
    });
    const { data, error } = await supabase.rpc("public_shelf", { p_limit: 9 });
    if (error) throw error;
    return composeShelf((data ?? []) as PublicShelfRow[]);
  } catch (e) {
    console.error("[shelf] public_shelf failed; showing samples", e);
    return composeShelf([]);
  }
}
