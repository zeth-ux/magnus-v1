/**
 * Database errors raised by Bayu's own functions for readers carry
 * hint = 'bayu' (see supabase/migrations). Only those messages are shown;
 * anything else (Postgres's own errors, with table or constraint names) is
 * logged by code and replaced with a generic sentence.
 */
export type DbError = { code?: string | null; message: string; hint?: string | null };

export function friendlyError(error: DbError, fallback: string, where: string): string {
  if (error.hint === "bayu" && error.message) {
    const m = error.message.charAt(0).toUpperCase() + error.message.slice(1);
    return m.endsWith(".") ? m : `${m}.`;
  }
  console.error(`[${where}] database error`, error.code ?? "unknown");
  return fallback;
}
