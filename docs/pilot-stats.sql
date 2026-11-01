-- Pilot stats for Bayu. Paste a query into Supabase → SQL Editor and Run.
-- Read-only: nothing here changes data.

-- 1. The headline numbers.
select
  (select count(*) from public.profiles)                                        as readers,
  (select count(*) from public.copies where status <> 'withdrawn')              as books_listed, -- includes paused (and given-away) copies
  (select count(*) from public.copies where status = 'available')               as on_the_shelf_now,
  (select count(*) from public.requests)                                        as requests,
  (select count(*) from public.requests where status in ('handed_over', 'on_loan', 'returned', 'forfeited')) as handovers,
  (select count(*) from public.requests where status = 'returned')              as lends_returned,
  (select count(*) from public.requests where status = 'forfeited')             as lends_not_returned;

-- 2. Week by week (Korea time, weeks start Monday): new readers, listings, requests, handovers.
-- Starts from the first reader's week, so nothing is left out.
with bounds as (
  select coalesce(date_trunc('week', min(created_at) at time zone 'Asia/Seoul'), date_trunc('week', now() at time zone 'Asia/Seoul')) as first_week
  from public.profiles
), weeks as (
  select generate_series((select first_week from bounds), date_trunc('week', now() at time zone 'Asia/Seoul'), interval '1 week') as week
)
select to_char(w.week, 'DD Mon') as week_of,
  (select count(*) from public.profiles p where date_trunc('week', p.created_at at time zone 'Asia/Seoul') = w.week) as new_readers,
  (select count(*) from public.copies c where date_trunc('week', c.created_at at time zone 'Asia/Seoul') = w.week) as listed,
  (select count(*) from public.requests r where date_trunc('week', r.created_at at time zone 'Asia/Seoul') = w.week) as requested,
  -- One ledger row per handover: the receiver's -1 for a give, the lock (delta 0) for a lend.
  -- (The ledger, not requests.updated_at, because a request's row keeps changing after handover.)
  (select count(*) from public.credit_ledger l where l.kind in ('give_transfer', 'lend_lock') and l.delta <= 0
     and date_trunc('week', l.created_at at time zone 'Asia/Seoul') = w.week) as handed_over
from weeks w order by w.week;

-- 3. How requests end (is something getting stuck?).
select status, mode, count(*) from public.requests group by status, mode order by status, mode;

-- 4. Give vs lend on the shelf.
select mode, status, count(*) from public.copies group by mode, status order by mode, status;

-- 5. Credits: should total exactly the number of starter credits (transfers sum to zero).
select
  (select coalesce(sum(delta), 0) from public.credit_ledger)                         as total_credits,
  (select count(*) from public.credit_ledger where kind = 'starter_grant')           as starter_credits,
  (select coalesce(sum(locked_delta), 0) from public.credit_ledger)                  as credits_held_now,
  (select count(*) from public.requests where status = 'on_loan')                    as books_on_loan_now; -- should equal credits_held_now

-- 5b. Nobody should have a negative available balance (R6). Expect no rows.
select user_id, sum(delta) as balance, sum(locked_delta) as held
from public.credit_ledger group by user_id
having sum(delta) - sum(locked_delta) < 0;

-- 6. Most listed books (by edition), and the most requested.
select b.isbn, b.title, count(*) as copies from public.copies c join public.books b using (isbn)
where c.status <> 'withdrawn' group by b.isbn, b.title order by copies desc limit 10;

select b.isbn, b.title, count(*) as requests from public.requests r
join public.copies c on c.id = r.copy_id join public.books b on b.isbn = c.isbn
group by b.isbn, b.title order by requests desc limit 10;

-- 7. Loans past their due date (to nudge people kindly).
-- borrower_says_returned = true means it's a "they say it's back" mix-up, not a late book.
select b.title, r.return_by, owner.display_name as lender, borrower.display_name as borrower, r.requester_returned as borrower_says_returned
from public.requests r
join public.copies c on c.id = r.copy_id
join public.books b on b.isbn = c.isbn
join public.profiles owner on owner.id = r.owner_id
join public.profiles borrower on borrower.id = r.requester_id
where r.status = 'on_loan' and r.return_by < public.today()
order by r.return_by;
