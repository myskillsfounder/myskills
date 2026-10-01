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
-- THE METHOD (v6), the same rules as src/lib/readinessScore.ts. Only what a
-- student does ON MySkills counts; education, outside work and aptitude
-- assessments are not part of the score.
--
-- Each programme is worth 40: a mentor-graded project (20) and activity (20).
--   Personal development      40   Career Readiness Programme
--     activity 20                   3 per module finished (5 = 15)
--                                   + 1 per confirmed live session (5 = 5)
--     project  20                   the mentor's rubric total, 0-20
--   Professional development  40   Digital Marketing Programme
--     activity 20                   per track, best of the last 3 SERVER-GRADED
--                                   attempts: 0 below 60%, then 0.25 at 60%
--                                   rising to 1.25 at 100% (8 tracks = 10)
--                                   + the Foundation assessment (% / 20, up to 5)
--                                   + 1 per confirmed live training (5 = 5)
--     project  20                   the mentor's rubric total, 0-20
--   Internship                20   the FIRST internship signed off by its host
--                                   organisation (later ones are badges, no points)
--
-- THE HOLD: until a programme's project has passed (8 of 20 or more), only the
-- first 8 of its 20 activity points count; the rest are held and released when
-- it passes. Project points always count as graded. A sign-off alone, with no
-- work behind it, is worth nothing.
--
-- Nobody earns the internship part yet, so 80 is the most today.
--
-- VERIFIED vs SELF-REPORTED: practice and the Foundation assessment are graded
-- by the server, live sessions and project grades by a person. Module answers
-- are self-reported until the Career Readiness project has passed.
-- Stored scores from earlier methods are replaced the next time the student
-- opens the dashboard, and the update at the foot of this file re-issues them all.
--
-- Run docs/supabase-programme-projects.sql FIRST: this reads its columns.

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
  c_method constant text := 'v6';
  c_mod_pts constant numeric := 3;
  c_live_pts constant numeric := 1;
  c_held_cap constant numeric := 8;   -- activity points that count before the project passes
  c_proj_max constant numeric := 20;
  c_intern_pts constant numeric := 20;

  v_modules int := 0;
  v_live int := 0;
  v_live_dm int := 0;
  v_cr_signed boolean := false;
  v_dm_signed boolean := false;
  v_cr_proj numeric := 0;
  v_dm_proj numeric := 0;
  v_cr_status text;
  v_dm_status text;
  v_tracks int := 0;
  v_track_pts numeric := 0;
  v_foundation int;
  v_identity boolean := false;
  v_interns int := 0;

  v_module_pts numeric;
  v_cr_act numeric;
  v_dm_act numeric;
  v_cr_counted numeric;
  v_dm_counted numeric;
  v_personal numeric;
  v_professional numeric;
  v_internship numeric;
  v_self numeric;
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

  -- Projects: passed (approved) or not, and the best grade across submissions.
  select exists (select 1 from public.mentor_reviews mr
                  where mr.user_id = p_user and mr.programme = 'career-readiness' and mr.status = 'approved'),
         exists (select 1 from public.mentor_reviews mr
                  where mr.user_id = p_user and mr.programme = 'digital-marketing' and mr.status = 'approved'),
         coalesce((select max(mr.project_points) from public.mentor_reviews mr
                    where mr.user_id = p_user and mr.programme = 'career-readiness'
                      and mr.project_points is not null), 0),
         coalesce((select max(mr.project_points) from public.mentor_reviews mr
                    where mr.user_id = p_user and mr.programme = 'digital-marketing'
                      and mr.project_points is not null), 0),
         (select mr.status::text from public.mentor_reviews mr
           where mr.user_id = p_user and mr.programme = 'career-readiness' and mr.status <> 'cancelled'
           order by mr.created_at desc limit 1),
         (select mr.status::text from public.mentor_reviews mr
           where mr.user_id = p_user and mr.programme = 'digital-marketing' and mr.status <> 'cancelled'
           order by mr.created_at desc limit 1)
    into v_cr_signed, v_dm_signed, v_cr_proj, v_dm_proj, v_cr_status, v_dm_status;

  -- Tracks: the best of the last 3 server-graded attempts. 0 below 60%, then
  -- 0.25 at 60% rising to 1.25 at 100%.
  select count(*) filter (where b.best >= 60),
         coalesce(sum(case when b.best >= 60 then 0.25 + (least(b.best, 100) - 60) / 40.0 else 0 end), 0)
    into v_tracks, v_track_pts
    from (
      select t.track_slug, max(t.percent) as best
        from (select pa.track_slug, pa.percent,
                     row_number() over (partition by pa.track_slug order by pa.attempted_at desc) as rn
                from public.practice_attempts pa
               where pa.profile_id = p_user and pa.server_graded) t
       where t.rn <= 3
       group by t.track_slug
    ) b;

  select r.percent into v_foundation from public.initial_assessment_results r where r.profile_id = p_user;

  -- Not scored; the admin list shows it.
  select exists (select 1 from public.verified_items vi
                  where vi.user_id = p_user and vi.item_type = 'identity')
    into v_identity;

  -- Internships signed off by their host. The first one scores; all are badges.
  select count(*) into v_interns from public.internship_signoffs where student_id = p_user;

  v_module_pts := least(v_modules, 5) * c_mod_pts;
  v_cr_act := v_module_pts + least(v_live, 5) * c_live_pts;
  -- Not coalesce(round(least(x, ...))): LEAST ignores NULLs, so a student with
  -- no Foundation result would get the maximum.
  v_dm_act := least(v_track_pts, 10)
              + (case when v_foundation is null then 0 else round(least(v_foundation, 100) / 20.0, 1) end)
              + least(v_live_dm, 5) * c_live_pts;

  -- The hold: only c_held_cap of the activity counts until the project passes.
  v_cr_counted := case when v_cr_signed then v_cr_act else least(v_cr_act, c_held_cap) end;
  v_dm_counted := case when v_dm_signed then v_dm_act else least(v_dm_act, c_held_cap) end;

  v_personal     := least(v_cr_counted + least(v_cr_proj, c_proj_max), 40);
  v_professional := least(v_dm_counted + least(v_dm_proj, c_proj_max), 40);
  v_internship   := case when v_interns > 0 then c_intern_pts else 0 end;
  -- Module answers are self-reported until the project has passed.
  v_self := case when v_cr_signed then 0 else least(v_module_pts, v_cr_counted) end;

  return jsonb_build_object(
    'method_version', c_method,
    'score', round(v_personal + v_professional + v_internship)::int,
    'verified_points', round(v_personal + v_professional + v_internship - v_self, 1),
    'self_reported_points', round(v_self, 1),
    'identity_verified', v_identity,
    'personal', jsonb_build_object(
      'points', round(v_personal, 2), 'max', 40, 'modules_done', least(v_modules, 5), 'live_sessions', v_live,
      'mentor_approved', v_cr_signed, 'activity', round(v_cr_act, 2), 'held', round(v_cr_act - v_cr_counted, 2),
      'project_points', v_cr_proj, 'project_max', 20, 'project_status', v_cr_status),
    'professional', jsonb_build_object(
      'points', round(v_professional, 2), 'max', 40, 'tracks_passed', v_tracks, 'foundation_percent', v_foundation,
      'live_sessions', v_live_dm, 'mentor_approved', v_dm_signed, 'activity', round(v_dm_act, 2),
      'held', round(v_dm_act - v_dm_counted, 2), 'project_points', v_dm_proj, 'project_max', 20,
      'project_status', v_dm_status),
    'internship', jsonb_build_object('points', v_internship, 'max', 20, 'signed_off', v_interns)
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
-- One-off after changing the method: re-issue every stored score
-- (the dashboard does this for a student the next time they open it, but the
-- admin lists read the stored rows).
-- ---------------------------------------------------------------------------
update public.career_readiness_scores s
   set score = (d.d ->> 'score')::int,
       verified_points = (d.d ->> 'verified_points')::numeric,
       self_reported_points = (d.d ->> 'self_reported_points')::numeric,
       detail = d.d,
       method_version = d.d ->> 'method_version',
       computed_at = now()
  from (select user_id, public.compute_career_readiness_score(user_id) as d
          from public.career_readiness_scores) d
 where s.user_id = d.user_id and d.d is not null;

-- ---------------------------------------------------------------------------
-- Check it: open the dashboard as a learner, then as admin
--   select p.full_name, s.score, s.verified_points, s.self_reported_points, s.computed_at
--     from public.career_readiness_scores s join public.profiles p on p.id = s.user_id
--    order by s.computed_at desc;
-- The dashboard number should match the one the old browser calculation shows
-- (it logs a console warning if they ever differ).
-- ---------------------------------------------------------------------------
