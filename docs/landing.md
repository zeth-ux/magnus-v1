# Landing page: the wind carries a book

*2026-10-30. Storyboard: the "Bayu v0.1 Screens" design canvas on claude.ai
(page "Landing storyboard", frames L1-L8).*

## The idea
> A traditional Malay house is built for the **bayu**: raised on stilts, with
> carved wooden panels (*ukiran tebuk tembus*) that let the breeze pass
> through. On our page, **the wind blows through a carved panel and carries a
> book from one reader to the next**, and the warm Malay world unfolds behind it.

Competitor test: no other book app can tell this story. That's the point.

Decisions: metaphor **A** (wind through the carved panel), Malay touches
**subtle** (palette + linework), **no photos yet** (drawn linework only; swap in
real photos of friends' books after the pilot).

## Scroll story

| Frame | Beat | Ground | Motion |
|---|---|---|---|
| L1 | **Hero.** "Books that breeze through." + one sentence + *Join the Ansan pilot* | Sky | Headline rises line by line on load (~0.9 s). Wind lines drift. Readable on the first frame, no preloader |
| L2 | **The wind arrives.** "Your finished book still has places to go." | Sky | ⭐ **Scene 1** starts (held ~3 screens, scrubbed). Awan larat lines draw themselves (DrawSVG); the book's pages lift |
| L3 | **Through the panel.** "Like the bayu, a book only stops by." | Sky → **kayu** | Book follows the wind (MotionPath) through the carved panel; the kayu world opens outward from it (clip-path) |
| L4 | **How credits work** (library card with stamps) | Kayu | Quiet. Rows arrive in order (70 ms apart); each stamp presses in once |
| L5 | **Breezing in Ansan right now**: the real pilot shelf (the "live thing") | Bone | Index with preview: hover a title, its cover shows. Read-only data from Supabase |
| L6 | **Every copy has a rantau** (Ansan → Seoul → KL + a warkah) | Merah hati | **Scene 2** (held ~2 screens). Route draws, stamps press in, the warkah unfolds. Labelled as "after the pilot" |
| L7 | **Safe by design** + FAQ | Bone | Quiet. Real `<details>` accordion |
| L8 | **Close**: "Jom, list your first book." + giant *Bayu* | Kayu | Wordmark grows slightly as it scrolls in |

## Rules (from the three design repos we studied)
- **Two scroll scenes only** (L2-L3 and L6), with quiet sections between them. One protected signature moment (the panel).
- **No preloader.** The message is readable on the first frame; load motion is over by ~1.2 s.
- **Native scroll.** No scroll-jacking, no custom cursor. Lenis smoothing optional and off for touch.
- Animate only **transform, opacity, clip-path** (+ SVG stroke for DrawSVG).
- **Reduced motion:** every frame shows its finished state; no travel. Use `gsap.matchMedia()`.
- **Phone:** shorter paths and holds, or the finished composition. Designed separately, not squeezed.
- **No:** eyebrow labels, 01/02/03 numbering, identical card grids, gradients, glows, emoji icons, monospace costume.
- Content stays visible if JavaScript fails.

## Tech
- `gsap` + `@gsap/react` (`useGSAP` with a scope, client-only) + plugins **ScrollTrigger**, **DrawSVGPlugin**, **MotionPathPlugin**. All free.
- GSAP skills vendored in `.claude/skills/gsap-*` (MIT), so every Claude session follows them.
- Scenes: a sticky stage inside a tall section, timeline scrubbed by ScrollTrigger; `ScrollTrigger.refresh()` after fonts load.
- Perf budget: 60 fps on a mid-range Android phone; lazy-start scenes near the viewport.

## Palette by chapter
Sky (opening) → **kayu** (inside) → bone (shelf) → **merah hati** (rantau) → bone (safety) → **kayu** (close). Tokens in [brand.md](brand.md).

## Cultural care
- Motifs (**awan larat**, carved panels) appear as **linework and pattern** only.
- **No Quranic verses or religious calligraphy** as decoration.
- **No invented Jawi.** If "Bayu" is ever set in Jawi (بايو), a native reader checks it first.

## Sample content to replace before launch
Book titles, owners and the warkah note in L5-L6 are **samples**. L5 reads the real shelf once friends list their books. Contact email in L8 is a placeholder.

## What we learned from each repo (short)
| Repo | Lesson we use |
|---|---|
| greensock/gsap-skills | How to build it: ScrollTrigger, DrawSVG, MotionPath, `useGSAP` cleanup, `matchMedia` for reduced motion, transforms only |
| pbakaus/impeccable | One authored moment beats many; the brief wins; landing = Persuade (bold), app = Operate (calm); craft-floor checklist |
| leonxlnx/taste-skill | Idea from the subject (competitor test); 2-3 scroll scenes + quiet sections; one live thing; no preloader; avoid cream + terracotta (so our warmth comes from real materials) |
