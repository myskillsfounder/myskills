-- Institution partner onboarding: public applications, admin review, public
-- listing. Mirrors docs/supabase-mentor-onboarding.sql exactly (same reasons
-- for the split): applications carry an email and phone number, and RLS can
-- only filter rows, not columns, so a public read policy on one table would
-- expose those alongside the legal name and course list.
--
-- This replaces the old single-partner (INTERVAL) "book a demo" flow on
-- /community/institutions with a real, repeatable "apply to be listed"
-- program any training institution can go through. The old
-- institution_demo_requests table and its admin review page are untouched —
-- this is additive, not a migration of that data.
--
-- Depends on public.is_admin() from docs/supabase-mentor-onboarding.sql.
-- Run this once against Supabase Cloud (SQL editor).

do $$ begin
  create type public.institution_partner_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Applications (PRIVATE — admin-only read)
-- ---------------------------------------------------------------------------
create table if not exists public.institution_partner_applications (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  status      public.institution_partner_status not null default 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id),
  review_note text,

  -- Shown publicly once approved (copied into public.institution_partners).
  legal_name         text not null check (length(trim(legal_name)) between 2 and 160),
  courses_offered    text[] not null default '{}'
                       check (array_length(courses_offered, 1) is null or array_length(courses_offered, 1) <= 15),
  years_in_education int not null check (years_in_education between 0 and 150),
  city               text check (length(city) <= 80),
  google_profile_url text check (google_profile_url is null or google_profile_url ~* '^https://'),
  google_rating      numeric(2, 1) check (google_rating is null or (google_rating between 0 and 5)),
  website_url        text check (website_url is null or website_url ~* '^https?://'),

  -- NEVER exposed publicly — same reasoning as mentor_applications.email/phone.
  contact_name    text not null check (length(trim(contact_name)) between 2 and 80),
  contact_role    text check (length(contact_role) <= 80),
  email           text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone           text check (length(phone) <= 32),
  additional_info text check (length(additional_info) <= 2000)
);

create index if not exists institution_partner_applications_status_idx
  on public.institution_partner_applications (status, created_at desc);

alter table public.institution_partner_applications enable row level security;

-- Anyone may apply, signed in or not — an applying institution is an outside
-- party, same as a mentor applicant. WITH CHECK pins status so a crafted
-- request can't self-approve on the way in.
drop policy if exists "anyone can apply" on public.institution_partner_applications;
create policy "anyone can apply"
  on public.institution_partner_applications for insert
  to anon, authenticated
  with check (status = 'pending' and reviewed_at is null and reviewed_by is null);

drop policy if exists "admins read applications" on public.institution_partner_applications;
create policy "admins read applications"
  on public.institution_partner_applications for select
  to authenticated
  using (public.is_admin());

-- No UPDATE/DELETE policies: review happens through the functions below, so
-- status transitions and the public copy can't drift apart.

-- ---------------------------------------------------------------------------
-- Institution partners (PUBLIC listing)
-- ---------------------------------------------------------------------------
create table if not exists public.institution_partners (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid unique references public.institution_partner_applications (id) on delete set null,
  created_at     timestamptz not null default now(),
  sort_order     int not null default 0,

  legal_name         text not null,
  courses_offered    text[] not null default '{}',
  years_in_education int not null default 0,
  city               text,
  google_profile_url text,
  google_rating      numeric(2, 1),
  website_url        text,
  logo_url           text
);

alter table public.institution_partners enable row level security;

-- The listing is public: it's a signed-out marketing surface, same as mentors.
drop policy if exists "institution partners are public" on public.institution_partners;
create policy "institution partners are public"
  on public.institution_partners for select
  to anon, authenticated
  using (true);

drop policy if exists "admins manage institution partners" on public.institution_partners;
create policy "admins manage institution partners"
  on public.institution_partners for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Review actions — one function per transition, so a half-approved
-- application (status flipped but not listed, or vice versa) can't exist.
-- ---------------------------------------------------------------------------
create or replace function public.approve_institution_partner_application(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.institution_partner_applications;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select * into app from public.institution_partner_applications where id = app_id;
  if not found then
    raise exception 'application % not found', app_id;
  end if;

  update public.institution_partner_applications
     set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(), review_note = null
   where id = app_id;

  insert into public.institution_partners
    (application_id, legal_name, courses_offered, years_in_education, city, google_profile_url, google_rating, website_url)
  values
    (app.id, app.legal_name, app.courses_offered, app.years_in_education, app.city, app.google_profile_url, app.google_rating, app.website_url)
  on conflict (application_id) do update
    set legal_name         = excluded.legal_name,
        courses_offered    = excluded.courses_offered,
        years_in_education = excluded.years_in_education,
        city               = excluded.city,
        google_profile_url = excluded.google_profile_url,
        google_rating      = excluded.google_rating,
        website_url        = excluded.website_url;
end;
$$;

-- Rejecting also unpublishes, so reversing an approval is one action.
create or replace function public.reject_institution_partner_application(app_id uuid, note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
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

revoke all on function public.approve_institution_partner_application(uuid) from public, anon;
revoke all on function public.reject_institution_partner_application(uuid, text) from public, anon;
grant execute on function public.approve_institution_partner_application(uuid) to authenticated;
grant execute on function public.reject_institution_partner_application(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--   select count(*) from public.institution_partner_applications; -- expect 0 rows, no error
--   select count(*) from public.institution_partners;             -- expect 0 rows, no error
-- After a test application + approval:
--   select public.approve_institution_partner_application('<app id>');
--   select * from public.institution_partners; -- the new listing row
