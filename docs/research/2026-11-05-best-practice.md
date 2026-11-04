# What good sharing apps do, and what Bayu should take

*Overnight research, 2026-11-05. Short on purpose: each finding ends in what it means for Bayu.*

## 1. Trust between strangers
**Seen elsewhere**
- **Airbnb:** two-way ratings, verified profiles, and no surprises at the moment of commitment. Trust comes from other people's experience, not the platform's claims ([raw.studio on Airbnb](https://raw.studio/blog/how-airbnb-increased-bookings-by-25-with-3-trust-building-ux-changes/)).
- **Olio** (free sharing of food and items):
  - phone verification at sign-up
  - ratings shown only after three or more people have rated someone
  - a short "about" on each profile
  - pickup at a doorstep or a public place, plus tips: check the profile, judge the messages, decline politely ([Olio safe sharing](https://help.olioapp.com/article/33-safe-sharing))
- **Craigslist (Quilo):** "Safe Meeting Places" suggests nearby public spots, because handing out home addresses went badly ([ConsumerAffairs](https://www.consumeraffairs.com/news/craigslist-apps-new-safe-meeting-places-feature-aims-to-make-transactions-safer-051116.html)).

**Bayu today**
- Meet-up suggestions are public places.
- After a handover there's a 👍/👎, and the book page shows "N readers had a smooth handover with them".
- Report and block work from every request.
- Contact details are never shown.

**Take**
- **Show the count only once it means something** (Olio's three-ratings rule). Bayu already shows only smooth handovers and never 👎, which avoids public shaming. Keep that.
- **Say how long someone has been a reader** ("Joined November 2026") next to the owner's name. It's cheap and useful when everyone is new. *(Later: needs a small read-only function.)*
- **Safety tips at the moment of meeting**, not only on the landing page: one line on the meet-up card ("Meet in a public place; tell a friend where you're going").

## 2. First run and empty pages
**Seen elsewhere ([Vercel Geist: empty state](https://vercel.com/geist/empty-state))**
- Every empty view is one of these:
  - first use: there's nothing yet, so say what to do
  - no results: echo the search and offer to clear it
  - cleared: you're done
  - error: what happened, plus a retry
- **One primary action**, named verb + noun ("Add a book", never "Get started"). The description adds information instead of repeating the title.
- No tours that launch on their own.

**Bayu today:** the first-run order is card → first book → shelf, but nothing shows it, and some empty pages are a sentence with a link.

**Take (done tonight)**
- A **first-steps strip** on Welcome, My shelf and Activity until all three steps are done: make your library card, add a book, ask for a book.
- Every empty page gets one primary action.
- A browse search with no results echoes the search and offers "Clear search".

## 3. Loans and returns
**Seen elsewhere:** library apps (Libby) put **the due date and what to do next on each loan**, and remind you before it's due.

**Bayu today:** the due-date countdown is done. The steps of a request are spread across buttons.

**Take (done tonight):** each request on Activity shows a **step strip** (Asked → Accepted → Met → Handed over → Returned for a lend) and one sentence saying who needs to act next.

## 4. Security checklist (OWASP ASVS 5.0, areas that apply to Bayu)
Sources: the [ASVS index on the OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/IndexASVS.html).

| Area | Bayu now | Tonight / next |
|---|---|---|
| **Authentication (V6):** out-of-band codes, one use, expiry, limits on tries | Email code or link, one use, 1 hour, Supabase limits sends and checks | Code sign-in shipped. Next (Zarith): shorten the code expiry to 10 to 15 minutes in Supabase once codes are the main way in |
| **Sessions (V7):** timeout, sign-out, ending other sessions | Sign-out on this device | **"Sign out everywhere" on Me** (tonight) |
| **Access control (V8):** every operation checked on the server | RLS on every table, explicit grants with a snapshot test, security-definer functions with `search_path=''` | Re-checked tonight |
| **Input validation (V2.2):** server-side, allow-lists | Every server action validates | Re-checked tonight |
| **Anti-automation (V2.4)** | Limits on requests (R7), Supabase auth limits | Limits on feedback and reports, if missing (tonight) |
| **Headers (V3.4)** | frame-ancestors, nosniff, HSTS, Referrer and Permissions policies, COOP | **Full CSP as report-only** first, so it can't break the page (tonight) |
| **Logging (V16)** | Error codes logged, never emails | Keep. `security.txt` so people know how to report a hole (tonight) |

## 5. Things Bayu should *not* copy
- **Phone verification:** extra cost and friction for a 15-person pilot of friends of friends.
- **Public star ratings:** they shame people in a small community. Keep the private 👍/👎 and the smooth-handover count.
- **Auto-launching tours:** the first-steps strip does the same job and can be ignored.
