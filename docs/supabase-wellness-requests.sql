-- Wellness & career-guidance support (dashboard "Wellness Support" card,
-- replacing the Prompt Library card slot — see src/routes/wellness.tsx).
--
-- Run this once against Supabase Cloud (SQL editor). Depends on
-- public.is_admin() (docs/supabase-mentor-onboarding.sql) and
-- public.has_section_access() (docs/supabase-staff-permissions.sql, which
-- must already be applied — this file extends it with a 'wellness' section).
--
-- Deliberately a request queue, not the existing live support chat
-- (support_sessions/support_messages, docs/supabase-support-chat.sql):
-- nobody is tagged as a psychologist or career mentor yet, so there's no one
-- to claim a real-time session. A student submits a request here, it lands
-- in /admin's Wellness queue, and staff follow up directly (call/email/
-- WhatsApp) once real people are onboarded — same shape as
-- institution_demo_requests, which solves the identical "collect a lead,
-- have a human follow up" problem.

-- ---------------------------------------------------------------------------
-- Extend staff_permissions with the 'wellness' section
-- ---------------------------------------------------------------------------
alter table public.staff_permissions drop constraint if exists staff_permissions_section_check;
alter table public.staff_permissions add constraint staff_permissions_section_check
  check (section in (
    'users', 'assessment', 'certificates', 'feedback',
    'mentors', 'institution-partners', 'demo-requests', 'blog', 'ads', 'wellness'
  ));

create or replace function public.my_staff_sections()
returns text[]
language sql
security definer
set search_path = public
stable
as $$
  select case
    when public.is_admin() then array[
      'users', 'assessment', 'certificates', 'feedback',
      'mentors', 'institution-partners', 'demo-requests', 'blog', 'ads', 'wellness'
    ]
    else coalesce(
      (select array_agg(sp.section) from public.staff_permissions sp
        join auth.users u on u.id = sp.user_id
       where sp.user_id = auth.uid() and lower(u.email) like '%@myskills.org.in'),
      array[]::text[]
    )
  end;
$$;

-- ---------------------------------------------------------------------------
-- wellness_requests
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.wellness_request_status as enum ('pending', 'contacted', 'closed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.wellness_requests (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  requested_by  uuid not null references auth.users (id) on delete cascade,

  -- What kind of support this is: a mental-health/counselling request, or a
  -- career-guidance one. Two request types, one table/queue/admin page —
  -- they share every other field, so a second table would just be duplication.
  type   text not null check (type in ('psychologist', 'career_mentor')),
  status public.wellness_request_status not null default 'pending',

  contacted_at timestamptz,
  contacted_by uuid references auth.users (id),

  full_name text not null check (length(trim(full_name)) between 2 and 80),
  email     text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone     text check (length(phone) <= 32),
  message   text check (length(message) <= 2000)
);

create index if not exists wellness_requests_status_idx
  on public.wellness_requests (status, created_at desc);

-- Lets a student's own "do I already have an open request?" check (shown on
-- /wellness instead of a blank form, so they don't stack duplicates) stay a
-- fast indexed lookup rather than a sequential scan.
create index if not exists wellness_requests_requester_idx
  on public.wellness_requests (requested_by, type, created_at desc);

alter table public.wellness_requests enable row level security;

drop policy if exists "authenticated can request wellness support" on public.wellness_requests;
create policy "authenticated can request wellness support"
  on public.wellness_requests for insert
  to authenticated
  with check (
    requested_by = auth.uid()
    and status = 'pending'
    and contacted_at is null
    and contacted_by is null
  );

-- A student can see their own requests (so /wellness can show "we've got
-- this" instead of a form once one's already in) but not anyone else's.
drop policy if exists "students read own wellness requests" on public.wellness_requests;
create policy "students read own wellness requests"
  on public.wellness_requests for select
  to authenticated
  using (requested_by = auth.uid());

drop policy if exists "staff manage wellness requests" on public.wellness_requests;
create policy "staff manage wellness requests"
  on public.wellness_requests for all
  to authenticated
  using (public.has_section_access('wellness'))
  with check (public.has_section_access('wellness'));

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--   -- Grant someone the Wellness section:
--   -- insert into public.staff_permissions (user_id, section)
--   -- select id, 'wellness' from auth.users where email = 'someone@myskills.org.in'
--   -- on conflict (user_id, section) do nothing;
