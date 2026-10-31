-- Trust and feedback (docs/user-flow.md, step 12 and "Trust" / "Feedback"):
-- a thumbs up or down after a handover, reporting a problem, blocking a
-- reader, and a feedback box. Reports and feedback are read by the pilot team
-- in the Supabase dashboard; readers can't read them back.

-- ---------------------------------------------------------------- ratings
create table public.handover_ratings (
  request_id uuid not null references public.requests (id),
  rater_id uuid not null references public.profiles (id),
  ratee_id uuid not null references public.profiles (id),
  thumbs_up boolean not null,
  created_at timestamptz not null default now(),
  primary key (request_id, rater_id),
  constraint not_yourself check (rater_id <> ratee_id)
);
create index handover_ratings_ratee_idx on public.handover_ratings (ratee_id) where thumbs_up;
alter table public.handover_ratings enable row level security;
create policy "see ratings you gave" on public.handover_ratings for select to authenticated using (rater_id = (select auth.uid()));
revoke insert, update, delete, truncate on public.handover_ratings from anon, authenticated;

-- Rate the other reader once the book has changed hands. Once per request; can be changed.
create function public.rate_handover(p_request uuid, p_up boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := public.require_user();
  r public.requests;
begin
  if p_up is null then raise exception 'thumbs up or down' using errcode = 'null_value_not_allowed', hint = 'bayu'; end if;
  select * into r from public.requests where id = p_request;
  if not found or me not in (r.requester_id, r.owner_id) then
    raise exception 'request not found' using errcode = 'no_data_found', hint = 'bayu';
  end if;
  if r.status not in ('handed_over', 'on_loan', 'returned', 'forfeited') then
    raise exception 'you can rate a handover once the book has changed hands' using errcode = 'check_violation', hint = 'bayu';
  end if;
  insert into public.handover_ratings (request_id, rater_id, ratee_id, thumbs_up)
  values (p_request, me, case when me = r.owner_id then r.requester_id else r.owner_id end, p_up)
  on conflict (request_id, rater_id) do update set thumbs_up = excluded.thumbs_up, created_at = now();
end $$;

-- "N smooth handovers": thumbs up received. A count only (who gave them stays private).
create function public.smooth_handovers(p_user uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.handover_ratings where ratee_id = p_user and thumbs_up
$$;

-- ---------------------------------------------------------------- blocks
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint not_yourself check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
create policy "see who you blocked" on public.blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy "unblock" on public.blocks for delete to authenticated using (blocker_id = (select auth.uid()));
revoke insert, update, truncate on public.blocks from anon, authenticated;
revoke all on public.blocks from anon;

-- Block a reader: no new requests either way, and open requests between you are cancelled.
create function public.block_reader(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := public.require_user();
begin
  if p_user is null or p_user = me or not exists (select 1 from public.profiles where id = p_user) then
    raise exception 'reader not found' using errcode = 'no_data_found', hint = 'bayu';
  end if;
  insert into public.blocks (blocker_id, blocked_id) values (me, p_user) on conflict do nothing;
  update public.requests set status = 'cancelled', updated_at = now()
   where status in ('requested', 'accepted')
     and ((requester_id = me and owner_id = p_user) or (requester_id = p_user and owner_id = me));
end $$;

-- Requests between readers where either has blocked the other are refused.
create function public.requests_respect_blocks() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.blocks
    where (blocker_id = new.owner_id and blocked_id = new.requester_id)
       or (blocker_id = new.requester_id and blocked_id = new.owner_id)
  ) then
    raise exception 'you can''t request books from this reader' using errcode = 'check_violation', hint = 'bayu';
  end if;
  return new;
end $$;
create trigger requests_respect_blocks before insert on public.requests
  for each row execute function public.requests_respect_blocks();

-- ---------------------------------------------------------------- reports and feedback
create table public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles (id),
  reported_id uuid references public.profiles (id),
  request_id uuid references public.requests (id),
  reason text not null check (char_length(btrim(reason)) between 5 and 2000),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;

create table public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id),
  message text not null check (char_length(btrim(message)) between 3 and 2000),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;

-- Report a problem, optionally about a request (and so about the other reader in it).
create function public.report_problem(p_reason text, p_request uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := public.require_user();
  r public.requests;
  other uuid;
begin
  if char_length(btrim(coalesce(p_reason, ''))) not between 5 and 2000 then
    raise exception 'tell us what happened (5 to 2000 characters)' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if p_request is not null then
    select * into r from public.requests where id = p_request;
    if not found or me not in (r.requester_id, r.owner_id) then
      raise exception 'request not found' using errcode = 'no_data_found', hint = 'bayu';
    end if;
    other := case when me = r.owner_id then r.requester_id else r.owner_id end;
  end if;
  if (select count(*) from public.reports where reporter_id = me and created_at > now() - interval '1 day') >= 10 then
    raise exception 'that''s a lot of reports today: message the pilot team instead' using errcode = 'check_violation', hint = 'bayu';
  end if;
  insert into public.reports (reporter_id, reported_id, request_id, reason) values (me, other, p_request, btrim(p_reason));
end $$;

create function public.send_feedback(p_message text) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := public.require_user();
begin
  if char_length(btrim(coalesce(p_message, ''))) not between 3 and 2000 then
    raise exception 'write a few words (up to 2000 characters)' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if (select count(*) from public.feedback where user_id = me and created_at > now() - interval '1 day') >= 20 then
    raise exception 'thanks! that''s plenty for today' using errcode = 'check_violation', hint = 'bayu';
  end if;
  insert into public.feedback (user_id, message) values (me, btrim(p_message));
end $$;

-- New functions are executable by PUBLIC unless revoked explicitly.
revoke execute on function public.rate_handover(uuid, boolean), public.smooth_handovers(uuid), public.block_reader(uuid),
  public.requests_respect_blocks(), public.report_problem(text, uuid), public.send_feedback(text) from public, anon;
grant execute on function public.rate_handover(uuid, boolean), public.smooth_handovers(uuid), public.block_reader(uuid),
  public.report_problem(text, uuid), public.send_feedback(text) to authenticated;
