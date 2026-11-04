import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";

/**
 * The signed-in reader for this request, asked of Supabase once: React's
 * cache() lasts for one server render, so the page and the first-steps strip
 * share one client and one getUser() (still a new client per request). In a
 * server action there's no render cache, so it simply runs each time.
 */
export const getSessionUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null };
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
});

/**
 * For pages and actions that need a signed-in reader. Confirms the session
 * with Supabase (getUser), or sends the visitor to sign in and come back.
 */
export async function requireUser(next: string) {
  const { supabase, user } = await getSessionUser();
  if (!supabase) redirect("/login");
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { supabase, user };
}

export type Profile = { display_name: string; area: string };

/** The reader's public profile (null until they've made one). */
export async function getProfile(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], userId: string) {
  const { data } = await supabase.from("profiles").select("display_name, area").eq("id", userId).maybeSingle();
  return (data as Profile | null) ?? null;
}
