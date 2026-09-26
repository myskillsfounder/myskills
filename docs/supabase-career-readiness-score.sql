-- The Career Readiness Score, issued by the server.
--
-- The server works the score out from records it holds and stores the result
-- with the date and the method version. refresh_my_career_readiness_score() is
-- what the dashboard calls.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on: public.live_session_attendance (docs/supabase-live-sessions.sql
-- and docs/supabase-live-sessions-programme.sql, run those first),
-- career_readiness_items() and career_readiness_responses
-- (docs/supabase-career-readiness-programme.sql), public.mentor_reviews
-- (docs/supabase-mentor-reviews.sql), practice_attempts with server_graded
-- (docs/supabase-practice-server-grading.sql), initial_assessment_results,
-- public.is_admin().
--
-- THE METHOD (v5), the same rules as src/lib/readinessScore.ts. Only what a
-- student does ON MySkills counts; education, outside work and projects are
-- part of the profile, not the score.
--   Personal development      40   2 per Career Readiness module finished (5 = 10)
--                                  + 2 per confirmed live session (5 = 10)
--                                  + 20 when a mentor signs the programme off
--   Professional development  40   1.25 per Digital Marketing track whose best
--                                  of the last 3 SERVER-GRADED attempts is 60%+
--                                  (8 = 10) + the Foundation assessment (% / 10,
--                                  up to 10) + 2 per confirmed live training
--                                  (5 = 10) + 10 when a mentor signs off
--   Internship                20   an internship through MySkills, not open yet
-- The most that can be earned today is 80.
--
-- VERIFIED vs SELF-REPORTED: practice and the Foundation assessment are graded
-- by the server, live sessions and sign-offs confirmed by a person. Module
-- answers are self-reported until the Career Readiness sign-off.
-- Stored scores from earlier methods are replaced the next time the student
-- opens the dashboard.

create table if not exists public.career_readiness_scores (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  score                int          not null check (score between 0 and 100),
  verified_points      numeric(5,1) not null,
  self_reported_points numeric(5,1) not null,
  detail               jsonb        not null,
  method_version       text         not null,
  computed_at          timestamptz  not null default now()
);

alter table public.career_readiness_scores enable row level security;

-- Written only by the function below. A student reads their own; admins read all.
drop policy if exists "learners read own score" on public.career_readiness_scores;
create policy "learners read own score"
  on public.career_readiness_scores for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "admins read scores" on public.career_readiness_scores;
create policy "admins read scores"
  on public.career_readiness_scores for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- The calculation (internal, not callable from the browser)
-- ---------------------------------------------------------------------------
create or replace function public.compute_career_readiness_score(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c_method constant text := 'v5';
  c_mod_pts constant numeric := 2;
  c_live_pts constant numeric := 2;
  c_cr_pts constant numeric := 20;
  c_track_pts constant numeric := 1.25;
  c_dm_pts constant numeric := 10;

  v_modules int := 0;
  v_live int := 0;
  v_live_dm int := 0;
  v_cr_signed boolean := false;
  v_dm_signed boolean := false;
  v_tracks int := 0;
  v_foundation int;
  v_identity boolean := false;

  v_module_pts numeric;
  v_personal numeric;
  v_professional numeric;
begin
  if not exists (select 1 from public.profiles where id = p_user) then
    return null;
  end if;

  -- Career Readiness modules with all four items written.
  select count(*) into v_modules from (
    select c.module
      from public.career_readiness_items() c
      join public.career_readiness_responses cr
        on cr.module = c.module and cr.item = c.item and cr.profile_id = p_user
     group by c.module
    having count(*) = 4
  ) m;

  -- Confirmed live sessions, per programme.
  select count(*) filter (where a.programme = 'career-readiness'),
         count(*) filter (where a.programme = 'digital-marketing')
    into v_live, v_live_dm
    from public.live_session_attendance a where a.student_id = p_user;

  -- Mentor sign-offs.
  select exists (select 1 from public.mentor_reviews mr
                  where mr.user_id = p_user and mr.programme = 'career-readiness' and mr.status = 'approved'),
         exists (select 1 from public.mentor_reviews mr
                  where mr.user_id = p_user and mr.programme = 'digital-marketing' and mr.status = 'approved')
    into v_cr_signed, v_dm_signed;

  -- Tracks whose best of the last 3 server-graded attempts is 60%+.
  select count(*) into v_tracks from (
    select t.track_slug
      from (select pa.track_slug, pa.percent,
                   row_number() over (partition by pa.track_slug order by pa.attempted_at desc) as rn
              from public.practice_attempts pa
             where pa.profile_id = p_user and pa.server_graded) t
     where t.rn <= 3
     group by t.track_slug
    having max(t.percent) >= 60
  ) passed;

  select r.percent into v_foundation from public.initial_assessment_results r where r.profile_id = p_user;

  -- Not scored; the admin list shows it.
  select exists (select 1 from public.verified_items vi
                  where vi.user_id = p_user and vi.item_type = 'identity')
    into v_identity;

  v_module_pts   := least(v_modules, 5) * c_mod_pts;
  v_personal     := least(v_module_pts + least(v_live * c_live_pts, 10)
                          + (case when v_cr_signed then c_cr_pts else 0 end), 40);
  v_professional := least(least(v_tracks, 8) * c_track_pts
                          + coalesce(round(least(v_foundation / 10.0, 10), 1), 0)
                          + least(v_live_dm * c_live_pts, 10)
                          + (case when v_dm_signed then c_dm_pts else 0 end), 40);

  return jsonb_build_object(
    'method_version', c_method,
    'score', round(v_personal + v_professional)::int,
    -- Once a mentor has signed the programme off they have read the modules.
    'verified_points', round(v_personal + v_professional - (case when v_cr_signed then 0 else v_module_pts end), 1),
    'self_reported_points', (case when v_cr_signed then 0 else v_module_pts end),
    'identity_verified', v_identity,
    'personal', jsonb_build_object(
      'points', v_personal, 'max', 40, 'modules_done', least(v_modules, 5), 'live_sessions', v_live,
      'mentor_approved', v_cr_signed),
    'professional', jsonb_build_object(
      'points', v_professional, 'max', 40, 'tracks_passed', v_tracks, 'foundation_percent', v_foundation,
      'live_sessions', v_live_dm, 'mentor_approved', v_dm_signed),
    'internship', jsonb_build_object('points', 0, 'max', 20)
  );
end;
$$;

revoke execute on function public.compute_career_readiness_score(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- What the dashboard calls: recompute, store, return
-- ---------------------------------------------------------------------------
create or replace function public.refresh_my_career_readiness_score()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  d jsonb;
begin
  if uid is null then
    raise exception 'You are not signed in.';
  end if;
  d := public.compute_career_readiness_score(uid);
  if d is null then
    return null;
  end if;

  insert into public.career_readiness_scores
    (user_id, score, verified_points, self_reported_points, detail, method_version, computed_at)
  values
    (uid, (d ->> 'score')::int, (d ->> 'verified_points')::numeric, (d ->> 'self_reported_points')::numeric,
     d, d ->> 'method_version', now())
  on conflict (user_id) do update set
    score = excluded.score,
    verified_points = excluded.verified_points,
    self_reported_points = excluded.self_reported_points,
    detail = excluded.detail,
    method_version = excluded.method_version,
    computed_at = excluded.computed_at;

  return d || jsonb_build_object('computed_at', now());
end;
$$;

revoke execute on function public.refresh_my_career_readiness_score() from public, anon;
grant execute on function public.refresh_my_career_readiness_score() to authenticated;

-- ---------------------------------------------------------------------------
-- Check it: open the dashboard as a learner, then as admin
--   select p.full_name, s.score, s.verified_points, s.self_reported_points, s.computed_at
--     from public.career_readiness_scores s join public.profiles p on p.id = s.user_id
--    order by s.computed_at desc;
-- The dashboard number should match the one the old browser calculation shows
-- (it logs a console warning if they ever differ).
-- ---------------------------------------------------------------------------
