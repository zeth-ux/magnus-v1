"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/supabase/user";
import { friendlyError } from "@/lib/supabase/friendly-error";
import { normalizeIsbn } from "@/lib/books/isbn";
import { ensureBook } from "@/lib/books/ensure-book";

export type WishState =
  | { status: "idle" }
  | { status: "error"; message: string; isbn: string }
  | { status: "done"; message: string; wished: boolean };

const str = (form: FormData, k: string) => (typeof form.get(k) === "string" ? (form.get(k) as string) : "");

/**
 * Add a book to (or remove it from) your wishlist by ISBN. A book nobody has
 * listed yet must be known to the lookup: a wish never invents a title.
 */
export async function toggleWish(_prev: WishState, form: FormData): Promise<WishState> {
  const { supabase, user } = await requireUser("/wishlist");
  const raw = str(form, "isbn").slice(0, 40);
  const fail = (message: string): WishState => ({ status: "error", message, isbn: raw });
  const isbn = normalizeIsbn(raw);
  const op = str(form, "op");
  if (!isbn) return fail("That isn't a book ISBN. Check the 10 or 13 digits under the barcode.");

  if (op === "remove") {
    const { error } = await supabase.from("wishlist").delete().eq("user_id", user.id).eq("isbn", isbn);
    if (error) return fail(friendlyError(error, "Couldn't remove it. Try again.", "wish:remove"));
    refresh();
    return { status: "done", message: "Removed from your wishlist.", wished: false };
  }
  if (op !== "add") return fail("That didn't work. Refresh and try again.");

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!profile) return fail("Make your profile first (Me), then add to your wishlist.");

  const book = await ensureBook(supabase, isbn, null, "wish:book");
  if (!book.ok) return fail(book.message);

  const { error } = await supabase.from("wishlist").upsert({ user_id: user.id, isbn }, { onConflict: "user_id,isbn", ignoreDuplicates: true });
  if (error) return fail(friendlyError(error, "Couldn't add it. Try again.", "wish:add"));
  refresh();
  return { status: "done", message: "On your wishlist. It shows up in Activity when someone lists it.", wished: true };
}
