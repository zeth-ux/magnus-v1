-- Loan extensions (ADR 003, "Lending"): the borrower asks for more time and
-- the lender approves or declines. Approving moves the request's due date
-- (return_by), so R4 (report not returned after due + grace) moves with it.
-- No credits move here: the held credit simply stays held for longer.
-- (Named loan_extensions: every Supabase project already has an "extensions" schema.)

-- 'closed': the loan ended or its return started before anyone answered.
create type public.loan_extension_status as enum ('asked', 'approved', 'declined', 'replaced', 'closed');

create table public.loan_extensions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id),
  asked_by uuid not null references public.profiles (id),
  old_return_by date not null,
  new_return_by date not null,
  status public.loan_extension_status not null default 'asked',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint later_date check (new_return_by > old_return_by)
);
-- At most one open ask per loan (a backstop if a code path forgets).
create unique index loan_extensions_one_open_per_request on public.loan_extensions (request_id) where status = 'asked';
-- Serves the per-loan count and the Activity lookup.
create index loan_extensions_request_idx on public.loan_extensions (request_id);
create index loan_extensions_asked_by_idx on public.loan_extensions (asked_by);

alter table public.loan_extensions enable row level security;
create policy "see extensions for your loans" on public.loan_extensions for select to authenticated
  using (exists (
    select 1 from public.requests r
    where r.id = loan_extensions.request_id and (select auth.uid()) in (r.requester_id, r.owner_id)
  ));
revoke insert, update, delete, truncate on public.loan_extensions from anon, authenticated;
revoke all on public.loan_extensions from anon;

-- The borrower asks to keep the book until p_new_date. Asking again replaces
-- an open ask; asking for the same date again is a no-op (a double tap doesn't
-- use up an ask). The new date must be after the due date and after today, and
-- at most the copy's lend period from today (the same limit as a new request).
-- At most 5 asks per loan.
create function public.ask_extension(p_request uuid, p_new_date date) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := public.require_user();
  r public.requests;
  open_ask public.loan_extensions;
  max_days integer;
  new_id uuid;
begin
  select * into r from public.requests where id = p_request;
  if not found or me not in (r.requester_id, r.owner_id) then
    raise exception 'request not found' using errcode = 'no_data_found', hint = 'bayu';
  end if;
  -- Both people, then the request: the same order as confirm_handover and report_not_returned.
  perform public.lock_person(least(r.requester_id, r.owner_id));
  perform public.lock_person(greatest(r.requester_id, r.owner_id));
  select * into r from public.requests where id = p_request for update;

  if me <> r.requester_id then
    raise exception 'only the reader borrowing the book can ask for more time' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if r.status <> 'on_loan' or r.mode <> 'lend' then
    raise exception 'you can ask for more time only while you are borrowing the book' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if r.requester_returned or r.owner_got_back then
    raise exception 'this book is already being returned' using errcode = 'check_violation', hint = 'bayu';
  end if;

  select * into open_ask from public.loan_extensions where request_id = r.id and status = 'asked';
  if open_ask.id is not null and open_ask.new_return_by = p_new_date then
    return open_ask.id; -- idempotent
  end if;

  if p_new_date is null or p_new_date <= r.return_by then
    raise exception 'pick a date after the current due date (%)', to_char(r.return_by, 'FMDD Mon') using errcode = 'check_violation', hint = 'bayu';
  end if;
  if p_new_date <= public.today() then
    raise exception 'pick a date after today' using errcode = 'check_violation', hint = 'bayu';
  end if;
  select public.lend_max_days(c.lend_max) into max_days from public.copies c where c.id = r.copy_id;
  if p_new_date > public.today() + max_days then
    raise exception 'that is longer than the owner lends this book for (% days from today)', max_days using errcode = 'check_violation', hint = 'bayu';
  end if;
  if (select count(*) from public.loan_extensions where request_id = r.id) >= 5 then
    raise exception 'you''ve asked for more time on this book 5 times: talk to the owner' using errcode = 'check_violation', hint = 'bayu';
  end if;

  update public.loan_extensions set status = 'replaced', decided_at = now() where request_id = r.id and status = 'asked';
  insert into public.loan_extensions (request_id, asked_by, old_return_by, new_return_by)
    values (r.id, me, r.return_by, p_new_date)
    returning id into new_id;
  update public.requests set updated_at = now() where id = r.id;
  return new_id;
end $$;

-- The lender approves (the due date moves) or declines (it stays). Answering
-- the same way twice is fine.
create function public.answer_extension(p_extension uuid, p_approve boolean) returns public.loan_extension_status
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := public.require_user();
  e public.loan_extensions;
  r public.requests;
begin
  select * into e from public.loan_extensions where id = p_extension;
  if found then select * into r from public.requests where id = e.request_id; end if;
  if e.id is null or r.id is null or me not in (r.requester_id, r.owner_id) then
    raise exception 'request not found' using errcode = 'no_data_found', hint = 'bayu';
  end if;
  perform public.lock_person(least(r.requester_id, r.owner_id));
  perform public.lock_person(greatest(r.requester_id, r.owner_id));
  select * into r from public.requests where id = e.request_id for update;
  select * into e from public.loan_extensions where id = p_extension for update;

  if me <> r.owner_id then
    raise exception 'only the owner can answer this' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if p_approve is null then
    raise exception 'choose yes or no' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if e.status = 'approved' and p_approve then return e.status; end if;
  if e.status = 'declined' and not p_approve then return e.status; end if;
  if e.status = 'closed' or r.status <> 'on_loan' or r.requester_returned or r.owner_got_back then
    raise exception 'this book is already being returned' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if e.status <> 'asked' then
    raise exception 'that ask was changed: refresh to see the latest' using errcode = 'check_violation', hint = 'bayu';
  end if;

  if p_approve then
    if e.new_return_by <= public.today() then
      raise exception 'that date has already passed: ask the reader to pick a new one' using errcode = 'check_violation', hint = 'bayu';
    end if;
    update public.requests set return_by = e.new_return_by, updated_at = now() where id = r.id;
    update public.loan_extensions set status = 'approved', decided_at = now() where id = e.id;
    return 'approved';
  end if;
  update public.loan_extensions set status = 'declined', decided_at = now() where id = e.id;
  update public.requests set updated_at = now() where id = r.id;
  return 'declined';
end $$;

-- When a loan ends (returned, forfeited) or its return starts, an unanswered
-- ask is closed, so "asked" always means "waiting for the lender". A trigger
-- keeps this in one place instead of touching every lifecycle function.
create function public.close_open_extensions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status <> 'on_loan' or new.requester_returned or new.owner_got_back then
    update public.loan_extensions set status = 'closed', decided_at = now()
     where request_id = new.id and status = 'asked';
  end if;
  return null;
end $$;
create trigger requests_close_open_extensions after update of status, requester_returned, owner_got_back on public.requests
  for each row execute function public.close_open_extensions();

-- New functions are executable by PUBLIC unless revoked explicitly.
revoke execute on function public.ask_extension(uuid, date), public.answer_extension(uuid, boolean), public.close_open_extensions() from public, anon;
revoke execute on function public.close_open_extensions() from authenticated;
grant execute on function public.ask_extension(uuid, date), public.answer_extension(uuid, boolean) to authenticated;
