-- Limits on adding rows that had none (OWASP ASVS 5.0 V2.4, anti-automation).
-- Requests, reports, feedback, meet-ups and "more time" asks already have
-- limits; listing copies and the wishlist didn't, so one account (or a script
-- with a stolen session) could flood the shelf. Generous for real readers:
--   * copies: 30 new listings a day, 200 on the shelf at once (withdrawn ones don't count);
--   * wishlist: 200 books.
-- Additive: two trigger functions and two triggers, no data changes. Given-away
-- copies change owner by UPDATE, so these never block a handover.
-- Security invoker: the counts only need the reader's own rows, which RLS lets them see.

create function public.copies_insert_limit() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if (select count(*) from public.copies
      where owner_id = new.owner_id and created_at > now() - interval '1 day') >= 30 then
    raise exception 'that''s a lot of books for one day: add the rest tomorrow'
      using errcode = 'check_violation', hint = 'bayu';
  end if;
  if (select count(*) from public.copies
      where owner_id = new.owner_id and status <> 'withdrawn') >= 200 then
    raise exception 'your shelf is full (200 books): take some off first'
      using errcode = 'check_violation', hint = 'bayu';
  end if;
  return new;
end
$$;

create function public.wishlist_insert_limit() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if (select count(*) from public.wishlist where user_id = new.user_id) >= 200 then
    raise exception 'your wishlist is full (200 books): remove some first'
      using errcode = 'check_violation', hint = 'bayu';
  end if;
  return new;
end
$$;

revoke execute on function public.copies_insert_limit() from public, anon, authenticated;
revoke execute on function public.wishlist_insert_limit() from public, anon, authenticated;

create trigger copies_insert_limit before insert on public.copies
  for each row execute function public.copies_insert_limit();
create trigger wishlist_insert_limit before insert on public.wishlist
  for each row execute function public.wishlist_insert_limit();
