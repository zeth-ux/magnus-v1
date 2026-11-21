# 01 · Product requirements: Bayu

*Written 2026-11-21 as a handoff for the next Claude. Start with
[05-HANDOFF.md](05-HANDOFF.md) for the current state; this file says what Bayu
is and what it must do. Decision records in `docs/decisions/` are the source
of truth when they disagree with this summary.*

## One line
**Bayu** (Malay: *a gentle breeze*) lets readers **give** and **lend** physical
English books to people nearby, with **credits** keeping it fair. Code name in
the repo: *Magnus*. Live: https://magnus-v1.vercel.app

## The problem
English books are hard to find and expensive in Korea. Zarith (the founder, an
AI student at Hanyang University ERICA in Ansan) and his Malaysian friends all
read English books and each own a few. Direct 1-for-1 swaps rarely line up
("I want yours *and* you want mine"), so books sit on shelves.

## Who it's for
- **Pilot:** ~15 English readers in **Ansan, Korea**: Zarith, 5 friends ready
  now, each inviting 2 more. Mostly Malaysian international students.
- **Later:** other Korean cities (parcels via GS25), then Malaysia (KL).
- Open to anyone (no university email check). English books only. **No
  textbooks:** Bayu is a reader community, not a campus marketplace.

## What success looks like (pilot, Nov 30–Dec 13 planned)
Judge by **behaviour, never signups** (friends are polite):
- 25+ real books listed before launch (seed: 5 friends × ~5 books).
- Requests made, handovers confirmed, lent books returned.
- At the end: would they miss it? What annoyed them? (`docs/pilot-notes.md`,
  then `docs/pilot-report.md`).

## Core idea: credits (ADR 003)
> A credit means "I've added a book to the community, so I can take one out."

- Give a book: giver **+1**, receiver **−1**. Ownership moves.
- Lend a book: 1 of the borrower's credits is **locked** as a deposit and
  **unlocked** when both confirm the return. Not returned after due date + 14
  days: the lender can report it, the credit moves to them and the loan becomes
  a give.
- **Starter credit:** 1 credit when you list your first book (once per account).
- Credits move **only when both people confirm** in the app.
- Limits: 3 books borrowed at once, 3 open requests.
- Full rules R1–R9 and proposed R10–R13: [04-DATA-AND-RULES.md](04-DATA-AND-RULES.md).

## The journey
1. **Arrive** from a WhatsApp link → landing page (the turning shelf).
2. **Look around without an account** (the *open shelf*, live since Nov 19):
   browse the shelf and open book pages. Visitors see the book, give/lend,
   condition and area, never the owner or their note.
3. **Sign in** with a 6-digit email code (the email's link is a backup). Comes
   back to the page you were on.
4. **Profile:** name, area of Ansan (fixed list), WhatsApp number (private).
5. **List a book:** scan the barcode or type the ISBN, pick give or lend (+ max
   lend period: 2 weeks / 4 weeks / 2 months / flexible), condition, optional
   note. First listing grants the starter credit.
6. **Browse** (search; filter all / give / lend / on my wishlist) → **book page**
   (owner's note, "N readers have this", lend date picker within the owner's max).
7. **Request** → the owner **accepts or declines** → both agree a **meet-up**
   (place + time; "Sounds good" / "Suggest another") → both tap **handed over**.
8. **Lend:** due-date stamp, ask for more time (extension), return, both confirm.
9. **After:** 👍/👎 for the handover, report, block.
10. **Library card** (Me): available / held / total credits and a stamped history.

Navigation: **Browse · My shelf · Add a book · Activity · Me** (bottom tab bar on phones).

## Feature status

| Area | Status |
|---|---|
| Landing (turning shelf, how it works, safety, FAQ, footer) | Live |
| Open shelf (browse + book pages signed out) | Live (Nov 19) |
| Sign-in: 6-digit email code, link as backup, sign out everywhere | Live. **Email delivery is the weak spot**, see handoff |
| Google sign-in | Built, switched off (`NEXT_PUBLIC_GOOGLE_SIGNIN=on` + Supabase provider needed) |
| Profile, area list, private WhatsApp | Live |
| Add a book: ISBN lookup (Google Books → Open Library), barcode scanner | Live (scanner fixed Nov 5; untested on a real Android phone) |
| My shelf: pause, withdraw, history | Live |
| Requests, accept/decline, cancel, limits | Live |
| Meet-up card | Live |
| Handover and return confirmations, credit ledger | Live |
| Loan extensions | Live |
| Not-returned report (R4 forfeit) | Live |
| Wishlist + "on the shelf now" | Live (email alert not built) |
| Activity: request stages, "your turn", waiting badge | Live |
| Trust: 👍/👎, report, block, feedback form | Live |
| Privacy page, delete-account runbook, security.txt | Live |
| PWA (installable, offline page) | Live |
| **Light / dark mode toggle** | **Next** (planned in 02-DESIGN) |
| **Real book covers + licensed photos** | **Next** (planned in 02-DESIGN) |
| Email notifications (new request, accepted, due soon, wishlist) | Not built: needs a Resend key from Zarith |
| R10–R13 (credit hold on accept, 3-day expiry, auto-confirm, WhatsApp reveal) | Waiting for Zarith's yes |
| Scheduled jobs (reminders, expiry) | Not built (Supabase cron) |

## Out of scope for v0.1 (on purpose)
Textbooks · parcels · clubs/events/organizer tools · payments · in-app chat
(WhatsApp after acceptance instead) · Warkah/Rantau/Penglipur (see brand) ·
recommendations · Korean-language books · native apps (ADR 001: PWA first).

## Candidates for v0.2 (decide from pilot data)
Warkah (pass-it-on notes) + Rantau (a book's journey via QR bookplate) · in-app
messages per request · Penglipur badges / lending rewards · GS25 parcels ·
clubs and events · Malaysia launch · native app (Expo) if ADR 001's triggers hit.

## Decisions still open (ask Zarith; don't decide for him)
- R10–R13 (see 04).
- Disputes: borrower taps "returned", lender doesn't. Proposal: pilot team resolves by hand.
- Domain and handles (`bayu.app`, `getbayu`, `@bayu.books`…).
- Tagline: *Books that breeze through* (used) or *Let a book drift your way*.
