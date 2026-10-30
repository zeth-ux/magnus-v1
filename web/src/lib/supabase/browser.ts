"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/** A Supabase client for Client Components. Null when not configured. */
export function createSupabaseBrowserClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.publishableKey);
}
