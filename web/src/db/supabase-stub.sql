-- Test-only stand-in for the parts of Supabase our migrations rely on:
-- the anon/authenticated roles, auth.users, auth.uid() and the default
-- privileges Supabase gives those roles on the public schema.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text);
-- The auth columns and tables admin_anonymise_reader() clears.
alter table auth.users add column if not exists phone text;
alter table auth.users add column if not exists email_change text;
alter table auth.users add column if not exists phone_change text;
alter table auth.users add column if not exists raw_user_meta_data jsonb not null default '{}';
alter table auth.users add column if not exists banned_until timestamptz;
create table if not exists auth.identities (id uuid primary key default gen_random_uuid(), user_id uuid not null, identity_data jsonb);
create table if not exists auth.sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null);
create table if not exists auth.refresh_tokens (id bigint generated always as identity primary key, user_id varchar(255), token text);
create table if not exists auth.mfa_factors (id uuid primary key default gen_random_uuid(), user_id uuid not null, phone text);
create table if not exists auth.one_time_tokens (id uuid primary key default gen_random_uuid(), user_id uuid not null, relates_to text);
create table if not exists auth.flow_state (id uuid primary key default gen_random_uuid(), user_id uuid, provider_access_token text);
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
