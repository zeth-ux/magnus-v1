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
- Tech stack and why
- Installation guide
- Screenshots and demo
- How it makes money
- Future improvements
