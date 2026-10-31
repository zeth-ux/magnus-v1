import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";

/**
 * For pages and actions that need a signed-in reader. Confirms the session
 * with Supabase (getUser), or sends the visitor to sign in and come back.
 */
export async function requireUser(next: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { supabase, user: data.user };
}

export type Profile = { display_name: string; area: string };

/** The reader's public profile (null until they've made one). */
export async function getProfile(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], userId: string) {
  const { data } = await supabase.from("profiles").select("display_name, area").eq("id", userId).maybeSingle();
  return (data as Profile | null) ?? null;
}
