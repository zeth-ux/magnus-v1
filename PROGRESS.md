# Progress Log

Newest entries at the top. Each entry: what was done, decisions made, what's next.

---

## 2026-10-31: Landing page redo (bolder motion)

**Done**
- Rebuilt the landing from scratch after feedback that v1 looked "AI generated, too plain". New sections: hero with blow-away letters and turning pages, wind scene (loose pages ride the wind, fly through the carved panel), how-it-works accordion with stamp slams, shelf showcase with cover flips, horizontal rantau journey with passport stamps, FAQ index cards, a working "list your first book" dialog on songket gold, and a B-a-y-u block wordmark.
- Actually ran the design repos' tools this time: taste-skill direction (`one-motif`, the carved-panel arch), its lint (0 FAIL, 0 WARN) and its page inspector (down from 7 FAIL to 1 FAIL, which is "no real photos yet").
- Added SplitText, Lenis (desktop wheel only), the pucuk rebung band. Removed the old credits card, shelf preview and reveal components.
- Bone is now `#EEEEEA` (the inspector still read `#F1EFEA` as cream). Icons regenerated.
- Verified: lint, typecheck, 12 tests, build; screenshots at 1440/390 px in normal and reduced motion; no console errors, no horizontal scroll.

**Decisions**
- One motif (the arch) carries the page: buttons, windows, tabs, postcards, wordmark.
- No content waits on a reveal to be visible (scrubbed motion instead of fade-ins), so a missed trigger never leaves a blank page.

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
