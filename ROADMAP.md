# Roadmap: Magnus MVP

*Drafted 2026-10-30. Assumes **~10 hours/week** alongside classes. Stretch
the dates if needed (e.g. around finals), but keep the order.*

**Goal for this roadmap:** by mid-January 2027, **2 real book clubs have run
real events on Magnus**, with RSVPs and a swap table, and we have numbers to
decide what comes next.

**Positioning** (from [MARKET.md](MARKET.md)): *the home for book clubs:
events, RSVPs and a swap table, in one link.* Organizers are the wedge.

---

## Overview

```
Nov 2 ─ Nov 15    Phase 0  Validate (talk)        ┐ run in parallel
Nov 2 ─ Nov 15    Phase 1  Walking skeleton (build)┘
Nov 16 ─ Nov 22   Phase 2  Spec + schema
Nov 23 ─ Dec 13   Phase 3  Clubs & events  ← the wedge
Dec 14 ─ Jan 3    Phase 4  Swap table      (lighter weeks, finals)
Jan 4 ─ Jan 17    Phase 5  Pilot with 2 clubs → decide v2
```

---

## Phase 0: Validate (Weeks 1-2, talking, not coding)
**Why:** the cheapest way to avoid building the wrong thing.

- [ ] DM organizers: KL Reads (+ Cheras/Cyberjaya chapters), Flipside, Rish's Book Club, The Badass Book Club, Eat Books Club, Seoul Silent Book Club
- [ ] Find readers: ERICA international students, Malaysian students in Korea, friends in KL
- [ ] Interview **5 organizers + 5 readers** (script: [MARKET.md §6](MARKET.md#6-validation-plan-before-writing-code))
- [ ] Write findings to `docs/interviews.md` (no names without permission)

**Done when:** 10 interviews are written up, and **≥ 2 organizers say "yes, I'll run
one real event on it"**.

**If fewer than 2 say yes after ~10 organizer conversations:** stop and rethink before
Phase 3. Options: readers-first, the Korea expat niche, or a different pain.

## Phase 1: Walking skeleton (Weeks 1-2, in parallel)
**Why:** get every piece of the stack deployed end-to-end while it's still tiny.

- [ ] Next.js + TypeScript (strict) + Tailwind app, mobile-first
- [ ] Supabase project: Auth (email magic link + Google)
- [ ] Deploy to Vercel. Every PR gets a preview URL.
- [ ] GitHub Actions CI: lint + typecheck + tests on every PR
- [ ] PWA basics: manifest, icons, installable
- [ ] Landing page + **organizer early-access form** (saved to Supabase). Doubles as validation: link it in your DMs.

**Done when:** a friend opens the URL on their phone, signs up, and CI is green.
**You'll learn:** deploy pipeline, CI, auth, environment variables and secrets.

## Phase 2: Spec + schema (Week 3)
- [ ] `docs/spec-mvp.md`: user stories built from the interview findings
- [ ] Database schema + Row Level Security policies as SQL migrations
- [ ] ADR 002: swap model (credits now, cycle matching later)

**Draft data model** (to be confirmed by the spec):
`profiles` · `clubs` · `club_members (role: organizer/member)` · `events` ·
`rsvps (going / waitlist / cancelled / attended)` · `books (isbn, title, cover)` ·
`shelf_items (owner, book, condition, status)` · `swap_listings (event, shelf_item)` ·
`reservations` · `credit_ledger`

## Phase 3: Clubs & events, the wedge (Weeks 4-6)
- [ ] Create a club; invite co-organizers
- [ ] Create an event: time, place, capacity, description
- [ ] Shareable event page with **rich WhatsApp/Instagram link previews** (OG images)
- [ ] RSVP with capacity + **waitlist that auto-promotes** when someone cancels
- [ ] Email reminders (24h before) and organizer announcements
- [ ] Organizer view: attendee list, check-in at the door

**Must-have tests:** capacity and waitlist logic, including two people grabbing
the last seat at the same time. This needs a Postgres function with row locking.
**You'll learn:** RLS, transactions and race conditions, background jobs and email.

## Phase 4: Swap table (Weeks 7-9, lighter around finals)
- [ ] My shelf: add books by **ISBN barcode scan** (ZXing) → lookup via Open Library (Google Books as fallback)
- [ ] Bring books to an event: list shelf items on the event's swap table
- [ ] Reserve books before the meetup (with a per-person limit)
- [ ] At the event, both people tap "handed over" → credits move in the ledger
- [ ] Credits: give 1 → earn 1; spend 1 to reserve

**Must-have tests:** credit ledger (it can never go negative, and every move has two
sides), no double reservations.
**You'll learn:** camera APIs, external APIs, designing a ledger.

## Phase 5: Pilot (Weeks 10-11)
- [ ] Run **2 real events** with partner organizers. Be there in person for at least one, at ERICA or in Seoul.
- [ ] Track the numbers below and gather feedback

| Metric | Target |
|---|---|
| Organizers who run an event on Magnus | ≥ 2 |
| RSVP → actually attended | ≥ 60% |
| Attendees who list ≥ 1 book on the swap table | ≥ 30% |
| Completed swaps | ≥ 10 |
| Organizers who want to use it again | 2 of 2 |

**Then decide v2 based on the data:** paid ticketing (Malaysian payment
gateway with FPX/DuitNow), club discovery map, multi-party swap cycles, BM/Korean
language support, reading streaks, or going native ([ADR 001](docs/decisions/001-pwa-first.md) triggers).
If events work but swaps don't, drop swapping and lean into events.

---

## Out of scope for the MVP (on purpose)
Payments · in-app chat (use WhatsApp links) · courier delivery · recommendations ·
native apps · multi-language UI (strings ready for translation, English only for now)

---

## How we work
- Each phase is a **GitHub milestone**, and each checkbox above is an **issue**.
- One branch per issue (`feat/rsvp-waitlist`) → PR → **Steve reviews** → **Zarith merges**.
- Every PR gets a Vercel preview link, so you can test on your phone before merging.
- End of each session: `/wrap-up` (when working locally in Claude Code).
