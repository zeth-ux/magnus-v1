# Progress Log

Newest entries at the top. Each entry: what was done, decisions made, what's next.

---

## 2026-11-05 (overnight): Sign in with a code, first steps, request progress

**Done**
- Sign-in (and sign-up) is now two steps: your email, then the code we email you (`app/login/login-form.tsx`, `lib/auth/otp.ts` with tests). Number keypad, iPhone autofill (`one-time-code`), paste with spaces or full-width digits, 6 to 10 digits, clear errors read out on every try, "Send a new code" after 60 s (a refused resend keeps you on the code step), "Use a different email".
- **Decision (Steve):** the code is checked from the browser, not a server action, so Supabase's per-IP limit on tries is per reader. From our server every reader would share one limit, and guesses would be spread over Vercel's IPs. Typing the code keeps you in the same tab or the installed app, so phones no longer depend on which browser opens a link.
- The email's link still works as a backup (implicit flow, finished on the landing page).
- Checked against a local fake Supabase: wrong code shows the error, right code lands on the page you were heading to.
- **First steps** (PR #33): a strip on Browse, My shelf and Activity (library card → add a book → ask for a book) until a new reader has done all three. One `getUser()` per request now (`getSessionUser`, React `cache()`, shared by `requireUser` and the strip).
- **Empty pages say what to do next:** one action each, and they only promise what the next screen delivers (e.g. "Add to wishlist by ISBN"; no starter-credit claim when it may not apply).
- **Activity progress** (PR #34): each request shows Asked → Accepted → Handed over (or On loan → Returned) and **Your turn** / **Waiting for …**. `whoseTurn()` mirrors `my_waiting_count()` rule for rule (tested), so the row label and the badge always agree. user-flow diagram corrected (lends go straight to `on_loan`).
- **Security pass** (PR #35, OWASP ASVS 5.0):
  - Database limits on new listings (30 a day, 200 on the shelf; withdrawn don't count) and wishlists (200), under per-reader advisory locks so parallel scripts can't slip past. Gives never hit the cap (they change owner, they don't insert). Migration `20261105000100_insert_limits.sql`, applied live.
  - **Sign out everywhere** on Me; if it can't reach other devices, the reader is told.
  - Enforced CSP adds `form-action 'self'`; a full CSP runs report-only.
  - `/.well-known/security.txt` and `SECURITY.md`.
  - Supabase advisors re-run: only known, intentional items.
- Research: `docs/research/2026-11-05-best-practice.md`.

**Needs Zarith**
- [ ] GitHub: turn on **private vulnerability reporting** (repo Settings → Code security), so the link in `security.txt` and `SECURITY.md` works.
- [ ] Supabase: set up SMTP (Gmail app password), raise emails per hour, and add `{{ .Token }}` to the Magic link and Confirm signup templates (README step 3-4). Until then the email has only the link.

## 2026-11-02: Paper redesign: foundation, turning shelf, browse and every page

**Why:** Zarith wants a beautiful, functional app before the pilot (no rush on 9 November now), using the concept in `Design.md`. Choices: Give/Lend tabs, English only, new brand colours (the reference's paper and cobalt).

**Done**
- New design foundation: paper `#EDEBE6`, sheet, ink, muted, one cobalt accent, vermilion for errors and stamps, print inks for covers (brand.md, with contrast checks). Newsreader + Inter Tight. Paper grain. Boxed catalogue labels (`.lbl`, `.box`), square printed buttons, cards and fields, a library stamp.
- Every page moved from the dark ground to paper (a mechanical pass; the careful page-by-page polish is next).
- Landing rebuilt around the **turning shelf**: 3D standing books, the centre one turned out to its cover, Give/Lend tabs, rolling caption, arrows/keys/drag/sideways scroll, ring cursor with OPEN on the cover. Opening a book grows a sheet from the cover with an ink-blot reveal. How it works, safety, questions and the footer redone as ruled, static sections. docs/landing.md rewritten.
- **Browse** is now the turning shelf of real copies (full-bleed band), then search, then a catalogue list. Opening a book grows a sheet from its cover into the **book page**, which has the cover bleeding in as ink and its lines rising (`InkPoster`, `Rise`).
- **Every app page** polished: catalogue-tab navigation (cobalt block on the current page), page and section titles, square buttons, ruled lists, stamps, a still from the shelf on the sign-in pages, the share card repainted.
- Steve's review fixed: four unreadable buttons from the colour pass, focus back to the shelf after closing a book, the shelf loop re-runs cleanly when its books change, screen readers hear one announcement when the shelf stops, Space opens, the ring cursor only over the books, CSS transitions off for reduced motion, darker muted text (AA under the grain), 24px tap targets.
- Checked in headless Chromium at 1440 and 390 px (with a local fake Supabase for signed-in pages), and with reduced motion.

**Decisions**
- Concept and motion from Design.md, not its images (someone else's VHS art on their CDN) or its "no libraries" rule (GSAP per CLAUDE.md).
- Native cursor stays everywhere except over the shelf; text selection stays on except on the shelf.

**Next**
- [ ] Zarith: try it on a real phone (Safari especially: the ink reveal uses an SVG mask on HTML; if Safari can't, the cover just appears).
- [ ] Zarith: OK to delete the old landing stack (`components/shelf/shelf.tsx`, `shelf-dialog.tsx`), now unused?

## 2026-11-01 (afternoon): The email link finally signs you in

**What happened**
- After PR #29 the email link still left Zarith on the landing page. Supabase's logs showed the link itself worked (`login_method: implicit` at 16:27 KST), but the page never used the session: no call back to Supabase at all.
- Cause: the hand-off wiped the tokens from the address bar *before* reading them, and `window.location` is live, so it read an empty hash. The unit tests passed a plain copy of the address, so they couldn't see it. Found by running the production build in a headless browser.

**Done**
- `finishSignInFromUrl` copies the address before touching it, plus a test with a live address object that changes when wiped.
- Checked end to end in a headless browser against the production build: the link's session is used, the refresh token rotated, and the reader sent on.

**Next**
- [ ] Zarith: request one link and tap it from Gmail.
- [ ] Optional (needs Zarith's yes): add `https://magnus-v1.vercel.app/**` to Supabase's Redirect URLs, so the link lands on the page you were heading to instead of Welcome.

## 2026-11-01 (day): Email sign-in works in any browser; one production address

**What the logs showed**
- Supabase's Site URL is reset to `magnus-v1-merey-jago.vercel.app` about 10 s after every production deploy (8 out of 8 merges): the Vercel-Supabase integration rewrites it. Changing it in the dashboard can't stick.
- On a phone, tapping the email link inside Gmail opens it in another browser, so the PKCE flow's key (saved in the browser that asked) was missing: `bad_code_verifier` every time.
- "Continue with Google" failed with "provider is not enabled": Google sign-in was never set up in Supabase.

**Done**
- Email links use the implicit flow: Supabase sends the session back in the URL hash, and the landing page saves it in whichever browser opened the link, then removes it from the address bar. No key from the original browser is needed, so phones and Gmail's browser work. (`lib/auth/session-hash.ts`, `components/auth/link-error-redirect.tsx`, `app/login/actions.ts`.)
- One production address: the proxy sends any other production host to Vercel's production domain (`VERCEL_PROJECT_PRODUCTION_URL`), keeping path, query and hash, so a sign-in always lives on one site whatever Supabase's Site URL says. Previews and local dev are untouched. (`lib/site/canonical.ts`; reads the Host header, after a local test caught `nextUrl` redirecting the main address to itself.)
- The redirect is a 307 with `Cache-Control: no-store` (Steve: a 308 would be cached in phones for good if the domain were ever wrong). Sign-in emails use the same production domain (`productionOrigin()`), so there's one source of truth.
- The landing-page hand-off is a pure, tested function (`lib/auth/finish-sign-in.ts`, 8 tests; plus 3 proxy tests): tokens wiped from the address bar first; a browser that's already signed in never takes a session from a link, on the landing page or in `/auth/callback` (a different account gets `/login?error=account`, with a sign-out button), so nobody can be silently swapped into someone else's account (Steve caught that checking the token's account isn't enough: an expired token's `sub` isn't verified); the refresh token is rotated straight after use; failures go to `/login?error=link`; `?code` and `?token_hash` are forwarded to `/auth/callback`.
- The Google button is hidden unless `NEXT_PUBLIC_GOOGLE_SIGNIN=on` (in README and `.env.example`).
- Login hint: "Open the newest one. You'll be signed in on the browser that opens it."
- README setup steps 2–3 rewritten for the one-address model.
- `safeRedirectPath` also checks its output: `/.//evil.example` used to collapse to `//evil.example` (another site). Also protected `/me`'s redirect, which was already on main.
- The landing page only loads the auth client when a link brings tokens.

**Decisions**
- Implicit flow for email only: tokens travel in the URL hash (never sent to a server) and are wiped at once. Like any any-browser magic link, someone could send you a link that signs you in as *them*: blocked when you're already signed in; otherwise /welcome shows who you're signed in as otherwise.
- After this deploys, sessions on the longer team address end (that host now redirects); sign in once more on magnus-v1.vercel.app.

**Next**
- [ ] Zarith (optional): enable Google in Supabase (Authentication → Providers, with a Google Cloud OAuth client), then set `NEXT_PUBLIC_GOOGLE_SIGNIN=on` in Vercel.
- [ ] Optional: in the Vercel-Supabase integration settings, stop it syncing the Site URL; no longer needed for sign-in to work.

## 2026-11-01 (day): Taken-off books stay hidden; warkah and welcome fixes

**Done**
- Migration `20261101001200_copies_visibility.sql`: a withdrawn copy is no longer visible to other readers, even from an old link (the book page then 404s). The owner and anyone in a request for it still see it, so Activity history keeps its titles. 2 tests.
- Book page: the note is labelled "Warkah: the note that travels with this book" instead of "Warkah from <owner>", because a given book keeps its note and the new owner didn't write it.
- `/welcome`: readers who already have books see "Welcome back" and "Go to the shelf", not "Add your first book" and the starter-credit card.

## 2026-11-01 (day): Launch basics

**Done**
- Custom 404 ("This page blew away.") and error pages (`error.tsx`, plus a self-contained `global-error.tsx`).
- `robots.txt` (public pages in, the signed-in app out) and `sitemap.xml`; `metadataBase`, Open Graph and Twitter card tags, canonical links on the public pages.
- A share card generated in the brand colours (`opengraph-image.tsx`), shown when a Bayu link is pasted into WhatsApp or KakaoTalk.
- `/privacy`: what Bayu keeps (including Google sign-in data and host logs), who sees it (the public home page shows a few newest books with the owner's area), where it's processed (Supabase in Ireland, Vercel in the US, Google if used), and exactly what deletion removes and keeps (matches `admin_anonymise_reader`). Linked from the landing footer and every app page. Steve checked every claim against the code.
- Migration `20261101001100_profiles_columns.sql`: readers see another reader's id, name and area only, not when they joined.
- Error pages use Next 16's `retry()` (fetches again) instead of `reset()`.
- `public/llms.txt`.
- Checked at 320, 375, 390 and 1280px: no sideways scrolling, no broken links, no console errors on `/`, `/login`, `/privacy`, the 404 and the offline page.

**Skipped on purpose**
- Reviews, team photo, maps, local-business schema, case studies, thank-you page, breadcrumbs, sticky CTA: not a fit for a 15-reader pilot.
- Analytics and a custom domain: waiting for Zarith's call.

**Next**
- [ ] Zarith: confirm the Vercel functions region (Project → Settings → Functions) so /privacy names the right country (it says the United States, the default).
- [ ] Zarith: choose a privacy contact email for /privacy (today only "Send feedback" or the pilot group, which need a sign-in or an invite).
- [ ] When Gmail SMTP is set up, update /privacy: sign-in emails go through Google.

## 2026-11-01 (day): Security headers (security step 2)

**Done**
- Every response carries: a small CSP (`frame-ancestors 'none'; base-uri 'self'; object-src 'none'`), `X-Frame-Options: DENY`, HSTS (on Vercel only), `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a Permissions-Policy (camera on our own pages for the barcode scanner; microphone, location, payments off), and `Cross-Origin-Opener-Policy: same-origin-allow-popups` (no tab-nabbing). `X-Powered-By` removed; browser source maps stay off.
- Checked on a production build: headers present on pages and `/sw.js`, no console errors, and another site can't frame `/login`.

**Decisions**
- No full script CSP yet: it needs per-request nonces, which would make every page dynamic. Revisit if third-party scripts are ever added.

## 2026-11-01 (day): Explicit table permissions (security step 1)

**Found:** on the live database, signed-in readers had no table privileges except on `wishlist`. New Supabase projects no longer grant `anon`/`authenticated` anything on new tables; our migrations assumed the old defaults and only narrowed them with `revoke`, and the test database still had the old defaults, so tests passed. After sign-in, every page reading `profiles`, `copies`, `requests` etc. would have failed.

**Done**
- Migration `20261101001000_explicit_table_grants.sql`: least privilege. Signed-in readers get exactly what the app uses: reads, plus writes on named columns only (their own profile, contact, new books, copies, wishlist; unblock). So nobody can set an id or `created_at` (a copy dated 2100 would sit first on the shelf forever) or rewrite a book's title. Signed-out visitors get no table access (the landing shelf uses `public_shelf()`). feedback, reports and `credit_balances` get none; the service role gets nothing extra (a leaked key couldn't write credits).
- The test database now starts like a new Supabase project (no automatic privileges). `grants.test.ts` pins the exact privilege list (anon: none), runs every direct table call the app makes as a signed-in reader (including upsert and conflict paths), and checks 17 writes that must stay forbidden.

**Decisions**
- Every new table's migration must `grant` what it needs (README).

## 2026-11-01 (day): Site URL was the protected address

**Found:** Supabase's Site URL was `https://magnus-v1-merey-jago.vercel.app`. Whenever Supabase rejects the app's return address it falls back to the Site URL, so readers landed on a different address from the one holding their sign-in key (`bad_code_verifier` in the logs), and on an address Vercel puts behind its own login for everyone else.

**Done**
- `normaliseSiteOrigin()` cleans up `NEXT_PUBLIC_SITE_URL` (spaces, quotes, missing `https://`, a path or trailing slash), so a small typo can't make Supabase reject the return address. A value that isn't a web address now fails loudly instead.

**Next**
- [ ] Zarith: Site URL → `https://magnus-v1.vercel.app`; add `https://magnus-v1.vercel.app/**` to Redirect URLs.

## 2026-11-01 (day): Sign-in survives a mismatched Site URL

**What happened:** after the service-worker fix, the email link still ended on the landing page. Supabase's auth settings were saved again at 12:04-12:11 KST, and since then every email's link went to `magnus-v1-merey-jago.vercel.app/` (the Site URL fallback) instead of `/auth/callback`. Supabase accepted the link and sent a valid sign-in code, but it landed on the homepage, where nothing used it.

**Done**
- The landing page now finishes a sign-in that lands on it: a well-formed `?code=` goes to `/auth/callback` (same site, so the browser's sign-in cookie matches); `#error=` still goes to `/login?error=link`. Tested in a headless browser. Steve: safe (a code only works in the browser that asked for it).

**Next**
- [ ] Zarith: in Supabase → Authentication → URL Configuration, set Site URL back to `https://magnus-v1.vercel.app` and keep `https://magnus-v1.vercel.app/auth/callback` in Redirect URLs; use `magnus-v1.vercel.app` (not the `-merey-jago` address, which Vercel puts behind its login for everyone else).
- [ ] `/welcome` says "Add your first book" and "first book earns a starter credit" even for returning readers; show "Go to your shelf" when they already have copies.

## 2026-11-01 (day): Claude can merge and apply additive migrations

**Decisions (Zarith)**
- Claude may merge its own PRs once CI is green and Steve's Blocking items are fixed, in the order the PR descriptions give. Merging deploys production.
- Claude may apply additive migrations to the live Supabase project after review; destructive ones still need Zarith's yes.
- Recorded in CLAUDE.md ("How to work").

## 2026-11-01 (day): Sign-in links were swapped twice (service worker bug)

**What happened:** clicking a fresh sign-in link still ended on "enter your email". Supabase's logs showed the code swapped twice, 0.5 s apart: the first worked, the second failed. The cause was the offline service worker's *navigation preload* (added in the PWA review fixes): with it on, every page load the worker skips, like `/auth/callback`, is fetched twice, once as the invisible preload and once for real. The preload used up the one-time code; the reader saw the failed second request. Reproduced locally (2 hits per click), fixed (1 hit), and checked the upgrade from the old worker.

**Done**
- `public/sw.js`: navigation preload off, and switched off on phones that already have the old worker (from the second page load of their next visit). The offline page still works.
- `/auth/callback` ignores a preload request (204, code untouched), so even the very first click after the update, still handled by the old worker, signs in. Tested that exact case: the preload got 204, the real request used the code.

**Decisions**
- Navigation preload saves a few milliseconds on a cold worker; not worth a sign-in bug. Leave it off.

## 2026-11-01 (day): Sign-in link loop

**What happened:** clicking the email link landed on the landing page, signed out. Supabase's logs showed why:
- The link clicked was an older one (Gmail groups every "Your sign-in link" email in one thread, oldest at the top); the newest link's token was still unused. When Supabase rejects a link it sends the reader to the Site URL, the landing page, with the reason in the URL hash, so it looked like a loop.
- Supabase's built-in email had hit its hourly limit about 20 times since 31 Oct, so asking again often sent nothing.
- Earlier, the Site URL pointed at `magnus-v1-merey-jago.vercel.app`, which Vercel puts behind its login. Zarith fixed the Site URL and Redirect URLs.

**Done**
- The landing page sends a rejected link to `/login?error=link`, which explains it.
- "Check your inbox" now says to open the newest email in the same browser (true for Supabase's default email, which only works in the browser that asked).
- The email limit gets its own message instead of "try again in a minute".

**Next**
- [ ] Zarith: connect Gmail SMTP in Supabase (Authentication → Emails → Set up SMTP), then set the Magic link and Confirm signup templates to `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`. That lifts the email limit and makes links work in any browser (e.g. Gmail's own). Then drop "in this same browser" from `OPEN_LINK_HINT` in `web/src/lib/auth/copy.ts`.
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://magnus-v1.vercel.app` in Vercel (needs the Vercel connector approved).

## 2026-11-01 (day): Activity badge and due-date countdown

**Done**
- Migration `20261101000900_waiting_count.sql`: `my_waiting_count()` counts your requests where the next step is yours (each request once): a request you can accept, a handover or return the other reader confirmed and you haven't, a lend that went stale before the handover (cancel it), their meet-up suggestion on a card the page shows, a "more time" ask on your book, and a book you're borrowing that's due within 3 days or overdue. Same rules as the Activity page's buttons. It runs as the reader (row level security applies). 6 SQL tests.
- The Activity link (top bar and phone tab bar) shows the count as a small songket badge ("9+" above nine). Screen readers hear "Activity, 3 waiting for you". It streams in, so pages never wait for it, and it's one database call per page (both navs share it). On phones it sits on the corner of the word, so the five tabs still fit at 320px.
- The borrower's line counts down: "Due back in 2 days (10 Nov)", "Due back today", then "Was due back 10 Nov. Return it soon, or ask for more time below."

**Decisions**
- In-app only for now. Email reminders need Resend (free tier) and a key only Zarith can create; see Next.

**Next**
- [ ] Zarith: create a free Resend account and add `RESEND_API_KEY` in Supabase (Edge Function secrets) and Vercel, then email notifications (new request, accepted, due in 3 days) can be built on the same events as the badge.

## 2026-11-01 (day): Landing safety and FAQ brought up to date

**Done**
- Safety points and FAQ now match what's built: meet-up cards, blocking and reports, asking for more time on a loan, and how to delete an account today (ask the pilot team; a button is still to come).
- Fixed a promise we don't keep yet: the landing and the profile form said your WhatsApp number is shared once a request is accepted. That reveal is R13, still waiting for approval, so both now say it isn't shown to other readers.
- FAQ drawer with 7 cards: tabs step back to the left after a full set of colours and overlap less, so no tab covers a question or its open/close mark (checked on a phone and desktop).
- Account deletion made real, so the FAQ's promise holds: `admin_anonymise_reader()` (migration `20261101000800_anonymise_reader.sql`) removes everything personal (including notes on books they still own and the meet-up places they wrote), keeps the anonymised swap history the ledger needs, and clears and bans the sign-in (a 100-year ban: Supabase Auth can't read 'infinity'). It locks first, then checks for open handovers. Only the SQL Editor can run it, and running it twice is safe. Steps in `docs/runbooks/delete-account.md`. 3 tests.
- Activity: every request without a rating card now has "Report a problem", so a reader can report (and block) before a handover, not only after.

**Decisions**
- Deleting = anonymising (ADR 003's plan). Reports stay, for safety; ratings and ledger rows stay without the name.

**Next**
- [ ] If R13 is approved, update the profile hint and the safety point again.

## 2026-11-01 (day): Loan extensions

**Done**
- Migration `20261101000700_extensions.sql`: the borrower asks for more time (`ask_extension`), the lender says yes or no (`answer_extension`). Yes moves the due date, so "report not returned" (R4) moves with it. One open ask per loan, at most 5 per loan, and the new date stays within the copy's lend period from today. No credits move. 6 SQL tests, 5 logic tests.
- Activity: a "More time" card on every loan. The borrower picks a date (the picker only offers allowed dates); the lender sees "Aina asks to keep it until 13 Nov (now due 10 Nov)" with "Yes, that's fine" / "No, keep 10 Nov". The last answer is shown to both.
- `lib/books/lend.ts`: one place for lend periods in days (the book page and Activity share it).
- Supabase is connected to Claude (Zarith, 1 Nov: "supabase and vercel are all yours"). Additive migrations are applied to the live project after Steve's review; each PR says what went live.
- Table `loan_extensions` (not `extensions`: every Supabase project already has an `extensions` schema). A double tap doesn't use up one of the 5 asks; an unanswered ask is closed when the loan ends or its return starts.

**Decisions**
- The longest extension is the copy's lend period counted from today, the same rule as a new request, so a "4 weeks" book can never be kept more than 4 weeks ahead.
- Tests use Seoul dates (before 9am KST, UTC is still yesterday).

## 2026-11-01 (night 2): Summary and morning checklist

Five PRs, each reviewed by Steve with his findings fixed. They're chained (each branch contains the one before), so merge them **in this order** and each merges cleanly:
1. #11 `feat/meetup`: meet-up cards
2. #12 `feat/my-shelf`: My shelf, stamped library card, phone tab bar
3. #13 `feat/wishlist`: wishlist
4. #14 `feat/trust`: 👍/👎 after handovers, block, report, feedback
5. #15 `feat/pwa-stats`: offline page, install, pilot stats SQL

**Next**
- [ ] Zarith: merge #11 → #15 in order
- [ ] Zarith: in Supabase SQL Editor run, oldest first: `20261101000300_meetups.sql`, `20261101000400_wishlist.sql`, `20261101000500_trust.sql`
- [ ] Zarith: R10-R13 still need a yes/no before they're built

**Decision (security)**
- Postgres lets everyone (`PUBLIC`, including signed-out visitors) run a new function unless it's revoked. A schema default can't change that, so every migration from now on revokes `execute` from `public, anon` and grants `authenticated` explicitly. Found by a wishlist test.

## 2026-11-01 (night 2): App polish and pilot stats

**Done**
- Offline page: a tiny service worker (`public/sw.js`) shows `public/offline.html` ("The wind has dropped", self-contained: inline styles, no scripts) when a page can't load without the internet. It caches nothing else, so no stale shelves or signed-in pages stay on the phone. It only touches plain GET page loads (never form posts or `/auth/` sign-in callbacks) and uses navigation preload so it adds no delay. Registered in production only; never cached itself.
- **Kill switch:** if the worker ever misbehaves, deploy a `sw.js` that calls `self.registration.unregister()`; it's served with `no-cache`, so phones pick it up on the next visit. Bump `CACHE` in `sw.js` whenever `offline.html` changes.
- The Android install prompt is caught in the root layout (it fires once, early), so the Install button on `/me` still works after moving around the app.
- Install: the manifest is dark now, opens on `/browse`, and has shortcuts (Add a book, Activity). `/me` shows "Put Bayu on your home screen": an Install button on Android, Share → Add to Home Screen steps on iPhone, nothing once installed.
- Every page's browser bar is dark (root viewport).
- `docs/pilot-stats.sql`: copy-paste queries for the headline numbers, week by week, how requests end, give vs lend, a credits sanity check, most listed books and overdue loans. Checked against a fresh database.

## 2026-11-01 (night 2): Trust and feedback

**Done**
- Migration `20261101000500_trust.sql`: `handover_ratings` (👍/👎 once per handover, changeable; `smooth_handovers()` gives the count, never who), `blocks` (no requests either way; blocking cancels open requests between the two), `reports` and `feedback` (written through functions with daily limits; readers can't read them back; the pilot team reads them in the Supabase dashboard).
- Activity: "How was the handover?" 👍/👎 and "Report a problem" on finished handovers. `/report` (with "Also block this reader"), `/feedback`, and links to both under every app page. Book pages show "N readers had a smooth handover with them" (distinct readers, so two friends can't inflate it). Your card (`/me`) lists readers you've blocked, with Unblock.

**Decisions**
- A blocked reader sees the same "not available right now" as any taken book; only the blocker is told they blocked.
- A block cancels requests that haven't changed hands yet, but a book on loan still has to come back (returns and R4 are unaffected; tested).
- Report + block run in one database call (`report_problem(..., p_block)`), so a report is never sent without the block asked for.
- `block_reader` takes the same per-person locks as `request_copy`, so a request racing a block can't slip through.

**Next**
- [ ] Zarith: run `20261101000500_trust.sql`; read reports and feedback in Supabase → Table Editor
- [ ] Later: let the pilot team mark reports as handled (an admin view), once there are any

## 2026-11-01 (night 2): Wishlist

**Done**
- Migration `20261101000400_wishlist.sql`: a private `wishlist` per reader, `wish_count()` ("N readers want this", a count only) and `wished_and_available()` (copies on the shelf now that you wished for).
- `/wishlist`: add by ISBN (looked up; type the title if nobody knows it), see which are on the shelf now, remove. Book pages get ☆/★ and "N readers want this". Browse gets "On my wishlist". Activity shows "From your wishlist, on the shelf now".
- Found and documented: Postgres lets PUBLIC execute every new function unless the migration revokes it explicitly (the schema-level default in the core migration can't remove that). New migrations now revoke and grant their own functions.

**Next**
- [ ] Zarith: run `20261101000400_wishlist.sql` in the Supabase SQL Editor

## 2026-11-01 (night 2): My shelf and the stamped library card

**Done**
- `/shelf`: your books with their status (on the shelf, paused, lent out), Pause / Put back, Edit (warkah, condition, lend period) and Take off the shelf (asks twice; cancels open requests). Books you're borrowing, with the due date. Books you took off, folded away.
- `/me`: "Stamps on your card", one stamp per credit movement (+1 gave, −1 took, held, freed, starter credit), with the book's title and date.
- Phones get a bottom tab bar (Browse · Shelf · Add · Activity · Me); wide screens keep the top bar.
- No database changes.
- Decision: pausing a book leaves waiting requests waiting (they can't be accepted until it's back on the shelf); the owner is told so.

## 2026-11-01 (night 2): Meet-up cards

**Done**
- Migration `20261101000300_meetups.sql`: one live meet-up card per request (place, time, optional note). `propose_meetup()` replaces the live card; `agree_meetup()` is for the other reader only. Times must be in the next 60 days.
- Activity shows the card on accepted requests (the handover) and on loans (the return): "Sounds good", "Suggest another", or "Change it" once agreed. Times are picked and shown in Korea time whatever the phone's timezone; common Ansan places are suggested.
- 4 SQL tests and 4 time tests.

**Next**
- [ ] Zarith: run `20261101000300_meetups.sql` in the Supabase SQL Editor

## 2026-11-01 (overnight): Activity page (request lifecycle)

**Done**
- `/activity`: requests made to you (accept / decline, "I handed it over", "I got it back", report not returned after due + 14 days) and your own requests (cancel, "I've got the book", "I returned it"), plus recent history. Each button calls exactly one database function; the database still enforces every rule.
- The steps per status live in `lib/activity/steps.ts`, with tests.

**Open**
- Meet-ups are agreed outside the app for now (the WhatsApp reveal is R13, waiting for approval).

## 2026-11-01 (overnight): Real shelf and browse

**Done**
- New migration `20261101000200_shelf.sql`: `public_shelf()` for the public landing (available copies with the area, never owners' names) and `search_shelf()` for signed-in readers (search by title or author, give/lend filter; row level security applies).
- The landing shelf now shows real copies first, dressed in one of the drawn cover designs chosen by ISBN, and fills up with samples so it never looks empty. Cached for a minute, so `/` stays a static page. Picking a real book leads to it after sign-in.
- `/browse`: the shelf as a list of spines, with search that works without JavaScript. `/browse/[id]`: the book posed in 3D, owner, condition, warkah, "N readers have this", and the request form (a return date within the owner's limit for a lend).

**Next**
- [ ] Activity page: incoming requests (accept / decline), handover and return buttons

## 2026-11-01 (overnight): Profile and add a book

**Done**
- `/me`: your library card. Name, area of Ansan (a fixed list), and an optional WhatsApp number kept in the owner-only table. Shows available / held / total credits.
- `/add`: find a book by scanning its barcode (ZXing, loaded only when the camera opens) or typing the ISBN; details come from our own books table, then Google Books, then Open Library; if nobody knows it, type the title. Then give or lend (with a maximum period), condition and a warkah note. The first listing shows the "+1 starter credit" stamp (granted by the database, R5).
- `/welcome` now points to the next step (make your card, or add your first book).
- Server-side validation for every field (`lib/books/validate.ts`), ISBN-10/13 checksums and conversion (`lib/books/isbn.ts`), and the lookup with fallbacks (`lib/books/lookup.ts`), all with tests.

**Not verified**
- The pages against a real Supabase project (I don't have its keys here). The SQL is tested; the forms were checked visually.

**Next**
- [ ] Zarith: after running the migration, sign in, make your card and add one real book

## 2026-11-01 (overnight): Database foundation and credit ledger

**Done**
- First database migration (`supabase/migrations/20261101000100_core.sql`): profiles (WhatsApp in an owner-only table), books, copies, requests, `app_settings` (R7 limits) and the append-only `credit_ledger`.
- The whole lend/give lifecycle as Postgres functions: request (R6, R7 checks), accept/decline, cancel, both-sides handover (R1-R3), both-sides return, report not returned after due + 14 days (R4). The starter credit (R5) is granted by a trigger on the first copy.
- 25 tests run the real SQL: PGlite (in-memory Postgres) for logic and row-level security, plus real Postgres for races (two handovers on one credit, 3-request limit). CI now starts a Postgres service.

**Decisions**
- Credits only move inside `security definer` functions; users can't write to the ledger or the requests table directly.
- R10-R13 not built (still waiting for approval).

**Next**
- [ ] Zarith: run the migration in the Supabase SQL editor (README → Database)
- [ ] Zarith: approve or change R10-R13

## 2026-11-01 (overnight): Dark sign-in pages

**Done**
- `/login` and `/welcome` now use the dark shelf look: a shared `AuthShell` with a small stack of shelf books that drifts once and settles (CSS, off for reduced motion), restyled fields and errors, and a stamped "library card" on the welcome page.
- Steve's review: field borders at 3.4:1, error border visible (custom CSS moved into `@layer components`), a stamp with its own background, the drift no longer loops forever, the books render on the server (no extra JavaScript on /login), and a new `merah-light` error colour token.

**Next**
- [ ] Merge order: #5 (landing), then this PR (#6)

## 2026-10-31 (night): Landing v3, the Stripe Press-style shelf

**Done**
- Zarith still found v2 generic and plain, and pointed at press.stripe.com. Studied it live in the browser: a dark ground, a stack of 3D books seen by a camera at mid-screen, and a colour flood when you pick one.
- Rebuilt the landing around **the Ansan shelf**: 9 sample books as real CSS 3D boxes with drawn Malay-craft covers (songket, awan larat, pucuk rebung, pelikat, tikar, bunga, ombak). On load they fall into place; scrolling makes the bayu blow through the stack (books drift and turn with scroll speed, then settle). Picking a book floods the page with its colour, turns it to its cover, and shows owner, give/lend and the owner's warkah.
- How it works, safety + FAQ and the footer restyled on the dark ground in the book colours. Removed the hero, wind scene, showcase, rantau scene and first-step sections (the shelf replaces them).
- Fixed: scroll triggers re-measure after fonts load and after the accordion hydrates (sections no longer stay blank).
- Verified: lint, typecheck, 12 tests, build; screenshots at 1440 and 390 px, reduced motion, keyboard (Tab to a book, Enter, Esc returns focus), no console errors, no sideways scroll.

**Decisions**
- Dark ground plus colourful books instead of bone and timber: the books carry the colour.
- CSS 3D instead of WebGL: no new dependency, crisp text, works without a GPU canvas.

**Next**
- [ ] Zarith: test locally and say if this is the direction; then merge PR #5
- [ ] Restyle /login and /welcome to match the dark shelf
- [ ] Replace the sample shelf with real books from Supabase in Week 2
- [ ] Sign-in on Vercel, domain + Resend, R10-R13 (unchanged)

## 2026-10-31: Landing page redo (bolder motion)

**Done**
- Rebuilt the landing from scratch after feedback that v1 looked "AI generated, too plain". New sections: hero with blow-away letters and turning pages, wind scene (loose pages ride the wind, fly through the carved panel), how-it-works accordion with stamp slams, shelf showcase with cover flips, horizontal rantau journey with passport stamps, FAQ index cards, a working "list your first book" dialog on songket gold, and a B-a-y-u block wordmark.
- Actually ran the design repos' tools this time: taste-skill direction (`one-motif`, the carved-panel arch), its lint (0 FAIL, 0 WARN) and its page inspector (down from 7 FAIL to 1 FAIL, which is "no real photos yet").
- Added SplitText, Lenis (desktop wheel only), the pucuk rebung band. Removed the old credits card, shelf preview and reveal components.
- Bone is now `#EEEEEA` (the inspector still read `#F1EFEA` as cream). Icons regenerated.
- Verified: lint, typecheck, 12 tests, build; screenshots at 1440/390 px in normal and reduced motion; no console errors, no horizontal scroll.

**Decisions**
- One motif (the arch) carries the page: buttons, windows, tabs, postcards, wordmark.
- Every section reads without JavaScript or with reduced motion (FAQ is native `<details>`, the accordion shows all four steps until hydrated). The close section uses scrubbed motion, not a fade-in.

**Next**
- [ ] Zarith: test locally (`git switch feat/landing-redo`, `npm run dev`), then merge the PR if happy
- [ ] Zarith: add 4+ real photos to `web/public/images/` (clears the last inspector FAIL)
- [ ] Sign-in on Vercel: Deployment Protection off, `NEXT_PUBLIC_SITE_URL`, Supabase URLs + email templates, then domain + Resend
- [ ] Zarith: approve rules R10-R13; then Week 2 (profile, add book with barcode, shelf, browse)

## 2026-10-30 (late night): Week 1 foundation

**Done**
- Next.js 16 app in `web/` (TypeScript strict, Tailwind 4, Bayu tokens, self-hosted fonts, themed focus and selection).
- Supabase sign-in: magic link + Google, `/auth/callback`, `/auth/signout`, protected `/welcome`, session refresh in `src/proxy.ts`.
- Redirect safety (`safeRedirectPath`) with 12 Vitest tests, so sign-in can't send people to other websites.
- **Landing page, full version**: hero, scene 1 (wind through the carved panel, kayu world opens), credits card, shelf preview (sample books), scene 2 (a book's rantau), safety + FAQ, close. Phone layouts, reduced-motion finished states, works without JavaScript.
- PWA manifest + icons; GitHub Actions CI (lint, typecheck, test, build).
- Verified: build, lint, typecheck, tests pass; screenshots at 1440 and 390 px through every scroll beat; no console errors, no horizontal scroll.

**Decisions**
- App lives in `web/` (room for Python services later); Vercel root directory = `web`.
- Kept Next 16 defaults (Cache Components, Partial Prefetching): session reads sit inside `<Suspense>`.
- Hero load animation is pure CSS (readable on the first frame, no JS dependency); scenes use GSAP with sticky stages, not scroll-jacking.
- Supabase **publishable** key naming (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).

**Next**
- [ ] Zarith: create Supabase + Vercel projects (README → One-time setup), then try signing in
- [ ] Zarith: approve rules R10-R13 ([user-flow.md](docs/user-flow.md))
- [ ] Week 2: profile, add-a-book with barcode scan, shelf, browse

## 2026-10-30 (night)

**Done**
- Designed the 6 core app screens and an 8-frame landing storyboard on the "Bayu v0.1 Screens" design canvas (claude.ai).
- Wrote [docs/user-flow.md](docs/user-flow.md): journey, request lifecycle, systems, BookSwap features worth borrowing.
- Studied 3 design repos (gsap-skills, impeccable, taste-skill) and bookswapapp.com → [docs/landing.md](docs/landing.md).
- Vendored the official GSAP skills into `.claude/skills/gsap-*` (MIT).
- Updated [docs/brand.md](docs/brand.md) with the Malay palette (kayu, songket, merah hati, bone).

**Decisions**
- Landing metaphor: **wind through a carved Malay panel** carries a book; the kayu world unfolds. Malay touches **subtle** (palette + linework). Drawn linework now, real photos after the pilot.
- **Meet-ups arranged per request** (people agree the place themselves), no fixed weekly swap hour.
- **WhatsApp after acceptance** for the pilot; in-app messages in v0.2.
- Paper changes from cream to **bone** to avoid the generic "AI cream + brown" look.
- Borrowed from BookSwap: "N readers have this", trust & safety section, FAQ, delete account.

**Next**
- [ ] Zarith: approve or change rules R10-R13 in [user-flow.md](docs/user-flow.md)
- [ ] Review the landing storyboard on the canvas and comment
- [ ] Week 1 build: walking skeleton + static landing

## 2026-10-30 (evening)

**Done**
- Fixed the nested-clone mix-up (deleted the empty `magnus-v1/` clone; the `Magnus/` folder is the real repo) and pushed all setup docs.
- Installed the Claude GitHub app. Claude can now push branches and open PRs. Default branch renamed `master` → `main`.
- Drafted an organizer-first roadmap, then **pivoted** after brainstorming (see Decisions).
- Wrote [ADR 002](docs/decisions/002-swap-first-korea-pilot.md) (swap-first Korea pilot), [ADR 003](docs/decisions/003-credit-system.md) (credit system), [docs/brand.md](docs/brand.md) (Bayu), and rewrote [ROADMAP.md](ROADMAP.md) around a 4-week build + 2-week pilot.

**Decisions**
- **Pilot first in Ansan, Korea**, with 5 Malaysian friends who read English books (same city), growing to ~15 through invites. Swapping first; clubs and organizer tools are "coming soon".
- **Give + lend with credits** (ADR 003): starter credit after the first listing, borrowing locks 1 credit, max 3 borrowed and 3 open requests. Lend period agreed by lender (max) + borrower (date).
- Meet-ups only (weekly swap hour). Open to everyone. English books only. No textbooks.
- **Name: Bayu** (Malay: gentle breeze), with Malay feature words: Warkah (notes), Rantau (book journey), Penglipur (badge). Repo keeps the code name Magnus.
- Git workflow: branch per issue → PR → Steve reviews → **Zarith merges** (Claude doesn't merge).

**Next**
- [ ] Review and merge PR #1 (roadmap + decisions + brand)
- [ ] Ask friends for their English book counts, create the pilot WhatsApp group
- [ ] Pick the swap spot + weekly swap hour
- [ ] Check the Bayu domain and handles
- [ ] Week 1 build: walking skeleton (Claude turns the roadmap into GitHub issues first)

## 2026-10-30

**Done**
- Brainstormed side-project ideas (AI tools, sports platforms, middleman/logistics platforms, book community app).
- Competitor research on two ideas:
  - Badminton court/player matching: Malaysia already covered (Courtsite, AFA Superapp, Book and Go). Possible gap in Korea for a badminton session organizer.
  - Book swap + book club app: no dominant Malaysian app found. Swapping and clubs run on Facebook groups and offline meetups.
- Set up this folder (README, PROGRESS, IDEAS, CLAUDE.md).
- Set up Claude Code automation in `.claude/`:
  - `agents/steve.md`: Steve, the reviewer subagent (bugs, security/RLS, missing tests, CLAUDE.md rules). Read-only.
  - `commands/wrap-up.md`: `/wrap-up` end-of-session routine (test → lint → review → update docs → commit, no push).
  - `hooks/protect-secrets.js`: blocks reading, editing or `git add`-ing `.env` files (`.env.example` allowed).
  - `hooks/lint-on-edit.js`: runs ESLint/Ruff on each edited file once they're installed; does nothing until then.
  - `settings.json`: wires up the hooks and makes Claude ask before `git push`, `rm`, Vercel deploys, `supabase db push/reset`, `docker push`.
- Added `.gitignore` (secrets, Node/Next, Python, Supabase).
- Renamed the reviewer subagent to **Steve** (`.claude/agents/steve.md`; agent names must be lowercase, so `name: steve`).
- Debated PWA vs native iOS. Recorded in [docs/decisions/001-pwa-first.md](docs/decisions/001-pwa-first.md).
- Connected the folder to GitHub (`zeth-ux/magnus-v1`).
- Market analysis for Malaysia + Korea + global comparables → [MARKET.md](MARKET.md).

**Decisions**
- **Idea picked:** book swap + book club community (Malaysia first, Korea second).
- **PWA first**, not native. Go native (Expo, iOS + Android) only when triggered: ~200 weekly active users, missed-notification complaints, or clubs asking for "the app".
- Treat this as a portfolio + learning project first, revenue second.
- Automation guardrails: hooks for hard rules (secrets, lint), `ask` permissions for anything risky or irreversible. No auto-push or auto-deploy.
- Working positioning (from market research): **"the home for book clubs: events, RSVPs and a swap table in one link."** Organizers are the wedge; swapping happens at events.

**Next**
- [x] Pick the idea
- [ ] Install the Claude GitHub app so Claude can push (`/install-github-app`)
- [ ] Confirm the hooks fire on Windows: ask Claude to read `.env` and check that it's blocked
- [ ] Decide the first pilot: KL clubs (remote) vs ERICA / Seoul expat readers (in person)
- [ ] Interview 5 organizers + 5 readers (script in MARKET.md §6). Goal: 2 organizers commit to a real event.
- [ ] Write the MVP spec and schema
- [ ] Start Day 1 build
