# 02 · Design: how Bayu looks, moves and talks

*Handoff, 2026-11-21. The long-form sources are `docs/brand.md` (palette,
voice, contrast rules) and `docs/landing.md` (the landing page piece by piece).
This file is the working summary plus the two designs that are planned but not
built: **dark mode** and **real covers/photos**.*

## What Zarith wants (in his words, over many rounds)
- "Beautiful and functional", a **well-executed app before piloting**, for a good first impression.
- He found early versions "boring", then "plain", "cheap", with "no contrast and depth".
  The fix that worked (Nov 5): **soft and loud sections in turn**, hard print-offset shadows, an ink app frame.
- He likes **bolahh.com** (a Malaysian futsal booking app): the home page *is*
  the product, real photos on every card, one loud accent on a calm ground,
  bold condensed type, a local voice ("KAD COP DAH SAMPAI"), stamp cards and
  rank tiers. Learn from it; don't copy its orange or its look.
- He asked for **a light/dark toggle** and **real photos** (Nov 19).
- He reviews on his **phone**. Always check phone width (Pixel 7 / 375 px) first.

## Concept: printed paper and a turning shelf
Everything is **printed paper**: warm paper with fine grain, ink type, small
**boxed labels** like a library catalogue card, and **one cobalt accent**. The
colour lives in the **books**: covers and spines screen-printed in a few inks
on cream or kraft card, with Malay craft patterns (`shelf/cover-art.tsx`).

- **The memorable thing is the shelf:** spines side by side, the chosen book
  turns in 3D to face you (`components/turning-shelf/`). Everything else stays quiet.
- **Motion answers people:** text rises through masks when it changes, a sheet
  grows out of a cover when you open it. No decorative motion, no scroll-triggered
  entrances, one GSAP ticker loop for the shelf only.
- **Labels carry facts** (give/lend, how long, area, condition, a step's state),
  never decoration, never an eyebrow above every heading.

## Tokens (`web/src/app/globals.css`, Tailwind v4 `@theme`)
| Token | Hex | Use |
|---|---|---|
| paper | `#edebe6` | the page |
| sheet | `#f4f2ed` | raised paper: cards, dialogs, fields |
| ink | `#141414` | text, rules, the app bar/footer ground |
| muted | `#66635c` | secondary text (5.0:1 on paper) |
| cobalt | `#1f3fb0` | the one accent: actions, active state, the mark |
| cobalt-deep | `#18328c` | pressed / hover |
| vermilion | `#b7351b` | errors and stamps (text-safe) |
| print-vermilion, cream `#f1e9d6`, kraft `#d9cdb4`, mustard `#e2b23a` | | print inks (covers, spines, loud blocks); never small text on paper |
| cream-muted | `#a8a49a` | small print on ink (7.4:1) |

Depth: `--shadow-print` (4px 4px 0 ink) on cards, `--shadow-print-lg` (7px) on
landing panels (`.panel`), 3px on buttons that press flat when tapped. A card
inside a card or panel stays flat. **No soft grey shadows** (only books, as
physical objects, get soft ones).

Contrast pairs already checked: cream on ink 15.2 · cream on cobalt 7.25 ·
mustard on cobalt 4.45 (large numbers/decoration only) · ink on mustard 9.35 ·
ink on kraft 11.7 · white on vermilion 5.9.

**Type:** Newsreader Variable (display serif, big titles, tight tracking) +
Inter Tight Variable (text, labels). Boxed labels are small uppercase
tracked Inter (`.lbl`, `.box`). Self-hosted via fontsource.

## Components and rhythm
- `.btn-primary` (cobalt, 1px ink border, 3px ink offset), `.btn-light` (paper on
  ink, mustard offset), `.btn-quiet`, `.card`, `.panel`, `.box` + `.lbl`, `.field`.
- **Landing, top to bottom:** soft (shelf under a lamp on a kraft plank) → loud
  (cobalt "How a book moves" band) → soft (safety on kraft, questions on sheet) →
  loud (ink footer, giant mustard "Bayu" cut off at the edge).
- **App frame:** ink top bar with catalogue tabs (mustard block = current page),
  ink bottom tab bar on phones, ink footer pinned to the bottom. Signed out: a
  **Sign in** button in the bar instead of the waiting badge.
- **Sign-in pages:** books on a cobalt half (cobalt band on phones), the form in a printed panel.
- **Me:** the credits card is cobalt with mustard numbers (the library card).
- Any ink or cobalt container gets `.on-dark` so focus rings turn mustard (the
  cobalt ring would vanish there). New dark surfaces must opt in.

## Voice
Plain, warm, short. Sentence case. Buttons say exactly what happens ("Email me a
code", "Sign in to ask for this book"). Errors say what happened and what to do,
never apologise vaguely. Feature words in Malay arrive with v0.2 (Warkah,
Rantau, Penglipur); the pilot says "credits". Use **copy** (a physical book
someone owns) vs **book** (title by ISBN), **give**, **lend**, **handover**.

## Accessibility (a floor, not a feature)
Visible keyboard focus everywhere (mustard on dark), 44 px tap targets,
`prefers-reduced-motion` gets the finished state (`gsap.matchMedia()` with
`MOTION_OK`), live regions for the shelf caption and status messages, Lighthouse
accessibility 100 on the main pages (re-check after every visual change; axe
skips text on gradients, so check those by hand).

---

## PLANNED 1: Light / dark mode toggle (next task)
Zarith chose: toggle, not a switch to dark. Order agreed: open shelf ✓ → **dark mode** → photos.

**Behaviour.** A sun/moon button in the app bar and the landing header. First
visit follows the phone (`prefers-color-scheme`); the choice is remembered
(`localStorage`, wrapped in try/catch). Set `data-theme="light|dark"` on
`<html>` with a tiny inline script in `<head>` **before paint** (CSP already
allows inline scripts) so there's no flash. Update `<meta name="theme-color">`
per theme (layout and `AUTH_VIEWPORT`/`APP_VIEWPORT` hard-code light colours today).

**The one real piece of work.** `ink` means two things today: *text* (must turn
light in dark mode) and *the dark frame* (app bar, footers, tab bar: must stay
dark). Split them first:
- Keep `ink`/`paper`/`sheet`/`muted` as *roles* that flip per theme.
- Add an always-dark surface token (e.g. `night`) for the app bar, footers and
  tab bar, and a matching text token; replace `bg-ink text-cream` on those.
- ~280 colour utility uses and ~19 hard-coded hex values in `.tsx`
  (e.g. `content/shelf.ts` cover colours, `#fff6e8` text on vermilion books):
  audit each. Book covers/spines keep their print inks in both themes.

**Dark palette (proposal; check every pair).** Ground: deep blue-black (around
`#12141c`), raised sheet a step lighter, text cream `#f1e9d6`, muted text around
`#a8a49a`, cobalt **brightened** for text/links on dark (the `#1f3fb0` is too dark
on dark: aim ≥4.5:1), mustard as the loud colour. Print shadows become a darker
offset or a cobalt one; decide by screenshot. Paper grain: lower opacity. It must
still read as Bayu at night, **not** Bolahh's orange-on-black.

**Done means:** both themes screenshotted on phone + desktop for landing,
browse, book page, add, activity, me, login; Lighthouse accessibility 100 in
both; Playwright runs the suite in both (a project with `colorScheme: "dark"`);
the toggle is keyboard-reachable with an accessible name ("Dark mode", pressed state).

## PLANNED 2: Real covers and licensed photos
Zarith said "search photos of books on Google, I give permission". His permission
can't cover photographers' and publishers' rights, so:
- **Book covers: Open Library** by ISBN
  (`https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg?default=false`), Google
  Books as fallback. `books.cover_url` already exists (a CHECK allows only Google
  Books and Open Library hosts) but the UI doesn't show it yet. Show the real
  cover on cards, the book page and the turning shelf's open book; keep the
  screen-print art as the fallback and for spines. Allow the hosts in
  `next.config.ts` (`images.remotePatterns`) and the CSP `img-src`.
- **Mood photos: Unsplash and Pexels only** (free licence, commercial use OK):
  shelves, reading in a café, paperback stacks. For the landing, empty states and
  sign-in. Record each photo's source URL and photographer in
  `docs/photo-credits.md`. **Never** use random Google Images results, and no
  photos of real, identifiable people.
- Better still, later: Zarith's own photos (books, his shelf, Ansan meet-up spots).
  He was asked for 10–20 daylight phone photos.

## Avoid (things that made earlier versions look templated)
Identical rounded SaaS cards with soft grey shadows · gradient washes · an
uppercase eyebrow above every heading · accenting one word of a headline ·
fades on every section · a second accent colour competing with cobalt.
