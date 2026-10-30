# 002: Swap-first pilot with English readers in Korea

- **Date:** 2026-10-30
- **Status:** Accepted
- **Decided by:** Zarith (brainstormed with Claude)
- **Changes:** the MVP order in [MARKET.md](../../MARKET.md) (organizers first).
  Organizer and club tools move to "coming soon".

## Context
The market research suggested organizers (book clubs) as the wedge, with KL as
the first market. But:
- Zarith lives in **Ansan, Korea**, and has **5 real users ready now**:
  Malaysian friends in the **same city** who all read **English** books.
- English books are hard to find and expensive in Korea, so the problem is real
  for this group.
- Real users you can meet in person give faster, more honest feedback than
  DMs to strangers in KL.

## Decision
Build a **book-sharing PWA first** and pilot it with English readers in Ansan:

1. **Swap-first.** Readers list their books to **give** or **lend**. A
   **credit system** ([ADR 003](003-credit-system.md)) makes swaps happen on
   their own, with no direct 1-for-1 matching needed.
2. **Meet-ups only** for handovers in v0.1, since everyone is in one city.
   Convenience-store parcels (GS25 반값택배, from about ₩1,800) come later
   for other cities.
3. **Open to everyone** (no university email check). Trust comes from verified
   email, handover 👍/👎 and a report button.
4. **English books only.** Lookup via Google Books / Open Library, so no Korean
   book lookup service is needed yet.
5. **No textbooks.** Bayu stays a reader community, not a campus marketplace.
6. Product name: **Bayu** (see [docs/brand.md](../brand.md)). The repo keeps
   the code name *Magnus*.

## Why
- Real users today beat hypothetical users later.
- It tests the riskiest assumption cheaply: **will readers actually list and
  hand over physical books?** The research flagged swapping alone as weak, so
  let's find out.
- The scope is smaller (about 8 screens), so there's a real pilot before finals.

## Risks and how we handle them
| Risk | Mitigation |
|---|---|
| Too few books, so the app feels empty | Seed before launch: 5 friends × ~5 books; each friend invites 2 more readers |
| Friends being polite | Judge by behaviour (books listed, requests, handovers), never by signups |
| International students own few physical books here | Ask friends for book counts before building the shelf |
| Someone takes books and disappears | Lending deposit, starter credit unlocked only by listing a book, borrowing limits (ADR 003) |

## What happens to the organizer idea
Not dropped, just moved later. Clubs, events, RSVPs and organizer tools are
**"coming soon"** features to add after the pilot, if the data supports it. A
**weekly swap hour** at a fixed spot keeps the "swap table at events" idea in
a lightweight form.
