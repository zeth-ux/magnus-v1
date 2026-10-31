"use server";

import { requireUser } from "@/lib/supabase/user";
import { normalizeIsbn } from "@/lib/books/isbn";
import { lookupIsbn, type BookInfo } from "@/lib/books/lookup";
import { parseCopy, type FieldErrors } from "@/lib/books/validate";

export type FindResult = { status: "found"; book: BookInfo } | { status: "unknown"; isbn: string } | { status: "invalid" };

/** Look up a scanned or typed ISBN: our own books table first, then Google Books / Open Library. */
export async function findBook(raw: string): Promise<FindResult> {
  const isbn = normalizeIsbn(String(raw ?? "").slice(0, 40));
  if (!isbn) return { status: "invalid" };
  const { supabase } = await requireUser("/add");

  const { data } = await supabase.from("books").select("isbn, title, authors, cover_url, published_year").eq("isbn", isbn).maybeSingle();
  if (data) {
    const row = data as { isbn: string; title: string; authors: string[]; cover_url: string | null; published_year: number | null };
    return { status: "found", book: { isbn, title: row.title, authors: row.authors, coverUrl: row.cover_url, year: row.published_year } };
  }
  const book = await lookupIsbn(isbn);
  return book ? { status: "found", book } : { status: "unknown", isbn };
}

export type AddState =
  | { status: "idle" }
  | { status: "error"; errors: FieldErrors; message?: string }
  | { status: "added"; title: string; mode: "give" | "lend"; starter: boolean };

export async function addCopy(_prev: AddState, form: FormData): Promise<AddState> {
  const parsed = parseCopy(form);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };
  const { supabase, user } = await requireUser("/add");
  const c = parsed.value;

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!profile) return { status: "error", errors: {}, message: "Make your profile first (Me), then add your book." };

  // The book's details: kept if someone already added this ISBN.
  const book = await supabase
    .from("books")
    .upsert(
      { isbn: c.isbn, title: c.title, authors: c.authors, cover_url: c.coverUrl, published_year: c.year },
      { onConflict: "isbn", ignoreDuplicates: true },
    );
  if (book.error) return { status: "error", errors: {}, message: "Couldn't save the book's details. Try again." };

  const { data: copy, error } = await supabase
    .from("copies")
    .insert({ owner_id: user.id, isbn: c.isbn, mode: c.mode, lend_max: c.lendMax, condition: c.condition, note: c.note })
    .select("id")
    .single();
  if (error || !copy) return { status: "error", errors: {}, message: "Couldn't add your book. Try again." };

  // Was this the listing that earned the starter credit (R5)?
  const { data: starter } = await supabase
    .from("credit_ledger")
    .select("id")
    .eq("kind", "starter_grant")
    .eq("ref_id", (copy as { id: string }).id)
    .maybeSingle();

  return { status: "added", title: c.title, mode: c.mode, starter: Boolean(starter) };
}
