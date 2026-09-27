-- Live mentor sessions: a student and a mentor agree to work together on one
-- programme, then the mentor logs each session they hold.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on: public.mentors (docs/supabase-mentor-onboarding.sql) — a mentor
-- can only be matched if their listing is linked to a MySkills account
-- (mentors.profile_id); the aptitude results (docs/supabase-dm-aptitude-
-- assessment.sql, docs/supabase-career-readiness-assessment.sql);
-- public.live_session_attendance with its programme column
-- (docs/supabase-live-sessions.sql + docs/supabase-live-sessions-programme.sql);
-- public.has_section_access(); the notify_* email helpers.
--
-- HOW IT WORKS
--   1. A student who has taken a programme's aptitude assessment asks a mentor
--      to work with them on that programme, with a note.
--   2. The mentor sees the request with the student's aptitude report — the
--      starting point — and accepts or declines. Accepted = matched.
--   3. They arrange sessions themselves (email, WhatsApp, a call). After each
--      one the mentor logs it here; it becomes a confirmed live session, worth
--      2 points of the Career Readiness Score (up to 5 per programme).
--   One open request or match per student per programme. Either side can end
--   a match; the student can then ask someone else.

do $$ begin
  create type public.mentor_match_status as enum ('requested', 'active', 'declined', 'ended', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.mentor_matches (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  programme    text not null check (programme in ('digital-marketing', 'career-readiness')),
  student_id   uuid not null references public.profiles (id) on delete cascade,
  mentor_id    uuid not null references public.mentors (id) on delete cascade,
  -- The mentor's account, copied from mentors.profile_id when the request is
  -- made, so a mentor sees their requests even if the listing changes later.
  mentor_user  uuid not null references auth.users (id) on delete cascade,
  status       public.mentor_match_status not null default 'requested',
  student_note text check (length(student_note) <= 1000),
  mentor_note  text check (length(mentor_note) <= 1000),
  decided_at   timestamptz,
  ended_at     timestamptz
);

create unique index if not exists mentor_matches_one_open
  on public.mentor_matches (student_id, programme) where status in ('requested', 'active');
create index if not exists mentor_matches_mentor_idx on public.mentor_matches (mentor_user, status);

alter table public.mentor_matches enable row level security;

-- Read only: every change goes through the functions below.
drop policy if exists "students read own matches" on public.mentor_matches;
create policy "students read own matches"
  on public.mentor_matches for select to authenticated
  using (student_id = auth.uid());

drop policy if exists "mentors read their matches" on public.mentor_matches;
create policy "mentors read their matches"
  on public.mentor_matches for select to authenticated
  using (mentor_user = auth.uid());

drop policy if exists "staff read matches" on public.mentor_matches;
create policy "staff read matches"
  on public.mentor_matches for select to authenticated
  using (public.has_section_access('mentor-reviews'));

-- ---------------------------------------------------------------------------
-- Student: ask a mentor, withdraw, end
-- ---------------------------------------------------------------------------
create or replace function public.request_mentor(p_programme text, p_mentor_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_mentor_user uuid;
begin
  if v_uid is null then
    raise exception 'You are not signed in.';
  end if;
  if p_programme = 'digital-marketing' then
    if not exists (select 1 from public.dm_aptitude_results where profile_id = v_uid) then
      raise exception 'Take the Digital Marketing aptitude assessment first — your mentor starts from that report.';
    end if;
  elsif p_programme = 'career-readiness' then
    if not exists (select 1 from public.career_readiness_assessment_results where profile_id = v_uid) then
      raise exception 'Take the personal aptitude assessment first — your mentor starts from that report.';
    end if;
  else
    raise exception 'Unknown programme.';
  end if;

  select m.profile_id into v_mentor_user from public.mentors m where m.id = p_mentor_id;
  if v_mentor_user is null then
    raise exception 'That mentor isn''t taking students through MySkills yet.';
  end if;
  if v_mentor_user = v_uid then
    raise exception 'You can''t be your own mentor.';
  end if;
  if exists (select 1 from public.mentor_matches
              where student_id = v_uid and programme = p_programme and status in ('requested', 'active')) then
    raise exception 'You already have a mentor, or a request waiting, for this programme.';
  end if;

  insert into public.mentor_matches (programme, student_id, mentor_id, mentor_user, student_note)
  values (p_programme, v_uid, p_mentor_id, v_mentor_user, nullif(btrim(p_note), ''));
end;
$$;

-- Withdraw a request that's still waiting, or end an active match.
create or replace function public.leave_mentor_match(p_match uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mentor_matches
     set status = case status when 'requested' then 'cancelled'::public.mentor_match_status
                              else 'ended'::public.mentor_match_status end,
         ended_at = now()
   where id = p_match
     and status in ('requested', 'active')
     and (student_id = auth.uid() or mentor_user = auth.uid());
  if not found then
    raise exception 'That request or match isn''t open any more.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Mentor: see requests and students, accept or decline, log sessions
-- ---------------------------------------------------------------------------
create or replace function public.my_mentor_matches()
returns table (
  id uuid, created_at timestamptz, programme text, status public.mentor_match_status,
  student_id uuid, student_name text, student_email text, student_note text, mentor_note text,
  aptitude jsonb, sessions int
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if auth.uid() is null then
    raise exception 'You are not signed in.';
  end if;
  return query
  select mm.id, mm.created_at, mm.programme, mm.status, mm.student_id, p.full_name, u.email::text,
         mm.student_note, mm.mentor_note,
         case mm.programme
           when 'digital-marketing' then
             (select jsonb_build_object('scores', a.scores, 'reflection', a.reflection, 'completed_at', a.completed_at)
                from public.dm_aptitude_results a where a.profile_id = mm.student_id)
           else
             (select jsonb_build_object('scores', a.scores, 'reflection', a.reflection, 'completed_at', a.completed_at)
                from public.career_readiness_assessment_results a where a.profile_id = mm.student_id)
         end,
         (select count(*)::int from public.live_session_attendance l
           where l.student_id = mm.student_id and l.programme = mm.programme and l.recorded_by = mm.mentor_user)
    from public.mentor_matches mm
    join public.profiles p on p.id = mm.student_id
    join auth.users u on u.id = mm.student_id
   where mm.mentor_user = auth.uid() and mm.status in ('requested', 'active')
   order by (mm.status = 'requested') desc, mm.created_at;
end;
$$;

create or replace function public.decide_mentor_request(p_match uuid, p_accept boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mentor_matches
     set status = case when p_accept then 'active'::public.mentor_match_status
                       else 'declined'::public.mentor_match_status end,
         mentor_note = nullif(btrim(p_note), ''),
         decided_at = now()
   where id = p_match and status = 'requested' and mentor_user = auth.uid();
  if not found then
    raise exception 'That request isn''t waiting for you any more.';
  end if;
end;
$$;

create or replace function public.log_mentor_session(p_match uuid, p_title text, p_held_on date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.mentor_matches%rowtype;
  v_mentor_name text;
begin
  select * into v_match from public.mentor_matches
   where id = p_match and mentor_user = auth.uid() and status = 'active';
  if not found then
    raise exception 'You can only log sessions with a student you''re matched with.';
  end if;
  if coalesce(btrim(p_title), '') = '' then
    raise exception 'Say what the session was about.';
  end if;
  if p_held_on > current_date then
    raise exception 'That session hasn''t happened yet.';
  end if;
  if p_held_on < current_date - 180 then
    raise exception 'That session is more than 6 months old.';
  end if;

  select m.full_name into v_mentor_name from public.mentors m where m.id = v_match.mentor_id;

  insert into public.live_session_attendance (student_id, programme, host_kind, host_name, title, held_on, recorded_by)
  values (v_match.student_id, v_match.programme, 'mentor', coalesce(v_mentor_name, 'Mentor'), btrim(p_title), p_held_on, auth.uid())
  on conflict do nothing;
  if not found then
    raise exception 'That session is already logged.';
  end if;
end;
$$;

revoke execute on function public.request_mentor(text, uuid, text) from public, anon;
revoke execute on function public.leave_mentor_match(uuid) from public, anon;
revoke execute on function public.my_mentor_matches() from public, anon;
revoke execute on function public.decide_mentor_request(uuid, boolean, text) from public, anon;
revoke execute on function public.log_mentor_session(uuid, text, date) from public, anon;
grant execute on function public.request_mentor(text, uuid, text) to authenticated;
grant execute on function public.leave_mentor_match(uuid) to authenticated;
grant execute on function public.my_mentor_matches() to authenticated;
grant execute on function public.decide_mentor_request(uuid, boolean, text) to authenticated;
grant execute on function public.log_mentor_session(uuid, text, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Email: the mentor on a new request, the student on a decision
-- ---------------------------------------------------------------------------
create or replace function public.notify_mentor_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student text;
  v_student_email text;
  v_mentor text;
  v_mentor_email text;
  v_prog text;
begin
  select p.full_name into v_student from public.profiles p where p.id = new.student_id;
  select u.email into v_student_email from auth.users u where u.id = new.student_id;
  select m.full_name into v_mentor from public.mentors m where m.id = new.mentor_id;
  select u.email into v_mentor_email from auth.users u where u.id = new.mentor_user;
  v_prog := case new.programme when 'digital-marketing' then 'Digital Marketing Programme'
                               else 'Career Readiness Programme' end;

  if tg_op = 'INSERT' then
    perform public.notify_email_address(
      v_mentor_email,
      format('%s would like you as their mentor', coalesce(v_student, 'A MySkills student')),
      public.notify_layout(
        'A student has asked you to mentor them',
        public.notify_row('Student', v_student)
        || public.notify_row('Programme', v_prog)
        || public.notify_row('Their note', new.student_note),
        'See the request and their aptitude report',
        'https://myskills.org.in/mentoring'
      )
    );
  elsif old.status = 'requested' and new.status in ('active', 'declined') then
    perform public.notify_email_address(
      v_student_email,
      case new.status when 'active' then coalesce(v_mentor, 'Your mentor') || ' has agreed to mentor you'
                      else 'Your mentor request' end,
      public.notify_layout(
        case new.status when 'active' then 'You have a mentor' else 'Your request wasn''t accepted this time' end,
        public.notify_row('Mentor', v_mentor)
        || public.notify_row('Programme', v_prog)
        || public.notify_row('Their note', new.mentor_note)
        || public.notify_row('Next step', case new.status
             when 'active' then 'Your mentor will be in touch to arrange your first session.'
             else 'You can ask another mentor from Practice.' end),
        'Open Practice',
        'https://myskills.org.in/practice'
      )
    );
  end if;
  return null;
end;
$$;
revoke execute on function public.notify_mentor_match() from public, anon, authenticated;

drop trigger if exists mentor_matches_notify on public.mentor_matches;
create trigger mentor_matches_notify
  after insert or update on public.mentor_matches
  for each row execute function public.notify_mentor_match();

-- ---------------------------------------------------------------------------
-- A mentor needs their listing linked to their MySkills account:
--   update public.mentors set profile_id = (select id from auth.users where email = 'mentor@example.com')
--    where full_name = 'Their Name';
-- ---------------------------------------------------------------------------
