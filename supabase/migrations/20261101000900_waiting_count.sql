-- "Things waiting on you", for the badge on Activity (docs/user-flow.md:
-- "in-app Activity badge"). Counts the reader's open requests (each once, however
-- many things wait on it) where the next step is theirs, using the same rules
-- the Activity page uses to show buttons (web/src/lib/activity/steps.ts and the
-- meet-up / more-time cards):
--   * a request for their book they can accept (the copy is on the shelf and
--     nobody else is accepted for it; requests they can only decline don't count);
--   * the other reader confirmed the handover or the return, and they haven't;
--   * a lend whose return date passed before the handover (both readers: cancel);
--   * a meet-up suggestion from the other reader, still in the future, on a card
--     the page shows;
--   * a "more time" ask on a book they lent;
--   * a book they're borrowing that's due within 3 days, or overdue.
-- Left out on purpose: "Report not returned" after the grace period (the lender's
-- choice, not a to-do).
-- security invoker: it runs as the reader, so row level security still decides
-- what it can see.
create function public.my_waiting_count() returns integer
language sql stable security invoker set search_path = '' as $$
  select count(*)::integer
  from public.requests r
  cross join lateral (select auth.uid() as me, public.today() as today) x
  cross join lateral (select r.mode = 'lend' and r.return_by <= x.today as stale) s
  where x.me in (r.requester_id, r.owner_id)
    and r.status in ('requested', 'accepted', 'on_loan')
    and (
      -- A request to answer (and accept).
      (r.status = 'requested' and r.owner_id = x.me
        and exists (select 1 from public.copies c where c.id = r.copy_id and c.status = 'available')
        and not exists (select 1 from public.requests o where o.copy_id = r.copy_id and o.status in ('accepted', 'on_loan')))
      -- The other reader confirmed the handover.
      or (r.status = 'accepted' and not s.stale and (
            (r.owner_id = x.me and not r.owner_handed_over and r.requester_received)
            or (r.requester_id = x.me and not r.requester_received and r.owner_handed_over)))
      -- A lend that went stale before the handover: cancel it.
      or (r.status = 'accepted' and s.stale)
      -- The other reader confirmed the return.
      or (r.status = 'on_loan' and (
            (r.owner_id = x.me and not r.owner_got_back and r.requester_returned)
            or (r.requester_id = x.me and not r.requester_returned and r.owner_got_back)))
      -- Their meet-up suggestion, on a card the page shows.
      or exists (
        select 1 from public.meetups m
        where m.request_id = r.id and m.status = 'proposed' and m.proposed_by <> x.me and m.meet_at > now()
          and ((r.status = 'accepted' and not s.stale and m.purpose = 'handover')
            or (r.status = 'on_loan' and not r.owner_got_back and not r.requester_returned and m.purpose = 'return')))
      -- A "more time" ask on a book they lent.
      or (r.owner_id = x.me and exists (select 1 from public.loan_extensions e where e.request_id = r.id and e.status = 'asked'))
      -- A book they're borrowing, due within 3 days or overdue.
      or (r.status = 'on_loan' and r.requester_id = x.me and not r.requester_returned and not r.owner_got_back
          and r.return_by <= x.today + 3)
    )
$$;

revoke execute on function public.my_waiting_count() from public, anon;
grant execute on function public.my_waiting_count() to authenticated;
