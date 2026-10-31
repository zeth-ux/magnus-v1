# Bayu 🍃 *(code name: Magnus)*

**Books that breeze through.** A place for readers to give and lend physical
books to each other. *Bayu* is Malay for a gentle breeze: it stops by for a
while, then moves on, just like a borrowed book.

A side project by Zarith Imran (AI major, Hanyang University ERICA).

> **Status:** building **v0.1**, a mobile-first PWA for a pilot with ~15 English readers in Ansan, Korea (Nov 30-Dec 13, 2026).
> Docs: [ROADMAP.md](ROADMAP.md) (pilot plan) · [docs/user-flow.md](docs/user-flow.md) (user journey + systems) · [docs/landing.md](docs/landing.md) (landing page story) · [docs/decisions/](docs/decisions/) (decision records) · [docs/brand.md](docs/brand.md) (name, palette, words) · [MARKET.md](MARKET.md) (market analysis) · [IDEAS.md](IDEAS.md) (shortlist) · [PROGRESS.md](PROGRESS.md) (running log)

## How Bayu works (v0.1)
1. **List** your books: scan the barcode, then mark each one **give** or **lend**.
2. **Browse** what other readers near you are sharing, and request a book.
3. **Meet up** at a public spot you both agree on, and both tap "handed over".
4. **Credits** keep it fair: give a book → +1 credit; take a book → −1. Borrowing
   locks 1 credit until you return the book. Everyone gets 1 starter credit after
   listing their first book. ([Full rules](docs/decisions/003-credit-system.md))

## Goal
Ship a real, deployed product that:
- solves a recurring problem people would actually rely on (daily or weekly use)
- has real engineering depth (not a CRUD tutorial)
- can earn money, even a little
- goes on the portfolio with a proper README, architecture diagram and demo

## Tech stack
| Layer | Choice | Why |
|---|---|---|
| App | **Next.js 16** (App Router, Cache Components) + **TypeScript** (strict) | One codebase for the landing page and the app; static where possible, streamed where personal |
| Styling | **Tailwind CSS 4** with Bayu tokens in `web/src/app/globals.css` | Tokens mirror [docs/brand.md](docs/brand.md) |
| Motion | **GSAP** (ScrollTrigger) via `useGSAP`, **CSS 3D** books, **Lenis** for wheel smoothing | The landing shelf (Stripe Press style); reduced-motion safe |
| Auth + DB | **Supabase** (`@supabase/ssr`) | Magic link + Google sign-in; Postgres with Row Level Security next |
| Fonts | Literata + Plus Jakarta Sans, self-hosted via Fontsource | No third-party font calls |
| Tests | **Vitest** + **PGlite** (Postgres in memory) | Core logic: redirect safety, the credit ledger and lending lifecycle (SQL tested in real Postgres) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) | Lint, typecheck, test, build on every PR |
| Hosting | Vercel (app) + Supabase (database) | Free tiers for the pilot |

## Run it locally
```bash
cd web
cp .env.example .env.local   # fill in your Supabase URL + publishable key
npm install
npm run dev                  # http://localhost:3000
npm run lint && npm run typecheck && npm test   # what CI runs
```
The landing page works without Supabase keys; sign-in needs them.

## One-time setup (Supabase + Vercel)
1. **Supabase** (free): create a project at supabase.com. In **Project Settings → API**, copy the Project URL and the **publishable** key into `web/.env.local`.
2. **Auth URLs:** in **Authentication → URL Configuration**, set *Site URL* to your Vercel address and add `http://localhost:3000/auth/callback` and `https://<your-vercel-domain>/auth/callback` to *Redirect URLs*.
3. **Magic-link email template** (important on phones): in **Authentication → Emails → Magic Link**, set the link to
   `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Sign in to Bayu</a>`.
   This makes the link work in any browser (e.g. when Gmail opens it in its own app). Keep the Redirect URLs list exact, with no wildcards.
4. **Email limit:** Supabase's built-in email only sends a few sign-in emails per hour. Before the pilot, connect a free SMTP sender (e.g. Resend) in **Authentication → Emails → SMTP**.
5. **Google sign-in (optional):** create an OAuth client in Google Cloud, then enable the Google provider in **Authentication → Providers**. Email sign-in works without it.
6. **Vercel** (free): import the GitHub repo, set **Root Directory = `web`**, and add the three variables from `.env.example` (with `NEXT_PUBLIC_SITE_URL` = your Vercel URL). Every PR then gets a preview link.
   Note: `NEXT_PUBLIC_*` values are fixed at build time, so sign-in emails sent from a *preview* deployment link to production. Test sign-in on production (or locally).

## Database (Supabase)
The schema lives in `supabase/migrations/` as plain SQL, applied in filename order.
- **Apply it:** open your Supabase project → **SQL Editor** → paste each migration file (oldest first) → **Run**. (Or, with the Supabase CLI linked to the project: `supabase db push`.)
- **What's in it:** profiles (WhatsApp kept in a separate owner-only table), books (by ISBN-13), copies, requests, and the **append-only credit ledger** with its lifecycle functions (`request_copy`, `respond_request`, `cancel_request`, `confirm_handover`, `confirm_return`, `report_not_returned`, `my_credits`). Rules: [ADR 003](docs/decisions/003-credit-system.md).
- **Tests:** `npm test` runs the real SQL in an in-memory Postgres (PGlite), no setup. The concurrency tests need a real Postgres: set `TEST_DATABASE_URL` (CI does this automatically).

## Development workflow (Claude Code)
This repo is set up so Claude Code can do most of the build work with guardrails.

| What | Where | How to use |
|---|---|---|
| Project rules | `CLAUDE.md` | Read automatically every session |
| GSAP skills (animation rules, MIT) | `.claude/skills/gsap-*` | Loaded automatically when building animations |
| Steve (reviewer subagent) | `.claude/agents/steve.md` | "ask Steve to review my changes" (read-only) |
| End-of-session routine | `.claude/commands/wrap-up.md` | `/wrap-up [notes]`: test, lint, review, update docs, commit (never pushes) |
| Secrets guard | `.claude/hooks/protect-secrets.js` | Automatic: blocks touching `.env*` (except `.env.example`) |
| Lint on edit | `.claude/hooks/lint-on-edit.js` | Automatic: ESLint/Ruff after every edit, once installed |
| Permissions | `.claude/settings.json` | Claude must ask before `git push`, `rm`, deploys, DB push/reset |

Hooks need **Node.js** on your PATH. Personal overrides go in `.claude/settings.local.json` (git-ignored).

Typical loop: start a feature in plan mode (Shift+Tab), approve the plan, let Claude build, then run `/wrap-up`.

## Sections to fill in as we build
- Architecture diagram
- Screenshots and demo
- How it makes money
- Future improvements
