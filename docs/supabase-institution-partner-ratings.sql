-- Lets signed-in students rate listed institution partners — a real,
-- MySkills-sourced trust signal alongside (not instead of) the admin-entered
-- Google rating already on institution_partners.
--
-- One row per (institution, student): rating again just updates their
-- existing row rather than creating a second one, so an institution's
-- average can't be inflated by one person rating repeatedly.
--
-- Depends on public.is_admin() from docs/supabase-mentor-onboarding.sql, and
-- on public.institution_partners existing already
-- (docs/supabase-institution-partner-onboarding.sql).
-- Run this once against Supabase Cloud (SQL editor).

create table if not exists public.institution_partner_ratings (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institution_partners (id) on delete cascade,
  profile_id     uuid not null references auth.users (id) on delete cascade,
  rating         smallint not null check (rating between 1 and 5),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (institution_id, profile_id)
);

create index if not exists institution_partner_ratings_institution_idx
  on public.institution_partner_ratings (institution_id);

alter table public.institution_partner_ratings enable row level security;

-- Ratings are part of the public listing's trust signal, same as the
-- institution_partners rows they're attached to.
drop policy if exists "ratings are public" on public.institution_partner_ratings;
create policy "ratings are public"
  on public.institution_partner_ratings for select
  to anon, authenticated
  using (true);

-- A signed-in student manages only their own rating (insert to rate,
-- update to change it, delete to remove it).
drop policy if exists "users manage own rating" on public.institution_partner_ratings;
create policy "users manage own rating"
  on public.institution_partner_ratings for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Admins can moderate any rating (e.g. remove an abusive one).
drop policy if exists "admins manage all ratings" on public.institution_partner_ratings;
create policy "admins manage all ratings"
  on public.institution_partner_ratings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--   select count(*) from public.institution_partner_ratings; -- expect 0 rows, no error
