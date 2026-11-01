-- Deleting an account (ADR 003: "anonymise the profile instead of deleting
-- rows"). The append-only ledger, requests and ratings reference the profile,
-- so the row stays, but everything personal goes: name and area (replaced),
-- WhatsApp, wishlist, the blocks they made, meet-up places and notes they
-- wrote, feedback, notes on books they still own (withdrawn), waiting requests
-- (cancelled), and their sign-in data. Reports stay, for safety.
--
-- Run by the pilot team in the Supabase SQL Editor (docs/runbooks/delete-account.md):
--   select public.admin_anonymise_reader('<user id>');
-- Safe to run again. No app role can run it.
create function public.admin_anonymise_reader(p_user uuid) returns text
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles where id = p_user) then
    raise exception 'no reader with id %', p_user;
  end if;
  -- Lock first, then check: the person, then their open requests (request
  -- before copy, the same order as respond_request), so nobody can accept a
  -- request between the check and the clean-up.
  perform public.lock_person(p_user);
  perform 1 from public.requests
   where p_user in (requester_id, owner_id) and status in ('requested', 'accepted', 'on_loan')
   for update;
  if exists (select 1 from public.requests where p_user in (requester_id, owner_id) and status in ('accepted', 'on_loan')) then
    raise exception 'this reader has an accepted request or a book on loan: finish or resolve it first';
  end if;

  update public.requests set status = 'cancelled', updated_at = now()
   where p_user in (requester_id, owner_id) and status = 'requested';
  -- Books they still own: off the shelf, note removed. (Books they gave away
  -- belong to someone else now, so their notes travel on with them.)
  update public.copies
     set note = null, status = case when status in ('available', 'paused') then 'withdrawn' else status end
   where owner_id = p_user;
  delete from public.wishlist where user_id = p_user;
  delete from public.profile_contacts where id = p_user;
  delete from public.blocks where blocker_id = p_user;
  update public.meetups set place = 'removed', note = null where proposed_by = p_user;
  delete from public.feedback where user_id = p_user;
  update public.profiles set display_name = 'Former reader', area = '-' where id = p_user;

  -- Sign-in data. A long ban, not 'infinity' (Supabase Auth can't read an
  -- infinite date). email_change / phone_change are '' because Auth reads them as strings.
  update auth.users
     set email = 'deleted-' || p_user || '@bayu.invalid', phone = null, email_change = '', phone_change = '',
         raw_user_meta_data = '{}'::jsonb, banned_until = now() + interval '100 years'
   where id = p_user;
  delete from auth.identities where user_id = p_user;
  delete from auth.mfa_factors where user_id = p_user;
  delete from auth.one_time_tokens where user_id = p_user;
  delete from auth.flow_state where user_id = p_user;
  delete from auth.refresh_tokens where user_id = p_user::text;
  delete from auth.sessions where user_id = p_user;
  return 'anonymised';
end $$;

revoke execute on function public.admin_anonymise_reader(uuid) from public, anon, authenticated, service_role;
