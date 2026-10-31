"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/supabase/user";
import { friendlyError } from "@/lib/supabase/friendly-error";
import { normalizeIsbn } from "@/lib/books/isbn";
import { cachedLookup } from "@/lib/books/cached-lookup";

export type WishState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "needTitle"; isbn: string }
  | { status: "done"; message: string; wished?: boolean };

const str = (form: FormData, k: string) => (typeof form.get(k) === "string" ? (form.get(k) as string) : "");

/**
 * Add a book to (or remove it from) your wishlist by ISBN. A book nobody has
 * listed yet is looked up first; if nobody knows it, the reader types the title.
 */
export async function toggleWish(_prev: WishState, form: FormData): Promise<WishState> {
  const { supabase, user } = await requireUser("/wishlist");
  const isbn = normalizeIsbn(str(form, "isbn").slice(0, 40));
  const op = str(form, "op");
  if (!isbn) return { status: "error", message: "That isn't a book ISBN. Check the 13 digits starting with 978 or 979." };

  if (op === "remove") {
    const { error } = await supabase.from("wishlist").delete().eq("user_id", user.id).eq("isbn", isbn);
    if (error) return { status: "error", message: friendlyError(error, "Couldn't remove it. Try again.", "wish:remove") };
    refresh();
    return { status: "done", message: "Removed from your wishlist.", wished: false };
  }
  if (op !== "add") return { status: "error", message: "That didn't work. Refresh and try again." };

  const { data: book } = await supabase.from("books").select("isbn").eq("isbn", isbn).maybeSingle();
  if (!book) {
    const found = await cachedLookup(isbn);
    const title = str(form, "title").trim().replace(/\s+/g, " ").slice(0, 300);
    if (!found && !title) return { status: "needTitle", isbn };
    const row = found
      ? { isbn, title: found.title, authors: found.authors, cover_url: found.coverUrl, published_year: found.year }
      : { isbn, title, authors: [], cover_url: null, published_year: null };
    const inserted = await supabase.from("books").upsert(row, { onConflict: "isbn", ignoreDuplicates: true });
    if (inserted.error) return { status: "error", message: friendlyError(inserted.error, "Couldn't save the book. Try again.", "wish:book") };
  }

  const { error } = await supabase.from("wishlist").upsert({ user_id: user.id, isbn }, { onConflict: "user_id,isbn", ignoreDuplicates: true });
  if (error) return { status: "error", message: friendlyError(error, "Couldn't add it. Try again.", "wish:add") };
  refresh();
  return { status: "done", message: "On your wishlist. We'll show it in Activity when someone lists it.", wished: true };
}
