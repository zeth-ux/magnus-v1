-- Wishlists (docs/user-flow.md: browse filter "On my wishlist", "N readers
-- want this", and a notice when a wanted book is listed).

create table public.wishlist (
  user_id uuid not null references public.profiles (id) on delete cascade,
  isbn text not null references public.books (isbn),
  created_at timestamptz not null default now(),
  primary key (user_id, isbn)
);
create index wishlist_isbn_idx on public.wishlist (isbn);

alter table public.wishlist enable row level security;
create policy "see your own wishlist" on public.wishlist for select to authenticated using (user_id = (select auth.uid()));
create policy "add to your own wishlist" on public.wishlist for insert to authenticated with check (user_id = (select auth.uid()));
create policy "remove from your own wishlist" on public.wishlist for delete to authenticated using (user_id = (select auth.uid()));
revoke update, truncate on public.wishlist from anon, authenticated;
revoke all on public.wishlist from anon;

-- How many readers want a book. A count only: never who.
create function public.wish_count(p_isbn text) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.wishlist where isbn = p_isbn
$$;

-- Copies on the shelf right now that are on my wishlist (not my own).
create function public.wished_and_available()
returns table (copy_id uuid, isbn text, title text, mode public.copy_mode, owner_name text, area text)
language sql stable security invoker set search_path = '' as $$
  select c.id, b.isbn, b.title, c.mode, p.display_name, p.area
  from public.wishlist w
  join public.copies c on c.isbn = w.isbn and c.status = 'available' and c.owner_id <> w.user_id
  join public.books b on b.isbn = c.isbn
  join public.profiles p on p.id = c.owner_id
  where w.user_id = (select auth.uid())
  order by c.created_at desc
  limit 20
$$;

-- Postgres lets everyone (PUBLIC) execute a new function unless it's revoked
-- explicitly; the schema-level default in the core migration can't remove
-- that, so every migration revokes and grants its own functions.
revoke execute on function public.wish_count(text), public.wished_and_available() from public, anon;
grant execute on function public.wish_count(text), public.wished_and_available() to authenticated;
