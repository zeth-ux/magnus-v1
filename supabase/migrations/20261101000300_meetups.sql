-- Meet-up cards (docs/user-flow.md, step 9). On an accepted request (or a
-- loan, for the return), either person proposes a place and time; the other
-- taps "Sounds good" or proposes something else. One live card per request.

create type public.meetup_status as enum ('proposed', 'agreed', 'replaced');
-- A card is either for the handover (accepted request) or for returning a lent
-- book (on loan): an agreed handover card never turns into a return card.
create type public.meetup_purpose as enum ('handover', 'return');

create table public.meetups (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id),
  purpose public.meetup_purpose not null,
  proposed_by uuid not null references public.profiles (id),
  place text not null check (char_length(btrim(place)) between 2 and 80),
  meet_at timestamptz not null,
  note text check (note is null or char_length(note) <= 200),
  status public.meetup_status not null default 'proposed',
  created_at timestamptz not null default now()
);
-- Also serves every lookup by request.
create unique index meetups_one_live_per_request on public.meetups (request_id) where status in ('proposed', 'agreed');

alter table public.meetups enable row level security;
create policy "see meet-ups for your requests" on public.meetups for select to authenticated
  using (exists (
    select 1 from public.requests r
    where r.id = meetups.request_id and (select auth.uid()) in (r.requester_id, r.owner_id)
  ));
revoke insert, update, delete, truncate on public.meetups from anon, authenticated;

-- Propose (or re-propose) a place and time. Replaces the live card, if any.
create function public.propose_meetup(p_request uuid, p_place text, p_at timestamptz, p_note text default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := public.require_user();
  r public.requests;
  new_id uuid;
begin
  select * into r from public.requests where id = p_request for update;
  if not found or me not in (r.requester_id, r.owner_id) then
    raise exception 'request not found' using errcode = 'no_data_found', hint = 'bayu';
  end if;
  if r.status not in ('accepted', 'on_loan') then
    raise exception 'meet-ups are for accepted requests and books on loan' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if char_length(btrim(coalesce(p_place, ''))) not between 2 and 80 then
    raise exception 'say where to meet (2 to 80 characters)' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if p_at is null or p_at <= now() then
    raise exception 'pick a time in the future' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if p_at > now() + interval '60 days' then
    raise exception 'pick a time in the next 60 days' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if p_note is not null and char_length(p_note) > 200 then
    raise exception 'keep the note to 200 characters' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if (select count(*) from public.meetups where request_id = p_request) >= 20 then
    raise exception 'that is a lot of suggestions: agree one of them, or talk it through' using errcode = 'check_violation', hint = 'bayu';
  end if;

  update public.meetups set status = 'replaced' where request_id = p_request and status in ('proposed', 'agreed');
  insert into public.meetups (request_id, purpose, proposed_by, place, meet_at, note)
  values (p_request, case when r.status = 'accepted' then 'handover' else 'return' end::public.meetup_purpose,
          me, btrim(p_place), p_at, nullif(btrim(coalesce(p_note, '')), ''))
  returning id into new_id;
  return new_id;
end $$;

-- The other person agrees. Idempotent. Locks the request, then the card
-- (the same order as propose_meetup, so the two can't deadlock).
create function public.agree_meetup(p_meetup uuid) returns public.meetup_status
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := public.require_user();
  req uuid;
  m public.meetups;
  r public.requests;
begin
  select request_id into req from public.meetups where id = p_meetup;
  if found then select * into r from public.requests where id = req for update; end if;
  if not found or me not in (r.requester_id, r.owner_id) then
    raise exception 'meet-up not found' using errcode = 'no_data_found', hint = 'bayu';
  end if;
  select * into m from public.meetups where id = p_meetup for update;
  if m.status = 'agreed' then return m.status; end if;
  if m.status <> 'proposed' then
    raise exception 'this meet-up was changed: look at the newest one' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if m.proposed_by = me then
    raise exception 'the other reader needs to agree to your suggestion' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if r.status not in ('accepted', 'on_loan')
     or m.purpose <> (case when r.status = 'accepted' then 'handover' else 'return' end)::public.meetup_purpose then
    raise exception 'this suggestion is out of date: suggest a new one' using errcode = 'check_violation', hint = 'bayu';
  end if;
  if m.meet_at <= now() then
    raise exception 'that time has passed: suggest another' using errcode = 'check_violation', hint = 'bayu';
  end if;
  update public.meetups set status = 'agreed' where id = p_meetup;
  return 'agreed';
end $$;

-- New functions are executable by PUBLIC unless revoked explicitly.
revoke execute on function public.propose_meetup(uuid, text, timestamptz, text), public.agree_meetup(uuid) from public, anon;
grant execute on function public.propose_meetup(uuid, text, timestamptz, text), public.agree_meetup(uuid) to authenticated;
