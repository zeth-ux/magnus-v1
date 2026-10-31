"use client";

import { Book3D } from "@/components/shelf/book-3d";
import { SHELF } from "@/content/shelf";

const PICKS = ["circe", "klara-and-the-sun", "the-midnight-library", "the-gift-of-rain"];

/**
 * A small stack from the landing shelf, seen from a little above, drifting
 * gently (CSS only, off for reduced motion). Decoration: hidden from screen readers.
 */
export function AuthBooks() {
  const books = PICKS.map((slug) => SHELF.find((b) => b.slug === slug)).filter((b) => b !== undefined);
  return (
    <div aria-hidden="true" className="auth-books flex flex-col items-center gap-12 [perspective:2200px] [perspective-origin:50%_0%]">
      {books.map((copy, i) => (
        <div key={copy.slug} className="auth-book" style={{ "--i": i } as React.CSSProperties}>
          <Book3D copy={copy} size="min(560px, 78vw)" className="[--k:0.7] lg:[--k:0.9]" />
        </div>
      ))}
    </div>
  );
}
