# Landing page: the wind carries a book

*Redo 2026-10-31. The first version (2026-10-30) read as "AI generated, too
plain". This version was rebuilt with the taste-skill tools (direction, lint,
page inspector) and the GSAP skills, not just their notes.*

## The idea
> A traditional Malay house is built for the **bayu**: raised on stilts, with
> carved wooden panels (*ukiran tebuk tembus*) that let the breeze pass
> through. On our page, **the wind blows through a carved panel and carries a
> book from one reader to the next**, and the warm Malay world unfolds behind it.

Competitor test: no other book app can tell this story. That's the point.

## Direction: one motif
taste-skill direction **`one-motif`** (seed 429143694): one shape carries the
whole page. Ours is the **arch of a carved panel** (`.arch` in `globals.css`).
It is the hero window, the button shape (`.btn-arch`), the shelf stage, the FAQ
tabs, the rantau postcards and the letters of the closing wordmark.

## Scroll story

| # | Section (file) | Ground | Motion |
|---|---|---|---|
| 1 | **Hero** "Books that breeze through." (`hero.tsx`) | Sky + giant kayu arch | CSS line-rise on load. On scroll (scrubbed): SplitText letters blow away, the arch grows, the book's pages turn |
| 2 | **Wind scene** (`wind-scene.tsx`, held 3 screens) | Sky → kayu | Kayu window opens (clip-path arch). Wind lines draw (DrawSVG); 18 loose pages ride them (MotionPath). The carved panel draws, then you fly through it; gold lines, then "Like the bayu, a book only stops by." |
| 3 | **How it works** "Four steps, one fair rule." (`how-it-works.tsx`) | Bone | Horizontal accordion (vertical on phone), timber to songket gold. Opening a step slams its stamp down |
| 4 | **Showcase** "On the shelf in Ansan" (`showcase.tsx`) | Bone | Hover/focus a title: its cover flips in on a coloured arch stage |
| 5 | **Rantau scene** (`rantau-scene.tsx`, held 2.5 screens) | Merah | Vertical scroll becomes horizontal travel Ansan → Seoul → KL. Route draws, passport stamps slam, the warkah unfolds on the last card |
| 6 | **Safety + FAQ** (`safety-faq.tsx`) | Bone | FAQ as stacked index cards with arch tabs; answers open with a grid-rows transition |
| 7 | **First step** "Jom, list one." (`first-step.tsx`) | Songket gold | A working "List your first book" dialog (give/lend toggle). The pucuk rebung band slides like cloth on a loom |
| 8 | **Closing** (`closing.tsx`) | Bone | B-a-y-u arch blocks rise into place |

## Rules
- Two held scroll scenes (2 and 5); the sections between move on scroll but never hold you.
- **No preloader.** The headline is readable on the first frame.
- **Native scroll.** Lenis smoothing on desktop wheel only (`smooth-scroll.tsx`); off for touch and reduced motion.
- Animate only **transform, opacity, clip-path** (+ SVG stroke).
- **Reduced motion / no JS:** every section's default markup *is* its finished picture. Scenes only get `.is-live` (tall + sticky) when their script runs.
- Content is never hidden waiting for a reveal: the close section's motion is a scrubbed tilt, not a fade-in.
- taste-skill house rules: no eyebrow labels, no monospace, no 01/02 numbering, no thin rules, no gradients, no resting shadows (the dialog is a real UI fragment, so it keeps one), two-line headlines.

## Verified (2026-10-31)
- taste-skill lint: **0 FAIL, 0 WARN**.
- taste-skill inspector: **1 FAIL, 4 WARN**, each defended:
  - `few-pictures` (FAIL) and `no-footage`: no real photos yet. Add four or more
    (friends' books, a kampung house, songket) to `web/public/images/` and this clears.
  - `size-count` (13 sizes): the motion pieces (wordmark letters, city names) are deliberate display sizes.
  - `blank-gap` 1440px: the closing blocks start lower and rise in as you scroll.
  - `mixed-font-headline`: the postcard pairs a serif city with a sans date. It's a label, not a headline.
- Screenshots at 1440 and 390 px (normal and reduced motion): no console errors, no horizontal scroll.

## Tech
- `gsap` + `@gsap/react`. Plugins registered once in `web/src/lib/gsap.ts`: ScrollTrigger, DrawSVGPlugin, MotionPathPlugin, SplitText. All free.
- `lenis` for wheel smoothing, driven by the GSAP ticker.
- Every effect lives inside `gsap.matchMedia()` with `MOTION_OK`.

## Cultural care
- Motifs (**awan larat**, carved panels, **pucuk rebung**) appear as linework and pattern only.
- **No Quranic verses or religious calligraphy** as decoration.
- **No invented Jawi.** If "Bayu" is ever set in Jawi (بايو), a native reader checks it first.

## Sample content to replace before launch
Book titles, owners and the warkah note are **samples** (`web/src/content/landing.ts`).
The showcase reads the real shelf once friends list their books.

## What we took from each repo
| Repo | Lesson we use |
|---|---|
| greensock/gsap-skills | ScrollTrigger scrub, containerAnimation for the horizontal rantau, DrawSVG, MotionPath, SplitText, `useGSAP` cleanup, `matchMedia` |
| pbakaus/impeccable | One authored moment (fly through the carved panel); the brief wins; landing = Persuade, app = Operate |
| leonxlnx/taste-skill | Direction picked by its tool (`one-motif`), its lint and its page inspector run on every change; avoid cream + terracotta |
