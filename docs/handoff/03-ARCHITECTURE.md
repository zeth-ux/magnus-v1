# 03 · Architecture: how Bayu is built

*Handoff, 2026-11-21. Read `CLAUDE.md` (rules) and `web/AGENTS.md` (Next.js 16
warning) before writing code. Database detail lives in
[04-DATA-AND-RULES.md](04-DATA-AND-RULES.md).*

## Stack
| Layer | Choice | Notes |
|---|---|---|
| App | **Next.js 16.4.6** (App Router, Cache Components on), React 19.3, TypeScript strict | Pinned exactly. `web/` |
| Styling | Tailwind v4 (`@theme` tokens in `globals.css`), plain CSS classes for components | No component library |
| Motion | GSAP 3 (+ `@gsap/react`, CustomEase) via `web/src/lib/gsap.ts`; Lenis is a dependency | Wrap motion in `gsap.matchMedia()` with `MOTION_OK` |
| Data + auth | **Supabase** (Postgres, Auth, RLS) via `@supabase/ssr` 0.12 / `supabase-js` 2.118 | Project `pzjwfaccurqvpvuvmayc` |
| Barcodes | Native `BarcodeDetector` where present, else ZXing (`@zxing/browser` + `@zxing/library`) | Loaded only when the scanner opens |
| Book lookup | Google Books → Open Library fallback, cached (`lib/books/cached-lookup.ts`, `"use cache"`) | English books only |
| Hosting | **Vercel** (team `team_7WE56gmmw5AoKiG8JIwhGqGB`, project `prj_h5YAxlLUSrqKvHk3cnUhR3YtKU6a`), free tier | Merge to `main` = production deploy |
| Tests | Vitest + PGlite (DB tests), real Postgres for concurrency, Playwright (browser) | See Testing |
| PWA | `app/manifest.ts`, service worker for an offline page | ADR 001: PWA first |

## Repo layout
```
CLAUDE.md            rules for Claude (read first)
ROADMAP.md PROGRESS.md README.md SECURITY.md MARKET.md IDEAS.md
docs/
  handoff/           these five handoff files
  decisions/         ADRs 001 PWA-first, 002 pilot scope, 003 credits (source of truth)
  brand.md landing.md user-flow.md runbooks/ research/ pilot-stats.sql
supabase/migrations/ every schema change, in order (applied to the live project via the Supabase connector)
web/
  src/app/           routes: / (landing) login welcome browse browse/[id] shelf add activity me wishlist
                     report feedback privacy auth/callback auth/signout (+ manifest, robots, sitemap, OG image)
  src/components/    app/ (shell, nav, badge, empty states, sign-in strip) auth/ landing/ turning-shelf/ shelf/ motion/ pwa/
  src/lib/           supabase/ auth/ books/ shelf/ activity/ card/ onboarding/ site/ dates smooth gsap
  src/db/            database tests (run the real migrations in PGlite)
  src/proxy.ts       Next 16's "middleware"
  e2e/               Playwright tests, fake Supabase, barcode video, build/dev scripts
  .claude/agents/    Steve, the reviewer subagent (at repo root .claude/)
```

## Next.js 16 rules that bite (read the docs in `web/node_modules/next/dist/docs/`)
- `middleware` is now **`proxy`** (`src/proxy.ts`): canonical-host redirect,
  Supabase session refresh, and the sign-in gate for `PROTECTED_PATHS`
  (`/welcome /me /add /activity /shelf /wishlist /report /feedback`…; **not**
  `/browse`, which is the open shelf).
- **Cache Components:** anything that reads cookies, headers or searchParams must
  sit inside `<Suspense>`. Pages are a static shell plus streamed parts.
- `createSupabaseServerClient()` (`lib/supabase/server.ts`) calls **`await
  connection()`** after `cookies()`: it stops Next's runtime prefetch from
  reading the clock (supabase-js checks session expiry) and logging errors.
  Consequence: **never call it inside `"use cache"`**.
- `getSessionUser()` (`lib/supabase/user.ts`) is React-`cache()`d: one
  `getUser()` per request shared by the badge, nav and page. `requireUser(next)`
  redirects to `/login?next=…`. `ServerClient` is the type of a configured client.
- `"use cache"` is used only for public data with its own anonymous client
  (`lib/shelf/landing-shelf.ts`, `lib/books/cached-lookup.ts`).
- Next 16.4.x prints a `SecurityFatalError` "upgrade nudge" **only when it
  detects an AI agent** running the build. It's not a CI failure; read the
  advisory, then upgrade on purpose.

## Auth
- **Sign-in = 6-digit email code**, verified **from the browser**
  (`supabase.auth.verifyOtp({ type: "email" })` in `app/login/login-form.tsx`)
  so Supabase's rate limit applies per reader. This is the one deliberate
  exception to "validate on the server" (CLAUDE.md). Sending the email is a
  server action (`app/login/actions.ts`) with input checks (`lib/auth/otp.ts`).
- **The email's link is a backup**, finished on the landing page
  (`lib/auth/finish-sign-in.ts`, `components/auth/link-error-redirect.tsx`):
  reads tokens from the URL hash *before* wiping it, then sets the session.
- **Canonical host:** on production the proxy 307s any other host to
  `VERCEL_PROJECT_PRODUCTION_URL` (`lib/site/canonical.ts`), because cookies are
  per host and the Vercel–Supabase integration keeps setting the long team URL.
- `next` redirects go through `safeRedirectPath()` (`lib/safe-redirect.ts`).
- Sign out everywhere: `app/auth/signout/route.ts` (scope `global`).
- Google sign-in is built but off (`NEXT_PUBLIC_GOOGLE_SIGNIN=on` + provider in Supabase).
- **Known weak spot: email delivery.** Supabase's built-in sender is for testing
  (very few emails per hour), and editing the template to include the code
  (`{{ .Token }}`) needs **custom SMTP**, which only Zarith can set up. See 05.

## Data access patterns
- **Writes and anything with rules go through Postgres functions** (`rpc()`):
  `request_copy`, `respond_request`, `confirm_handover`, `confirm_return`,
  `report_not_returned`, `propose_meetup`/`agree_meetup`, `ask_extension`/
  `answer_extension`, `withdraw_copy`, `rate_handover`, `report_problem`,
  `block_reader`, `send_feedback`. The UI never does credit maths.
- Simple reads/writes on a reader's own rows use tables directly, under RLS
  (`profiles`, `profile_contacts`, `copies`, `wishlist`).
- **Signed-out visitors** only reach `public_shelf`, `public_search_shelf`,
  `public_copy` (security definer, fixed safe columns). Anon has no table access at all.
- DB errors raised with `hint = 'bayu'` carry a reader-facing message;
  `friendlyError()` (`lib/supabase/friendly-error.ts`) shows those and hides the rest.
- Server actions validate everything again on the server (`lib/books/validate.ts`
  etc.) even when the form already did.

## Security
- RLS on every table, **explicit grants** (`20261101001000_explicit_table_grants.sql`),
  `security definer` functions with `set search_path = ''` and fully qualified
  names, execute revoked from `public` and granted per role.
- CSP enforced (`next.config.ts`): `script-src 'self' 'unsafe-inline'` (Next
  needs it), `form-action 'self'`, Supabase origin incl. ws/wss; a stricter
  Report-Only policy alongside. `camera=(self)` Permissions-Policy for the scanner.
- `public/.well-known/security.txt`, `SECURITY.md`. Never commit secrets or
  `.env*`; never put the service_role key in a `NEXT_PUBLIC_` variable.
- `robots.ts` keeps the app (including `/browse`, on purpose: areas) out of search engines.

## Environment variables (names only)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`NEXT_PUBLIC_SITE_URL`, optional `NEXT_PUBLIC_GOOGLE_SIGNIN`. Vercel sets
`VERCEL_ENV` and `VERCEL_PROJECT_PRODUCTION_URL`. `NEXT_PUBLIC_*` are baked in at
build time. Zarith's local values live in `web/.env.local`: **don't read it**.

## Testing and CI
- `cd web && npm run lint && npm run typecheck && npm test && npm run build`.
- **Unit + DB tests** (Vitest, ~207): `src/db/*.test.ts` run every migration in
  PGlite and act as real roles (`db.as(user, sql)`, `set role anon`).
  `ledger.concurrency` needs real Postgres (`TEST_DATABASE_URL=postgresql://…`)
  and is skipped otherwise. Core logic (ledger, lending, limits) **must** have tests.
- **Browser smoke tests** (Playwright 1.63, Chromium, 28 tests): `npm run e2e:build
  && npm run e2e`. The built app against `e2e/fake-supabase.mjs` (any email, code
  `123456`; `busy@example.com` → email limit). Covers landing, sign-in (and back
  to where you were), every tab on desktop and phone waiting for streamed data,
  the open shelf (no private names), and the scanner with Chromium's fake camera
  showing a generated EAN-13 (`e2e/barcode-video.mjs`). Any page error, console
  error or crash screen fails a test. The fake logs `[fake supabase] unhandled …`
  for calls it doesn't know: add them.
- e2e builds go to `.next-e2e` (`BAYU_E2E=1` → `distDir`), never over `.next`.
- **`npm run dev:fake`**: dev server on :3100 against the fake. Build UI without email.
- **CI** (`.github/workflows/ci.yml`): job 1 lint/typecheck/test/build; job 2
  browser smoke tests (uploads the Playwright report). Vercel adds preview deploys.

## Deploy
Branch → PR → CI green → Steve reviewed → merge to `main` → Vercel deploys
production (~1–2 min). Migrations are applied to the live Supabase **before**
merging code that needs them (additive ones only without asking; see CLAUDE.md).
After deploying: Vercel runtime errors (`get_runtime_errors`) and a look at the
live page. The free Vercel plan keeps runtime logs for **one hour**.
