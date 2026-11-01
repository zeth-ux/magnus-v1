-- Indexes for foreign keys the Supabase performance advisor flagged.
-- Postgres doesn't index the referencing side of a foreign key by itself, so
-- deleting a profile or a request (or looking up "reports about this reader")
-- would scan the whole table. Additive only; safe to run more than once.
create index if not exists feedback_user_idx on public.feedback (user_id);
create index if not exists handover_ratings_rater_idx on public.handover_ratings (rater_id);
create index if not exists meetups_proposed_by_idx on public.meetups (proposed_by);
create index if not exists reports_reported_idx on public.reports (reported_id);
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists reports_request_idx on public.reports (request_id);
