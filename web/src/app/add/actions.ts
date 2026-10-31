"use server";

import { requireUser } from "@/lib/supabase/user";
import { normalizeIsbn } from "@/lib/books/isbn";
import { cachedLookup } from "@/lib/books/cached-lookup";
import type { BookInfo } from "@/lib/books/lookup";
import { parseCopy, type FieldErrors } from "@/lib/books/validate";

export type FindResult = { status: "found"; book: BookInfo } | { status: "unknown"; isbn: string } | { status: "invalid" };

type BookRow = { isbn: string; title: string; authors: string[]; cover_url: string | null; published_year: number | null };

/** Look up a scanned or typed ISBN: our own books table first, then Google Books / Open Library. */
export async function findBook(raw: string): Promise<FindResult> {
  const { supabase } = await requireUser("/add");
  const isbn = normalizeIsbn(String(raw ?? "").slice(0, 40));
  if (!isbn) return { status: "invalid" };

  const { data } = await supabase.from("books").select("isbn, title, authors, cover_url, published_year").eq("isbn", isbn).maybeSingle();
  if (data) {
    const row = data as BookRow;
    return { status: "found", book: { isbn, title: row.title, authors: row.authors, coverUrl: row.cover_url, year: row.published_year } };
  }
  const book = await cachedLookup(isbn);
  return book ? { status: "found", book } : { status: "unknown", isbn };
}

/** What the reader typed, sent back with errors so the form keeps it. */
export type AddValues = { title: string; authors: string; mode: string; lendMax: string; condition: string; note: string };

export type AddState =
  | { status: "idle" }
  | { status: "error"; errors: FieldErrors; message?: string; values: AddValues; attempt: number }
  | { status: "added"; title: string; mode: "give" | "lend"; starter: boolean };

const valuesOf = (form: FormData): AddValues => {
  const get = (k: string) => (typeof form.get(k) === "string" ? (form.get(k) as string) : "");
  return { title: get("title"), authors: get("authors"), mode: get("mode"), lendMax: get("lendMax"), condition: get("condition"), note: get("note") };
};

export async function addCopy(_prev: AddState, form: FormData): Promise<AddState> {
  const { supabase, user } = await requireUser("/add");
  const fail = (errors: FieldErrors, message?: string): AddState => ({
    status: "error",
    errors,
    message,
    values: valuesOf(form),
    attempt: Date.now(),
  });

  const parsed = parseCopy(form);
  if (!parsed.ok) return fail(parsed.errors);
  const c = parsed.value;

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!profile) return fail({}, "Make your profile first (Me), then add your book.");

  // The shared book details are decided here on the server, never taken from
  // the form: an existing row stays as it is; a new ISBN is looked up, and only
  // if nobody knows it do we use the title and author the reader typed.
  const { data: existing } = await supabase.from("books").select("isbn").eq("isbn", c.isbn).maybeSingle();
  if (!existing) {
    const found = await cachedLookup(c.isbn);
    const row = found
      ? { isbn: c.isbn, title: found.title, authors: found.authors, cover_url: found.coverUrl, published_year: found.year }
      : { isbn: c.isbn, title: c.title, authors: c.authors, cover_url: null, published_year: null };
    const book = await supabase.from("books").upsert(row, { onConflict: "isbn", ignoreDuplicates: true });
    if (book.error) {
      console.error("[add] books insert failed", book.error.code);
      return fail({}, "Couldn't save the book's details. Try again.");
    }
  }

  const { data: copy, error } = await supabase
    .from("copies")
    .insert({ owner_id: user.id, isbn: c.isbn, mode: c.mode, lend_max: c.lendMax, condition: c.condition, note: c.note })
    .select("id")
    .single();
  if (error || !copy) {
    console.error("[add] copies insert failed", error?.code);
    return fail({}, "Couldn't add your book. Try again.");
  }

  // Was this the listing that earned the starter credit (R5)?
  const { data: starter } = await supabase
    .from("credit_ledger")
    .select("id")
    .eq("kind", "starter_grant")
    .eq("ref_id", (copy as { id: string }).id)
    .maybeSingle();

  return { status: "added", title: c.title, mode: c.mode, starter: Boolean(starter) };
}
