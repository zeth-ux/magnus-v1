import "server-only";
import { normalizeIsbn } from "./isbn";

export type BookInfo = {
  isbn: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  year: number | null;
};

type Fetch = typeof fetch;

/** Cover images may only come from the lookup services' own image hosts. */
export const COVER_HOSTS = ["books.google.com", "books.googleusercontent.com", "covers.openlibrary.org"];

export function safeCoverUrl(url: unknown): string | null {
  if (typeof url !== "string" || url.length === 0 || url.length > 500) return null;
  try {
    const u = new URL(url.replace(/^http:\/\//, "https://"));
    return u.protocol === "https:" && COVER_HOSTS.includes(u.hostname) ? u.toString() : null;
  } catch {
    return null;
  }
}

const yearOf = (date: unknown): number | null => {
  const y = typeof date === "string" ? Number.parseInt(date.match(/\d{4}/)?.[0] ?? "", 10) : NaN;
  return Number.isFinite(y) && y >= 1450 && y <= 2100 ? y : null;
};

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").slice(0, 10) : [];

/** Google Books (no key needed at pilot volume). */
export async function fromGoogleBooks(isbn: string, f: Fetch = fetch): Promise<BookInfo | null> {
  const res = await f(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=5`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { items?: { volumeInfo?: Record<string, unknown> }[] };
  // q=isbn: is a search: only trust a result that really carries this ISBN.
  const v = data.items
    ?.map((item) => item.volumeInfo)
    .find((info) =>
      Array.isArray(info?.industryIdentifiers) &&
      (info.industryIdentifiers as { identifier?: unknown }[]).some((id) => {
        const n = typeof id.identifier === "string" ? normalizeIsbn(id.identifier) : null;
        return n === isbn;
      }),
    );
  if (!v || typeof v.title !== "string") return null;
  const title = typeof v.subtitle === "string" && v.title.length < 40 ? `${v.title}: ${v.subtitle}` : v.title;
  const links = (v.imageLinks ?? {}) as Record<string, unknown>;
  return {
    isbn,
    title: title.slice(0, 300),
    authors: strings(v.authors),
    coverUrl: safeCoverUrl(links.thumbnail ?? links.smallThumbnail),
    year: yearOf(v.publishedDate),
  };
}

/** Open Library, as the fallback. */
export async function fromOpenLibrary(isbn: string, f: Fetch = fetch): Promise<BookInfo | null> {
  const key = `ISBN:${isbn}`;
  const res = await f(`https://openlibrary.org/api/books?bibkeys=${key}&format=json&jscmd=data`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, Record<string, unknown> | undefined>;
  const b = data[key];
  if (!b || typeof b.title !== "string") return null;
  const authors = Array.isArray(b.authors) ? b.authors.map((a) => (a as { name?: unknown }).name) : [];
  const cover = (b.cover ?? {}) as Record<string, unknown>;
  return {
    isbn,
    title: b.title.slice(0, 300),
    authors: strings(authors),
    coverUrl: safeCoverUrl(cover.medium ?? cover.large),
    year: yearOf(b.publish_date),
  };
}

/** Look a book up by ISBN-13: Google Books first, then Open Library. Never throws. */
export async function lookupIsbn(isbn: string, f: Fetch = fetch): Promise<BookInfo | null> {
  for (const source of [fromGoogleBooks, fromOpenLibrary]) {
    try {
      const found = await source(isbn, f);
      if (found) return found;
    } catch {
      // Network trouble or a bad response: try the next source.
    }
  }
  return null;
}
