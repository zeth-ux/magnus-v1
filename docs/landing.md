# Landing page: the turning shelf

*Fourth version, 2026-11-02. Zarith asked for a redesign from `Design.md`, a
reference page whose shelf of spines turns the chosen item out to face you. We
took its concept and motion, not its assets (its images are someone else's
VHS art). Palette and type: [brand.md](brand.md).*

## The page
| Piece | File | What happens |
|---|---|---|
| **Header** | `components/landing/site-header.tsx` | Boxed links left, the cobalt mark centred, "Join" right |
| **Turning shelf** (first screen) | `components/turning-shelf/turning-shelf.tsx`, maths in `geometry.ts` | Books stand spine out, endlessly. The middle one turns in 3D to show its cover, leans -4.5°, lifts and comes forward; neighbours slide apart. Arrows, ← →, a drag, a sideways scroll or a click on a spine moves along. Give / Lend tabs jump to each run, and a cobalt block slides under the active one. The caption (title, author, facts as boxed labels) rolls through a mask |
| **Covers and spines** | `components/turning-shelf/print-art.tsx` | Screen-print style: card colour, a pattern disc overprinted by an ink disc a little off register, big serif title, Give/Lend box. Malay craft patterns from `shelf/cover-art.tsx` |
| **Book sheet** | `components/turning-shelf/book-sheet.tsx` | Click the open cover (or the round button, or Enter): a sheet the size and tilt of the cover grows to fill the screen, each line rises out of its mask, and the cover bleeds in as ink blots (an SVG mask with turbulence). Close or Esc folds it back into the cover |
| **The shelf's ground** | `globals.css` (`.turning-shelf`, `.ts-plank`) | A lamp over the shelf (lighter paper behind the books, darker edges) and a kraft plank with an ink edge the books stand on |
| **How a book moves** | `components/landing/how-it-works.tsx` | The loud band: full cobalt, a big cream title, four printed step cards (sheet, ink border, hard offset shadow) with a big cobalt numeral and the vermilion library stamp |
| **Safety + questions** | `components/landing/safety-faq.tsx` | Back to paper: safety on a kraft panel, questions on a sheet panel; answers in native `<details>`, a boxed + that turns when open |
| **Footer** | `components/landing/closing.tsx` | Ink, loud again: one invitation, a paper button with a mustard offset, boxed cream links, and a giant mustard Bayu wordmark cut off at the bottom edge |

The rhythm going down is soft, loud, soft, loud (see `docs/brand.md`, "Contrast and depth").

Books come from `getLandingShelf()` as before (real copies first, samples to
fill), ordered gives then lends.

## Rules
- **One moving moment:** the shelf. Sections below are static: no scroll-triggered entrances.
- One GSAP ticker loop writes the shelf's transforms straight to the DOM, and only
  while the shelf is on screen and something changed. Animate transforms and clip-path only.
- Sideways scrolling moves the shelf; up and down always scroll the page.
- The ring cursor appears only for a mouse or trackpad, and only over the shelf.
- **Reduced motion:** the shelf snaps instead of gliding, no tilt, the caption swaps
  without sliding, the sheet opens and closes instantly.
- **Keyboard:** the shelf is one focusable group (← → to move, Enter to open);
  the arrows, tabs and open button are real buttons; the caption is a live region.
- **No JavaScript:** the first book's caption and the spines render; nothing turns.
- Chrome quirk: a 3D face must not clip its overflow, or a turned face stops receiving clicks.

## Cultural care
- Patterns appear as linework and pattern only.
- **No Quranic verses or religious calligraphy** as decoration.
- **No invented Jawi.** If "Bayu" is ever set in Jawi (بايو), a native reader checks it first.
- Covers are Bayu's own designs. We never copy a publisher's cover art.
