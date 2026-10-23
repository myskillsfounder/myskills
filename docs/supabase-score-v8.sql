-- The Global Readiness Score, method v8: several professional programmes.
--
-- Paul (24 Oct 2026): the Global Leadership Programme adds to the PERSONAL
-- part; Digital Marketing, Data Analytics and every other professional
-- programme add to the PROFESSIONAL part. With more than one professional
-- programme, Professional is the AVERAGE of the ones the student has
-- started (starting a new one lowers it until it's done), and every finished
-- programme is a Completed badge.
--
--   40  Personal       Global Leadership, unchanged (v7)
--   40  Professional   the average of the started professional programmes,
--                      each worth 40 in the same shape:
--                        activity 20  modules 10 (shared equally; Digital
--                                     Marketing's 8 tracks as before),
--                                     Foundation certificate % / 20 (5),
--                                     live sessions 1 each (5)
--                        project  20  graded by the mentor
--                      the hold as before: 8 activity points count until
--                      the project passes.
--                      "Started" means real work in it: Digital Marketing
--                      practice, its Foundation attempt, a project or a live
--                      session; a course-engine programme once the student
--                      starts it (an aptitude test alone isn't a start).
--                      "Completed" means its project passed.
--   20  Internship     the first confirmed internship, unchanged
--
-- A student with Digital Marketing only keeps exactly the same score.
-- detail.professional gains `programmes` (each started programme, its points
-- and whether it's completed) and `averaged_over`.
--
-- Run once, BEFORE OR AFTER the deploy (the app reads the new fields if they
-- are there). It re-issues every stored score at the end. Safe to re-run.
-- Depends on docs/supabase-life-readiness-modules.sql (v7),
-- -course-engine-students.sql and -foundation-certificates.sql.

create or replace function public.compute_career_readiness_score(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c_method constant text := 'v8';
  c_mod_total constant numeric := 25;   -- shared by the fourteen modules
  c_modules constant int := 14;
  c_cr_proj_pts constant numeric := 15; -- the Global Leadership project: its grade (0-20) counts out of 15
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
  -- v8: every professional programme the student has started, averaged.
  v_dm_started boolean := false;
  v_dm_points numeric;
  v_progs jsonb := '[]'::jsonb;
  v_sum numeric := 0;
  v_n int := 0;
  e record;
  v_content jsonb;
  v_mod_total int;
  v_mod_done int;
  v_found int;
  v_e_live int;
  v_e_act numeric;
  v_e_signed boolean;
  v_e_proj numeric;
  v_e_status text;
  v_e_counted numeric;
  v_e_points numeric;
begin
  if not exists (select 1 from public.profiles where id = p_user) then
    return null;
  end if;

  -- Global Leadership modules with all their items written (three or four each).
  select count(*) into v_modules from (
    select c.module
      from public.career_readiness_items() c
      join public.career_readiness_responses cr
        on cr.module = c.module and cr.item = c.item and cr.profile_id = p_user
     group by c.module
    having count(*) = (select count(*) from public.career_readiness_items() i where i.module = c.module)
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

  v_module_pts := least(v_modules, c_modules) * c_mod_total / c_modules;
  -- Global Leadership live sessions are on the record, not scored (v7).
  v_cr_act := v_module_pts;
  -- Not coalesce(round(least(x, ...))): LEAST ignores NULLs, so a student with
  -- no Foundation result would get the maximum.
  v_dm_act := least(v_track_pts, 10)
              + (case when v_foundation is null then 0 else round(least(v_foundation, 100) / 20.0, 1) end)
              + least(v_live_dm, 5) * c_live_pts;

  -- The hold: only c_held_cap of the activity counts until the project passes.
  v_cr_counted := case when v_cr_signed then v_cr_act else least(v_cr_act, c_held_cap) end;
  v_dm_counted := case when v_dm_signed then v_dm_act else least(v_dm_act, c_held_cap) end;

  v_personal     := least(v_cr_counted + least(v_cr_proj, c_proj_max) * c_cr_proj_pts / c_proj_max, 40);
  -- v8: Professional is the AVERAGE of the professional programmes the
  -- student has started (Paul, 24 Oct 2026). Each is worth 40 in the same
  -- shape: activity 20 (modules 10, Foundation 5, live sessions 5) held at 8
  -- until its mentor-graded project (20) passes. A programme counts as
  -- started with real work in it, not an aptitude test alone.
  v_dm_points := least(v_dm_counted + least(v_dm_proj, c_proj_max), 40);
  v_dm_started := exists (select 1 from public.practice_attempts pa where pa.profile_id = p_user)
               or v_foundation is not null
               or exists (select 1 from public.foundation_attempts fa where fa.student_id = p_user and fa.programme = 'digital-marketing')
               or v_dm_status is not null
               or v_live_dm > 0;
  if v_dm_started then
    v_sum := v_sum + v_dm_points;
    v_n := v_n + 1;
    v_progs := v_progs || jsonb_build_array(jsonb_build_object(
      'slug', 'digital-marketing', 'title', 'Digital Marketing', 'points', round(v_dm_points, 2),
      'activity', round(v_dm_act, 2), 'held', round(v_dm_act - v_dm_counted, 2),
      'project_points', v_dm_proj, 'project_status', v_dm_status, 'completed', v_dm_signed));
  end if;

  -- Course-engine professional programmes the student has started.
  for e in
    select p.id, p.slug, p.title, en.version
      from public.programme_enrolments en
      join public.programmes p on p.id = en.programme_id
     where en.student_id = p_user and p.kind = 'professional' and p.source = 'engine'
  loop
    v_content := public.programme_version_content(e.id, e.version);
    v_mod_total := coalesce(jsonb_array_length(v_content -> 'modules'), 0);
    select count(*) filter (where public.programme_module_done(p_user, e.id, m.x)) into v_mod_done
      from jsonb_array_elements(coalesce(v_content -> 'modules', '[]')) as m(x);
    select fa.percent into v_found from public.foundation_attempts fa
     where fa.student_id = p_user and fa.programme = e.slug and fa.kind = 'certificate';
    select count(*) into v_e_live from public.live_session_attendance a
     where a.student_id = p_user and a.programme = e.slug;
    v_e_act := (case when v_mod_total > 0 then 10.0 * v_mod_done / v_mod_total else 0 end)
               + (case when v_found is null then 0 else round(least(v_found, 100) / 20.0, 1) end)
               + least(v_e_live, 5) * c_live_pts;
    select exists (select 1 from public.mentor_reviews mr
                    where mr.user_id = p_user and mr.programme = e.slug and mr.status = 'approved'),
           coalesce((select max(mr.project_points) from public.mentor_reviews mr
                      where mr.user_id = p_user and mr.programme = e.slug and mr.project_points is not null), 0),
           (select mr.status::text from public.mentor_reviews mr
             where mr.user_id = p_user and mr.programme = e.slug and mr.status <> 'cancelled'
             order by mr.created_at desc limit 1)
      into v_e_signed, v_e_proj, v_e_status;
    v_e_counted := case when v_e_signed then v_e_act else least(v_e_act, c_held_cap) end;
    v_e_points := least(v_e_counted + least(v_e_proj, c_proj_max), 40);
    v_sum := v_sum + v_e_points;
    v_n := v_n + 1;
    v_progs := v_progs || jsonb_build_array(jsonb_build_object(
      'slug', e.slug, 'title', e.title, 'points', round(v_e_points, 2),
      'activity', round(v_e_act, 2), 'held', round(v_e_act - v_e_counted, 2),
      'modules_done', v_mod_done, 'modules_total', v_mod_total, 'foundation_percent', v_found,
      'live_sessions', v_e_live, 'project_points', v_e_proj, 'project_status', v_e_status,
      'completed', v_e_signed));
  end loop;

  v_professional := case when v_n = 0 then 0 else v_sum / v_n end;
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
      'points', round(v_personal, 2), 'max', 40, 'modules_done', least(v_modules, c_modules), 'modules_total', c_modules, 'live_sessions', v_live,
      'mentor_approved', v_cr_signed, 'activity', round(v_cr_act, 2), 'held', round(v_cr_act - v_cr_counted, 2),
      'project_points', round(least(v_cr_proj, c_proj_max) * c_cr_proj_pts / c_proj_max, 2),
      'project_grade', v_cr_proj, 'project_max', c_cr_proj_pts, 'project_status', v_cr_status),
    'professional', jsonb_build_object(
      'points', round(v_professional, 2), 'max', 40, 'tracks_passed', v_tracks, 'foundation_percent', v_foundation,
      'live_sessions', v_live_dm, 'mentor_approved', v_dm_signed, 'activity', round(v_dm_act, 2),
      'held', round(v_dm_act - v_dm_counted, 2), 'project_points', v_dm_proj, 'project_max', 20,
      'project_status', v_dm_status,
      -- v8: the average is over these; 'completed' ones are badges too.
      'programmes', v_progs, 'averaged_over', v_n),
    'internship', jsonb_build_object('points', v_internship, 'max', 20, 'signed_off', v_interns)
  );
end;
$$;

revoke execute on function public.compute_career_readiness_score(uuid) from public, anon, authenticated;

-- Re-issue every stored score under v8.
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

-- Check: every stored score is v8.
select method_version, count(*) as scores from public.career_readiness_scores group by 1;
