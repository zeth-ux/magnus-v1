-- Bayu core schema: profiles, books, copies, requests and the credit ledger.
-- Rules: docs/decisions/003-credit-system.md (R1-R9). Proposed rules R10-R13
-- are NOT implemented here; they wait for Zarith's approval.
--
-- Errors meant for readers are raised with hint = 'bayu'; the app shows their
-- message and hides every other database error.
--
-- Security model
-- * Every table has row level security on.
-- * People read what they need and edit only their own rows.
-- * Every credit movement and every lifecycle step goes through a function
--   below (security definer, empty search_path, checks auth.uid()).
-- * The ledger is append-only: no UPDATE or DELETE, for anyone.


-- ---------------------------------------------------------------- settings
-- Pilot limits (R7), configurable without a code change.
create table public.app_settings (
  key text primary key,
  value integer not null check (value >= 0)
);
insert into public.app_settings (key, value) values
  ('max_open_requests', 3),
  ('max_active_borrows', 3),
  ('forfeit_grace_days', 14),
  ('max_flexible_lend_days', 183);

alter table public.app_settings enable row level security;
create policy "settings are readable" on public.app_settings for select to anon, authenticated using (true);

-- Fails closed: a missing key is an error, never a silently disabled limit.
create function public.setting(p_key text) returns integer
language plpgsql stable set search_path = '' as $$
declare v integer;
begin
  select value into strict v from public.app_settings where key = p_key;
  return v;
exception when no_data_found then
  raise exception 'missing app setting %', p_key;
end $$;

-- Dates are the pilot's local dates (Ansan), not UTC.
create function public.today() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'Asia/Seoul')::date
$$;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  area text not null check (char_length(btrim(area)) between 1 and 40),
  created_at timestamptz not null default now()
);

-- WhatsApp numbers live apart so the public profile never carries them.
-- Only the owner reads their own; sharing after an accepted request comes
-- with R13 once approved.
create table public.profile_contacts (
  id uuid primary key references public.profiles (id) on delete cascade,
  whatsapp text check (whatsapp ~ '^\+[1-9][0-9]{7,14}$')
);

alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;

create policy "signed-in readers see profiles" on public.profiles for select to authenticated using (true);
create policy "make your own profile" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "edit your own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "read your own contact" on public.profile_contacts for select to authenticated using (id = (select auth.uid()));
create policy "add your own contact" on public.profile_contacts for insert to authenticated with check (id = (select auth.uid()));
create policy "edit your own contact" on public.profile_contacts for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------------------------------------------------------------- books
-- Title metadata, one row per ISBN-13 (ISBN-10s are converted in the app).
create table public.books (
  isbn text primary key check (isbn ~ '^97[89][0-9]{10}$'),
  title text not null check (char_length(btrim(title)) between 1 and 300),
  authors text[] not null default '{}' check (cardinality(authors) <= 10),
  -- Only the lookup services' image hosts, so a cover can't be a tracking pixel.
  cover_url text check (
    cover_url is null
    or cover_url ~ '^https://(books\.google\.com|books\.googleusercontent\.com|covers\.openlibrary\.org)/'
  ),
  published_year integer check (published_year is null or published_year between 1450 and 2100),
  created_at timestamptz not null default now()
);

alter table public.books enable row level security;
create policy "books are readable" on public.books for select to anon, authenticated using (true);
create policy "signed-in readers add books" on public.books for insert to authenticated with check (true);

-- ---------------------------------------------------------------- copies
create type public.copy_mode as enum ('give', 'lend');
-- withdrawn: taken off the shelf by its owner (copies are never deleted, so
-- their request history stays intact).
create type public.copy_status as enum ('available', 'paused', 'on_loan', 'withdrawn');
create type public.lend_max as enum ('2_weeks', '4_weeks', '2_months', 'flexible');
create type public.copy_condition as enum ('like_new', 'good', 'worn');

create table public.copies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  isbn text not null references public.books (isbn),
  mode public.copy_mode not null,
  lend_max public.lend_max,
  condition public.copy_condition not null default 'good',
  note text check (note is null or char_length(note) <= 280),
  status public.copy_status not null default 'available',
  created_at timestamptz not null default now(),
  constraint lend_has_max check ((mode = 'lend') = (lend_max is not null))
);
create index copies_owner_idx on public.copies (owner_id);
create index copies_isbn_idx on public.copies (isbn);
create index copies_status_idx on public.copies (status);

alter table public.copies enable row level security;
create policy "signed-in readers see copies" on public.copies for select to authenticated using (true);
create policy "list your own copies" on public.copies for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'available');
create policy "edit your own copies" on public.copies for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
-- Owners may only change these columns; everything else goes through functions.
revoke update, delete, truncate on public.copies from anon, authenticated;
grant update (note, condition, lend_max, status) on public.copies to authenticated;

-- Owners may pause and unpause a copy (and edit the columns granted above).
-- Lending, giving and withdrawing happen in the functions below, which run as
-- the table owner, so this check only applies to signed-in users' own updates.
create function public.copies_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user <> 'authenticated' then
    return new;
  end if;
  if new.status <> old.status
     and not (old.status in ('available', 'paused') and new.status in ('available', 'paused')) then
    raise exception 'a copy can only be paused or made available by its owner' using errcode = 'check_violation', hint = 'bayu';
  end if;
  return new;
end $$;
create trigger copies_guard before update on public.copies for each row execute function public.copies_guard();

-- ---------------------------------------------------------------- credit ledger
create type public.ledger_kind as enum ('starter_grant', 'give_transfer', 'lend_lock', 'lend_unlock', 'lend_forfeit');

-- Every credit movement is a row. balance = sum(delta), locked = sum(locked_delta),
-- available = balance - locked (R6: never below 0).
create table public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id),
  kind public.ledger_kind not null,
  delta integer not null check (delta between -1 and 1),
  locked_delta integer not null default 0 check (locked_delta between -1 and 1),
  -- The request (or, for a starter grant, the first copy) that caused the move.
  ref_id uuid not null,
  created_at timestamptz not null default now(),
  -- Each kind can only move credits the way ADR 003 says.
  constraint ledger_kind_amounts check (
    (kind = 'starter_grant' and delta = 1 and locked_delta = 0)
    or (kind = 'give_transfer' and delta in (-1, 1) and locked_delta = 0)
    or (kind = 'lend_lock' and delta = 0 and locked_delta = 1)
    or (kind = 'lend_unlock' and delta = 0 and locked_delta = -1)
    or (kind = 'lend_forfeit' and ((delta = -1 and locked_delta = -1) or (delta = 1 and locked_delta = 0)))
  )
);
-- Idempotency: the same event can never move the same person's credits twice.
create unique index credit_ledger_once on public.credit_ledger (ref_id, kind, user_id);
-- R5: one starter credit per account, ever.
create unique index credit_ledger_one_starter on public.credit_ledger (user_id) where kind = 'starter_grant';
create index credit_ledger_user_idx on public.credit_ledger (user_id);

alter table public.credit_ledger enable row level security;
create policy "read your own ledger" on public.credit_ledger for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete, truncate on public.credit_ledger from anon, authenticated;

-- Append-only, for everyone (including functions and the service role).
create function public.ledger_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'the credit ledger is append-only' using errcode = 'insufficient_privilege', hint = 'bayu';
end $$;
create trigger ledger_no_update before update or delete on public.credit_ledger
  for each row execute function public.ledger_append_only();
create trigger ledger_no_truncate before truncate on public.credit_ledger
  for each statement execute function public.ledger_append_only();

create view public.credit_balances with (security_invoker = true) as
  select user_id,
         coalesce(sum(delta), 0)::integer as balance,
         coalesce(sum(locked_delta), 0)::integer as locked,
         (coalesce(sum(delta), 0) - coalesce(sum(locked_delta), 0))::integer as available
  from public.credit_ledger
  group by user_id;

-- Balance for one person. Callers that are about to spend must hold the
-- person's row lock first (lock_person).
create function public.credits_of(p_user uuid, out balance integer, out locked integer, out available integer)
language sql stable set search_path = '' as $$
  select coalesce(sum(delta), 0)::integer,
         coalesce(sum(locked_delta), 0)::integer,
         (coalesce(sum(delta), 0) - coalesce(sum(locked_delta), 0))::integer
  from public.credit_ledger where user_id = p_user
$$;

-- Serialise every credit decision about one person (no overspending when two
-- requests land at the same moment).
create function public.lock_person(p_user uuid) returns void
language plpgsql set search_path = '' as $$
begin
  -- NO KEY UPDATE: serialises credit decisions without blocking the foreign-key
  -- checks other transactions make against this profile (no deadlocks).
  perform 1 from public.profiles where id = p_user for no key update;
  if not found then
    raise exception 'no profile for this account' using errcode = 'no_data_found', hint = 'bayu';
  end if;
end $$;

-- R5: the starter credit, granted with the first listed copy. Idempotent.
create function public.grant_starter_on_first_copy() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.credit_ledger (user_id, kind, delta, ref_id)
  values (new.owner_id, 'starter_grant', 1, new.id)
  on conflict do nothing;
  return new;
end $$;
create trigger copies_starter_grant after insert on public.copies
  for each row execute function public.grant_starter_on_first_copy();

-- ---------------------------------------------------------------- requests
create type public.request_status as enum (
  'requested', 'accepted', 'declined', 'cancelled', 'handed_over', 'on_loan', 'returned', 'forfeited'
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  copy_id uuid not null references public.copies (id),
  requester_id uuid not null references public.profiles (id),
  owner_id uuid not null references public.profiles (id),
  mode public.copy_mode not null,
  status public.request_status not null default 'requested',
  return_by date,
  owner_handed_over boolean not null default false,
  requester_received boolean not null default false,
  owner_got_back boolean not null default false,
  requester_returned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint not_your_own check (requester_id <> owner_id),
  constraint lend_has_date check ((mode = 'lend') = (return_by is not null))
);
create index requests_requester_idx on public.requests (requester_id, status);
create index requests_owner_idx on public.requests (owner_id, status);
create index requests_copy_idx on public.requests (copy_id, status);
-- A copy is promised to one reader at a time.
create unique index requests_one_active_per_copy on public.requests (copy_id) where status in ('accepted', 'on_loan');

alter table public.requests enable row level security;
create policy "see requests you are part of" on public.requests for select to authenticated
  using ((select auth.uid()) in (requester_id, owner_id));
revoke insert, update, delete, truncate on public.requests from anon, authenticated;
revoke update, delete, truncate on public.profiles, public.profile_contacts, public.books, public.app_settings from anon;
revoke truncate, delete on public.profiles, public.profile_contacts, public.books, public.app_settings from authenticated;
revoke insert, update on public.app_settings from anon, authenticated;

-- Helpers ---------------------------------------------------------------
create function public.require_user() returns uuid
language plpgsql stable set search_path = '' as $$
declare v uuid := auth.uid();
begin
  if v is null then
    raise exception 'sign in first' using errcode = 'insufficient_privilege', hint = 'bayu';
  end if;
  return v;
end $$;

create function public.lend_max_days(p public.lend_max) returns integer
language sql stable set search_path = '' as $$
  select case p when '2_weeks' then 14 when '4_weeks' then 28 when '2_months' then 61
                else public.setting('max_flexible_lend_days') end
$$;

-- Lifecycle -------------------------------------------------------------

-- Request a copy. R6 (an available credit), R7 (limits).
create function public.request_copy(p_copy uuid, p_return_by date default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := public.require_user();
  c public.copies;
  open_count integer;
  borrow_count integer;
  new_id uuid;
begin
  perform public.lock_person(me);
  select * into c from public.copies where id = p_copy for update;
  if not found then raise exception 'that book is no longer listed' using errcode = 'no_data_found', hint = 'bayu'; end if;
  if c.owner_id = me then raise exception 'that is your own book' using errcode = 'check_violation', hint = 'bayu'; end if;
  if c.status <> 'available' then raise exception 'that book is not available right now' using errcode = 'check_violation', hint = 'bayu'; end if;
  if exists (select 1 from public.requests where copy_id = p_copy and requester_id = me and status in ('requested', 'accepted')) then
    raise exception 'you already asked for this book' using errcode = 'unique_violation', hint = 'bayu';
  end if;

  if (public.credits_of(me)).available < 1 then
    raise exception 'you need 1 available credit: list a book first' using errcode = 'check_violation', hint = 'bayu';
  end if;

  select count(*) into open_count from public.requests where requester_id = me and status in ('requested', 'accepted');
  if open_count >= public.setting('max_open_requests') then
    raise exception 'you already have % open requests', open_count using errcode = 'check_violation', hint = 'bayu';
  end if;

  if c.mode = 'lend' then
    select count(*) into borrow_count from public.requests where requester_id = me and status = 'on_loan';
    if borrow_count >= public.setting('max_active_borrows') then
      raise exception 'you are already borrowing % books', borrow_count using errcode = 'check_violation', hint = 'bayu';
    end if;
    if p_return_by is null or p_return_by <= public.today() then
      raise exception 'pick a return date after today' using errcode = 'check_violation', hint = 'bayu';
    end if;
    if p_return_by > public.today() + public.lend_max_days(c.lend_max) then
      raise exception 'that return date is later than the owner allows' using errcode = 'check_violation', hint = 'bayu';
    end if;
  else
    p_return_by := null;
  end if;

  insert into public.requests (copy_id, requester_id, owner_id, mode, return_by)
  values (c.id, me, c.owner_id, c.mode, p_return_by)
  returning id into new_id;
  return new_id;
end $$;

-- The owner accepts or declines. One accepted reader per copy at a time.
-- (R10, holding a credit on accept, is proposed, not built.)
create function public.respond_request(p_request uuid, p_accept boolean) returns public.request_status
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := public.require_user();
  r public.requests;
  c public.copies;
begin
  if p_accept is null then raise exception 'accept or decline' using errcode = 'null_value_not_allowed', hint = 'bayu'; end if;
  select * into r from public.requests where id = p_request for update;
  if not found or r.owner_id <> me then raise exception 'request not found' using errcode = 'no_data_found', hint = 'bayu'; end if;
  if r.status = 'accepted' and p_accept then return r.status; end if;   -- idempotent
  if r.status = 'declined' and not p_accept then return r.status; end if;
  if r.status <> 'requested' then
    raise exception 'this request was already answered' using errcode = 'check_violation', hint = 'bayu';
  end if;

  if p_accept then
    select * into c from public.copies where id = r.copy_id for update;
    if c.owner_id <> me or c.status <> 'available' then
      raise exception 'this book is not available any more' using errcode = 'check_violation', hint = 'bayu';
    end if;
    if exists (select 1 from public.requests where copy_id = r.copy_id and status in ('accepted', 'on_loan')) then
      raise exception 'you already accepted another reader for this book' using errcode = 'check_violation', hint = 'bayu';
    end if;
  end if;

  update public.requests set status = case when p_accept then 'accepted'::public.request_status else 'declined'::public.request_status end,
         updated_at = now()
   where id = p_request returning status into r.status;
  return r.status;
end $$;

-- Either side can step out before the handover.
create function public.cancel_request(p_request uuid) returns public.request_status
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := public.require_user();
  r public.requests;
begin
  select * into r from public.requests where id = p_request for update;
  if not found or me not in (r.requester_id, r.owner_id) then raise exception 'request not found' using errcode = 'no_data_found', hint = 'bayu'; end if;
  if r.status = 'cancelled' then return r.status; end if;
  if r.status not in ('requested', 'accepted') then
    raise exception 'this request can no longer be cancelled' using errcode = 'check_violation', hint = 'bayu';
  end if;
  update public.requests set status = 'cancelled', updated_at = now() where id = p_request;
  return 'cancelled';
end $$;

-- R1-R3: each person taps their side of the handover. When both have, the
-- credits move once (give: transfer and ownership; lend: lock the deposit).
create function public.confirm_handover(p_request uuid) returns public.request_status
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := public.require_user();
  r public.requests;
begin
  select * into r from public.requests where id = p_request;
  if not found or me not in (r.requester_id, r.owner_id) then raise exception 'request not found' using errcode = 'no_data_found', hint = 'bayu'; end if;

  -- Lock both people in a fixed order (no deadlocks), then the request.
  perform public.lock_person(least(r.requester_id, r.owner_id));
  perform public.lock_person(greatest(r.requester_id, r.owner_id));
  select * into r from public.requests where id = p_request for update;

  if r.status in ('handed_over', 'on_loan', 'returned', 'forfeited') then return r.status; end if; -- idempotent
  if r.status <> 'accepted' then raise exception 'the owner has to accept first' using errcode = 'check_violation', hint = 'bayu'; end if;

  if me = r.owner_id then r.owner_handed_over := true; else r.requester_received := true; end if;
  update public.requests set owner_handed_over = r.owner_handed_over, requester_received = r.requester_received, updated_at = now()
   where id = p_request;

  if not (r.owner_handed_over and r.requester_received) then
    return r.status;
  end if;

  if (public.credits_of(r.requester_id)).available < 1 then
    raise exception 'the reader taking the book has no available credit' using errcode = 'check_violation', hint = 'bayu';
  end if;
  -- The copy must still be the owner's and on the shelf.
  if not exists (select 1 from public.copies where id = r.copy_id and owner_id = r.owner_id and status in ('available', 'paused') for update) then
    raise exception 'this book is not available any more' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if r.mode = 'lend' then
    -- R7 at the moment it matters: requests made earlier can't stack past the limit.
    if (select count(*) from public.requests where requester_id = r.requester_id and status = 'on_loan')
       >= public.setting('max_active_borrows') then
      raise exception 'you are already borrowing the most books allowed at once' using errcode = 'check_violation', hint = 'bayu';
    end if;
    if r.return_by <= public.today() then
      raise exception 'the return date has passed: agree a new date and request again' using errcode = 'check_violation', hint = 'bayu';
    end if;
  end if;

  if r.mode = 'give' then
    -- R2: giver +1, receiver -1, ownership moves.
    insert into public.credit_ledger (user_id, kind, delta, ref_id) values
      (r.owner_id, 'give_transfer', 1, r.id),
      (r.requester_id, 'give_transfer', -1, r.id);
    update public.copies set owner_id = r.requester_id, status = 'paused' where id = r.copy_id;
    update public.requests set status = 'handed_over', updated_at = now() where id = p_request;
    r.status := 'handed_over';
  else
    -- R3: one of the borrower's credits is locked as a deposit.
    insert into public.credit_ledger (user_id, kind, delta, locked_delta, ref_id)
      values (r.requester_id, 'lend_lock', 0, 1, r.id);
    update public.copies set status = 'on_loan' where id = r.copy_id;
    update public.requests set status = 'on_loan', updated_at = now() where id = p_request;
    r.status := 'on_loan';
  end if;

  -- Other open requests for this copy can't happen any more.
  update public.requests set status = 'cancelled', updated_at = now()
   where copy_id = r.copy_id and id <> r.id and status in ('requested', 'accepted');
  return r.status;
end $$;

-- R3: both confirm the book came back; the deposit unlocks.
create function public.confirm_return(p_request uuid) returns public.request_status
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := public.require_user();
  r public.requests;
begin
  select * into r from public.requests where id = p_request;
  if not found or me not in (r.requester_id, r.owner_id) then raise exception 'request not found' using errcode = 'no_data_found', hint = 'bayu'; end if;
  perform public.lock_person(r.requester_id);
  select * into r from public.requests where id = p_request for update;

  if r.status in ('returned', 'forfeited') then return r.status; end if; -- idempotent
  if r.status <> 'on_loan' then raise exception 'this book is not on loan' using errcode = 'check_violation', hint = 'bayu'; end if;

  if me = r.owner_id then r.owner_got_back := true; else r.requester_returned := true; end if;
  update public.requests set owner_got_back = r.owner_got_back, requester_returned = r.requester_returned, updated_at = now()
   where id = p_request;
  if not (r.owner_got_back and r.requester_returned) then return r.status; end if;

  insert into public.credit_ledger (user_id, kind, delta, locked_delta, ref_id)
    values (r.requester_id, 'lend_unlock', 0, -1, r.id);
  update public.copies set status = 'available' where id = r.copy_id;
  update public.requests set status = 'returned', updated_at = now() where id = p_request;
  return 'returned';
end $$;

-- R4: after the due date plus the grace period, the lender can report a book
-- that never came back. The deposit moves to the lender and the loan becomes a give.
create function public.report_not_returned(p_request uuid) returns public.request_status
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := public.require_user();
  r public.requests;
begin
  select * into r from public.requests where id = p_request;
  if not found or me <> r.owner_id then raise exception 'request not found' using errcode = 'no_data_found', hint = 'bayu'; end if;
  perform public.lock_person(least(r.requester_id, r.owner_id));
  perform public.lock_person(greatest(r.requester_id, r.owner_id));
  select * into r from public.requests where id = p_request for update;

  if r.status = 'forfeited' then return r.status; end if; -- idempotent
  if r.status <> 'on_loan' then raise exception 'this book is not on loan' using errcode = 'check_violation', hint = 'bayu'; end if;
  if r.requester_returned then
    -- The reader says they gave it back: this needs a person to look at it, not an automatic forfeit.
    raise exception 'the reader says this book was returned: confirm the return, or contact the pilot team' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if public.today() <= r.return_by + public.setting('forfeit_grace_days') then
    raise exception 'you can report it after %', r.return_by + public.setting('forfeit_grace_days') using errcode = 'check_violation', hint = 'bayu';
  end if;

  insert into public.credit_ledger (user_id, kind, delta, locked_delta, ref_id) values
    (r.requester_id, 'lend_forfeit', -1, -1, r.id),
    (r.owner_id, 'lend_forfeit', 1, 0, r.id);
  update public.copies set owner_id = r.requester_id, status = 'paused' where id = r.copy_id;
  update public.requests set status = 'forfeited', updated_at = now() where id = p_request;
  return 'forfeited';
end $$;

-- Take a copy off the shelf. Open requests for it are cancelled. Copies are
-- never deleted, so request and credit history stay intact.
create function public.withdraw_copy(p_copy uuid) returns public.copy_status
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := public.require_user();
  c public.copies;
begin
  select * into c from public.copies where id = p_copy for update;
  if not found or c.owner_id <> me then raise exception 'book not found' using errcode = 'no_data_found', hint = 'bayu'; end if;
  if c.status = 'withdrawn' then return c.status; end if;
  if c.status = 'on_loan' then raise exception 'this book is on loan: wait until it is back' using errcode = 'check_violation', hint = 'bayu'; end if;
  update public.requests set status = 'cancelled', updated_at = now()
   where copy_id = p_copy and status in ('requested', 'accepted');
  update public.copies set status = 'withdrawn' where id = p_copy;
  return 'withdrawn';
end $$;

-- My credits (for the library card).
create function public.my_credits(out balance integer, out locked integer, out available integer)
language sql stable security definer set search_path = '' as $$
  select * from public.credits_of(public.require_user())
$$;

-- Only signed-in people can run the lifecycle; nobody calls the internals directly.
revoke execute on all functions in schema public from public, anon;
grant execute on function public.request_copy(uuid, date), public.respond_request(uuid, boolean),
  public.cancel_request(uuid), public.confirm_handover(uuid), public.confirm_return(uuid),
  public.report_not_returned(uuid), public.withdraw_copy(uuid), public.my_credits(),
  public.setting(text), public.today() to authenticated;
revoke execute on function public.lock_person(uuid), public.credits_of(uuid) from authenticated;

-- Functions added by later migrations are not executable by default; each
-- migration grants what it means to expose.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
