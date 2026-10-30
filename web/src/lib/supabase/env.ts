/**
 * Supabase settings come from environment variables (see web/.env.example).
 * Returns null when they're missing, so the landing page still works before
 * Supabase is set up; sign-in pages then show a friendly "not configured" note.
 *
 * The publishable key is safe in the browser: Row Level Security protects data.
 * Never put the secret (service-role) key in a NEXT_PUBLIC_ variable.
 */
export type SupabaseEnv = { url: string; publishableKey: string };

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}
