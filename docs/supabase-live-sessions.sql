-- Live sessions with a trainer, mentor or institution — confirmed attendance.
--
-- Worth up to 10 points of the Career Readiness Score's Personal Development
-- part (2 per confirmed session, 5 sessions). A student can never add one to
-- themselves: attendance is recorded by the person who ran the session (a
-- mentor) or by the MySkills team on behalf of a trainer or institution that
-- reported it. Every row keeps who recorded it, so it can be audited.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Run BEFORE docs/supabase-career-readiness-score.sql (the score counts these).
-- Depends on: public.profiles (is_mentor), public.is_admin(),
-- public.has_section_access() (docs/supabase-staff-permissions.sql).
--
-- WHO CAN RECORD
--   * Admins and staff with the 'mentor-reviews' section — any kind of session.
--   * A mentor (profiles.is_mentor) — sessions they ran themselves, kind 'mentor'.
--   Institutions and trainers don't have accounts, so their attendance is
--   recorded by the team from what they report (a sheet, an email).

create table if not exists public.live_session_attendance (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  student_id  uuid not null references public.profiles (id) on delete cascade,
  host_kind   text not null check (host_kind in ('mentor', 'trainer', 'institution')),
  -- Who ran it: the mentor's or trainer's name, or the institution.
  host_name   text not null check (char_length(btrim(host_name)) between 2 and 120),
  title       text not null check (char_length(btrim(title)) between 2 and 160),
  held_on     date not null,
  recorded_by uuid not null references auth.users (id),
  -- The same session can't be recorded twice for one student.
  unique (student_id, title, held_on)
);

create index if not exists live_session_attendance_student_idx
  on public.live_session_attendance (student_id);

alter table public.live_session_attendance enable row level security;

-- A student reads their own. Nobody writes through the API: only the function
-- below, so the "who may record" rule can't be skipped.
drop policy if exists "students read own sessions" on public.live_session_attendance;
create policy "students read own sessions"
  on public.live_session_attendance for select
  to authenticated
  using (student_id = auth.uid());

drop policy if exists "staff read sessions" on public.live_session_attendance;
create policy "staff read sessions"
  on public.live_session_attendance for select
  to authenticated
  using (public.has_section_access('mentor-reviews'));

-- ---------------------------------------------------------------------------
-- Record one attendance
-- ---------------------------------------------------------------------------
create or replace function public.record_live_session_attendance(
  p_student_email text,
  p_host_kind     text,
  p_host_name     text,
  p_title         text,
  p_held_on       date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_student uuid;
  v_is_staff boolean;
  v_is_mentor boolean;
begin
  if v_uid is null then
    raise exception 'You are not signed in.';
  end if;

  v_is_staff := public.is_admin() or public.has_section_access('mentor-reviews');
  select coalesce(p.is_mentor, false) into v_is_mentor from public.profiles p where p.id = v_uid;
  v_is_mentor := coalesce(v_is_mentor, false);

  if not v_is_staff and not (v_is_mentor and p_host_kind = 'mentor') then
    raise exception 'Only the team, or a mentor for their own sessions, can record attendance.';
  end if;

  select u.id into v_student from auth.users u where lower(u.email) = lower(btrim(p_student_email));
  if v_student is null then
    raise exception 'No student has that email.';
  end if;
  if v_student = v_uid then
    raise exception 'You can''t record your own attendance.';
  end if;
  if p_held_on > current_date then
    raise exception 'That session hasn''t happened yet.';
  end if;
  if p_held_on < current_date - 180 then
    raise exception 'That session is more than 6 months old.';
  end if;

  insert into public.live_session_attendance (student_id, host_kind, host_name, title, held_on, recorded_by)
  values (v_student, p_host_kind, btrim(p_host_name), btrim(p_title), p_held_on, v_uid)
  on conflict (student_id, title, held_on) do nothing;

  if not found then
    raise exception 'That session is already recorded for this student.';
  end if;
end;
$$;

revoke execute on function public.record_live_session_attendance(text, text, text, text, date) from public, anon;
grant execute on function public.record_live_session_attendance(text, text, text, text, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Staff: what has been recorded, newest first
-- ---------------------------------------------------------------------------
create or replace function public.admin_live_sessions()
returns table (
  id uuid, created_at timestamptz, held_on date, host_kind text, host_name text, title text,
  student_name text, student_email text, recorded_by_name text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('mentor-reviews') then
    raise exception 'Not authorised.';
  end if;
  return query
  select a.id, a.created_at, a.held_on, a.host_kind, a.host_name, a.title,
         sp.full_name, su.email::text, rp.full_name
    from public.live_session_attendance a
    left join public.profiles sp on sp.id = a.student_id
    left join auth.users su on su.id = a.student_id
    left join public.profiles rp on rp.id = a.recorded_by
   order by a.held_on desc, a.created_at desc
   limit 200;
end;
$$;

revoke execute on function public.admin_live_sessions() from public, anon;
grant execute on function public.admin_live_sessions() to authenticated;

-- ---------------------------------------------------------------------------
-- Check it: record one from Admin -> Live sessions, then
--   select * from public.live_session_attendance order by created_at desc;
-- ---------------------------------------------------------------------------
