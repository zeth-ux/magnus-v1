# Security

Bayu is a small pilot app for readers in Ansan. If you find a security problem, please report it **privately**:

- contact the maintainer, [@zeth-ux](https://github.com/zeth-ux), or
- use GitHub's **Report a vulnerability** button on this repository's Security tab (once private vulnerability reporting is switched on).

Please don't open a public issue or test against other readers' accounts or data. Tell us what you found and how to reproduce it; we'll reply as soon as we can and credit you if you'd like.

How Bayu protects readers (for reviewers): row level security on every table with explicit grants (`web/src/db/grants.test.ts`), database functions for every credit and request change, sign-in by one-time email code, security headers (`web/next.config.ts`), and limits on requests, reports, feedback, listings and wishlists.
