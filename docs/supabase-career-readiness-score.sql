-- The Career Readiness Score, issued by the server.
--
-- BEFORE: the score was added up in the student's browser and stored nowhere,
-- so nobody but the student could ever see or confirm it.
-- AFTER: the server works it out from records it holds — what the MySkills team
-- verified on a video call, the student's programme progress and the mentor's
-- sign-off — and stores the result with the date and the method version.
-- refresh_my_career_readiness_score() is what the dashboard calls.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on: public.profiles, public.live_session_attendance
-- (docs/supabase-live-sessions.sql — run that first), public.verified_items
-- (docs/supabase-profile-verification.sql), public.career_readiness_items() and
-- career_readiness_responses (docs/supabase-career-readiness-programme.sql),
-- public.mentor_reviews (docs/supabase-mentor-reviews.sql), public.is_admin().
--
-- THE METHOD (v3) — the same rules as src/lib/readinessScore.ts, which stays
-- as the student's "what next" guide and as a fallback if this isn't run:
--   Personal development  30   2 per Career Readiness module finished (5 x 2)
--                              + 2 per live session with a trainer, mentor or
--                              institution whose attendance was confirmed
--                              (5 sessions = 10) + 10 when a mentor signs off
--                              the programme
--   Professional          20   highest VERIFIED education level (Class 10 = 2,
--                              Class 12 = 4, Diploma = 6, Bachelor's = 8,
--                              Master's = 9, Doctorate = 10; x0.75 while in
--                              progress) + 10 when a mentor signs off the
--                              Digital Marketing practice
--   Experience            30   5 per verified internship (max 15) + 1 per
--                              verified month of other work (max 5) + 2.5 per
--                              verified project (max 10)
--   Reserved              20   not scored yet: practice results and
--                              mentor-confirmed hours, allocated later
-- Education, experience and projects count only while identity is verified and
-- the entry still matches what was checked. Skills a student lists earn no
-- points (nobody checks them). Age, institution and MySkills test scores are
-- never used. The most that can be earned today is 80.
--
-- VERIFIED vs SELF-REPORTED: education, experience, projects and the two mentor
-- sign-offs are verified by a person. Module completions (written answers no
-- one has read yet) are self-reported until the Career Readiness sign-off. The score adds both, and reports the two
-- totals separately so nobody has to guess how much of a number was checked.
-- Stored scores from method v2 are replaced the next time the student opens
-- the dashboard.

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
-- The calculation (internal — not callable from the browser)
-- ---------------------------------------------------------------------------
create or replace function public.compute_career_readiness_score(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c_method constant text := 'v3';
  c_mod_pts constant int := 2;
  c_live_pts constant int := 2;
  c_cr_pts constant int := 10;
  c_dm_pts constant int := 10;

  v_name text;
  v_dob text;
  v_edu jsonb;
  v_exp jsonb;
  v_proj jsonb;

  vsnap jsonb;
  r record;
  v_identity boolean := false;

  v_best_edu numeric := 0;
  v_edu_label text := '';
  v_lvl text;
  v_pts numeric;
  v_end int;
  v_complete boolean;

  v_internships int := 0;
  v_work_months int := 0;
  v_projects int := 0;
  v_sm text[];
  v_live_end text;
  v_em text[];
  v_start_y int; v_start_m int; v_end_y int; v_end_m int;
  v_months int;

  v_modules int := 0;
  v_live int := 0;
  v_cr_signed boolean := false;
  v_dm_signed boolean := false;

  v_prof_total numeric;
  v_exp_total numeric;
  v_personal numeric;
  v_verified numeric;
  v_self numeric;
begin
  select p.full_name, p.date_of_birth::text, p.education, p.experience
    into v_name, v_dob, v_edu, v_exp
    from public.profiles p where p.id = p_user;
  if not found then
    return null;
  end if;

  -- Projects live in their own column that may not exist on an older database.
  begin
    execute 'select projects from public.profiles where id = $1' into v_proj using p_user;
  exception when undefined_column then
    v_proj := '[]'::jsonb;
  end;

  -- Identity: verified only while name and date of birth still match the check.
  select vi.snapshot into vsnap
    from public.verified_items vi
   where vi.user_id = p_user and vi.item_type = 'identity' and vi.item_id = 'self';
  v_identity := found
    and coalesce(vsnap ->> 'full_name', '') = btrim(coalesce(v_name, ''))
    and coalesce(vsnap ->> 'date_of_birth', '') = coalesce(v_dob, '');

  if v_identity then
    -- Education: the best verified level, unchanged since it was checked.
    for r in select value as e from jsonb_array_elements(coalesce(v_edu, '[]'::jsonb)) loop
      select vi.snapshot into vsnap
        from public.verified_items vi
       where vi.user_id = p_user and vi.item_type = 'education' and vi.item_id = r.e ->> 'id';
      if found
         and coalesce(vsnap ->> 'school', '')    = btrim(coalesce(r.e ->> 'school', ''))
         and coalesce(vsnap ->> 'degree', '')    = btrim(coalesce(r.e ->> 'degree', ''))
         and coalesce(vsnap ->> 'field', '')     = btrim(coalesce(r.e ->> 'field', ''))
         and coalesce(vsnap ->> 'startYear', '') = btrim(coalesce(r.e ->> 'startYear', ''))
         and coalesce(vsnap ->> 'endYear', '')   = btrim(coalesce(r.e ->> 'endYear', ''))
         and (coalesce(r.e ->> 'level', '') = '' or coalesce(vsnap ->> 'level', '') = r.e ->> 'level')
      then
        v_lvl := coalesce(vsnap ->> 'level', '');
        v_pts := case v_lvl
                   when 'class-10' then 2 when 'class-12' then 4 when 'diploma' then 6
                   when 'bachelors' then 8 when 'masters' then 9 when 'doctorate' then 10
                   else 0 end;
        v_end := nullif(substring(coalesce(vsnap ->> 'endYear', '') from '^\s*(\d{1,4})'), '')::int;
        v_complete := v_end is not null and v_end <= extract(year from now())::int;
        if not v_complete then
          v_pts := v_pts * 0.75;
        end if;
        if v_pts > v_best_edu then
          v_best_edu := v_pts;
          v_edu_label := v_lvl || case when v_complete then '' else ' (in progress)' end;
        end if;
      end if;
    end loop;

    -- Experience: verified internships, and months of other verified work.
    for r in select value as x from jsonb_array_elements(coalesce(v_exp, '[]'::jsonb)) loop
      -- Worked out here, not inside the IF below: plpgsql ends an IF condition
      -- at the first THEN it sees, so a CASE ... THEN in the condition breaks it.
      v_live_end := case when coalesce((r.x ->> 'current')::boolean, false)
                         then '' else btrim(coalesce(r.x ->> 'endDate', '')) end;
      select vi.snapshot into vsnap
        from public.verified_items vi
       where vi.user_id = p_user and vi.item_type = 'experience' and vi.item_id = r.x ->> 'id';
      if found
         and coalesce(vsnap ->> 'title', '')          = btrim(coalesce(r.x ->> 'title', ''))
         and coalesce(vsnap ->> 'company', '')        = btrim(coalesce(r.x ->> 'company', ''))
         and coalesce(vsnap ->> 'employmentType', '') = btrim(coalesce(r.x ->> 'employmentType', ''))
         and coalesce(vsnap ->> 'startDate', '')      = btrim(coalesce(r.x ->> 'startDate', ''))
         and coalesce(vsnap ->> 'endDate', '') = v_live_end
         and coalesce((vsnap ->> 'current')::boolean, false) = coalesce((r.x ->> 'current')::boolean, false)
      then
        if (coalesce(vsnap ->> 'employmentType', '') || ' ' || coalesce(vsnap ->> 'title', '')) ~* '(intern|apprentic)' then
          v_internships := v_internships + 1;
        else
          v_sm := regexp_match(coalesce(vsnap ->> 'startDate', ''), '^(\d{4})(?:-(\d{1,2}))?$');
          if v_sm is not null then
            v_start_y := v_sm[1]::int;
            v_start_m := coalesce(v_sm[2]::int, 1);
            if coalesce((vsnap ->> 'current')::boolean, false) then
              v_end_y := extract(year from now())::int;
              v_end_m := extract(month from now())::int;
            else
              v_em := regexp_match(coalesce(vsnap ->> 'endDate', ''), '^(\d{4})(?:-(\d{1,2}))?$');
              if v_em is not null then
                v_end_y := v_em[1]::int;
                v_end_m := coalesce(v_em[2]::int, 1);
              else
                v_end_y := extract(year from now())::int;
                v_end_m := extract(month from now())::int;
              end if;
            end if;
            v_months := greatest(0, (v_end_y - v_start_y) * 12 + (v_end_m - v_start_m));
            v_work_months := v_work_months + v_months;
          end if;
        end if;
      end if;
    end loop;

    -- Projects: verified and unchanged.
    for r in select value as pr from jsonb_array_elements(coalesce(v_proj, '[]'::jsonb)) loop
      select vi.snapshot into vsnap
        from public.verified_items vi
       where vi.user_id = p_user and vi.item_type = 'project' and vi.item_id = r.pr ->> 'id';
      if found
         and coalesce(vsnap ->> 'title', '') = btrim(coalesce(r.pr ->> 'title', ''))
         and coalesce(vsnap ->> 'link', '')  = btrim(coalesce(r.pr ->> 'link', ''))
         and coalesce(vsnap ->> 'year', '')  = btrim(coalesce(r.pr ->> 'year', ''))
      then
        v_projects := v_projects + 1;
      end if;
    end loop;
  end if;

  -- Personal development: modules with all four items written, and the sign-offs.
  select count(*) into v_modules from (
    select c.module
      from public.career_readiness_items() c
      join public.career_readiness_responses cr
        on cr.module = c.module and cr.item = c.item and cr.profile_id = p_user
     group by c.module
    having count(*) = 4
  ) m;
  select count(*) into v_live from public.live_session_attendance a where a.student_id = p_user;

  select exists (select 1 from public.mentor_reviews mr
                  where mr.user_id = p_user and mr.programme = 'career-readiness' and mr.status = 'approved'),
         exists (select 1 from public.mentor_reviews mr
                  where mr.user_id = p_user and mr.programme = 'digital-marketing' and mr.status = 'approved')
    into v_cr_signed, v_dm_signed;

  v_prof_total := v_best_edu + case when v_dm_signed then c_dm_pts else 0 end;
  v_exp_total  := least(v_internships * 5, 15) + least(v_work_months, 5) + least(v_projects * 2.5, 10);
  v_personal   := least(v_modules, 5) * c_mod_pts + least(v_live * c_live_pts, 10)
                  + case when v_cr_signed then c_cr_pts else 0 end;

  -- Once a mentor has signed the programme off they have read the modules, so
  -- those points stop being self-reported.
  v_verified := v_best_edu + v_exp_total + least(v_live * c_live_pts, 10)
                + case when v_cr_signed then c_cr_pts + least(v_modules, 5) * c_mod_pts else 0 end
                + case when v_dm_signed then c_dm_pts else 0 end;
  v_self     := case when v_cr_signed then 0 else least(v_modules, 5) * c_mod_pts end;

  return jsonb_build_object(
    'method_version', c_method,
    'score', round(v_personal + v_prof_total + v_exp_total)::int,
    'verified_points', round(v_verified, 1),
    'self_reported_points', round(v_self, 1),
    'identity_verified', v_identity,
    'personal', jsonb_build_object(
      'points', v_personal, 'max', 30, 'modules_done', least(v_modules, 5), 'live_sessions', v_live,
      'mentor_approved', v_cr_signed),
    'professional', jsonb_build_object(
      'points', v_prof_total, 'max', 20, 'education_points', v_best_edu,
      'education_level', v_edu_label, 'mentor_approved', v_dm_signed),
    'experience', jsonb_build_object(
      'points', v_exp_total, 'max', 30, 'internships', v_internships,
      'work_months', v_work_months, 'projects', v_projects),
    'reserved', 20
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
