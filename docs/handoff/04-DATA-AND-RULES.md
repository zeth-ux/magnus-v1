# 04 · Data and rules: the database, credits and privacy

*Handoff, 2026-11-21. Source of truth: `docs/decisions/003-credit-system.md`
(rules) and `supabase/migrations/*.sql` (what's real). The tests in
`web/src/db/` show every rule working, so read them when in doubt.*

## Tables (Postgres, schema `public`, RLS on all)
| Table | What it holds |
|---|---|
| `profiles` | id (= auth user), display_name, area (fixed list in the app), created_at |
| `profile_contacts` | private WhatsApp number (only the owner, and later R13) |
| `books` | one row per ISBN: title, authors[], published_year, cover_url (CHECK: Google Books / Open Library hosts only) |
| `copies` | a physical book a reader owns: owner_id, isbn, mode (give/lend), lend_max, condition, note, status |
| `requests` | someone asking for a copy: mode, status, return_by, the four confirmation flags, timestamps |
| `meetups` | place + time proposals per request (purpose handover/return; proposed/agreed/replaced) |
| `loan_extensions` | borrower asks for a later return date; lender approves/declines |
| `credit_ledger` | **append-only** credit movements (see below) |
| `wishlist` | ISBNs a reader wants |
| `handover_ratings` | 👍/👎 after a handover |
| `reports`, `blocks`, `feedback` | trust and the feedback form (no policies: written only through functions) |
| `app_settings` | limits and periods: `max_open_requests` 3, `max_active_borrows` 3, `forfeit_grace_days` 14, `max_flexible_lend_days` 183 (a missing setting is an error, never "no limit") |

**Enums:** `copy_mode` give/lend · `copy_status` available/paused/on_loan/withdrawn
· `lend_max` 2_weeks/4_weeks/2_months/flexible · `copy_condition`
like_new/good/worn · `ledger_kind` starter_grant/give_transfer/lend_lock/
lend_unlock/lend_forfeit · `meetup_status`, `meetup_purpose`, `loan_extension_status`.

## Credit rules (accepted, built and tested)
| # | Rule |
|---|---|
| R1 | Credits move **only when both people confirm** the handover. |
| R2 | **Give:** giver +1, receiver −1; ownership moves. |
| R3 | **Lend:** 1 of the borrower's credits is **locked**; unlocked when both confirm the return. |
| R4 | **Not returned:** after due date + 14 days, the lender can report; the locked credit moves to the lender and the loan becomes a give. Not allowed once the borrower has tapped "returned" (that's a dispute, see open questions). |
| R5 | **Starter credit:** 1 credit on the first listed copy, once per account (trigger + unique index). |
| R6 | **Available = balance − locked**, never below 0. |
| R7 | At most 3 books borrowed at once, 3 open requests (`app_settings`; the borrow limit is re-checked at handover). |
| R8 | Swap = give one + take one; no separate feature. |
| R9 | Lenders don't earn credits in v0.1. The planned public "Lent N books" count is **not built yet**. |

**How it's enforced (keep it this way):**
- `credit_ledger` rejects UPDATE/DELETE/TRUNCATE for everyone (trigger). Balance
  = `sum(delta)`, locked = `sum(locked_delta)`. A CHECK ties each kind to its
  allowed amounts, so a buggy function can't mint credits.
- Every movement happens inside **one function, one transaction**, after
  `lock_person()` takes the people's profile rows `FOR NO KEY UPDATE` in a fixed
  order (NO KEY UPDATE avoids deadlocks with foreign-key checks). A real-Postgres
  test races two handovers on one credit: exactly one wins.
- Idempotent: unique `(ref_id, kind, user_id)` plus "already done" checks, so
  double taps never double-move.
- One accepted request per copy; a handover cancels the copy's other open requests.
- Copies are never deleted: `withdraw_copy()` hides one and cancels its requests.
- Dates are Ansan's local date (`public.today()`, Asia/Seoul).
- Insert limits per reader on `copies` and `wishlist` (triggers, advisory lock).
- Deleting an account = anonymise, not delete (ledger rows reference the
  profile): `admin_anonymise_reader()`, see `docs/runbooks/delete-account.md`.

## Proposed rules R10–R13 (NOT built: waiting for Zarith's yes)
| # | Rule | Why |
|---|---|---|
| R10 | On **accept**, hold 1 of the requester's credits until handover (released on cancel) | Stops 1 credit backing 3 accepted requests |
| R11 | A request with **no reply for 3 days expires** | Frees request slots |
| R12 | If one side confirms a handover and the other doesn't respond in **3 days**, it **auto-confirms** unless they report a problem | Stops stuck credits |
| R13 | WhatsApp **required** at sign-up, shown only to the other person after **accept** | The WhatsApp button needs it; privacy before acceptance |

R11/R12 and due-date reminders need **scheduled jobs** (Supabase cron), not built.

## Request lifecycle
```
requested ──accept──► accepted ──meet-up agreed, both confirm──┬─(give)──► handed_over (done)
    │                    │                                     └─(lend)──► on_loan
    ├─decline──► declined│                                                   ├─both confirm──► returned (credit unlocked)
    ├─cancel───► cancelled◄─cancel                                           └─due + 14 days, reported──► forfeited (R4)
    └─3 days, no reply──► expired (R11, proposed)
```
Activity shows this as a stage strip with "Your turn" / "Waiting for …";
`whoseTurn()` in `web/src/lib/activity/steps.ts` mirrors the SQL
`my_waiting_count()` (the badge). Change both together.

## Who can see what (privacy model; the privacy page promises this)
| Viewer | Sees |
|---|---|
| **Anyone, signed out** | Available books only: title, authors, cover, give/lend, lend max, condition, **area** (only a known area or "Ansan", via `public_area()`). Never the owner, their note, contact, or listing time. Lent-out/paused/withdrawn copies are invisible. |
| **Any signed-in reader** (anyone can make an account, so not a vetted group) | Owners' display names, areas, notes, "N readers have this", smooth-handover counts |
| **The other person in a request** | The request, meet-up details (WhatsApp after accept once R13 lands) |
| **Nobody else** | Emails, WhatsApp numbers, who rated or reported whom |

The app only offers a fixed area list (`AREAS` in `web/src/lib/books/validate.ts`),
but the database accepts any short text, so **anything shown to the public must go
through `public_area()`**. If the area list changes, change it in both places (a
test checks they match).

## Changing the database
1. New file `supabase/migrations/YYYYMMDDHHMMSS_name.sql`. Comment *why*.
2. Tests in `web/src/db/` (as the right roles; check what anon and other readers
   can and can't see). Update `grants.test.ts` for new functions.
3. Steve reviews.
4. **Additive** (new tables/functions/indexes): apply to the live project with the
   Supabase connector (`apply_migration`) **before** merging the code that needs
   it, then check it live as `anon`/`authenticated`. **Destructive** (dropping or
   rewriting tables, columns or data): ask Zarith first, always.
5. Say in the PR that it was applied live. Run Supabase advisors afterwards
   (the "security definer executable by authenticated" warnings are expected:
   the app works through those functions).
