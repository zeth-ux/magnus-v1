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
