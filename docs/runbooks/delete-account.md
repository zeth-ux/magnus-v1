# Runbook: delete a reader's account

Until there's a delete button, the pilot team does this by hand when a reader asks
(through "Send feedback" or the pilot group). The landing page FAQ promises it.

**Why it's "anonymise", not "delete":** the credit ledger is append-only and other
readers' credits depend on it (ADR 003). So the profile row stays, but everything
personal goes. See `supabase/migrations/20261101000800_anonymise_reader.sql`.

## Steps
1. **Find the reader's id.** Supabase → **SQL Editor**:
   ```sql
   select p.id, p.display_name, p.area, u.email
   from public.profiles p join auth.users u on u.id = p.id
   where u.email = 'their@email.com';
   ```
   Double-check it's the right person (name and area match what they told you).
2. **Check for open handovers or loans.** The function refuses while the reader
   has an accepted request or a book on loan. Help them finish it first (return
   the book, or cancel the handover), or wait for R4.
3. **Note the request** before you run it (date, their id, how they asked), e.g. in
   `docs/pilot-notes.md`. Their feedback rows are deleted too, including the request itself.
4. **Run it** (only the SQL Editor can; the app can't):
   ```sql
   select public.admin_anonymise_reader('<their id>');
   ```
   It answers `anonymised`.
5. **Run it again an hour later.** A sign-in token the reader already had keeps
   working until it expires (up to 1 hour), so they could still change their profile
   in that time. Running it twice is safe.
6. **Tell the reader** it's done.

## What it does
| Removed or changed | Kept (without their name) |
|---|---|
| Name → "Former reader", area → "-" | Credit ledger rows (other readers' credits depend on them) |
| WhatsApp number, wishlist, blocks they made | Finished requests and handovers |
| Meet-up places and notes they wrote, feedback they sent | Reports (needed for safety), 👍/👎 ratings |
| Books they still own → withdrawn, note removed; waiting requests → cancelled | Notes on books they gave away (those books belong to someone else now) |
| Email → `deleted-<id>@bayu.invalid`, phone, pending email/phone changes and sign-in metadata cleared, Google sign-in link, MFA factors, one-time tokens and sessions removed, banned for 100 years | Other readers' blocks of them (harmless) |

**Known leftover:** Supabase's own `auth.audit_log_entries` keeps the email inside old
log entries. It isn't shown anywhere in Bayu.

If they come back later, they sign up again as a new reader.
