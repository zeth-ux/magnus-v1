# Landing page: the shelf

*Third version, 2026-10-31. Zarith's verdict on the first two ("generic,
plain, boring colours") pointed at one reference: [Stripe Press](https://press.stripe.com).
We studied it live in the browser and rebuilt the landing around the same idea.*

## What we took from Stripe Press
Studied on 2026-10-31 at 1440 px:
- **The books are the page.** A warm near-black ground, a vertical stack of
  3D books lying flat with their spines towards you, each with its own bold cover art.
- **A camera at the middle of the screen.** Books above it show their
  undersides, books below show their covers. Scrolling moves the stack past the camera.
- **Pick a book and the page becomes it.** The background floods with the
  book's colour, the book turns to show its cover, and the details arrive beside it.
- Quiet serif type, very little chrome, no stock photos.

## Bayu's version
| Piece | File | What happens |
|---|---|---|
| **Shelf** (first screen) | `components/shelf/shelf.tsx` | Headline left ("Your next book is on a friend's shelf."), the stack right. On load the books fall into place. Scrolling makes the **bayu blow through the stack**: books drift and turn with your scroll speed, then settle, with a faint idle sway. Hover pulls a book towards you |
| **3D book** | `components/shelf/book-3d.tsx` | A real CSS 3D box: spine, covers, page block. Size from `--w`, `--t`, `--k` |
| **Cover art** | `components/shelf/cover-art.tsx` | Drawn patterns from Malay craft: songket, awan larat, pucuk rebung, kain pelikat, tikar, bunga, ombak, plus stars and a sun |
| **Book dialog** | `components/shelf/shelf-dialog.tsx` | Colour flood from the click point, book turns to its cover, owner, give/lend, the owner's warkah, "Join to borrow it", "Next book" |
| **How it works** | `components/landing/how-it-works.tsx` | Accordion in the book colours, stamp slam |
| **Safety + FAQ** | `components/landing/safety-faq.tsx` | Native `<details>` index cards in the books' light tints |
| **Footer** | `components/landing/closing.tsx` | B-a-y-u arch blocks rise in |

Real copies come first (`public_shelf()`, newest first, owners anonymous),
each dressed in one of the drawn designs picked by its ISBN
(`web/src/lib/shelf/dress.ts`). SAMPLE books from `web/src/content/shelf.ts`
fill the stack up to 9, labelled "sample" when opened. The data is cached for
a minute, so the landing stays a static page.

## Rules
- Native scroll; Lenis smoothing for mouse wheels only.
- Small looping or one-off decoration (FAQ cards opening, the sign-in books drifting) may be plain CSS under `prefers-reduced-motion: no-preference`; anything scroll-driven or sequenced uses GSAP via `lib/gsap.ts`.
- Animate transforms, opacity and clip-path only. The breeze uses `gsap.quickSetter` and skips work while the stack is off screen.
- **Reduced motion:** a fixed camera, no drop-in, no breeze, instant dialog. Still 3D, still colourful.
- **No JavaScript:** the stack and every section render; the book buttons simply don't open.
- Every colour pair used for text is at least WCAG AA (checked in `brand.md`).

## Cultural care
- Patterns appear as linework and pattern only.
- **No Quranic verses or religious calligraphy** as decoration.
- **No invented Jawi.** If "Bayu" is ever set in Jawi (بايو), a native reader checks it first.
- Covers are Bayu's own designs. We never copy a publisher's cover art.
