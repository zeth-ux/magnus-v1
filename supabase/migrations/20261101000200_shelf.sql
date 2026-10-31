-- The shelf, read side.
-- public_shelf(): what the public landing page shows. Available copies only,
-- with the owner's area but never their name or contact (anyone can call it).
-- search_shelf(): what signed-in readers browse, with the owner's first name.

create function public.public_shelf(p_limit integer default 24)
returns table (
  copy_id uuid, isbn text, title text, authors text[],
  mode public.copy_mode, lend_max public.lend_max, area text, note text, listed_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select c.id, b.isbn, b.title, b.authors, c.mode, c.lend_max, p.area, c.note, c.created_at
  from public.copies c
  join public.books b on b.isbn = c.isbn
  join public.profiles p on p.id = c.owner_id
  where c.status = 'available'
  order by c.created_at desc
  limit least(greatest(coalesce(p_limit, 24), 1), 48)
$$;

-- Runs as the caller, so row level security decides what they can see.
create function public.search_shelf(p_query text default null, p_mode public.copy_mode default null)
returns table (
  copy_id uuid, isbn text, title text, authors text[], cover_url text,
  mode public.copy_mode, lend_max public.lend_max, condition public.copy_condition,
  note text, owner_id uuid, owner_name text, area text, listed_at timestamptz
)
language sql stable security invoker set search_path = '' as $$
  select c.id, b.isbn, b.title, b.authors, b.cover_url, c.mode, c.lend_max, c.condition,
         c.note, c.owner_id, p.display_name, p.area, c.created_at
  from public.copies c
  join public.books b on b.isbn = c.isbn
  join public.profiles p on p.id = c.owner_id
  where c.status = 'available'
    and (p_mode is null or c.mode = p_mode)
    and (
      coalesce(btrim(p_query), '') = ''
      or position(lower(btrim(p_query)) in lower(b.title || ' ' || array_to_string(b.authors, ' '))) > 0
    )
  order by c.created_at desc
  limit 100
$$;

revoke execute on function public.public_shelf(integer), public.search_shelf(text, public.copy_mode) from public;
grant execute on function public.public_shelf(integer) to anon, authenticated;
grant execute on function public.search_shelf(text, public.copy_mode) to authenticated;
revoke execute on function public.search_shelf(text, public.copy_mode) from anon;
