-- The open shelf (2026-11-19): signed-out visitors can browse the shelf and
-- open a book's page, like the landing page already shows a few books.
-- Signing in is only needed to ask for a book (or list one).
--
-- Same rules as public_shelf(): available copies only, and only what a
-- stranger needs to decide they want the book. Never the owner (no id, no
-- name), never their note (people write things like phone numbers there),
-- never when it was listed. The search text is capped, the results too.
-- security definer because anon has no table access at all (see
-- 20261101001000_explicit_table_grants.sql); the column lists below are the
-- whole of what leaves the database.
--
-- Newest first, like the landing page (useful for browsing). That shows the
-- order books were listed in, but never the time.
--
-- Areas: the app only lets readers pick from a fixed list (lib/books/validate.ts
-- AREAS), but the database itself takes any short text, so someone calling the
-- API directly could type a street address. What leaves to the public is
-- therefore only ever one of the known areas, or plain "Ansan".
create function public.public_area(p_area text)
returns text
language sql immutable set search_path = '' as $$
  select case
    when p_area = any (array[
      'Sa-dong (ERICA)', 'Il-dong', 'Bono-dong', 'Gojan-dong', 'Jungang-dong',
      'Wa-dong', 'Choji-dong', 'Seonbu-dong', 'Hosu-dong', 'Other part of Ansan'
    ]) then p_area
    else 'Ansan'
  end
$$;
revoke execute on function public.public_area(text) from public;

create function public.public_search_shelf(p_query text default null, p_mode public.copy_mode default null)
returns table (
  copy_id uuid, isbn text, title text, authors text[], cover_url text,
  mode public.copy_mode, lend_max public.lend_max, condition public.copy_condition, area text
)
language sql stable security definer set search_path = '' as $$
  select c.id, b.isbn, b.title, b.authors, b.cover_url, c.mode, c.lend_max, c.condition, public.public_area(p.area)
  from public.copies c
  join public.books b on b.isbn = c.isbn
  join public.profiles p on p.id = c.owner_id
  where c.status = 'available'
    and (p_mode is null or c.mode = p_mode)
    and (
      coalesce(btrim(left(p_query, 100)), '') = ''
      or position(lower(btrim(left(p_query, 100))) in lower(b.title || ' ' || array_to_string(b.authors, ' '))) > 0
    )
  order by c.created_at desc
  limit 100
$$;

create function public.public_copy(p_copy uuid)
returns table (
  copy_id uuid, isbn text, title text, authors text[], published_year integer, cover_url text,
  mode public.copy_mode, lend_max public.lend_max, condition public.copy_condition, area text
)
language sql stable security definer set search_path = '' as $$
  select c.id, b.isbn, b.title, b.authors, b.published_year, b.cover_url, c.mode, c.lend_max, c.condition, public.public_area(p.area)
  from public.copies c
  join public.books b on b.isbn = c.isbn
  join public.profiles p on p.id = c.owner_id
  where c.id = p_copy and c.status = 'available'
$$;

revoke execute on function public.public_search_shelf(text, public.copy_mode), public.public_copy(uuid) from public;
grant execute on function public.public_search_shelf(text, public.copy_mode), public.public_copy(uuid) to anon, authenticated;

-- The landing page's shelf gets the same area rule (same signature and
-- columns, so its grants and callers don't change).
create or replace function public.public_shelf(p_limit integer default 9)
returns table (
  copy_id uuid, isbn text, title text, authors text[],
  mode public.copy_mode, lend_max public.lend_max, area text
)
language sql stable security definer set search_path = '' as $$
  select c.id, b.isbn, b.title, b.authors, c.mode, c.lend_max, public.public_area(p.area)
  from public.copies c
  join public.books b on b.isbn = c.isbn
  join public.profiles p on p.id = c.owner_id
  where c.status = 'available'
  order by c.created_at desc
  limit least(greatest(coalesce(p_limit, 9), 1), 24)
$$;
