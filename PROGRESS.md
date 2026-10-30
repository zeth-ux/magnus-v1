# Progress Log

Newest entries at the top. Each entry: what was done, decisions made, what's next.

---

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
