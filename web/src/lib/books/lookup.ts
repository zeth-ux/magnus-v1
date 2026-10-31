import "server-only";

export type BookInfo = {
  isbn: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  year: number | null;
};

type Fetch = typeof fetch;

const httpsOnly = (url: unknown): string | null =>
  typeof url === "string" && url.length > 0 ? url.replace(/^http:\/\//, "https://") : null;

const yearOf = (date: unknown): number | null => {
  const y = typeof date === "string" ? Number.parseInt(date.match(/\d{4}/)?.[0] ?? "", 10) : NaN;
  return Number.isFinite(y) && y >= 1450 && y <= 2100 ? y : null;
};

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").slice(0, 10) : [];

/** Google Books (no key needed at pilot volume). */
export async function fromGoogleBooks(isbn: string, f: Fetch = fetch): Promise<BookInfo | null> {
  const res = await f(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { items?: { volumeInfo?: Record<string, unknown> }[] };
  const v = data.items?.[0]?.volumeInfo;
  if (!v || typeof v.title !== "string") return null;
  const title = typeof v.subtitle === "string" && v.title.length < 40 ? `${v.title}: ${v.subtitle}` : v.title;
  const links = (v.imageLinks ?? {}) as Record<string, unknown>;
  return {
    isbn,
    title: title.slice(0, 300),
    authors: strings(v.authors),
    coverUrl: httpsOnly(links.thumbnail ?? links.smallThumbnail),
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
    coverUrl: httpsOnly(cover.medium ?? cover.large),
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
