# Roadmap: Bayu pilot (v0.1)

*Updated 2026-10-30. Assumes **~10 hours/week** alongside classes. If weeks
get busy, cut scope (wishlist, extensions) before moving the pilot past finals.*

**Goal:** by mid-December 2026, about **15 English readers in Ansan** have been
giving and lending real books on **Bayu** for 2 weeks, and we have the numbers
to decide what comes next.

**Why this plan:** [ADR 002](docs/decisions/002-swap-first-korea-pilot.md)
(swap-first pilot in Korea) · [ADR 003](docs/decisions/003-credit-system.md)
(credit system) · [ADR 001](docs/decisions/001-pwa-first.md) (PWA) ·
[Brand](docs/brand.md)

---

## Overview

```
Nov 2 ─ Nov 8     Week 1  Walking skeleton + talk to friends
Nov 9 ─ Nov 15    Week 2  Shelf: add books, give/lend, browse
Nov 16 ─ Nov 22   Week 3  Requests, handover, credits ledger
Nov 23 ─ Nov 29   Week 4  Lending lifecycle, wishlist, polish, seed books
Nov 30 ─ Dec 13   Pilot   2 weeks, ~15 readers, meet-ups per request
Dec 14 ─ Jan 3    Finals  Light: pilot report, decide v0.2
```

---

## Week 1: Walking skeleton + friends (Nov 2-8)
**Build**
- [x] Next.js + TypeScript (strict) + Tailwind app, mobile-first, Bayu colour tokens
- [x] Supabase project + Auth (email magic link + Google)
- [ ] Deploy to Vercel. Every PR gets a preview URL.
- [x] GitHub Actions CI: lint + typecheck + tests on every PR
- [x] PWA basics: manifest, icon, installable
- [x] Landing page, full version with both scroll scenes (moved up from week 4) ([landing.md](docs/landing.md))

**Talk**
- [ ] Ask the 5 friends: how many physical English books do you have here? Which would you give, and which only lend?
- [ ] Create the pilot WhatsApp group
- [ ] Ask friends for 2-3 favourite **public meet-up spots** (shown as suggestions on the meet-up card)
- [ ] Check the Bayu domain and handles ([brand.md](docs/brand.md))

**Done when:** a friend opens the link on their phone and signs up, and CI is green.
**You'll learn:** deploy pipeline, CI, auth, environment variables and secrets.

## Week 2: Shelf (Nov 9-15)
- [ ] Profile: display name, city, languages
- [ ] **Add a book:** scan the ISBN barcode (ZXing) or search, then look it up on Google Books (Open Library as fallback)
- [ ] Each copy: condition, **give or lend**, max lend period (2w / 4w / 2m / flexible), short note
- [ ] My shelf: edit, pause, remove
- [ ] **Browse + search** all available books (title, author, give/lend filter)
- [ ] Book detail page, with **"N readers have this"**
- [ ] Database: `profiles`, `books`, `copies` + Row Level Security

**Done when:** you can scan a real book on your phone and a friend sees it in browse.
**You'll learn:** camera APIs, external APIs, RLS.

## Week 3: Requests, handover and credits (Nov 16-22)
- [ ] **Request** a copy (for a lend: propose a return date within the max)
- [ ] Owner **accepts or declines**. Accepted → WhatsApp numbers revealed (R13) → **meet-up card**: one proposes place + time, the other confirms or counters
- [ ] **Both confirm "handed over"** → credits move ([ADR 003](docs/decisions/003-credit-system.md) R1-R3)
- [ ] `credit_ledger` (append-only) + Postgres functions for every credit move
- [ ] Starter credit on the first listing (R5), limits: 3 borrowed, 3 open requests (R7)
- [ ] Credit hold on accept, 3-day request expiry, 3-day handover auto-confirm (R10-R12, once approved; see [user-flow.md](docs/user-flow.md))
- [ ] Credits page styled as a library card: balance, locked, history
- [ ] Email notifications: new request, accepted, handover confirmed
- [ ] After each handover: quick 👍/👎 and a report button

**Must-have tests:** every test listed in ADR 003, including two requests
racing for the last credit.
**Done when:** you and a friend complete a real give and a real lend in person.
**You'll learn:** transactions, row locking, designing a ledger, idempotency.

## Week 4: Lending lifecycle + launch prep (Nov 23-29)
- [ ] Due dates styled as a library stamp, reminder email 3 days before
- [ ] Extension request → lender approves or declines
- [ ] Return confirmation → credit unlocks. Not returned after +14 days → lender reports → forfeit (R4)
- [ ] **Wishlist** + "a book you want is available" email
- [ ] Polish: empty states, loading states, errors, install prompt
- [ ] Landing: swap the sample shelf for the real pilot shelf (Supabase), add real account deletion
- [ ] **Seed:** you + 5 friends list ~5 books each before launch (25+ books)
- [ ] Ask Steve for a full review and fix every Blocking item

**Done when:** a stranger could use Bayu without you explaining anything.

## Pilot (Nov 30-Dec 13)
- [ ] Launch to the 5 friends; each invites 2 more readers (~15 total)
- [ ] Optional: one **group swap meet-up** so readers meet each other
- [ ] Note every confusion or complaint in `docs/pilot-notes.md`
- [ ] Short chat with each user at the end (what did you like, what annoyed you, would you miss it?)

| Signal | Good sign |
|---|---|
| Books listed per user | ≥ 3 |
| Users who request at least 1 book | ≥ 50% |
| Completed handovers (gives + lends) | ≥ 10 |
| Lends returned on time | ≥ 80% |
| Users who invite someone without being asked | Any |
| "Would you be sad if Bayu disappeared?" | Most say yes |

## Finals + decide v0.2 (Dec 14-Jan 3)
- [ ] Write `docs/pilot-report.md`: numbers, quotes, surprises
- [ ] Decide what's next based on the data. Candidates:

| Candidate | When it makes sense |
|---|---|
| **Warkah** (pass-it-on notes) + **Rantau** (book journey via QR bookplate) | Users love the community feel |
| **In-app messages** per request (replace WhatsApp) | Strangers join, or people dislike sharing numbers |
| **Penglipur** badges, lending rewards | Lending is rare (ADR 003 R9) |
| **GS25 반값택배 parcels** | Readers in other cities want in |
| **Clubs, events, organizer tools** ("coming soon") | The group meet-up is the highlight |
| **Malaysia** (KL launch) | Pilot works, and friends take it home over the break |
| Native app (Expo) | [ADR 001](docs/decisions/001-pwa-first.md) triggers |

---

## Out of scope for v0.1 (on purpose)
Textbooks · parcels · clubs/events/organizer tools · payments · in-app chat
(use WhatsApp) · Warkah/Rantau/Penglipur · recommendations · Korean-language
books · native apps

## How we work
- Each week is a **GitHub milestone**, and each checkbox is an **issue**.
- One branch per issue (`feat/shelf-isbn-scan`) → PR → **Steve reviews** → **Zarith merges**.
- Test every PR on your phone using its Vercel preview link before merging.
- End each local session with `/wrap-up`.
