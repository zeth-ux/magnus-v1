# CLAUDE.md — Magnus

Instructions for Claude Code working in this repo.

## About me
- Zarith, AI major at Hanyang University ERICA, aiming to be an AI Software Engineer.
- I want to understand the code, not just accept it. Explain non-obvious decisions briefly.

## How to work
- Start new features in **plan mode**: propose the approach, files touched, and risks before editing.
- Small, focused commits with clear messages. Never commit secrets or `.env` files.
- Run tests and the linter before saying a task is done. If something can't be verified, say so.
- Ask before: adding a paid service, changing the database schema in a destructive way, deleting files, or deploying.
- Prefer simple, boring solutions over clever ones.
- After finishing a feature, ask Steve (the `steve` subagent) to review the changes and fix Blocking items before committing.
- If a hook blocks an action (e.g. touching `.env`), don't work around it. Tell me what you needed instead.

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
- Tests for core logic (matching, payments, booking rules) are required, UI tests optional.
