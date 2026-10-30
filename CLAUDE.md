# CLAUDE.md — Magnus

Instructions for Claude Code working in this repo.

## About me
- Zarith, AI major at Hanyang University ERICA, aiming to be an AI Software Engineer.
- I want to understand the code, not just accept it. Explain non-obvious decisions briefly.

## The product
- **Bayu** (code name Magnus): readers give and lend physical books to each other. Current plan: `ROADMAP.md`.
- Key rules live in decision records. Read them before touching related code:
  - `docs/decisions/003-credit-system.md`: credits, lending, limits (R1-R9). **The ledger is append-only.**
  - `docs/decisions/002-swap-first-korea-pilot.md`: pilot scope (what's in and out).
  - `docs/brand.md`: name, colours, voice, and feature words (**Warkah** = pass-it-on note, **Rantau** = book journey, **Penglipur** = contributor badge).
- Use these terms in code and UI: `copy` (a physical book someone owns), `book` (title metadata by ISBN), `give`, `lend`, `credit`, `handover`.

## How to work
- Start new features in **plan mode**: propose the approach, files touched, and risks before editing.
- Small, focused commits with clear messages. Never commit secrets or `.env` files.
- Run tests and the linter before saying a task is done. If something can't be verified, say so.
- Ask before: adding a paid service, changing the database schema in a destructive way, deleting files, or deploying.
- Prefer simple, boring solutions over clever ones.
- After finishing a feature, ask Steve (the `steve` subagent) to review the changes and fix Blocking items before committing.
- If a hook blocks an action (e.g. touching `.env`), don't work around it. Tell me what you needed instead.
- Git: one branch per issue (`feat/...`, `fix/...`, `docs/...`) → open a PR into `main`. **Never merge PRs yourself**; I merge.

## Keep the docs current (every session)
- Add an entry to the top of `PROGRESS.md`: what was done, decisions, next steps.
- Update `README.md` when features, setup steps or architecture change.

## Stack defaults (until decided otherwise)
- Frontend: Next.js + TypeScript + Tailwind, mobile-first PWA
- Backend/DB: Supabase (Postgres, auth, storage); FastAPI for Python services
- Deploy: Vercel + Supabase; Docker for Python services

## Code standards
- TypeScript strict mode; Python with type hints.
- Validate all user input on the server.
- Tests for core logic (credit ledger, lending lifecycle, request limits; later payments and booking rules) are required, UI tests optional.
