# Brand: Bayu

*Locked 2026-10-30. Code name for the repo: **Magnus**.*

## Name
**Bayu** (Malay: *a gentle breeze*), pronounced **BAH-yoo** (바유).

> A breeze stops by for a while, then moves on. So do books on Bayu.

**Tagline options** (pick one at launch):
- *Books that breeze through.*
- *Let a book drift your way.*

**Before launch:** check that the domain and handles are free (e.g. `bayu.app`,
`getbayu`, `bayubooks`, `@bayu.books`). "Bayu" is a common given name,
so the exact handle is probably taken.

## Feature words (traditional Malay)
The app name stays light. The features carry the Malay character, and users
learn the words as they go.

| Feature | Word | Meaning | In the UI |
|---|---|---|---|
| Pass-it-on note | **Warkah** | Old Malay word for a letter | "Leave a warkah for the next reader" |
| A book's journey | **Rantau** | From *merantau*, to journey away from home | "This book's rantau: Ansan → Seoul → KL" |
| Top contributor badge | **Penglipur** | From *penglipur lara*, traditional storytellers who soothed sorrow | Badge for passing on 10+ books |
| Credits | **credits** | Plain English, kept simple on purpose | "You have 2 credits" |

Warkah, Rantau and Penglipur are **v0.2+ features**. The pilot uses credits only.

## Vibe: printed paper and a turning shelf
*Updated 2026-11-02. Replaces the night shelf (malam ground) and the bone
palette, which Zarith found boring. Direction from `Design.md`, a reference
page of a shelf whose chosen item turns out to face you.*

Everything is **printed paper**: a warm paper sheet with fine grain, ink type,
small boxed labels like a library catalogue card, and **one cobalt accent**.
The colour lives in the **books**: covers and spines are screen-printed in a
few inks (ink, cobalt, vermilion, mustard) on cream or kraft card.

- **The memorable thing:** the shelf. Spines stand side by side and the chosen
  book turns in 3D to show its cover. Everything around it stays quiet.
- **Motion answers people:** text rises through masks when it changes, a sheet
  of paper grows out of a cover when you open it. No fades for their own sake,
  no decoration that moves by itself.
- **Labels carry facts** (give or lend, how long, area, condition, a step's state),
  never decoration, and never an eyebrow above every heading.

**Colour tokens** (`web/src/app/globals.css`)
| Token | Use | Hex |
|---|---|---|
| `paper` | The page | `#EDEBE6` |
| `sheet` | Raised paper: cards, dialogs, fields | `#F4F2ED` |
| `ink` | Text, rules, labels | `#141414` |
| `muted` | Secondary text | `#6D6A63` |
| `cobalt` | The one accent: primary buttons, active tab, links that act, the mark | `#1F3FB0` |
| `cobalt-deep` | Hover and pressed | `#18328C` |
| `vermilion` | Errors, stamps (text-safe) | `#B7351B` |

**Print inks** (book covers and spines only, never body text): `print-vermilion`
`#D9472B` (covers use `#C23A1E` where text sits on it), `mustard` `#E2B23A`,
`cream` `#F1E9D6`, `kraft` `#D9CDB4`, plus ink and cobalt.

**Contrast** (WCAG AA ≥ 4.5 for text): ink on paper 15.5 · muted on paper 4.5 ·
muted on sheet 4.8 · cobalt on paper 7.4 · white on cobalt 8.8 · vermilion on
paper 4.9 · ink on kraft 11.7 · ink on mustard 9.4 · cream on ink 15.2 · cream
on cobalt 7.3 · cream on `#C23A1E` 4.4 (spine and cover titles only, which are
large text: ≥ 3).

**Type**
- **Newsreader** (variable, optical sizes): book titles, headings, reading text.
- **Inter Tight**: the interface: labels, buttons, form text.
- Labels (`.lbl`): Inter Tight 600, 11px, tracked .09em, uppercase; boxed with a
  1px ink rule (`.box`). Only for short facts.

**Shapes:** 2px corners everywhere (printed blocks, not pills). One primary
button per view (`.btn-primary`, cobalt); everything else `.btn-quiet` (1px ink rule).

**Malay motifs (linework only)**
- **Awan larat** ("drifting clouds"): the flowing spiral motif from Malay
  woodcarving and songket. Used as the wind lines.
- **Ukiran tebuk tembus**: the pierced carved panels of a Malay house that let
  the breeze through. The landing's signature moment.
- **The arch** (from the carved panel's top): retired from buttons in the
  paper redesign; may return as a cover motif.
- **Pucuk rebung** (bamboo shoot): the gold-on-oxblood triangle band from
  songket borders. Used as a band on the closing section.
- No Quranic verses or religious calligraphy as decoration. No invented Jawi;
  any Jawi is checked by a native reader first.

**Details**
- **Logo idea:** a book with a few pages lifted by the wind.
- **Library-card touches:** due dates look like a library **due-date stamp**,
  and credits and history look like a stamped **library card**.
- **Type:** see above.
- **Dark mode:** not now. If it comes back: ink ground, cream text, cobalt lifted to a lighter tint.

## Voice
English first, with friendly Malaysian touches, like a group chat of friends:
- "Book dah sampai! 📚" (the book has arrived)
- "Jom swap?" (let's swap?)
- "Tak apa, take your time." (on extension requests)

Keep Malay phrases short and obvious from context, because non-Malaysian readers
will join later.
