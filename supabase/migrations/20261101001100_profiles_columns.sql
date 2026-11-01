-- Signed-in readers see another reader's name and area, never when they joined.
-- The app (and the security invoker shelf functions) only read id, display_name
-- and area, so the table-wide SELECT becomes a column grant. Safe to run again.
revoke select on public.profiles from authenticated;
grant select (id, display_name, area) on public.profiles to authenticated;
