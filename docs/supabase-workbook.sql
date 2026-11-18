-- The Workbook: the programmes a student chose to study (Paul, 18 Nov 2026:
-- "for a new user he should be able to choose what he wants to study and add
-- it to workbook").
--
-- A new student's Workbook starts empty and lists every programme to add.
-- Adding Digital Marketing or Global Leadership (built into the site) writes a
-- row here. Adding a course-engine programme (Entrepreneurship, Data
-- Analytics) enrols them in it, as its own "Start" button always has
-- (programme_enrolments), so it needs no row here.
--
-- Once added, a programme stays (Paul: students can't remove one): there is
-- no delete. The aptitude test is an optional first step inside it.
--
-- Run BEFORE deploying the site version that reads it. Safe to run again.

create table if not exists public.workbook_programmes (
  student_id  uuid not null references auth.users (id) on delete cascade,
  programme   text not null check (programme in ('digital-marketing', 'global-leadership')),
  added_at    timestamptz not null default now(),
  primary key (student_id, programme)
);

alter table public.workbook_programmes enable row level security;

drop policy if exists "students read their workbook" on public.workbook_programmes;
create policy "students read their workbook" on public.workbook_programmes
  for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

drop policy if exists "students add to their workbook" on public.workbook_programmes;
create policy "students add to their workbook" on public.workbook_programmes
  for insert to authenticated
  with check (student_id = auth.uid());

grant select, insert on public.workbook_programmes to authenticated;
