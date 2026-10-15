-- The Life Readiness Programme: fourteen modules, one for each skill in the
-- Life aptitude test, and the Career Readiness Score's method v7.
--
-- MODULES
--   The five core modules stay as they are (three written tasks and a
--   reflection each). Nine new ones, one per WHO life skill that had no
--   module, have two tasks and a reflection: self-awareness, empathy, critical-thinking, creative-thinking, decision-making, problem-solving, relationships, coping-stress, coping-emotions.
--   The project still opens once the five CORE modules are written
--   (career_readiness_core_items); the nine count toward finishing the
--   programme and toward the score.
--
-- THE SCORE, method v7 (Life Readiness only; Digital Marketing is unchanged)
--   Personal development stays out of 40:
--     modules 25   the fourteen modules share 25 points (about 1.8 each)
--     project 15   the mentor's rubric grade, 0-20, counted out of 15
--   Life Readiness live sessions stay on the record but no longer score.
--   The hold is unchanged: until the project passes, 8 activity points count.
--   Every stored score is re-issued at the end, so the admin lists match.
--
-- THE LIFE APTITUDE TEST
--   A student whose result is from the earlier, five-skill test may take the
--   Life aptitude test once; it replaces the result and the earlier scores
--   are kept beside it (previous_scores).
--
-- ORDER: run this BEFORE deploying. The app this goes with saves answers to
-- the new modules, which the database refuses until this has run; the app
-- before it works unchanged with this. Safe to re-run.
-- Depends on: docs/supabase-career-readiness-programme.sql, -score.sql,
-- -programme-projects.sql, -skill-badges.sql, -admin-v2.sql,
-- -admin-v2-programmes.sql and -life-skills.sql.

-- ---------------------------------------------------------------------------
-- 1. The modules and what each asks for
-- ---------------------------------------------------------------------------
create or replace function public.career_readiness_items()
returns table (module text, item text)
language sql
immutable
as $$
  select m, i
    from unnest(array['goal-setting', 'communication', 'leadership', 'agile', 'growth-mindset']) as m,
         unnest(array['t1', 't2', 't3', 'reflect']) as i
  union all
  select m, i
    from unnest(array['self-awareness', 'empathy', 'critical-thinking', 'creative-thinking', 'decision-making', 'problem-solving', 'relationships', 'coping-stress', 'coping-emotions']) as m,
         unnest(array['t1', 't2', 'reflect']) as i;
$$;

-- What the project needs: the five core modules, in full.
create or replace function public.career_readiness_core_items()
returns table (module text, item text)
language sql
immutable
as $$
  select m, i
    from unnest(array['goal-setting', 'communication', 'leadership', 'agile', 'growth-mindset']) as m,
         unnest(array['t1', 't2', 't3', 'reflect']) as i;
$$;

-- Answers may be saved for any of the fourteen.
do $$
declare
  c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.career_readiness_responses'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%goal-setting%'
  loop
    execute format('alter table public.career_readiness_responses drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.career_readiness_responses
  add constraint career_readiness_responses_module_check
  check (module in ('goal-setting', 'communication', 'leadership', 'agile', 'growth-mindset', 'self-awareness', 'empathy', 'critical-thinking', 'creative-thinking', 'decision-making', 'problem-solving', 'relationships', 'coping-stress', 'coping-emotions'));

-- ---------------------------------------------------------------------------
-- 2. The project still opens after the five core modules: the live functions
--    that check it are changed in place to count the core items.
-- ---------------------------------------------------------------------------
do $$
declare
  f record;
  d text;
begin
  for f in
    select p.oid from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public'
       and p.proname in ('submit_programme_project', 'request_mentor_review')
       and p.prosrc like '%career_readiness_items()%'
  loop
    d := replace(pg_get_functiondef(f.oid), 'public.career_readiness_items()', 'public.career_readiness_core_items()');
    execute d;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. The Career Readiness Score, method v7
-- ---------------------------------------------------------------------------
create or replace function public.compute_career_readiness_score(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c_method constant text := 'v7';
  c_mod_total constant numeric := 25;   -- shared by the fourteen modules
  c_modules constant int := 14;
  c_cr_proj_pts constant numeric := 15; -- the Life Readiness project: its grade (0-20) counts out of 15
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

  -- Life Readiness modules with all their items written (three or four each).
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
  -- Life Readiness live sessions are on the record, not scored (v7).
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
      'points', round(v_personal, 2), 'max', 40, 'modules_done', least(v_modules, c_modules), 'modules_total', c_modules, 'live_sessions', v_live,
      'mentor_approved', v_cr_signed, 'activity', round(v_cr_act, 2), 'held', round(v_cr_act - v_cr_counted, 2),
      'project_points', round(least(v_cr_proj, c_proj_max) * c_cr_proj_pts / c_proj_max, 2),
      'project_grade', v_cr_proj, 'project_max', c_cr_proj_pts, 'project_status', v_cr_status),
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
-- 4. Skill badges: a mentor can award one for each of the fourteen
-- ---------------------------------------------------------------------------
create or replace function public.programme_skills(p_programme text)
returns setof text
language sql
immutable
as $$
  select unnest(case p_programme
    when 'digital-marketing' then array['marketing-fundamentals', 'market-research', 'meta-ads', 'google-ads',
                                        'seo-aeo', 'analytics', 'content-marketing', 'marketing-automation-ai']
    when 'career-readiness'  then array['goal-setting', 'communication', 'leadership', 'agile', 'growth-mindset', 'self-awareness', 'empathy', 'critical-thinking', 'creative-thinking', 'decision-making', 'problem-solving', 'relationships', 'coping-stress', 'coping-emotions']
    else array[]::text[]
  end);
$$;

create or replace function public.skill_progress(p_student uuid, p_programme text, p_skill text)
returns table (earned boolean, result text)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_pct int;
  v_items int;
  v_needed int;
begin
  if p_programme = 'digital-marketing' then
    select b.percent into v_pct from public.practice_best_scores b
     where b.profile_id = p_student and b.track_slug = p_skill;
    return query select coalesce(v_pct, 0) >= 60,
                        case when v_pct is null then 'Not practised yet' else v_pct || '%' end;
  else
    select count(*) into v_needed from public.career_readiness_items() i where i.module = p_skill;
    select count(*) into v_items from public.career_readiness_responses r
     where r.profile_id = p_student and r.module = p_skill;
    return query select v_needed > 0 and v_items >= v_needed, v_items || ' of ' || v_needed || ' written';
  end if;
end;
$$;
revoke execute on function public.skill_progress(uuid, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Admin: a module is finished when all its own items are written, and
--    "all modules written" means all fourteen
-- ---------------------------------------------------------------------------
create or replace function public.admin_cr_modules()
returns table (module text, started int, finished int)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not (public.has_section_access('users') or public.has_section_access('mentor-reviews')) then
    raise exception 'Not authorised.';
  end if;

  return query
  select m.module, count(*)::int,
         count(*) filter (where m.n >= (select count(*) from public.career_readiness_items() i where i.module = m.module))::int
    from (select r.module, r.profile_id, count(*) as n
            from public.career_readiness_responses r
           group by r.module, r.profile_id) m
   group by m.module;
end;
$$;

revoke execute on function public.admin_cr_modules() from public, anon;
grant execute on function public.admin_cr_modules() to authenticated;

do $$
declare
  f record;
  d text;
begin
  for f in
    select p.oid from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public' and p.prosrc like '%from cr_modules where n >= 20%'
  loop
    d := replace(pg_get_functiondef(f.oid), 'from cr_modules where n >= 20',
                 'from cr_modules where n >= (select count(*) from public.career_readiness_items())');
    execute d;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 6. The Life aptitude test: an earlier, five-skill result may be replaced once
-- ---------------------------------------------------------------------------
create or replace function public.submit_career_readiness_assessment(
  p_answers    jsonb,
  p_reflection text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid        uuid := auth.uid();
  v_existing   int;
  v_expected   int;
  v_valid      int;
  v_scores     jsonb;
  v_reflection text := nullif(btrim(coalesce(p_reflection, '')), '');
begin
  if v_uid is null then
    raise exception 'You are not signed in.';
  end if;
  select version into v_existing from public.career_readiness_assessment_results where profile_id = v_uid;
  if v_existing is not null and v_existing >= 2 then
    raise exception 'You have already taken this assessment.';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Please answer every question.';
  end if;

  -- Every statement of the profile answered, with a value of 1-4.
  select count(*) into v_expected from public.career_readiness_assessment_questions where version = 2;
  select count(*) into v_valid
    from public.career_readiness_assessment_questions q
    join jsonb_each_text(p_answers) a on a.key = q.id
   where q.version = 2 and a.value in ('1', '2', '3', '4');
  if v_expected = 0 or v_valid <> v_expected then
    raise exception 'Please answer every question.';
  end if;
  if v_reflection is not null and length(v_reflection) > 500 then
    raise exception 'Please keep your answer under 500 characters.';
  end if;

  select jsonb_object_agg(s.skill, s.total)
    into v_scores
    from (
      select q.skill,
             sum(case when q.reverse then 5 - a.value::int else a.value::int end)::int as total
        from public.career_readiness_assessment_questions q
        join jsonb_each_text(p_answers) a on a.key = q.id
       where q.version = 2
       group by q.skill
    ) s;

  insert into public.career_readiness_assessment_results (profile_id, answers, scores, reflection, version)
  values (v_uid, p_answers, v_scores, v_reflection, 2)
  on conflict (profile_id) do update
    set previous_scores = public.career_readiness_assessment_results.scores,
        previous_completed_at = public.career_readiness_assessment_results.completed_at,
        answers = excluded.answers,
        scores = excluded.scores,
        reflection = excluded.reflection,
        version = 2,
        completed_at = now();

  return jsonb_build_object('scores', v_scores, 'reflection', v_reflection);
end;
$$;
revoke execute on function public.submit_career_readiness_assessment(jsonb, text) from public, anon;
grant execute on function public.submit_career_readiness_assessment(jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Re-issue every stored score under v7
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

-- Check: 14 modules (5 with 4 items, 9 with 3), and the scores re-issued.
select module, count(*) as items from public.career_readiness_items() group by module order by 2 desc, 1;
select method_version, count(*) as scores from public.career_readiness_scores group by 1;
