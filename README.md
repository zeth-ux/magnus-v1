# Magnus

A side project by Zarith Imran (AI major, Hanyang University ERICA).

> **Status:** idea picked: a **book swap + book club community** for Malaysia (KL first) and Korea, built as a **mobile-first PWA**. Now validating with organizers and readers.
> Docs: [ROADMAP.md](ROADMAP.md) (MVP plan) · [MARKET.md](MARKET.md) (market analysis) · [docs/decisions/](docs/decisions/) (decision records) · [IDEAS.md](IDEAS.md) (shortlist) · [PROGRESS.md](PROGRESS.md) (running log)

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
| Steve (reviewer subagent) | `.claude/agents/steve.md` | "ask Steve to review my changes" (read-only) |
| End-of-session routine | `.claude/commands/wrap-up.md` | `/wrap-up [notes]`: test, lint, review, update docs, commit (never pushes) |
| Secrets guard | `.claude/hooks/protect-secrets.js` | Automatic: blocks touching `.env*` (except `.env.example`) |
| Lint on edit | `.claude/hooks/lint-on-edit.js` | Automatic: ESLint/Ruff after every edit, once installed |
| Permissions | `.claude/settings.json` | Claude must ask before `git push`, `rm`, deploys, DB push/reset |

Hooks need **Node.js** on your PATH. Personal overrides go in `.claude/settings.local.json` (git-ignored).

Typical loop: start a feature in plan mode (Shift+Tab), approve the plan, let Claude build, then run `/wrap-up`.

## Sections to fill in once the idea is picked
- Problem and who it's for
- Features (MVP vs later)
- Architecture diagram
- Tech stack and why
- Installation guide
- Screenshots and demo
- How it makes money
- Future improvements
