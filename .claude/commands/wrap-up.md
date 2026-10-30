---
description: End-of-session routine. Test, lint, review, update PROGRESS.md/README.md, then commit.
argument-hint: "[optional notes about this session]"
---

Wrap up this work session for Magnus. Follow these steps in order and stop to
ask me if anything is unclear or fails.

Extra notes from me (may be empty): $ARGUMENTS

1. **See what changed.** Run `git status` and `git diff HEAD`. If this folder is
   not a git repo yet, tell me and ask whether to run `git init` before going on.
   If nothing changed, tell me and stop.

2. **Verify.** Run the test suite and the linter for every part of the project
   that has them (e.g. `npm test` / `npm run lint` in the Next.js app,
   `pytest` / `ruff check` for Python services). If none exist yet, say so.
   If anything fails, fix it, or explain why you can't, before continuing.

3. **Review.** Ask Steve (the `steve` subagent) to review the changes. Fix every
   **Blocking** item. For "Should fix" items, either fix them or list them as next steps.

4. **Update `PROGRESS.md`.** Add an entry at the top for today's date (if one
   for today already exists, add to it). Use the existing format:
   **Done**, **Decisions**, **Next** (as `- [ ]` checkboxes). Include
   my notes above. Keep it short and factual.

5. **Update `README.md`** only if features, setup steps or architecture
   changed this session.

6. **Commit.** Group the changes into small, focused commits with clear
   messages (e.g. `feat(shelf): add ISBN barcode scanning`). Show me the plan
   (which files go in which commit), then make the commits.
   - Never commit `.env` files or secrets. Check `git diff --cached` first.
   - Do **not** push or deploy.

7. **Summarize** in 3-5 lines: what got done, what's committed, and the top
   next step.
