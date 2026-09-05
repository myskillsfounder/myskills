-- Mentor onboarding: public applications, admin review, public mentor listing.
--
-- Run this once against the self-hosted Supabase instance (SQL editor, or
-- psql). It is idempotent enough to re-run, but read it first — it creates an
-- admins table that starts EMPTY, so grant yourself admin at the bottom.

-- ---------------------------------------------------------------------------
-- Admin role
-- ---------------------------------------------------------------------------
-- Deliberately a table rather than auth.users.raw_user_meta_data: metadata is
-- writable by the user via supabase.auth.updateUser(), so anyone could grant
-- themselves admin. Only service_role can write this table (no policies allow
-- INSERT/UPDATE/DELETE from the client).
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- security definer so RLS policies elsewhere can call it without needing a
-- SELECT policy on admins itself (which would recurse).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admins can see the admin list" on public.admins;
create policy "admins can see the admin list"
  on public.admins for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Applications (PRIVATE — contains contact details)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.mentor_application_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.mentor_applications (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  status      public.mentor_application_status not null default 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id),
  review_note text,

  -- Shown publicly once approved (copied into public.mentors).
  full_name    text not null check (length(trim(full_name)) between 2 and 80),
  headline     text not null check (length(trim(headline)) between 2 and 120),
  bio          text not null check (length(trim(bio)) between 20 and 1200),
  location     text check (length(location) <= 80),
  expertise    text[] not null default '{}' check (array_length(expertise, 1) is null
                                                   or array_length(expertise, 1) <= 10),
  linkedin_url text check (linkedin_url is null or linkedin_url ~* '^https://([a-z]+\.)?linkedin\.com/'),

  -- NEVER exposed publicly. This is why applications and the listing are two
  -- tables: RLS is row-level, so a public read policy here would hand out the
  -- applicant's email and phone along with their bio.
  email      text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone      text check (length(phone) <= 32),
  motivation text check (length(motivation) <= 2000)
);

create index if not exists mentor_applications_status_idx
  on public.mentor_applications (status, created_at desc);

alter table public.mentor_applications enable row level security;

-- Anyone may apply, signed in or not — mentors are outside parties who
-- shouldn't need a learner account first. The WITH CHECK pins status so a
-- crafted request can't self-approve on the way in.
drop policy if exists "anyone can apply" on public.mentor_applications;
create policy "anyone can apply"
  on public.mentor_applications for insert
  to anon, authenticated
  with check (status = 'pending' and reviewed_at is null and reviewed_by is null);

-- Only admins read applications. Applicants intentionally cannot read back
-- what they submitted: there is no account to tie it to.
drop policy if exists "admins read applications" on public.mentor_applications;
create policy "admins read applications"
  on public.mentor_applications for select
  to authenticated
  using (public.is_admin());

-- No UPDATE/DELETE policies: review happens through the functions below, so
-- status transitions and the public copy can't drift apart.

-- ---------------------------------------------------------------------------
-- Mentors (PUBLIC listing)
-- ---------------------------------------------------------------------------
create table if not exists public.mentors (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid unique references public.mentor_applications (id) on delete set null,
  created_at     timestamptz not null default now(),
  sort_order     int not null default 0,

  -- If set, the mentor is also a platform user and the listing prefers their
  -- live profile row, the way the hardcoded list did before this table existed.
  profile_id   uuid references public.profiles (id) on delete set null,

  full_name    text not null,
  headline     text not null,
  bio          text not null,
  location     text,
  expertise    text[] not null default '{}',
  linkedin_url text,
  avatar_url   text
);

alter table public.mentors enable row level security;

-- The listing is public: it is also a signed-out marketing surface.
drop policy if exists "mentors are public" on public.mentors;
create policy "mentors are public"
  on public.mentors for select
  to anon, authenticated
  using (true);

drop policy if exists "admins manage mentors" on public.mentors;
create policy "admins manage mentors"
  on public.mentors for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Review actions
-- ---------------------------------------------------------------------------
-- Approving is two writes (flip the status, publish the listing). A function
-- keeps them in one transaction so a half-approved application can't exist.
create or replace function public.approve_mentor_application(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.mentor_applications;
begin
  if not public.is_admin() then
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

-- Rejecting also unpublishes, so reversing an approval is one action.
create or replace function public.reject_mentor_application(app_id uuid, note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
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

revoke all on function public.approve_mentor_application(uuid) from public, anon;
revoke all on function public.reject_mentor_application(uuid, text) from public, anon;
grant execute on function public.approve_mentor_application(uuid) to authenticated;
grant execute on function public.reject_mentor_application(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Seed: the mentor that used to be hardcoded in the app
-- ---------------------------------------------------------------------------
-- routes/community/mentors.tsx carried this entry in a const array. The page
-- now reads this table, so without the seed the listing would come up empty.
-- profile_id is resolved by email rather than hardcoded: the original id
-- (b15eb398-…) belonged to a user that has since been deleted.
insert into public.mentors (full_name, headline, bio, expertise, linkedin_url, profile_id, sort_order)
select
  'Paul Thomas',
  'Edupreneur & Professional Development Coach',
  'Helping learners turn digital marketing skills into real, job-ready careers through practical coaching and mentorship.',
  array['Digital Marketing', 'Career Coaching', 'Professional Development'],
  'https://www.linkedin.com/in/paul-thomas-edupreneur-professional-development-coach/',
  (select p.id from public.profiles p
     join auth.users u on u.id = p.id
    where u.email = 'myskillsfounder@gmail.com'
    limit 1),
  0
where not exists (select 1 from public.mentors);

-- ---------------------------------------------------------------------------
-- Grant yourself admin — REQUIRED, the table is empty until you do.
-- ---------------------------------------------------------------------------
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'myskillsfounder@gmail.com'
-- on conflict do nothing;
