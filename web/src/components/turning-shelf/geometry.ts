/**
 * The maths of the turning shelf (docs/landing.md, "The turning shelf").
 *
 * Books stand side by side, spine out. `s` is the scroll position in books:
 * the book whose index equals `s` is turned out to show its cover, and a
 * fractional `s` sits between two books, so everything moves smoothly.
 * All of this is pure so it can be tested without a browser.
 */

/** Book sizes in px, all derived from the tallest book's height H. */
export type Dims = { H: number; ws: number; d: number; gap: number };

export function dims(H: number): Dims {
  // A paperback spine is about a sixth of its height; the cover about two thirds.
  return { H, ws: H * 0.16, d: H * 0.66, gap: H * 0.03 };
}

export const smoothstep = (x: number) => x * x * (3 - 2 * x);

/**
 * How far the open cover has pushed a book aside, from -0.5 to 0.5.
 * Continuous through 0 so a moving shelf never jumps.
 */
export function push(r: number): number {
  if (r <= -1) return -0.5;
  if (r >= 1) return 0.5;
  return (r + Math.sin(Math.PI * r) / Math.PI) / 2;
}

/** Centre x of a book `r` places from the open one. */
export function bookX(r: number, { ws, d, gap }: Dims): number {
  return r * (ws + gap) + (d - ws + 1.6 * gap) * push(r);
}

/** 1 for the open book, 0 for spines, in between while the shelf moves past. */
export function openness(r: number): number {
  return smoothstep(Math.max(0, 1 - Math.abs(r)));
}

/** `v - s` wrapped into [-total/2, total/2), so the shelf is endless. */
export function wrapRel(v: number, s: number, total: number): number {
  const half = total / 2;
  return ((((v - s + half) % total) + total) % total) - half;
}

/** The book index (0..n-1) showing at scroll position s. */
export function activeIndex(s: number, n: number): number {
  return ((Math.round(s) % n) + n) % n;
}

/**
 * The target that brings book `i` to the centre by the shortest way round,
 * starting from target `T` on a shelf of `n` books.
 */
export function nearestTarget(T: number, i: number, n: number): number {
  const base = Math.round(T);
  const cur = activeIndex(base, n);
  let delta = (i - cur) % n;
  if (delta > n / 2) delta -= n;
  if (delta < -n / 2) delta += n;
  return base + delta;
}

/** How many copies of the books to render so wrapping happens off screen. */
export function copiesFor(n: number, minBooks = 30): number {
  return Math.max(3, Math.ceil(minBooks / Math.max(1, n)));
}

/** A book's height as a share of the tallest (from its drawn length, 0.82 to 1). */
export function bookHeight(length: number): number {
  return 0.86 + Math.min(1, Math.max(0, (length - 0.82) / 0.18)) * 0.13;
}
