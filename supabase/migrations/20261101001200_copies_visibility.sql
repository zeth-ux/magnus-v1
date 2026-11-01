-- Copies a reader takes off the shelf (withdrawn) stop being visible to other
-- readers, even from an old link. Still visible to: the owner, and anyone in a
-- request for that copy (so Activity history keeps its titles).
-- Everything else stays as before: available, on loan and paused copies are
-- visible to signed-in readers (Browse filters to available).
drop policy if exists "signed-in readers see copies" on public.copies;
create policy "signed-in readers see copies" on public.copies for select to authenticated
  using (
    status <> 'withdrawn'
    or owner_id = (select auth.uid())
    or exists (
      select 1 from public.requests r
      where r.copy_id = copies.id and (select auth.uid()) in (r.requester_id, r.owner_id)
    )
  );
