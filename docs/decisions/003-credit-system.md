# 003: Credit system for giving and lending

- **Date:** 2026-10-30
- **Status:** Accepted
- **Decided by:** Zarith (brainstormed with Claude)

## Context
Bayu lets readers **give** and **lend** books. With only about 15 pilot users,
direct 1-for-1 swaps rarely line up (A wants B's book *and* B wants A's).
We need something that lets people take a book before the "perfect match"
exists, rewards giving, and makes borrowers return books.

## Decision: one credit system
> A credit means *"I've added a book to the community, so I can take one out."*

### Rules
| # | Rule |
|---|---|
| R1 | Credits move **only when both people confirm the handover** in the app. |
| R2 | **Give:** giver **+1**, receiver **−1**. Ownership moves to the receiver. |
| R3 | **Lend:** 1 of the borrower's credits is **locked** as a deposit. It's **unlocked** when both confirm the book was returned. |
| R4 | **Not returned:** after the due date + **14 days' grace**, the lender can report it. The locked credit **moves to the lender** and the loan becomes a give (the borrower now owns the book). |
| R5 | **Starter credit:** each account gets **1 credit, granted when it lists its first book** (once per account). |
| R6 | **Available credits** = balance − locked. Available can **never go below 0**. |
| R7 | **Limits** (pilot defaults, configurable): at most **3 books borrowed at once** and at most **3 open requests** per user. |
| R8 | **Swap** isn't a separate feature: give one and take one, and the credits even out. |
| R9 | Lenders **don't earn credits** in v0.1. They get a public "📚 Lent N books" count. If lending turns out rare in the pilot, revisit this. |

### Lend period
- The **lender** sets a maximum on the listing: 2 weeks / 4 weeks / 2 months / flexible.
- The **borrower** proposes a return date within that maximum when requesting.
- When the lender **accepts**, that date becomes the **due date**.
- **Reminder 3 days before** the due date. The borrower can request an
  extension, and the lender approves or declines.

### Worked example
| Step | Aina | Hafiz |
|---|---|---|
| Aina lists her first book → starter credit (R5) | 1 | 0 |
| Hafiz lists his first book → starter credit | 1 | 1 |
| Aina **gives** *Klara and the Sun* to Hafiz (R2) | 2 | 0 |
| Hafiz gives *Norwegian Wood* to someone else | 2 | 1 |
| Hafiz **borrows** Aina's *Circe*: 1 credit locked (R3) | 2 | 1 (0 available) |
| Hafiz returns *Circe*: unlocked | 2 | 1 |

## Why this design
- **Hard to cheat.** Credits only *move* between users (R2-R4). The only way
  new credits appear is the starter credit (R5), which needs a real book listed.
  Two friends passing a book back and forth gain nothing.
- **Borrowers have a reason to return books** (R3/R4), without money changing hands.
- **No matching algorithm needed** for the pilot. Multi-party swap cycles stay
  a possible v2 feature.

## Implementation notes (for the build)
- **Append-only ledger table** (`credit_ledger`). Every movement is a row:
  `starter_grant`, `give_transfer`, `lend_lock`, `lend_unlock`, `lend_forfeit`.
  The balance is computed from the rows. Never edit or delete ledger rows.
- Every credit movement happens inside **one Postgres function in one
  transaction**, which locks the user's rows (`SELECT ... FOR UPDATE`) so two
  simultaneous requests can't overspend.
- Confirmations are **idempotent**: tapping "handed over" twice must not move
  credits twice.
- **Required tests** (core logic, per CLAUDE.md):
  - Available credits never go below 0, including under concurrent requests.
  - Every transfer has two sides that sum to zero. Only starter grants add credits.
  - The starter credit is granted exactly once per account, only after the first listing.
  - Limits R7 are enforced.
  - The lend lifecycle works: lock → unlock on return; lock → forfeit after grace.
  - Double confirmations don't double-move credits.

## Implementation status (2026-11-01)
Built in `supabase/migrations/20261101000100_core.sql`, tested in `web/src/db/`:
- `credit_ledger` is append-only (a trigger rejects UPDATE, DELETE and TRUNCATE for everyone). Kinds: `starter_grant`, `give_transfer`, `lend_lock`, `lend_unlock`, `lend_forfeit`. `available = sum(delta) - sum(locked_delta)`.
- Every movement runs inside one function and one transaction, after `lock_person()` takes the people's profile rows `FOR NO KEY UPDATE`, in a fixed order. NO KEY UPDATE matters: it doesn't block the foreign-key checks other transactions make against a profile (with plain FOR UPDATE, a new request during a handover could deadlock). A test on real Postgres shows two handovers racing on one credit: exactly one wins. Without the lock, that test fails.
- Idempotency: a unique index on `(ref_id, kind, user_id)`, plus "already done" checks in each function.
- R5: a trigger on the first `copies` insert, with a unique index so it can only happen once.
- R7 limits live in `app_settings` (`max_open_requests`, `max_active_borrows`, `forfeit_grace_days`, `max_flexible_lend_days` = 183). A missing setting is an error, never a disabled limit. The borrow limit is checked again at the handover, so earlier requests can't stack past it.
- One accepted reader per copy at a time (a unique index). A handover cancels the copy's other open requests.
- Copies are never deleted; `withdraw_copy()` takes one off the shelf and cancels its open requests, so history stays intact.
- Dates use Ansan's local date (`public.today()`, Asia/Seoul), not UTC.
- R4 can't be used against a borrower who has tapped "returned": that case needs a person (see below).
- A check constraint ties each ledger kind to its allowed amounts, so even a buggy future function can't mint credits.
- Not built yet: R10-R13 (waiting for approval); scheduled jobs (reminders, expiry); extension requests.
- **Open question (Zarith): disputes.** If the borrower taps "returned" and the lender doesn't, R4 is refused and the credit stays locked. Who resolves it? Proposal: the pilot team, by hand, until R12 (auto-confirm) is decided.
- **Design note:** someone could list a fake copy for the starter credit, withdraw it and repeat with new emails. R5 accepts this risk for a pilot of friends.
- Open question: deleting an account. Ledger rows reference the profile, so a delete is refused while the person has credit history. Plan: anonymise the profile instead of deleting rows.
