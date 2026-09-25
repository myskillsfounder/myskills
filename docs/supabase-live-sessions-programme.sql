-- Live sessions per programme: Digital Marketing training now counts too.
--
-- Run once against Supabase Cloud (SQL editor), AFTER
-- docs/supabase-live-sessions.sql and BEFORE re-running
-- docs/supabase-career-readiness-score.sql (method v4). Safe to re-run.
--
-- Each confirmed session now belongs to a programme:
--   'career-readiness'  -> Personal Development (2 each, up to 10)
--   'digital-marketing' -> Professional Development (2 each, up to 10)
-- Sessions recorded before this change were Career Readiness ones and keep
-- counting there.

alter table public.live_session_attendance
  add column if not exists programme text not null default 'career-readiness';

alter table public.live_session_attendance drop constraint if exists live_session_attendance_programme_check;
alter table public.live_session_attendance add constraint live_session_attendance_programme_check
  check (programme in ('career-readiness', 'digital-marketing'));

-- The same session can't be recorded twice for one student, per programme.
alter table public.live_session_attendance drop constraint if exists live_session_attendance_student_id_title_held_on_key;
create unique index if not exists live_session_attendance_one_per_session
  on public.live_session_attendance (student_id, programme, title, held_on);

-- ---------------------------------------------------------------------------
-- Recording now says which programme the session was for
-- ---------------------------------------------------------------------------
drop function if exists public.record_live_session_attendance(text, text, text, text, date);

create or replace function public.record_live_session_attendance(
  p_programme     text,
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
  if p_programme not in ('career-readiness', 'digital-marketing') then
    raise exception 'Pick the programme the session was for.';
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

  insert into public.live_session_attendance (student_id, programme, host_kind, host_name, title, held_on, recorded_by)
  values (v_student, p_programme, p_host_kind, btrim(p_host_name), btrim(p_title), p_held_on, v_uid)
  on conflict do nothing;

  if not found then
    raise exception 'That session is already recorded for this student.';
  end if;
end;
$$;

revoke execute on function public.record_live_session_attendance(text, text, text, text, text, date) from public, anon;
grant execute on function public.record_live_session_attendance(text, text, text, text, text, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Staff list, with the programme
-- ---------------------------------------------------------------------------
drop function if exists public.admin_live_sessions();

create or replace function public.admin_live_sessions()
returns table (
  id uuid, created_at timestamptz, programme text, held_on date, host_kind text, host_name text, title text,
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
  select a.id, a.created_at, a.programme, a.held_on, a.host_kind, a.host_name, a.title,
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
