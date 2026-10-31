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

## Vibe: a night shelf of bright books
Two moods, one brand:
- **The app** (where people get things done): calm, light and airy. Like a friend
  handing you a book on a breezy afternoon, not a marketplace.
- **The landing page** (where people decide to join, updated 2026-10-31): a warm
  near-black **malam** ground where the books themselves bring the colour, each
  with a bold cover patterned from Malay craft (after Stripe Press). See [landing.md](landing.md).

Malay touches stay **subtle**: palette and linework, not costume.

**Colour tokens** (updated 2026-10-31)
| Token | Use | Hex |
|---|---|---|
| `bone` | Paper ground (replaces the old cream `#FBF7EF` and `#F1EFEA`, which taste-skill still read as cream) | `#EEEEEA` |
| `bone-deep` | Second paper tone (inputs, toggles, FAQ cards) | `#E2E1DB` |
| `muted` | Secondary text on bone | `#5C574E` |
| `ink` | Text | `#2B2A28` |
| `sky` | Airy backgrounds, decoration only | `#9CC9E3` (light: `#DCEEF7`) |
| `pandan` | Primary buttons on light grounds | `#2F7A4D` |
| `kopi` | Secondary accents in the app | `#7A5838` |
| `kayu` | Full fields on the landing (carved cengal timber) | `#3B2618` |
| `kayu-muted` | Secondary text on kayu | `#CDBFA8` |
| `songket` | Gold linework, large text and buttons on kayu | `#C9A24A` |
| `merah-hati` | Oxblood, stamps | `#6E1F1F` |
| `malam` | Landing ground (night) | `#1C1614` |
| `paper` | Text on malam | `#EFE9DF` |
| `merah-light` | Error text and borders on malam (9.0:1) | `#FF9E8F` |

**Book colours (landing):** each sample book has a spine colour, a pattern ink,
a text colour and a flood colour for its open page, in `web/src/content/shelf.ts`.
Text contrast: spines 5.4 to 13.4, open pages 4.6 to 13.4 (all ≥ 4.5). Paper on
malam 14.8.

**Why bone, not cream:** a yellow-cream ground with a brown or terracotta accent
is now the most recognisable "AI-generated" look (taste-skill research). Our warmth
comes from **real materials used as full fields** (timber, songket gold, oxblood),
and the paper is a low-saturation bone (20% vs the old cream's 60%).

Contrast checked (WCAG AA needs ≥ 4.5 for text): ink on bone 12.3 · bone on kayu
12.2 · songket on kayu 5.9 · kayu on songket (button text) 5.9 · kayu-muted on
kayu 7.9 · bone on merah hati 9.6 · songket on merah hati 4.7 · white on pandan
5.2 · kopi on bone 5.5 · muted on bone 6.2 · muted on bone-deep 5.5 · bone on the
how-it-works timber tints `#53371F` 9.3 and `#6B4A2C` 6.8 · ink on sky 8.1. Sky is too light for text on bone; use
it only for backgrounds and decoration.

**Malay motifs (linework only)**
- **Awan larat** ("drifting clouds"): the flowing spiral motif from Malay
  woodcarving and songket. Used as the wind lines.
- **Ukiran tebuk tembus**: the pierced carved panels of a Malay house that let
  the breeze through. The landing's signature moment.
- **The arch** (from the carved panel's top): the one shape of the brand.
  Buttons (`.btn-arch`), windows, tabs and stages use it (`.arch`).
- **Pucuk rebung** (bamboo shoot): the gold-on-oxblood triangle band from
  songket borders. Used as a band on the closing section.
- No Quranic verses or religious calligraphy as decoration. No invented Jawi;
  any Jawi is checked by a native reader first.

**Details**
- **Logo idea:** a book with a few pages lifted by the wind.
- **Library-card touches:** due dates look like a library **due-date stamp**,
  and credits and history look like a stamped **library card**.
- **Type:** a serif for book titles (bookish), a clean sans-serif for the UI.
- **Dark mode:** night breeze, with a deep navy background and cream text.

## Voice
English first, with friendly Malaysian touches, like a group chat of friends:
- "Book dah sampai! 📚" (the book has arrived)
- "Jom swap?" (let's swap?)
- "Tak apa, take your time." (on extension requests)

Keep Malay phrases short and obvious from context, because non-Malaysian readers
will join later.
