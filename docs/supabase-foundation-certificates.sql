-- A Foundation certificate for every programme.
--
-- Paul's rules (2026-10-21):
--   - Every programme has two credentials. The Foundation certificate is
--     awarded for the programme's MCQ test (the course engine's `final`, now
--     called the Foundation assessment). The Programme certificate (modules,
--     practical tasks, graded capstone) comes later and is not built here.
--   - The Foundation assessment opens once every module at level 'foundation'
--     is done. Digital Marketing keeps its Beginner-vocabulary unlock and its
--     own page (/foundation-assessment, graded by grade_initial_assessment).
--   - One attempt. Gold 80+, Silver 60+, Bronze below; every finished attempt
--     earns a certificate. The bands are TIER_THRESHOLDS in
--     src/lib/certificates.ts; certificate_band() below must match it.
--   - No Global Readiness points change.
--
-- WHAT THIS DOES
--   1. certificates gets a programme column (the programme's slug). Every
--      existing row is Digital Marketing's, so it is set to
--      'digital-marketing'; nothing else about those rows changes. One
--      certificate per student per programme instead of one per student.
--   2. certificate_band(): the band CASE, in one place for SQL.
--   3. grade_initial_assessment() (Digital Marketing) is re-issued unchanged
--      except that its certificate now names the programme.
--   4. The engine's Foundation assessment (submit_programme_final): unlock on
--      the foundation modules, one attempt, no pass mark, and a banded
--      certificate titled with the programme's name, issued here on the
--      server. Global Leadership's modules are written on its own pages, so
--      its unlock reads those answers. A programme with no 'foundation'
--      module needs every module, as before.
--   5. get_my_programme() returns the Foundation result with its band and
--      certificate code, and whether the assessment is open.
--   6. Global Leadership's Foundation questions can be added: its locked
--      structure no longer covers `final` (nothing counts those questions).
--      Digital Marketing's stay locked (they are the Foundation question ids).
--   7. Anyone who already took an engine final gets the certificate for
--      their best attempt.
--   8. admin_foundation_results() shows Digital Marketing's certificate only.
--
-- Students still have no insert, update or delete policy on certificates:
-- they read their own, and only the two grading functions write.
--
-- Run once, BEFORE the deploy (the new pages read certificates.programme and
-- the new get_my_programme fields). Safe to re-run. Run it after
-- docs/supabase-learner-events.sql, -course-engine-students.sql,
-- -builtin-programmes.sql and -admin-v2-programmes.sql.

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
-- 2. The bands: TIER_THRESHOLDS in src/lib/certificates.ts
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
-- 3. Digital Marketing: unchanged, except the certificate names the programme
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
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select exists(select 1 from public.initial_assessment_results where profile_id = uid) into already_taken;
  if already_taken then
    raise exception 'assessment already completed';
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
                       'by_category', cat_scores,
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
    'review', review
  );
end;
$$;
revoke all on function public.grade_initial_assessment(jsonb) from public, anon;
grant execute on function public.grade_initial_assessment(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. The engine's Foundation assessment
-- ---------------------------------------------------------------------------
-- Open once every 'foundation' module is done (every module, when none is
-- marked foundation). Global Leadership's modules are written on its own
-- pages, so for it "done" is every item career_readiness_items() lists.
create or replace function public.programme_foundation_unlocked(p_student uuid, p_programme public.programmes, p_content jsonb)
returns boolean
language plpgsql security definer set search_path = public stable as $$
declare
  v_modules jsonb;
  m jsonb;
begin
  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_modules
    from jsonb_array_elements(coalesce(p_content -> 'modules', '[]')) x where x ->> 'level' = 'foundation';
  if jsonb_array_length(v_modules) = 0 then
    v_modules := coalesce(p_content -> 'modules', '[]');
  end if;
  if jsonb_array_length(v_modules) = 0 then
    return false;
  end if;

  for m in select x from jsonb_array_elements(v_modules) x loop
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

create or replace function public.submit_programme_final(p_slug text, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_version int;
  v_content jsonb;
  g jsonb;
  v_attempt uuid;
  v_percent int;
  v_cert public.certificates;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  select * into r from public.programme_for_student(p_slug);
  if (r.programme).slug = 'digital-marketing' then
    raise exception 'Take the Digital Marketing Foundation assessment on its own page.';
  end if;
  v_version := (r.enrolment).version;
  if v_version is null then
    -- Built-in programmes are taken on their own pages, without an engine
    -- enrolment: this is where they get one.
    if (r.programme).source = 'built-in' then
      v_version := public.enrol_programme(p_slug);
    else
      raise exception 'Start the programme first.';
    end if;
  end if;
  v_content := public.programme_version_content((r.programme).id, v_version);

  if not public.programme_foundation_unlocked(auth.uid(), r.programme, v_content) then
    raise exception 'Finish the foundation modules first.';
  end if;
  -- One attempt, as in Digital Marketing.
  if exists (select 1 from public.programme_quiz_attempts a
              where a.student_id = auth.uid() and a.programme_id = (r.programme).id and a.module_id = 'final') then
    raise exception 'You’ve already taken the Foundation assessment.';
  end if;

  g := public.programme_grade(v_content #> '{final,questions}', p_answers);
  v_percent := (g #>> '{grade,percent}')::int;
  insert into public.programme_quiz_attempts (student_id, programme_id, version, module_id, correct, total, earned, max_weight, percent)
  values (auth.uid(), (r.programme).id, v_version, 'final',
          (g #>> '{grade,correct}')::int, (g #>> '{grade,total}')::int, (g #>> '{grade,earnedWeight}')::int,
          (g #>> '{grade,maxWeight}')::int, v_percent)
  returning id into v_attempt;
  insert into public.programme_quiz_answers (attempt_id, student_id, programme_id, question_id, selected, correct, weight, topic, difficulty)
  select v_attempt, auth.uid(), (r.programme).id, a.question_id, a.selected, a.correct, a.weight, a.topic, a.difficulty
    from jsonb_to_recordset(g -> 'rows') as a (question_id text, selected int, correct boolean, weight int, topic text, difficulty text);
  -- Every finished attempt completes the Foundation.
  update public.programme_enrolments set final_passed_at = now()
   where student_id = auth.uid() and programme_id = (r.programme).id;

  v_cert := public.issue_certificate(auth.uid(), (r.programme).slug, (r.programme).title, v_percent);

  perform public.record_learner_event(
    auth.uid(), 'programme_final', 'programme_quiz_attempts', v_attempt::text,
    'Foundation assessment · ' || (r.programme).title || ' · ' || v_percent || '% · ' || initcap(v_cert.kind),
    jsonb_build_object('programme', (r.programme).slug, 'percent', v_percent, 'kind', v_cert.kind,
                       'correct', (g #>> '{grade,correct}')::int, 'total', (g #>> '{grade,total}')::int, 'missed', g -> 'missed'));
  return jsonb_build_object('grade', g -> 'grade', 'review', g -> 'review',
                            'certificate', jsonb_build_object('code', v_cert.code, 'kind', v_cert.kind,
                                                              'percent', v_cert.percent, 'title', v_cert.title));
end $$;
revoke execute on function public.submit_programme_final(text, jsonb) from public, anon;
grant execute on function public.submit_programme_final(text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. The programme as a student sees it: the Foundation result and whether
--    it is open. Everything else as before.
-- ---------------------------------------------------------------------------
create or replace function public.get_my_programme(p_slug text) returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare
  r record;
  uid uuid := auth.uid();
  v_version int;
  v_content jsonb;
begin
  select * into r from public.programme_for_student(p_slug);
  v_version := coalesce((r.enrolment).version, (r.programme).current_version);
  v_content := public.programme_version_content((r.programme).id, v_version);
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
    'final', (select jsonb_build_object('percent', a.percent, 'correct', a.correct, 'total', a.total,
                       'completed_at', a.attempted_at, 'kind', public.certificate_band(a.percent),
                       'certificate_code', (select c.code from public.certificates c
                                             where c.profile_id = uid and c.programme = (r.programme).slug))
                from public.programme_quiz_attempts a
               where a.student_id = uid and a.programme_id = (r.programme).id and a.module_id = 'final'
               order by a.percent desc, a.attempted_at limit 1),
    'foundation_unlocked', uid is not null and public.programme_foundation_unlocked(uid, r.programme, v_content),
    'final_passed_at', (r.enrolment).final_passed_at);
end $$;
revoke execute on function public.get_my_programme(text) from public, anon;
grant execute on function public.get_my_programme(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Global Leadership's Foundation questions can be added
-- ---------------------------------------------------------------------------
-- Same as in docs/supabase-builtin-programmes.sql (keep the two in step),
-- except that Global Leadership's `final` is left out of the lock.
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
    from public.programmes pr where pr.id = p_programme
$$;
revoke execute on function public.programme_problems(uuid, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Engine finals already taken: a certificate for the best attempt
-- ---------------------------------------------------------------------------
do $$
declare
  b record;
begin
  for b in
    select distinct on (a.student_id, p.id) a.student_id, p.slug, p.title, a.percent, a.attempted_at
      from public.programme_quiz_attempts a
      join public.programmes p on p.id = a.programme_id
     where a.module_id = 'final' and p.slug <> 'digital-marketing'
     order by a.student_id, p.id, a.percent desc, a.attempted_at
  loop
    perform public.issue_certificate(b.student_id, b.slug, b.title, b.percent, b.attempted_at);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 8. Admin Foundation results: Digital Marketing's certificate
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
--   select policyname, cmd from pg_policies where tablename = 'certificates';
--   -- cert_select_own (SELECT) only
