# User flow: Bayu v0.1

*2026-10-30. Screens: the "Bayu v0.1 Screens" design canvas on claude.ai
(page "App screens"). Credit rules: [ADR 003](decisions/003-credit-system.md).*

## The journey

| # | Step | What the user does | What Bayu does |
|---|---|---|---|
| 1 | **Arrive** | Opens a link a friend shared on WhatsApp | Shows the landing page ([landing.md](landing.md)) |
| 2 | **Sign in** | Google or email magic link | Creates the account |
| 3 | **Profile** | Name, area of Ansan, WhatsApp number | Keeps the number **private** until a request is accepted |
| 4 | **First book** | Scans the barcode (or searches), picks **give** or **lend** (+ max lend period), condition, optional note | Looks up the title. On the first listing it grants the **starter credit** (R5) |
| 5 | **Browse** | Searches and filters (All / Give / Lend / On my wishlist) | Shows available copies; the credit badge is always visible |
| 6 | **Book page** | Reads the owner's note; sees **"N readers have this"** | For a lend: date picker limited to the owner's max; says "locks 1 credit" |
| 7 | **Request** | Taps *Request* | Checks limits (R6, R7); notifies the owner |
| 8 | **Accept** | The owner accepts or declines | On accept: **holds the requester's credit** (R10, proposed); reveals both WhatsApp numbers |
| 9 | **Agree the meet-up** | Either person suggests a place + time; the other taps *Sounds good* or *Suggest another* | Stores the agreed meet-up; reminder on the day |
| 10 | **Handover** | Both tap *Handed over* / *I've got the book* | Moves credits (R1-R3). For a lend: shows the **due-date stamp** |
| 11 | **Lend: return** | Reminder 3 days before due; borrower can ask for more time; they meet again; both confirm *Returned* | Unlocks the held credit. Not returned after due + 14 days → lender can report → forfeit (R4) |
| 12 | **After** | Quick 👍/👎, optional report | Builds the "smooth handovers" count |
| 13 | **Library card** | Checks credits, history, shelf, wishlist | Shows available / held / total and a stamped history |

Navigation: **Browse · Activity · ➕ Add · Shelf · Me**

## Request lifecycle

```
requested ──accept──► accepted ──meet-up agreed──► meeting ──both confirm──► handed_over
    │                    │                                                      │
    ├─decline──► declined│                                         (give) done ◄┤
    ├─cancel───► cancelled◄─cancel (credit hold released)                       │
    └─3 days, no reply──► expired (R11, proposed)            (lend) on_loan ────┤
                                                              ├─both confirm──► returned (credit unlocked)
                                                              └─due + 14 days, reported──► forfeited (R4)
```

## Proposed rules (waiting for Zarith's OK, then added to ADR 003)

| # | Rule | Why |
|---|---|---|
| R10 | When an owner **accepts**, 1 of the requester's credits is **held** until the handover (or released on cancel) | Stops someone with 1 credit getting 3 accepted requests and failing at the meet-up |
| R11 | A request with **no reply for 3 days expires** | Frees the requester's 3 request slots |
| R12 | If one person confirms a handover and the other doesn't respond in **3 days**, it **auto-confirms** unless they report a problem | Stops credits getting stuck when someone forgets to tap |
| R13 | The **WhatsApp number is required** at sign-up but shown only to the other person once a request is accepted | The WhatsApp button needs it; privacy before acceptance |

## Contact
- **Pilot:** WhatsApp button after acceptance (everyone already uses it).
- **v0.2:** a small in-app message thread per request, like BookSwap, so strangers
  never need to share phone numbers.

## Systems behind it

| System | Purpose | Tool |
|---|---|---|
| Auth | Google + magic link | Supabase Auth |
| Profiles | Name, area, private WhatsApp | Supabase + RLS |
| Book lookup | ISBN → title, author, cover | Google Books, Open Library fallback |
| Scanner | Phone camera barcode reading | ZXing |
| Copies / shelf | `available`, `requested`, `on_loan`, `given`, `paused` | Postgres |
| Requests | The lifecycle above | Postgres functions |
| Credit ledger | ADR 003, append-only | Postgres, one transaction per move, row locks |
| Meet-up card | Propose / confirm / counter | Postgres |
| Notifications | Email + in-app Activity badge | Resend (free tier) |
| Scheduled jobs | Due reminders, request expiry, auto-confirm, overdue | Supabase cron |
| Wishlist alerts | Email when a wanted book is listed | DB trigger |
| Trust | 👍/👎, report, block | Postgres |
| Feedback | "Send feedback" → table Zarith reads | Postgres |
| Pilot stats | Listings, requests, handovers, returns | SQL queries |
| PWA | Installable, icon, splash | Next.js manifest |

## Borrowed from BookSwap (only where it beats us)
- **"N readers have this"** on the book page.
- **Trust & safety** section and FAQ on the landing page.
- **Delete account** link in the footer and settings.
- **Chat only after acceptance** (our version: WhatsApp now, in-app in v0.2).

Not borrowed: 1-for-1 swap offers (credits are better), iOS-only (we're a PWA).
