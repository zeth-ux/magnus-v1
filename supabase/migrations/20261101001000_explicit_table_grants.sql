-- Explicit table privileges.
-- Newer Supabase projects no longer give the anon and authenticated roles
-- automatic privileges on new tables, so the earlier migrations (written for the
-- old defaults, then narrowed with `revoke`) left signed-in readers unable to
-- read anything but their wishlist. Row level security still decides WHICH rows;
-- these grants decide whether a role may touch the table (and which columns).
--
-- Least privilege: exactly what the app does through the Data API.
--   * Signed-out visitors (anon): no table access. The landing shelf reads
--     through public.public_shelf(), which has its own grant.
--   * Anything that moves credits or changes a request goes through security
--     definer functions, so those tables are read-only for readers.
--   * Writes name their columns, so readers can't set ids or created_at (a
--     copy dated 2100 would sit first on the shelf forever).
--   * feedback, reports and credit_balances: no access (functions only / unused).
--   * service_role: not used by the app; decide when something needs it.
-- Safe to run more than once (revoke all also clears column grants).

revoke all on public.app_settings, public.blocks, public.books, public.copies, public.credit_balances,
  public.credit_ledger, public.feedback, public.handover_ratings, public.loan_extensions, public.meetups,
  public.profile_contacts, public.profiles, public.reports, public.requests, public.wishlist
  from anon, authenticated;

-- Read-only for signed-in readers (RLS limits rows).
grant select on public.app_settings, public.credit_ledger, public.handover_ratings, public.loan_extensions,
  public.meetups, public.requests to authenticated;

-- Profile: read; create and edit your own name and area (the upsert also sets id).
grant select on public.profiles to authenticated;
grant insert (id, display_name, area), update (id, display_name, area) on public.profiles to authenticated;

-- Private WhatsApp contact: read and save your own (RLS).
grant select on public.profile_contacts to authenticated;
grant insert (id, whatsapp), update (id, whatsapp) on public.profile_contacts to authenticated;

-- Books (title metadata by ISBN): read, and add a new one when listing a copy
-- (insert ... on conflict do nothing; there is no update policy).
grant select on public.books to authenticated;
grant insert (isbn, title, authors, cover_url, published_year) on public.books to authenticated;

-- Copies: read; list one; edit only these columns of your own (RLS + copies_guard).
grant select on public.copies to authenticated;
grant insert (owner_id, isbn, mode, lend_max, condition, note) on public.copies to authenticated;
grant update (condition, lend_max, note, status) on public.copies to authenticated;

-- Blocks: see and remove your own; blocking itself goes through block_reader().
grant select, delete on public.blocks to authenticated;

-- Wishlist: see, add and remove your own.
grant select, delete on public.wishlist to authenticated;
grant insert (user_id, isbn) on public.wishlist to authenticated;
