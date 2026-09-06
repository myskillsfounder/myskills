-- Institution "Book a demo" requests (Community > Institutions).
--
-- Run this once against the Supabase instance (SQL editor). Depends on
-- public.is_admin() from docs/supabase-mentor-onboarding.sql.
--
-- Unlike mentor_applications, the booker is always a signed-in MySkills
-- user (the page is behind requireOnboarded), so INSERT is restricted to
-- `authenticated` rather than `anon, authenticated`.

do $$ begin
  create type public.demo_request_status as enum ('pending', 'contacted', 'scheduled', 'closed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.institution_demo_requests (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  requested_by  uuid references auth.users (id) on delete set null,
  status        public.demo_request_status not null default 'pending',
  contacted_at  timestamptz,
  contacted_by  uuid references auth.users (id),

  -- Which offline partner the demo is for. A single hardcoded value today
  -- (INTERVAL) but a column, not a constant, so a second partner doesn't
  -- need a schema change.
  partner text not null default 'INTERVAL',

  full_name     text not null check (length(trim(full_name)) between 2 and 80),
  role          text check (length(role) <= 80),
  institution   text check (length(institution) <= 120),
  city          text check (length(city) <= 80),
  student_count int check (student_count is null or student_count between 1 and 100000),

  email   text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone   text check (length(phone) <= 32),
  message text check (length(message) <= 2000)
);

create index if not exists institution_demo_requests_status_idx
  on public.institution_demo_requests (status, created_at desc);

alter table public.institution_demo_requests enable row level security;

drop policy if exists "authenticated can request a demo" on public.institution_demo_requests;
create policy "authenticated can request a demo"
  on public.institution_demo_requests for insert
  to authenticated
  with check (
    requested_by = auth.uid()
    and status = 'pending'
    and contacted_at is null
    and contacted_by is null
  );

-- Admins have full read/write (marking contacted/scheduled/closed) — no
-- derived public table to keep in sync, so a function isn't needed here the
-- way approve/reject is for mentor_applications.
drop policy if exists "admins manage demo requests" on public.institution_demo_requests;
create policy "admins manage demo requests"
  on public.institution_demo_requests for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
