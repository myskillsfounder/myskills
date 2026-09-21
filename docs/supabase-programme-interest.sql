-- Programme interest — the "Register your interest" button on
-- /career-readiness (src/routes/career-readiness.tsx).
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on public.is_admin() (docs/supabase-mentor-onboarding.sql) and the
-- notify_* helpers (docs/supabase-email-notifications.sql).
--
-- An interest list, not an enrolment: there's no price, schedule or cohort
-- yet. One row per (learner, programme) — the unique constraint makes a
-- second click a no-op, which the frontend treats as success.
--
-- The stored slug is 'career-launchpad' (the programme's working name) even
-- though it's now the Career Readiness Programme — changing it would mean
-- migrating the check constraint for no user-visible gain.

create table if not exists public.programme_interest (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  programme  text not null check (programme in ('career-launchpad')),
  full_name  text not null check (length(trim(full_name)) between 1 and 80),
  email      text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  unique (user_id, programme)
);

alter table public.programme_interest enable row level security;

drop policy if exists "learners register own interest" on public.programme_interest;
create policy "learners register own interest"
  on public.programme_interest for insert
  to authenticated
  with check (user_id = auth.uid());

-- So the page can show "You're on the list" instead of the button.
drop policy if exists "learners read own interest" on public.programme_interest;
create policy "learners read own interest"
  on public.programme_interest for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "admins read all interest" on public.programme_interest;
create policy "admins read all interest"
  on public.programme_interest for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Email notification
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_programme_interest()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
begin
  select count(*) into v_total from public.programme_interest where programme = new.programme;

  perform public.notify_email(
    format('[MySkills · Programme] %s joined the Career Readiness Programme list (%s total)',
           new.full_name, v_total),
    public.notify_layout(
      'New programme interest',
      public.notify_row('Programme', 'Career Readiness Programme')
      || public.notify_row('Name', new.full_name)
      || public.notify_row('Email', new.email)
      || public.notify_row('Total on list', v_total::text),
      'Open MySkills',
      'https://myskills.org.in/career-readiness'
    )
  );
  return null;
end;
$$;

drop trigger if exists programme_interest_notify on public.programme_interest;
create trigger programme_interest_notify
  after insert on public.programme_interest
  for each row execute function public.notify_new_programme_interest();

-- ---------------------------------------------------------------------------
-- See who's interested
-- ---------------------------------------------------------------------------
--   select created_at, full_name, email
--     from public.programme_interest
--    where programme = 'career-launchpad'
--    order by created_at desc;
