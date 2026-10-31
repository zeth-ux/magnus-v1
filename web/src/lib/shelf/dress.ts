import { SHELF, type ShelfCopy } from "@/content/shelf";
import { LEND_MAX } from "@/lib/books/validate";

/** A row from public_shelf() (supabase/migrations/20261101000200_shelf.sql). */
export type PublicShelfRow = {
  copy_id: string;
  isbn: string;
  title: string;
  authors: string[] | null;
  mode: "give" | "lend";
  lend_max: keyof typeof LEND_MAX | null;
  area: string;
};

/** A small, stable hash so the same book always gets the same look. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Dress a real copy for the 3D shelf: it borrows one of the drawn cover designs
 * (colours and pattern) chosen by its ISBN, and a thickness and length so the
 * stack never looks like a tidy column. Owners stay anonymous on the public page.
 */
export function dressCopy(row: PublicShelfRow): ShelfCopy {
  const h = hash(row.isbn);
  const look = SHELF[h % SHELF.length];
  return {
    slug: `copy-${row.copy_id}`,
    copyId: row.copy_id,
    sample: false,
    title: row.title,
    author: row.authors?.join(", ") || "Unknown author",
    mode: row.mode,
    lendFor: row.mode === "lend" && row.lend_max ? LEND_MAX[row.lend_max] : undefined,
    owner: "A reader",
    area: row.area,
    note: "",
    thick: 40 + ((h >>> 8) % 48),
    length: 0.82 + ((h >>> 16) % 19) / 100,
    colour: look.colour,
    ink: look.ink,
    text: look.text,
    flood: look.flood,
    floodText: look.floodText,
    pattern: look.pattern,
  };
}

/** Real copies first; samples fill the stack up to `size` so the landing never looks empty. */
export function composeShelf(rows: PublicShelfRow[], size = 9): ShelfCopy[] {
  const real = rows.slice(0, size).map(dressCopy);
  if (real.length >= size) return real;
  return [...real, ...SHELF.slice(0, size - real.length)];
}
