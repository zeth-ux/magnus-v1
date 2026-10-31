import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cachedLookup } from "./cached-lookup";
import { friendlyError } from "@/lib/supabase/friendly-error";

/**
 * Make sure a books row exists for an ISBN, with details decided here on the
 * server: an existing row stays as it is; otherwise the lookup's result.
 * A typed title is used only when `typed` is given (the reader is holding the
 * copy and listing it); a wish never creates a title on its own.
 */
export async function ensureBook(
  supabase: SupabaseClient,
  isbn: string,
  typed: { title: string; authors: string[] } | null,
  where: string,
): Promise<{ ok: true } | { ok: false; message: string; unknown?: boolean }> {
  const { data: existing } = await supabase.from("books").select("isbn").eq("isbn", isbn).maybeSingle();
  if (existing) return { ok: true };
  const found = await cachedLookup(isbn);
  if (!found && !typed) return { ok: false, unknown: true, message: "We couldn't find that ISBN. Check the number." };
  const row = found
    ? { isbn, title: found.title, authors: found.authors, cover_url: found.coverUrl, published_year: found.year }
    : { isbn, title: typed!.title, authors: typed!.authors, cover_url: null, published_year: null };
  const { error } = await supabase.from("books").upsert(row, { onConflict: "isbn", ignoreDuplicates: true });
  if (error) return { ok: false, message: friendlyError(error, "Couldn't save the book's details. Try again.", where) };
  return { ok: true };
}
