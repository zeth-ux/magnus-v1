# 05 · Handoff: start here

*Written 2026-11-21 by the Claude session that built most of Bayu (Oct 30–Nov 21),
for the next Claude. Read this first, then `CLAUDE.md`, then the other four files
in this folder as you need them.*

| File | Read it for |
|---|---|
| [01-PRD.md](01-PRD.md) | What Bayu is, who it's for, what's built, what's out of scope |
| [02-DESIGN.md](02-DESIGN.md) | The look, tokens, voice, and the **planned dark mode and covers/photos** |
| [03-ARCHITECTURE.md](03-ARCHITECTURE.md) | Stack, Next.js 16 traps, auth, security, testing, deploy |
| [04-DATA-AND-RULES.md](04-DATA-AND-RULES.md) | Tables, credit rules, request lifecycle, privacy model, how to change the DB |

## Where things stand (2026-11-21)
- **Live:** https://magnus-v1.vercel.app, `main` at `769722c` (PR #44). No runtime errors.
- **Last shipped:** #39 scanner fix · #40 contrast & depth · #41 quiet prefetch
  logs · #42 Next 16.4.6 · #43 browser smoke tests in CI · #44 **open shelf**
  (browse without an account; DB functions applied live).
- **Real data:** 1 reader (Zarith), 1 book listed. The pilot hasn't started.
- No open PRs, no uncommitted work. The light/dark toggle was agreed but **not started**.

## Do next, in this order (agreed with Zarith on Nov 19)
1. **Light / dark mode toggle.** Plan in 02-DESIGN ("PLANNED 1"). Biggest job:
   split `ink` into a text role and an always-dark frame surface before adding
   the dark palette.
2. **Real covers (Open Library) and licensed mood photos (Unsplash/Pexels).**
   Plan in 02-DESIGN ("PLANNED 2"). No Google Images scraping, even though Zarith
   offered: his permission can't cover others' copyright. Keep `docs/photo-credits.md`.
3. Then, as Zarith decides: email notifications (needs his Resend key), R10–R13
   (needs his yes), scheduled jobs, a smoke test for the request flow
   (Browse → request → Activity).

## Waiting on Zarith (don't work around these)
- **Custom SMTP** (e.g. Gmail SMTP or Resend) in Supabase. Until then the
  built-in sender sends very few emails per hour, and the email template can't be
  edited to include the 6-digit code (`{{ .Token }}`). This is the root of most
  "login doesn't work" pain. He has to do it in the Supabase dashboard; don't ask
  him to paste keys into chat.
- A Resend API key for notification emails.
- Yes/no on R10–R13; who resolves return disputes.
- Domain and handles; privacy contact email; GitHub private vulnerability reporting.
- Real-phone checks: scan a barcode on Android Chrome (the native detector isn't
  covered by CI), and how dark mode / the design feels on his phone.
- Seed content: him + 5 friends listing ~5 books each; 10–20 of his own photos.
- Pilot ops: WhatsApp group, 2–3 public meet-up spots in Ansan.

## How to work with Zarith
- He writes casually ("bro", "blud", Malay words, typos). Answer in plain,
  warm English; he's an AI student who **wants to understand the code**, so
  explain non-obvious decisions briefly.
- When he says **"brainstorm with me" / "don't do anything yet"**, don't build:
  research, lay out options and trade-offs, and ask. Otherwise he expects you to
  get on with it and work independently (even overnight), then report what went live.
- He reviews on his **phone**. He judges by look and feel: screenshots on a phone
  width before you call a visual change done.
- **Permissions he gave (in CLAUDE.md):** merge your own PRs once CI is green and
  Steve's Blocking items are fixed; apply **additive** migrations live. Ask before
  destructive DB changes, paid services, deleting files, or Vercel/Supabase
  project settings. Never read `web/.env.local`, never ask for keys in chat.
- **Steve** is the reviewer subagent (`steve`). Ask him after every feature;
  fix Blocking items (and usually Should-fix) before merging. He's been right a lot,
  including correcting my own wrong claims. Give him the diff command and tell
  him not to switch branches or build in your checkout.
- Every session: an entry at the **top of `PROGRESS.md`**, README when setup
  changes. Commit messages and PR bodies end with the attribution lines the
  harness gives you.

## Checklist for every change
1. Branch from `origin/main` (`feat/…`, `fix/…`, `docs/…`). Plan first for features.
2. Build it; tests for core logic (credits, lending, limits) are required.
3. `cd web && npm run lint && npm run typecheck && npm test && npm run build`.
4. Browser tests: `npm run e2e:build && npm run e2e`. Add one for each new feature.
   For visual work, screenshot desktop + phone (Playwright is pre-installed:
   `require('playwright')`, don't install another browser).
5. Steve reviews → fix → PROGRESS entry → PR with what/why/checks/merge order.
6. Migrations: apply live **before** merging the code that needs them; verify as `anon`.
7. Wait for CI (both jobs) → merge (squash) → wait for the Vercel deploy →
   check `get_runtime_errors` and look at the live page → tell Zarith what went live.

## Lessons learned the hard way (don't repeat them)
- **Stale `.next` cache** dropped CSS from a build: `rm -rf .next` before
  screenshot builds.
- **3D shelf hit-testing:** `overflow: hidden` on `.ts-face` made the turned cover
  unclickable in Chrome; clip inside the art instead. `.turning-shelf` needs
  `isolation: isolate` so the book sheet sits above it.
- **Sign-in link:** `window.location` is live, so copy the hash **before**
  `replaceState` wipes it.
- **Countdowns:** use timestamps, not chained timeouts (phones pause timers).
- **Scanner:** ZXing's `decodeFromConstraints` never started the video on many
  phones; we open the camera ourselves and read frames every 180 ms.
- **Next prefetch + supabase-js** logged "unstable Date.now()": fixed with
  `connection()` in the server client.
- **Agent-only build stop:** Next's `SecurityFatalError` nudge fires only for AI
  agents; CI/Vercel weren't blocked. Verify claims in source before telling Zarith.
- **Waiting on CI:** a background watcher can stop when you reply; use a
  blocking `gh run watch <id> --exit-status` before merging.
- **Shared checkout:** reviewers and branch switches collide; use git worktrees
  (`git worktree add`) with their own `npm ci` (Turbopack breaks on symlinked node_modules).
- **The fake Supabase can lie:** if a browser test fails oddly, check whether the
  fake answered the query the way PostgREST would (e.g. `maybeSingle()` asks for a list).
- **Privacy wording is a promise:** when what the public can see changes, update
  `app/privacy/page.tsx` in the same PR.

## Useful IDs and commands
- Supabase project: `pzjwfaccurqvpvuvmayc` (connector: `apply_migration`,
  `execute_sql`, `get_advisors`).
- Vercel: team `team_7WE56gmmw5AoKiG8JIwhGqGB`, project `prj_h5YAxlLUSrqKvHk3cnUhR3YtKU6a`
  (`list_deployments`, `get_runtime_errors`; logs kept 1 hour on the free plan).
- GitHub: `zeth-ux/magnus-v1` (use `gh api`; PRs into `main`).
- Local: `npm run dev` (needs Zarith's `.env.local`), `npm run dev:fake` (fake
  Supabase, any email + code `123456`), `npm run e2e:build && npm run e2e`.
