-- Partnerships portal: a second, narrower role — separate from full admin —
-- for whoever reviews mentor applications, institution partner applications,
-- and demo requests. A partnership manager can do exactly those three jobs
-- and nothing else in /admin (no Users, no Assessment grading, no Ads).
--
-- Mirrors the public.admins table/is_admin() pattern from
-- docs/supabase-mentor-onboarding.sql exactly, as a second, independent role
-- table. A full admin automatically has partnerships access too (via
-- has_partnerships_access() below) — this does not take anything away from
-- admins, it only widens who else can reach these three review queues.
--
-- Depends on public.is_admin() from docs/supabase-mentor-onboarding.sql, and
-- on the tables from docs/supabase-mentor-onboarding.sql,
-- docs/supabase-institution-partner-onboarding.sql,
-- docs/supabase-institution-demo-requests.sql and
-- docs/supabase-institution-partner-courses.sql existing already.
-- Run this once against Supabase Cloud (SQL editor). It is idempotent enough
-- to re-run, but read it first — partnership_managers starts EMPTY, so grant
-- someone access at the bottom once you know their user id.

-- ---------------------------------------------------------------------------
-- Partnership manager role
-- ---------------------------------------------------------------------------
-- Only service_role can write this table (no INSERT/UPDATE/DELETE policies
-- for the client), same reasoning as admins: a self-writable flag would let
-- anyone grant themselves access.
create table if not exists public.partnership_managers (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.partnership_managers enable row level security;

create or replace function public.is_partnership_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.partnership_managers where user_id = auth.uid());
$$;

-- The single check every partnerships-portal policy and RPC uses — an admin
-- or a partnership manager, either is enough.
create or replace function public.has_partnerships_access()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin() or public.is_partnership_manager();
$$;

-- Only admins see (or, once granted via service_role, manage) the roster —
-- a partnership manager doesn't need to see who else has the role.
drop policy if exists "admins can see the partnership manager list" on public.partnership_managers;
create policy "admins can see the partnership manager list"
  on public.partnership_managers for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Widen the existing is_admin()-only policies to has_partnerships_access().
-- Same policy names, same shape — just the check function changes, so this
-- is safe to run even if these already exist from the earlier onboarding
-- migrations.
-- ---------------------------------------------------------------------------

-- Mentor applications (private) + mentors (public listing) —
-- docs/supabase-mentor-onboarding.sql
drop policy if exists "admins read applications" on public.mentor_applications;
create policy "admins read applications"
  on public.mentor_applications for select
  to authenticated
  using (public.has_partnerships_access());

drop policy if exists "admins manage mentors" on public.mentors;
create policy "admins manage mentors"
  on public.mentors for all
  to authenticated
  using (public.has_partnerships_access())
  with check (public.has_partnerships_access());

-- Institution partner applications (private) + institution_partners (public
-- listing) — docs/supabase-institution-partner-onboarding.sql
drop policy if exists "admins read applications" on public.institution_partner_applications;
create policy "admins read applications"
  on public.institution_partner_applications for select
  to authenticated
  using (public.has_partnerships_access());

drop policy if exists "admins manage institution partners" on public.institution_partners;
create policy "admins manage institution partners"
  on public.institution_partners for all
  to authenticated
  using (public.has_partnerships_access())
  with check (public.has_partnerships_access());

-- Per-course detail on a listing — docs/supabase-institution-partner-courses.sql
drop policy if exists "admins manage institution partner courses" on public.institution_partner_courses;
create policy "admins manage institution partner courses"
  on public.institution_partner_courses for all
  to authenticated
  using (public.has_partnerships_access())
  with check (public.has_partnerships_access());

-- Demo requests (from the "Get pricing" lead form on Community > Institutions)
-- — docs/supabase-institution-demo-requests.sql
drop policy if exists "admins manage demo requests" on public.institution_demo_requests;
create policy "admins manage demo requests"
  on public.institution_demo_requests for all
  to authenticated
  using (public.has_partnerships_access())
  with check (public.has_partnerships_access());

-- ---------------------------------------------------------------------------
-- Widen the approve/reject RPCs' internal checks the same way. Both are
-- security definer, so they bypass RLS on writes — this internal check is the
-- only thing gating who may call them (execute is already granted to every
-- authenticated user; that grant relies entirely on this check).
-- ---------------------------------------------------------------------------

create or replace function public.approve_mentor_application(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.mentor_applications;
begin
  if not public.has_partnerships_access() then
    raise exception 'not authorized';
  end if;

  select * into app from public.mentor_applications where id = app_id;
  if not found then
    raise exception 'application % not found', app_id;
  end if;

  update public.mentor_applications
     set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(), review_note = null
   where id = app_id;

  insert into public.mentors (application_id, full_name, headline, bio, location, expertise, linkedin_url)
  values (app.id, app.full_name, app.headline, app.bio, app.location, app.expertise, app.linkedin_url)
  on conflict (application_id) do update
    set full_name    = excluded.full_name,
        headline     = excluded.headline,
        bio          = excluded.bio,
        location     = excluded.location,
        expertise    = excluded.expertise,
        linkedin_url = excluded.linkedin_url;
end;
$$;

create or replace function public.reject_mentor_application(app_id uuid, note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_partnerships_access() then
    raise exception 'not authorized';
  end if;

  update public.mentor_applications
     set status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(), review_note = note
   where id = app_id;

  if not found then
    raise exception 'application % not found', app_id;
  end if;

  delete from public.mentors where application_id = app_id;
end;
$$;

create or replace function public.approve_institution_partner_application(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.institution_partner_applications;
begin
  if not public.has_partnerships_access() then
    raise exception 'not authorized';
  end if;

  select * into app from public.institution_partner_applications where id = app_id;
  if not found then
    raise exception 'application % not found', app_id;
  end if;

  update public.institution_partner_applications
     set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(), review_note = null
   where id = app_id;

  insert into public.institution_partners (
    application_id, legal_name, courses_offered, years_in_education, city,
    google_profile_url, google_rating, website_url
  )
  values (
    app.id, app.legal_name, app.courses_offered, app.years_in_education, app.city,
    app.google_profile_url, app.google_rating, app.website_url
  )
  on conflict (application_id) do update
    set legal_name          = excluded.legal_name,
        courses_offered     = excluded.courses_offered,
        years_in_education  = excluded.years_in_education,
        city                = excluded.city,
        google_profile_url  = excluded.google_profile_url,
        google_rating       = excluded.google_rating,
        website_url         = excluded.website_url;
end;
$$;

create or replace function public.reject_institution_partner_application(app_id uuid, note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_partnerships_access() then
    raise exception 'not authorized';
  end if;

  update public.institution_partner_applications
     set status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(), review_note = note
   where id = app_id;

  if not found then
    raise exception 'application % not found', app_id;
  end if;

  delete from public.institution_partners where application_id = app_id;
end;
$$;

grant execute on function public.has_partnerships_access() to authenticated;

-- ---------------------------------------------------------------------------
-- Grant someone partnerships access (uncomment and fill in a real user id —
-- find it in Supabase Studio > Authentication > Users). Admins already have
-- access via has_partnerships_access() and don't need a row here.
-- ---------------------------------------------------------------------------
-- insert into public.partnership_managers (user_id) values ('<user-uuid-here>')
--   on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--   select public.has_partnerships_access(); -- true if you're an admin or a partnership manager
