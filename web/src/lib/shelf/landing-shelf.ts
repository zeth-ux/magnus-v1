import "server-only";
import { cacheLife } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { composeShelf, type PublicShelfRow } from "./dress";

/**
 * The books on the public landing shelf: the newest available copies (via
 * public_shelf(), which never returns owners' names), topped up with samples.
 * Cached for a few minutes, so the landing page stays static and fast; uses
 * no cookies (an anonymous client), so it can be part of the static shell.
 */
export async function getLandingShelf() {
  "use cache";
  cacheLife("minutes");
  const env = getSupabaseEnv();
  if (!env) return composeShelf([]);
  try {
    const supabase = createClient(env.url, env.publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.rpc("public_shelf", { p_limit: 24 });
    if (error) throw error;
    return composeShelf((data ?? []) as PublicShelfRow[]);
  } catch (e) {
    console.error("[shelf] public_shelf failed; showing samples", e);
    return composeShelf([]);
  }
}
