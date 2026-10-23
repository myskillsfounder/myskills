-- The Foundation assessment: a benchmark and a certificate for every programme.
--
-- Paul's rules (2026-10-21, and the entry flow of 2026-10-23):
--   - Every programme has two credentials. The Foundation certificate is
--     awarded for the programme's MCQ test (the course engine's `final`, now
--     called the Foundation assessment). The Programme certificate (modules,
--     practical tasks, graded capstone) comes later and is not built here.
--   - The first step of every programme is "Where are you starting from?":
--       beginner     ("New to this"): aptitude self-check, the foundation
--                    modules, then the Foundation assessment, which opens once
--                    every module at level 'foundation' is done. Digital
--                    Marketing keeps its Beginner-vocabulary unlock (in the
--                    app). One attempt, always certified.
--       experienced  ("I already know some of this"): the Foundation
--                    assessment is open straight away. 60%+ earns the
--                    certificate now. Every foundation module whose skill
--                    scored 70%+ is "tested out" and counts as done for the
--                    unlock. Below 60% is a benchmark only: no certificate, no
--                    Global Readiness points. Once the modules of the skills
--                    under 70% are done, ONE more attempt, always certified.
--     The choice can change until the first Foundation attempt.
--   - Bands: Gold 80+, Silver 60+, Bronze below (TIER_THRESHOLDS in
--     src/lib/certificates.ts; certificate_band() below must match it).
--   - Scores: only the certificate attempt counts. Digital Marketing's still
--     lands in initial_assessment_results (the Global Readiness Score reads
--     it); a benchmark never does. No score rule changes.
--
-- WHAT THIS DOES
--   1. certificates gets a programme column (the programme's slug). Every
--      existing row is Digital Marketing's, so it is set to
--      'digital-marketing'; nothing else about those rows changes. One
--      certificate per student per programme instead of one per student.
--   2. certificate_band() and issue_certificate(): the bands and the issuing,
--      in one place for SQL.
--   3. programme_entry_paths: each student's starting point per programme
--      (by slug, so it works for the engine, Digital Marketing and Global
--      Leadership alike). set_programme_path() sets it.
--   4. foundation_attempts: every Foundation attempt, with its kind
--      (benchmark or certificate), path, version and per-skill result, for
--      the course team to compare entry with end-of-foundation by version.
--      admin_foundation_attempts() reads it.
--   5. A Foundation question can carry a `skill` (a skill id); results are
--      worked out per skill. Publishing an engine programme needs every skill
--      with a foundation module covered by at least 2 Foundation questions
--      (built-in programmes: a warning in the editor until tagged).
--   6. grade_initial_assessment() (Digital Marketing) and
--      submit_programme_final() (every other programme) follow the paths.
--      A benchmark's correct answers are not shown, since the same questions
--      come back on the second attempt.
--   7. get_my_programme() and get_foundation_status() return the path, the
--      benchmark, the per-skill results, the tested-out and gap modules, and
--      whether the next attempt is open.
--   8. Global Leadership's Foundation questions can be added: its locked
--      structure no longer covers `final` (nothing counts those questions).
--   9. Attempts already taken are recorded (as certificate attempts), with a
--      certificate for any engine final already taken.
--  10. admin_foundation_results() shows Digital Marketing's certificate.
--
-- Students still have no insert, update or delete policy on certificates,
-- programme_entry_paths or foundation_attempts: everything goes through the
-- functions here.
--
-- Run once, BEFORE the deploy (the new pages call these functions and read
-- certificates.programme). Safe to re-run. Run it after
-- docs/supabase-learner-events.sql, -course-engine-students.sql,
-- -builtin-programmes.sql, -admin-v2-programmes.sql and
-- -practice-server-grading.sql.

-- ---------------------------------------------------------------------------
-- 1. One certificate per student per programme
-- ---------------------------------------------------------------------------
alter table public.certificates add column if not exists programme text;
update public.certificates set programme = 'digital-marketing' where programme is null;
alter table public.certificates alter column programme set not null;

alter table public.certificates drop constraint if exists certificates_profile_id_key;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'certificates_profile_programme_key') then
    alter table public.certificates
      add constraint certificates_profile_programme_key unique (profile_id, programme);
  end if;
end $$;

-- Reading your own stays; writing is the grading functions' job alone.
drop policy if exists cert_insert_own on public.certificates;
drop policy if exists cert_update_own on public.certificates;
drop policy if exists cert_delete_own on public.certificates;

-- ---------------------------------------------------------------------------
-- 2. The bands (TIER_THRESHOLDS in src/lib/certificates.ts), and issuing
-- ---------------------------------------------------------------------------
create or replace function public.certificate_band(p_percent int) returns text
language sql immutable as $$
  select case
    when p_percent >= 80 then 'gold'
    when p_percent >= 60 then 'silver'
    else 'bronze'
  end
$$;

-- Issue a student's certificate for a programme (once; a second call keeps
-- the first). Internal: only the grading functions call it.
create or replace function public.issue_certificate(p_student uuid, p_programme text, p_title text,
                                                    p_percent int, p_issued_at timestamptz default now())
returns public.certificates
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
  v_cert public.certificates;
begin
  select coalesce(nullif(trim(p.full_name), ''), split_part(u.email, '@', 1), 'Member')
    into v_name
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.id = p_student;

  insert into public.certificates (profile_id, programme, code, recipient_name, kind, percent, title, issued_at)
  values (p_student, p_programme,
          'MSK-' || upper(substr(md5(p_student::text || clock_timestamp()::text || random()::text), 1, 4))
            || '-' || upper(substr(md5(random()::text), 1, 4))
            || '-' || upper(substr(md5(random()::text), 1, 4)),
          coalesce(v_name, 'Member'), public.certificate_band(p_percent), p_percent, p_title, p_issued_at)
  on conflict (profile_id, programme) do nothing;

  select * into v_cert from public.certificates where profile_id = p_student and programme = p_programme;
  return v_cert;
end $$;
revoke execute on function public.issue_certificate(uuid, text, text, int, timestamptz) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Where each student starts, per programme
-- ---------------------------------------------------------------------------
create table if not exists public.programme_entry_paths (
  student_id uuid not null references auth.users (id) on delete cascade,
  programme  text not null,
  path       text not null check (path in ('beginner', 'experienced')),
  chosen_at  timestamptz not null default now(),
  primary key (student_id, programme)
);
alter table public.programme_entry_paths enable row level security;

-- ---------------------------------------------------------------------------
-- 4. Every Foundation attempt
-- ---------------------------------------------------------------------------
create table if not exists public.foundation_attempts (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references auth.users (id) on delete cascade,
  programme    text not null,
  version      int,
  kind         text not null check (kind in ('benchmark', 'certificate')),
  path         text not null check (path in ('beginner', 'experienced')),
  correct      int not null,
  total        int not null,
  percent      int not null,
  -- {skill id: {correct, total, percent}}; empty while the questions carry no skill.
  by_skill     jsonb not null default '{}'::jsonb,
  -- A benchmark keeps its answers here (Digital Marketing's certificate
  -- answers stay in foundation_answers, as before).
  answers      jsonb,
  attempted_at timestamptz not null default now()
);
create index if not exists foundation_attempts_student_idx
  on public.foundation_attempts (student_id, programme, attempted_at);
create index if not exists foundation_attempts_programme_idx
  on public.foundation_attempts (programme, version, kind);
-- One certificate attempt per student per programme.
create unique index if not exists foundation_attempts_one_certificate
  on public.foundation_attempts (student_id, programme) where kind = 'certificate';
alter table public.foundation_attempts enable row level security;
-- No policies on either table: everything goes through the functions below.

-- ---------------------------------------------------------------------------
-- 5. Helpers
-- ---------------------------------------------------------------------------
-- A published programme and the student's enrolment, like
-- programme_for_student() but for built-in programmes too: Digital Marketing
-- and Global Leadership have a starting point and a Foundation assessment as
-- well. (programme_for_student() stays engine-only for the engine's pages.)
create or replace function public.programme_for_foundation(p_slug text, out programme public.programmes,
                                                           out enrolment public.programme_enrolments)
language plpgsql security definer set search_path = public stable as $$
begin
  select * into programme from public.programmes where slug = p_slug and status = 'published';
  if programme.id is null then
    raise exception 'That programme isn’t available.';
  end if;
  select * into enrolment from public.programme_enrolments
   where student_id = auth.uid() and programme_id = programme.id;
end $$;
revoke execute on function public.programme_for_foundation(text) from public, anon, authenticated;

-- The published content of a programme, by slug.
create or replace function public.programme_published_content(p_slug text) returns jsonb
language sql security definer set search_path = public stable as $$
  select v.content from public.programmes p
    join public.programme_versions v on v.programme_id = p.id and v.version = p.current_version
   where p.slug = p_slug
$$;
revoke execute on function public.programme_published_content(text) from public, anon, authenticated;

-- Per-skill results of an attempt: {skill: {correct, total, percent}}, by
-- weight, from the questions that carry a skill.
create or replace function public.foundation_skill_results(p_questions jsonb, p_answers jsonb) returns jsonb
language sql immutable as $$
  select coalesce(jsonb_object_agg(skill, jsonb_build_object(
           'correct', correct, 'total', total,
           'percent', case when max_w > 0 then round(earned::numeric / max_w * 100)::int else 0 end)), '{}'::jsonb)
    from (
      select q ->> 'skill' as skill,
             count(*) filter (where (p_answers ->> (q ->> 'id')) = (q ->> 'correct_index')) as correct,
             count(*) as total,
             sum(greatest(coalesce((q ->> 'weight')::int, 1), 1))
               filter (where (p_answers ->> (q ->> 'id')) = (q ->> 'correct_index')) as earned,
             sum(greatest(coalesce((q ->> 'weight')::int, 1), 1)) as max_w
        from jsonb_array_elements(coalesce(p_questions, '[]')) q
       where coalesce(btrim(q ->> 'skill'), '') <> ''
       group by q ->> 'skill'
    ) s
$$;

-- The student's path in a programme; null until chosen (treated as beginner).
create or replace function public.programme_entry_path(p_student uuid, p_slug text) returns text
language sql security definer set search_path = public stable as $$
  select path from public.programme_entry_paths where student_id = p_student and programme = p_slug
$$;
revoke execute on function public.programme_entry_path(uuid, text) from public, anon, authenticated;

-- The per-skill result that places an experienced student: their first
-- attempt, when they took it on the experienced path.
create or replace function public.foundation_placement(p_student uuid, p_slug text) returns jsonb
language sql security definer set search_path = public stable as $$
  select a.by_skill from public.foundation_attempts a
   where a.student_id = p_student and a.programme = p_slug
   order by a.attempted_at limit 1
$$;
revoke execute on function public.foundation_placement(uuid, text) from public, anon, authenticated;

-- The modules at level 'foundation' (every module, when none is marked).
create or replace function public.programme_foundation_modules(p_content jsonb) returns jsonb
language sql immutable as $$
  select case when exists (select 1 from jsonb_array_elements(coalesce(p_content -> 'modules', '[]')) x where x ->> 'level' = 'foundation')
              then (select jsonb_agg(x) from jsonb_array_elements(p_content -> 'modules') x where x ->> 'level' = 'foundation')
              else coalesce(p_content -> 'modules', '[]') end
$$;

-- Foundation modules placed by the first experienced attempt: tested out
-- (skill 70%+) and gaps (skill below 70%). A module whose skill no question
-- tested is neither.
create or replace function public.foundation_module_placement(p_student uuid, p_slug text, p_content jsonb,
                                                              out tested_out jsonb, out gaps jsonb)
language plpgsql security definer set search_path = public stable as $$
declare
  v_place jsonb := case when exists (select 1 from public.foundation_attempts a
                                      where a.student_id = p_student and a.programme = p_slug and a.path = 'experienced')
                        then public.foundation_placement(p_student, p_slug) end;
begin
  select coalesce(jsonb_agg(m ->> 'id') filter (where (v_place #>> array[m ->> 'skill', 'percent'])::int >= 70), '[]'::jsonb),
         coalesce(jsonb_agg(m ->> 'id') filter (where (v_place #>> array[m ->> 'skill', 'percent'])::int < 70), '[]'::jsonb)
    into tested_out, gaps
    from jsonb_array_elements(public.programme_foundation_modules(p_content)) m;
end $$;
revoke execute on function public.foundation_module_placement(uuid, text, jsonb) from public, anon, authenticated;

-- Every foundation module done or tested out. Global Leadership's modules are
-- written on its own pages, so for it "done" is every item
-- career_readiness_items() lists.
create or replace function public.programme_foundation_unlocked(p_student uuid, p_programme public.programmes, p_content jsonb)
returns boolean
language plpgsql security definer set search_path = public stable as $$
declare
  v_modules jsonb := public.programme_foundation_modules(p_content);
  v_tested jsonb := (public.foundation_module_placement(p_student, p_programme.slug, p_content)).tested_out;
  m jsonb;
begin
  if jsonb_array_length(v_modules) = 0 then
    return false;
  end if;
  for m in select x from jsonb_array_elements(v_modules) x loop
    continue when v_tested ? (m ->> 'id');
    if p_programme.source = 'built-in' and p_programme.slug = 'global-leadership' then
      if exists (select 1 from public.career_readiness_items() i
                  where i.module = m ->> 'id'
                    and not exists (select 1 from public.career_readiness_responses r
                                     where r.profile_id = p_student and r.module = i.module and r.item = i.item)) then
        return false;
      end if;
    elsif not public.programme_module_done(p_student, p_programme.id, m) then
      return false;
    end if;
  end loop;
  return true;
end $$;
revoke execute on function public.programme_foundation_unlocked(uuid, public.programmes, jsonb) from public, anon, authenticated;

-- Digital Marketing's second attempt: its tracks have no done-gate, so the
-- gap tracks (the foundation tracks whose skill was under 70%) need a
-- practice best of 60% or more. Null while its questions carry no skill
-- (the app then keeps the Beginner-vocabulary unlock).
create or replace function public.dm_gap_tracks_practised(p_student uuid, p_content jsonb) returns boolean
language plpgsql security definer set search_path = public stable as $$
declare
  v_gaps jsonb := (public.foundation_module_placement(p_student, 'digital-marketing', p_content)).gaps;
begin
  if public.foundation_placement(p_student, 'digital-marketing') = '{}'::jsonb then
    return null;
  end if;
  return not exists (
    select 1 from jsonb_array_elements_text(v_gaps) g
     where coalesce((select b.percent from public.practice_best_scores b
                      where b.profile_id = p_student and b.track_slug = g), 0) < 60);
end $$;
revoke execute on function public.dm_gap_tracks_practised(uuid, jsonb) from public, anon, authenticated;

-- Where a student stands with a programme's Foundation assessment.
--   open: the server would accept the next attempt now. For Digital
--   Marketing's beginners (and a second attempt before its questions carry a
--   skill) the app also applies the Beginner-vocabulary unlock.
create or replace function public.foundation_status(p_student uuid, p_programme public.programmes, p_content jsonb) returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare
  v_path text := public.programme_entry_path(p_student, p_programme.slug);
  v_cert public.foundation_attempts;
  v_bench public.foundation_attempts;
  v_place record;
  v_open boolean;
begin
  select * into v_cert from public.foundation_attempts
   where student_id = p_student and programme = p_programme.slug and kind = 'certificate';
  select * into v_bench from public.foundation_attempts
   where student_id = p_student and programme = p_programme.slug and kind = 'benchmark'
   order by attempted_at limit 1;
  select * into v_place from public.foundation_module_placement(p_student, p_programme.slug, p_content);

  v_open := case
    when p_student is null or v_cert.id is not null then false
    when v_path = 'experienced' and v_bench.id is null then true
    when p_programme.slug = 'digital-marketing' then
      coalesce(v_bench.id is null or public.dm_gap_tracks_practised(p_student, p_content), true)
    else public.programme_foundation_unlocked(p_student, p_programme, p_content)
  end;

  return jsonb_build_object(
    'path', v_path,
    -- The path can change until the first attempt.
    'switchable', v_cert.id is null and v_bench.id is null,
    'benchmark', case when v_bench.id is not null then jsonb_build_object(
                   'percent', v_bench.percent, 'correct', v_bench.correct, 'total', v_bench.total,
                   'by_skill', v_bench.by_skill, 'attempted_at', v_bench.attempted_at) end,
    'certificate_attempt', case when v_cert.id is not null then jsonb_build_object(
                   'percent', v_cert.percent, 'correct', v_cert.correct, 'total', v_cert.total, 'path', v_cert.path,
                   'by_skill', v_cert.by_skill, 'attempted_at', v_cert.attempted_at,
                   'kind', public.certificate_band(v_cert.percent),
                   'certificate_code', (select c.code from public.certificates c
                                         where c.profile_id = p_student and c.programme = p_programme.slug)) end,
    'placement', public.foundation_placement(p_student, p_programme.slug),
    'tested_out', v_place.tested_out,
    'gaps', v_place.gaps,
    'open', v_open);
end $$;
revoke execute on function public.foundation_status(uuid, public.programmes, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Choosing the path, and reading the status (Digital Marketing and Global
--    Leadership; engine programmes get it inside get_my_programme)
-- ---------------------------------------------------------------------------
create or replace function public.set_programme_path(p_slug text, p_path text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  if p_path not in ('beginner', 'experienced') then
    raise exception 'Choose “New to this” or “I already know some of this”.';
  end if;
  select * into r from public.programme_for_foundation(p_slug);
  if exists (select 1 from public.foundation_attempts where student_id = auth.uid() and programme = p_slug)
     or (p_slug = 'digital-marketing' and exists (select 1 from public.initial_assessment_results where profile_id = auth.uid())) then
    raise exception 'Your starting point is set once you’ve taken the Foundation assessment.';
  end if;
  insert into public.programme_entry_paths (student_id, programme, path)
  values (auth.uid(), p_slug, p_path)
  on conflict (student_id, programme) do update set path = excluded.path, chosen_at = now();
  return public.foundation_status(auth.uid(), r.programme, public.programme_published_content(p_slug));
end $$;

create or replace function public.get_foundation_status(p_slug text) returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare
  r record;
  v_content jsonb;
begin
  select * into r from public.programme_for_foundation(p_slug);
  v_content := public.programme_version_content((r.programme).id,
                 coalesce((r.enrolment).version, (r.programme).current_version));
  return public.foundation_status(auth.uid(), r.programme, v_content)
    || jsonb_build_object(
         'skills', coalesce(v_content -> 'skills', '[]'),
         'modules', coalesce((select jsonb_agg(jsonb_build_object('id', m ->> 'id', 'title', m ->> 'title', 'skill', m ->> 'skill'))
                                from jsonb_array_elements(public.programme_foundation_modules(v_content)) m), '[]'::jsonb),
         'questions', coalesce(jsonb_array_length(v_content #> '{final,questions}'), 0),
         'minutes', coalesce((v_content #>> '{final,minutes}')::int, 30));
end $$;

revoke execute on function public.set_programme_path(text, text) from public, anon;
revoke execute on function public.get_foundation_status(text) from public, anon;
grant execute on function public.set_programme_path(text, text) to authenticated;
grant execute on function public.get_foundation_status(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Digital Marketing's Foundation assessment
-- ---------------------------------------------------------------------------
create or replace function public.grade_initial_assessment(answers jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  already_taken boolean;
  rec record;
  total_correct int := 0;
  total_count int := 0;
  cat_scores jsonb := '{}'::jsonb;
  -- Safe to hand back once grading is final and one-time-only: per-question
  -- correct answers for the post-quiz review screen. Revealing these AFTER
  -- the graded, unrepeatable attempt can't be used to game that attempt.
  review jsonb := '{}'::jsonb;
  overall_percent int;
  v_answers jsonb := '[]'::jsonb;
  v_content jsonb := public.programme_published_content('digital-marketing');
  v_version int := (select current_version from public.programmes where slug = 'digital-marketing');
  v_path text;
  v_bench boolean;
  v_kind text;
  v_by_skill jsonb;
  v_attempt uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select exists(select 1 from public.initial_assessment_results where profile_id = uid) into already_taken;
  if already_taken then
    raise exception 'assessment already completed';
  end if;

  v_path := coalesce(public.programme_entry_path(uid, 'digital-marketing'), 'beginner');
  select exists(select 1 from public.foundation_attempts
                 where student_id = uid and programme = 'digital-marketing' and kind = 'benchmark') into v_bench;
  -- The second attempt waits for the gap tracks (once the questions carry a skill).
  if v_bench and public.dm_gap_tracks_practised(uid, v_content) is false then
    raise exception 'Practise the tracks marked “Recommended start” first (60%% or more in each).';
  end if;

  for rec in
    select q.id, q.category, k.correct_index, k.explanation,
           (answers ->> q.id)::int as selected
    from public.initial_assessment_questions q
    join public.initial_assessment_answer_key k on k.question_id = q.id
  loop
    total_count := total_count + 1;
    cat_scores := jsonb_set(
      cat_scores,
      array[rec.category],
      jsonb_build_object(
        'correct', coalesce((cat_scores -> rec.category ->> 'correct')::int, 0)
                   + (case when rec.selected = rec.correct_index then 1 else 0 end),
        'total',   coalesce((cat_scores -> rec.category ->> 'total')::int, 0) + 1
      ),
      true
    );
    review := review || jsonb_build_object(
      rec.id,
      jsonb_build_object('correctIndex', rec.correct_index, 'explanation', rec.explanation)
    );
    if rec.selected = rec.correct_index then
      total_correct := total_correct + 1;
    end if;
    v_answers := v_answers || jsonb_build_array(jsonb_build_object(
      'question_id', rec.id, 'category', rec.category, 'selected', rec.selected,
      'correct', coalesce(rec.selected = rec.correct_index, false)));
  end loop;

  if total_count = 0 then
    raise exception 'no questions found';
  end if;

  overall_percent := round((total_correct::numeric / total_count) * 100);
  -- Skills come from the programme's Foundation questions (same ids), with
  -- the answer key as the source of the right answers.
  v_by_skill := public.foundation_skill_results(
    (select coalesce(jsonb_agg(q || jsonb_build_object('correct_index', k.correct_index)), '[]'::jsonb)
       from jsonb_array_elements(coalesce(v_content #> '{final,questions}', '[]')) q
       join public.initial_assessment_answer_key k on k.question_id = q ->> 'id'),
    answers);
  v_kind := case when v_path = 'experienced' and not v_bench and overall_percent < 60 then 'benchmark' else 'certificate' end;

  insert into public.foundation_attempts (student_id, programme, version, kind, path, correct, total, percent, by_skill, answers)
  values (uid, 'digital-marketing', v_version, v_kind, v_path, total_correct, total_count, overall_percent, v_by_skill,
          case when v_kind = 'benchmark' then answers end)
  returning id into v_attempt;

  if v_kind = 'benchmark' then
    -- A benchmark: nothing the score or the certificate reads, and no answers
    -- revealed, because the same questions come back on the second attempt.
    perform public.record_learner_event(
      uid, 'foundation', 'foundation_attempts', v_attempt::text,
      'Foundation benchmark · ' || overall_percent || '% · no certificate yet',
      jsonb_build_object('percent', overall_percent, 'correct', total_correct, 'total', total_count,
                         'kind', 'benchmark', 'path', v_path, 'version', v_version,
                         'by_category', cat_scores, 'by_skill', v_by_skill));
    return json_build_object(
      'correct', total_correct, 'total', total_count, 'percent', overall_percent,
      'byCategory', (select coalesce(jsonb_agg(jsonb_build_object(
                       'category', key, 'correct', (value ->> 'correct')::int, 'total', (value ->> 'total')::int)), '[]'::jsonb)
                       from jsonb_each(cat_scores)),
      'review', '{}'::jsonb,
      'kind', 'benchmark', 'bySkill', v_by_skill);
  end if;

  insert into public.initial_assessment_results (profile_id, correct, total, percent, completed_at)
  values (uid, total_correct, total_count, overall_percent, now());

  insert into public.initial_assessment_category_scores (profile_id, category, correct, total, percent)
  select
    uid,
    key,
    (value ->> 'correct')::int,
    (value ->> 'total')::int,
    round(((value ->> 'correct')::numeric / nullif((value ->> 'total')::int, 0)) * 100)
  from jsonb_each(cat_scores);

  insert into public.foundation_answers (profile_id, question_id, category, selected, correct)
  select uid, a.question_id, a.category, a.selected, a.correct
    from jsonb_to_recordset(v_answers) as a (question_id text, category text, selected int, correct boolean)
  on conflict (profile_id, question_id) do nothing;

  perform public.record_learner_event(
    uid, 'foundation', 'initial_assessment_results', uid::text,
    'Foundation assessment · ' || overall_percent || '%',
    jsonb_build_object('percent', overall_percent, 'correct', total_correct, 'total', total_count,
                       'kind', 'certificate', 'path', v_path, 'version', v_version,
                       'by_category', cat_scores, 'by_skill', v_by_skill,
                       'missed', (select coalesce(jsonb_agg(jsonb_build_object('question_id', a ->> 'question_id', 'category', a ->> 'category')), '[]'::jsonb)
                                    from jsonb_array_elements(v_answers) a where not (a ->> 'correct')::boolean)));

  -- Same title as every Digital Marketing certificate so far.
  perform public.issue_certificate(uid, 'digital-marketing', 'Digital Marketing', overall_percent);

  return json_build_object(
    'correct', total_correct,
    'total', total_count,
    'percent', overall_percent,
    'byCategory', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'category', key,
               'correct', (value ->> 'correct')::int,
               'total', (value ->> 'total')::int
             )), '[]'::jsonb)
      from jsonb_each(cat_scores)
    ),
    -- {question_id: {correctIndex, explanation}} — safe now that grading is
    -- final; the client uses this to render "here's what you missed."
    'review', review,
    'kind', 'certificate',
    'bySkill', v_by_skill
  );
end;
$$;
revoke all on function public.grade_initial_assessment(jsonb) from public, anon;
grant execute on function public.grade_initial_assessment(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Every other programme's Foundation assessment
-- ---------------------------------------------------------------------------
create or replace function public.submit_programme_final(p_slug text, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_version int;
  v_content jsonb;
  v_status jsonb;
  v_path text;
  g jsonb;
  v_attempt uuid;
  v_percent int;
  v_by_skill jsonb;
  v_kind text;
  v_cert public.certificates;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  select * into r from public.programme_for_foundation(p_slug);
  if (r.programme).slug = 'digital-marketing' then
    raise exception 'Take the Digital Marketing Foundation assessment on its own page.';
  end if;
  v_version := (r.enrolment).version;
  if v_version is null then
    -- Built-in programmes are taken on their own pages, without an engine
    -- enrolment: this is where they get one.
    if (r.programme).source = 'built-in' then
      insert into public.programme_enrolments (student_id, programme_id, version)
      values (auth.uid(), (r.programme).id, (r.programme).current_version)
      on conflict (student_id, programme_id) do nothing;
      v_version := (r.programme).current_version;
    else
      raise exception 'Start the programme first.';
    end if;
  end if;
  v_content := public.programme_version_content((r.programme).id, v_version);
  v_status := public.foundation_status(auth.uid(), r.programme, v_content);
  v_path := coalesce(v_status ->> 'path', 'beginner');

  if v_status -> 'certificate_attempt' <> 'null'::jsonb then
    raise exception 'You’ve already taken the Foundation assessment.';
  end if;
  if not (v_status ->> 'open')::boolean then
    raise exception '%', case when v_status -> 'benchmark' <> 'null'::jsonb
                              then 'Finish the modules for the skills you’re building first, then take it again.'
                              else 'Finish the foundation modules first.' end;
  end if;

  g := public.programme_grade(v_content #> '{final,questions}', p_answers);
  v_percent := (g #>> '{grade,percent}')::int;
  v_by_skill := public.foundation_skill_results(v_content #> '{final,questions}', p_answers);
  v_kind := case when v_path = 'experienced' and v_status -> 'benchmark' = 'null'::jsonb and v_percent < 60
                 then 'benchmark' else 'certificate' end;

  insert into public.programme_quiz_attempts (student_id, programme_id, version, module_id, correct, total, earned, max_weight, percent)
  values (auth.uid(), (r.programme).id, v_version, 'final',
          (g #>> '{grade,correct}')::int, (g #>> '{grade,total}')::int, (g #>> '{grade,earnedWeight}')::int,
          (g #>> '{grade,maxWeight}')::int, v_percent)
  returning id into v_attempt;
  insert into public.programme_quiz_answers (attempt_id, student_id, programme_id, question_id, selected, correct, weight, topic, difficulty)
  select v_attempt, auth.uid(), (r.programme).id, a.question_id, a.selected, a.correct, a.weight, a.topic, a.difficulty
    from jsonb_to_recordset(g -> 'rows') as a (question_id text, selected int, correct boolean, weight int, topic text, difficulty text);
  insert into public.foundation_attempts (id, student_id, programme, version, kind, path, correct, total, percent, by_skill, answers)
  values (v_attempt, auth.uid(), (r.programme).slug, v_version, v_kind, v_path,
          (g #>> '{grade,correct}')::int, (g #>> '{grade,total}')::int, v_percent, v_by_skill,
          case when v_kind = 'benchmark' then p_answers end);

  if v_kind = 'certificate' then
    update public.programme_enrolments set final_passed_at = now()
     where student_id = auth.uid() and programme_id = (r.programme).id;
    v_cert := public.issue_certificate(auth.uid(), (r.programme).slug, (r.programme).title, v_percent);
  end if;

  perform public.record_learner_event(
    auth.uid(), 'programme_final', 'programme_quiz_attempts', v_attempt::text,
    case when v_kind = 'benchmark'
         then 'Foundation benchmark · ' || (r.programme).title || ' · ' || v_percent || '% · no certificate yet'
         else 'Foundation assessment · ' || (r.programme).title || ' · ' || v_percent || '% · ' || initcap(v_cert.kind) end,
    jsonb_build_object('programme', (r.programme).slug, 'percent', v_percent, 'kind', v_kind, 'path', v_path,
                       'version', v_version, 'band', v_cert.kind, 'by_skill', v_by_skill,
                       'correct', (g #>> '{grade,correct}')::int, 'total', (g #>> '{grade,total}')::int, 'missed', g -> 'missed'));
  return jsonb_build_object(
    'grade', g -> 'grade',
    -- A benchmark's answers aren't revealed: the same questions come back.
    'review', case when v_kind = 'benchmark' then '{}'::jsonb else g -> 'review' end,
    'kind', v_kind,
    'by_skill', v_by_skill,
    'certificate', case when v_cert.code is not null then jsonb_build_object(
                     'code', v_cert.code, 'kind', v_cert.kind, 'percent', v_cert.percent, 'title', v_cert.title) end);
end $$;
revoke execute on function public.submit_programme_final(text, jsonb) from public, anon;
grant execute on function public.submit_programme_final(text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. The programme as a student sees it: the Foundation status too.
--    Everything else as before.
-- ---------------------------------------------------------------------------
create or replace function public.get_my_programme(p_slug text) returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare
  r record;
  uid uuid := auth.uid();
  v_version int;
  v_content jsonb;
  v_status jsonb;
begin
  select * into r from public.programme_for_foundation(p_slug);
  v_version := coalesce((r.enrolment).version, (r.programme).current_version);
  v_content := public.programme_version_content((r.programme).id, v_version);
  v_status := public.foundation_status(uid, r.programme, v_content);
  return jsonb_build_object(
    'slug', (r.programme).slug, 'title', (r.programme).title, 'kind', (r.programme).kind,
    'source', (r.programme).source,
    'version', v_version, 'latest_version', (r.programme).current_version,
    'enrolled', (r.enrolment).student_id is not null,
    'started_at', (r.enrolment).started_at,
    'content', public.programme_public_content(v_content),
    'aptitude', (select jsonb_build_object('scores', a.scores, 'completed_at', a.completed_at)
                   from public.programme_aptitude_results a where a.student_id = uid and a.programme_id = (r.programme).id),
    'responses', coalesce((select jsonb_object_agg(x.module_id, x.items) from (
                   select pr.module_id, jsonb_object_agg(pr.item, pr.response) as items
                     from public.programme_responses pr
                    where pr.student_id = uid and pr.programme_id = (r.programme).id
                    group by pr.module_id) x), '{}'::jsonb),
    'quizzes', coalesce((select jsonb_object_agg(x.module_id, jsonb_build_object(
                   'best', x.best, 'attempts', x.n, 'last_at', x.last_at,
                   'next_at', x.last_at + interval '24 hours'))
                   from (select a.module_id, max(a.percent) as best, count(*) as n, max(a.attempted_at) as last_at
                           from public.programme_quiz_attempts a
                          where a.student_id = uid and a.programme_id = (r.programme).id and a.module_id <> 'final'
                          group by a.module_id) x), '{}'::jsonb),
    -- The certificate attempt.
    'final', v_status -> 'certificate_attempt',
    'foundation', v_status,
    'foundation_unlocked', coalesce((v_status ->> 'open')::boolean, false),
    'final_passed_at', (r.enrolment).final_passed_at);
end $$;
revoke execute on function public.get_my_programme(text) from public, anon;
grant execute on function public.get_my_programme(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 10. Publishing: Foundation questions name a real skill, and every skill
--     with a foundation module has at least 2 of them (engine programmes;
--     built-in ones show it as a warning in the editor until tagged).
--     Global Leadership's `final` is outside its locked structure.
-- ---------------------------------------------------------------------------
-- Keep in step with scripts/builtin-programmes.template.sql (the same
-- function) and publishProblems() in agents/lib/checks.mjs.
create or replace function public.programme_foundation_problems(p jsonb, p_built_in boolean) returns text[]
language sql immutable as $$
  select coalesce(array_agg(x order by n), '{}')
    from (
      select 'Foundation assessment: a question names a skill that does not exist' as x, 1 as n
       where exists (select 1 from jsonb_array_elements(coalesce(p #> '{final,questions}', '[]')) q
                      where coalesce(btrim(q ->> 'skill'), '') <> ''
                        and not exists (select 1 from jsonb_array_elements(coalesce(p -> 'skills', '[]')) s where s ->> 'id' = q ->> 'skill'))
      union all
      select 'Foundation assessment: skill "' || s || '" needs at least 2 questions', 2
        from (select distinct m ->> 'skill' as s
                from jsonb_array_elements(coalesce(p -> 'modules', '[]')) m
               -- The foundation modules (every module, when none is marked).
               where coalesce(m ->> 'skill', '') <> ''
                 and (m ->> 'level' = 'foundation'
                      or not exists (select 1 from jsonb_array_elements(coalesce(p -> 'modules', '[]')) x
                                      where x ->> 'level' = 'foundation'))) fs
       where not p_built_in
         and (select count(*) from jsonb_array_elements(coalesce(p #> '{final,questions}', '[]')) q where q ->> 'skill' = fs.s) < 2
    ) t
$$;

create or replace function public.programme_problems(p_programme uuid, p_content jsonb) returns text[]
language sql stable security definer set search_path = public as $$
  select case
           when pr.source = 'built-in'
            and case when pr.slug = 'global-leadership'
                     then (public.programme_structure(p_content) - 'final') is distinct from (pr.structure - 'final')
                     else public.programme_structure(p_content) is distinct from pr.structure end then
             array[pr.title || ': modules, tasks, questions and statements can''t be added, removed or reordered yet, because students'' progress and scores count them. Change their wording instead.']
           else '{}'::text[]
         end || public.programme_content_problems(p_content)
             || public.programme_foundation_problems(p_content, pr.source = 'built-in')
    from public.programmes pr where pr.id = p_programme
$$;
revoke execute on function public.programme_problems(uuid, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 11. Attempts already taken: recorded as certificate attempts, and a
--     certificate for any engine final (best attempt)
-- ---------------------------------------------------------------------------
do $$
declare
  b record;
begin
  for b in
    select distinct on (a.student_id, p.id) a.id, a.student_id, p.slug, p.title, a.version, a.correct, a.total, a.percent, a.attempted_at
      from public.programme_quiz_attempts a
      join public.programmes p on p.id = a.programme_id
     where a.module_id = 'final' and p.slug <> 'digital-marketing'
     order by a.student_id, p.id, a.percent desc, a.attempted_at
  loop
    perform public.issue_certificate(b.student_id, b.slug, b.title, b.percent, b.attempted_at);
    insert into public.foundation_attempts (id, student_id, programme, version, kind, path, correct, total, percent, attempted_at)
    values (b.id, b.student_id, b.slug, b.version, 'certificate', 'beginner', b.correct, b.total, b.percent, b.attempted_at)
    on conflict do nothing;
  end loop;

  insert into public.foundation_attempts (student_id, programme, kind, path, correct, total, percent, attempted_at)
  select r.profile_id, 'digital-marketing', 'certificate', 'beginner', r.correct, r.total, r.percent, r.completed_at
    from public.initial_assessment_results r
   where not exists (select 1 from public.foundation_attempts f
                      where f.student_id = r.profile_id and f.programme = 'digital-marketing' and f.kind = 'certificate');
end $$;

-- ---------------------------------------------------------------------------
-- 12. Staff: every Foundation attempt of a programme, to compare entry with
--     end-of-foundation results by version
-- ---------------------------------------------------------------------------
create or replace function public.admin_foundation_attempts(p_slug text)
returns table (student_id uuid, full_name text, version int, kind text, path text, percent int,
               correct int, total int, by_skill jsonb, attempted_at timestamptz)
language plpgsql security definer set search_path = public stable as $$
#variable_conflict use_column
begin
  if not (public.has_section_access('programmes') or public.has_section_access('assessment')) then
    raise exception 'Not authorised.';
  end if;
  return query
  select a.student_id, p.full_name, a.version, a.kind, a.path, a.percent, a.correct, a.total, a.by_skill, a.attempted_at
    from public.foundation_attempts a
    left join public.profiles p on p.id = a.student_id
   where a.programme = p_slug
   order by a.attempted_at desc;
end $$;
revoke execute on function public.admin_foundation_attempts(text) from public, anon;
grant execute on function public.admin_foundation_attempts(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 13. Admin Foundation results: Digital Marketing's certificate
-- ---------------------------------------------------------------------------
create or replace function public.admin_foundation_results()
returns table (user_id uuid, full_name text, email text, percent int, correct int, total int,
               completed_at timestamptz, certificate_code text, certificate_kind text)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not (public.has_section_access('users') or public.has_section_access('assessment')) then
    raise exception 'Not authorised.';
  end if;

  return query
  select r.profile_id, p.full_name, u.email::text, r.percent, r.correct, r.total, r.completed_at,
         c.code, c.kind
    from public.initial_assessment_results r
    join public.profiles p on p.id = r.profile_id
    join auth.users u on u.id = r.profile_id
    left join public.certificates c on c.profile_id = r.profile_id and c.programme = 'digital-marketing'
   order by r.completed_at desc;
end;
$$;
revoke execute on function public.admin_foundation_results() from public, anon;
grant execute on function public.admin_foundation_results() to authenticated;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--   select programme, count(*) from public.certificates group by 1;
--   -- every row from before this file: 'digital-marketing'
--   select conname from pg_constraint where conrelid = 'public.certificates'::regclass;
--   -- certificates_profile_programme_key, and no certificates_profile_id_key
--   select policyname, cmd from pg_policies
--    where tablename in ('certificates', 'programme_entry_paths', 'foundation_attempts');
--   -- cert_select_own (SELECT) only
--   select programme, kind, count(*) from public.foundation_attempts group by 1, 2;
--   -- one certificate row per Digital Marketing result and per engine final
