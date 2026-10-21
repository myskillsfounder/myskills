-- Global Leadership and Digital Marketing, moved onto the course engine.
-- GENERATED from scripts/builtin-programmes.template.sql by
-- scripts/generate-builtin-programmes.mjs: edit the template, not this file.
--
-- WHAT THIS DOES
--   1. The engine becomes flexible enough for both: a module can be any mix of
--      Learn, Practise tasks, Reflect and a quiz (tasks or a quiz at least);
--      the final assessment is optional; a question can carry a full case
--      (company, role, background, objective, constraints) and, after the
--      attempt, why the other options are wrong and what it teaches.
--   2. Both programmes are imported as version 1, built from what students
--      see today: the module text and practice questions from the app's code
--      (below), the aptitude statements, practice answers and Foundation
--      questions from the database. Nothing is retyped.
--   3. From now on they are edited in Admin > Programmes > Course engine.
--      Publishing a new version makes it live:
--        - the app's pages load the published wording (module text, practice
--          questions, track and module names), with today's text as fallback;
--        - the database copies the pages and grading already use are updated
--          from it (aptitude statements, practice answer keys and
--          explanations, Foundation questions and answers).
--      Progress, grading and the Global Readiness Score work exactly as today.
--   4. Their STRUCTURE is locked for now: wording, questions, options, answers
--      and explanations can change, but modules, tasks, questions and
--      statements can't be added, removed or reordered, because progress and
--      scores count them. That waits for the scoring decision.
--   5. They don't appear in the engine's own catalogue (/programmes lists
--      them as the existing pages they already are).
--
-- Run once, BEFORE the deploy. Safe to re-run: the import happens only once;
-- later runs never overwrite edits. If the import finds a problem it stops
-- with the list and changes nothing.
-- Depends on docs/supabase-course-engine.sql and -course-engine-students.sql.

-- ---------------------------------------------------------------------------
-- 1. Built-in programmes and their locked structure
-- ---------------------------------------------------------------------------
alter table public.programmes
  add column if not exists source text not null default 'engine' check (source in ('engine', 'built-in')),
  add column if not exists structure jsonb;

-- The ids, in order, that progress and scores count on.
create or replace function public.programme_structure(c jsonb) returns jsonb
language sql immutable as $$
  select jsonb_build_object(
    'skills', coalesce((select jsonb_agg(x ->> 'id' order by n) from jsonb_array_elements(coalesce(c -> 'skills', '[]')) with ordinality t(x, n)), '[]'::jsonb),
    'aptitude', coalesce((select jsonb_agg(x ->> 'id' order by n) from jsonb_array_elements(coalesce(c #> '{aptitude,items}', '[]')) with ordinality t(x, n)), '[]'::jsonb),
    'modules', coalesce((select jsonb_agg(jsonb_build_object(
        'id', m ->> 'id',
        'tasks', coalesce((select jsonb_agg(k ->> 'id' order by kn) from jsonb_array_elements(coalesce(m -> 'tasks', '[]')) with ordinality u(k, kn)), '[]'::jsonb),
        'quiz', coalesce((select jsonb_agg(q ->> 'id' order by qn) from jsonb_array_elements(coalesce(m -> 'quiz', '[]')) with ordinality v(q, qn)), '[]'::jsonb)) order by n)
      from jsonb_array_elements(coalesce(c -> 'modules', '[]')) with ordinality t(m, n)), '[]'::jsonb),
    'final', coalesce((select jsonb_agg(x ->> 'id' order by n) from jsonb_array_elements(coalesce(c #> '{final,questions}', '[]')) with ordinality t(x, n)), '[]'::jsonb))
$$;

-- ---------------------------------------------------------------------------
-- 2. The flexible checks
-- ---------------------------------------------------------------------------
create or replace function public.programme_content_problems(p jsonb) returns text[]
language plpgsql immutable as $$
declare
  v text[] := '{}';
  v_skills text[];
  m jsonb;
  q jsonb;
  s text;
  v_where text;
  v_ids text[] := '{}';
  v_tasks int;
  v_quiz int;
  v_final int;
begin
  if coalesce(btrim(p #>> '{overview,summary}'), '') = '' then v := v || 'Overview: write a summary'::text; end if;
  if coalesce(jsonb_array_length(p #> '{overview,outcomes}'), 0) = 0 then v := v || 'Overview: add at least one outcome'::text; end if;

  select coalesce(array_agg(x ->> 'id'), '{}') into v_skills from jsonb_array_elements(coalesce(p -> 'skills', '[]')) x;
  if cardinality(v_skills) = 0 then v := v || 'Skills: add at least one skill'::text; end if;
  if exists (select 1 from jsonb_array_elements(coalesce(p -> 'skills', '[]')) x where coalesce(btrim(x ->> 'id'), '') = '' or coalesce(btrim(x ->> 'name'), '') = '') then
    v := v || 'Skills: every skill needs a name'::text;
  end if;
  if cardinality(v_skills) <> (select count(distinct x) from unnest(v_skills) x) then v := v || 'Skills: two skills share an id'::text; end if;

  -- Aptitude: at least two statements per skill, so one odd answer can't decide it.
  foreach s in array v_skills loop
    if (select count(*) from jsonb_array_elements(coalesce(p #> '{aptitude,items}', '[]')) i
         where i ->> 'skill' = s and coalesce(btrim(i ->> 'statement'), '') <> '') < 2 then
      v := v || ('Aptitude: skill "' || s || '" needs at least 2 statements');
    end if;
  end loop;
  if exists (select 1 from jsonb_array_elements(coalesce(p #> '{aptitude,items}', '[]')) i where not (i ->> 'skill' = any (v_skills))) then
    v := v || 'Aptitude: a statement belongs to a skill that does not exist'::text;
  end if;

  if coalesce(jsonb_array_length(p -> 'modules'), 0) = 0 then v := v || 'Modules: add at least one module'::text; end if;
  for m in select x from jsonb_array_elements(coalesce(p -> 'modules', '[]')) x loop
    v_where := 'Module "' || coalesce(nullif(btrim(m ->> 'title'), ''), m ->> 'id', '?') || '"';
    v_tasks := coalesce(jsonb_array_length(m -> 'tasks'), 0);
    v_quiz := coalesce(jsonb_array_length(m -> 'quiz'), 0);
    if coalesce(btrim(m ->> 'id'), '') = '' or coalesce(btrim(m ->> 'title'), '') = '' then v := v || (v_where || ': needs an id and a title'); end if;
    if not (coalesce(m ->> 'skill', '') = any (v_skills)) then v := v || (v_where || ': pick the skill it trains'); end if;
    -- Any mix of parts, as long as there is something to do.
    if v_tasks = 0 and v_quiz = 0 then v := v || (v_where || ': add Practise tasks, a quiz, or both'); end if;
    if v_tasks > 0 and coalesce(btrim(m #>> '{reflection,prompt}'), '') = '' then v := v || (v_where || ': write the Reflect prompt'); end if;
    if exists (select 1 from jsonb_array_elements(coalesce(m -> 'tasks', '[]')) t where coalesce(btrim(t ->> 'prompt'), '') = '') then
      v := v || (v_where || ': a Practise task has no instructions');
    end if;
    if v_quiz between 1 and 2 then v := v || (v_where || ': a quiz needs at least 3 questions'); end if;
    for q in select x from jsonb_array_elements(coalesce(m -> 'quiz', '[]')) x loop
      v := v || public.programme_question_problems(q, v_where || ' quiz');
      v_ids := v_ids || coalesce(q ->> 'id', '');
    end loop;
    v_ids := v_ids || coalesce(m ->> 'id', '');
  end loop;

  -- The final assessment is optional; when there is one, at least 5 questions.
  v_final := coalesce(jsonb_array_length(p #> '{final,questions}'), 0);
  if v_final between 1 and 4 then v := v || 'Final assessment: add at least 5 questions, or none'::text; end if;
  for q in select x from jsonb_array_elements(coalesce(p #> '{final,questions}', '[]')) x loop
    v := v || public.programme_question_problems(q, 'Final assessment');
    v_ids := v_ids || coalesce(q ->> 'id', '');
  end loop;
  if cardinality(v_ids) <> (select count(distinct x) from unnest(v_ids) x) then
    v := v || 'Two modules or questions share an id'::text;
  end if;

  if coalesce(btrim(p #>> '{project,brief}'), '') = '' then v := v || 'Project: write the brief'::text; end if;
  if coalesce(jsonb_array_length(p #> '{project,rubric}'), 0) = 0 then v := v || 'Project: the rubric needs at least one criterion'::text; end if;

  return (select coalesce(array_agg(x order by n), '{}')
            from (select x, min(n) as n from unnest(v) with ordinality as t(x, n) group by x) s);
end $$;

-- A programme's problems: the content's, plus the lock on a built-in one.
-- Global Leadership's Foundation questions (`final`) are outside the lock:
-- nothing counts them (docs/supabase-foundation-certificates.sql).
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

-- Never sent to students before an attempt: answers, explanations, why the
-- others are wrong, what it teaches, and which statements are reversed.
create or replace function public.programme_public_content(p jsonb) returns jsonb
language sql immutable as $$
  select p
    || jsonb_build_object('aptitude', jsonb_build_object('items', coalesce((
         select jsonb_agg(i - 'reverse' order by n) from jsonb_array_elements(coalesce(p #> '{aptitude,items}', '[]')) with ordinality as t(i, n)), '[]'::jsonb)))
    || jsonb_build_object('modules', coalesce((
         select jsonb_agg(
                  m || jsonb_build_object('quiz', coalesce((
                    select jsonb_agg(q - 'correct_index' - 'explanation' - 'why_wrong' - 'learning_outcome' order by qn)
                      from jsonb_array_elements(coalesce(m -> 'quiz', '[]')) with ordinality as u(q, qn)), '[]'::jsonb))
                  order by n)
           from jsonb_array_elements(coalesce(p -> 'modules', '[]')) with ordinality as t(m, n)), '[]'::jsonb))
    || jsonb_build_object('final', coalesce(p -> 'final', '{}'::jsonb) || jsonb_build_object('questions', coalesce((
         select jsonb_agg(q - 'correct_index' - 'explanation' - 'why_wrong' - 'learning_outcome' order by n)
           from jsonb_array_elements(coalesce(p #> '{final,questions}', '[]')) with ordinality as t(q, n)), '[]'::jsonb)))
$$;

-- A module is done: every task (and the reflection, when it has tasks) written,
-- and its quiz passed when it has one.
create or replace function public.programme_module_done(p_student uuid, p_programme uuid, p_module jsonb) returns boolean
language sql security definer set search_path = public stable as $$
  select
    (select count(*) from public.programme_responses r
      where r.student_id = p_student and r.programme_id = p_programme and r.module_id = p_module ->> 'id'
        and (r.item = 'reflect' or r.item in (select t ->> 'id' from jsonb_array_elements(coalesce(p_module -> 'tasks', '[]')) t)))
      >= coalesce(jsonb_array_length(p_module -> 'tasks'), 0)
         + case when coalesce(jsonb_array_length(p_module -> 'tasks'), 0) > 0 then 1 else 0 end
    and (coalesce(jsonb_array_length(p_module -> 'quiz'), 0) = 0
         or coalesce((select max(a.percent) from public.programme_quiz_attempts a
                       where a.student_id = p_student and a.programme_id = p_programme and a.module_id = p_module ->> 'id'), 0) >= 60)
$$;
revoke execute on function public.programme_module_done(uuid, uuid, jsonb) from public, anon, authenticated;

-- Grade answers against a list of questions; returns the grade, the review
-- (now with why the others are wrong and what it teaches), every answer and
-- the topics missed.
create or replace function public.programme_grade(p_questions jsonb, p_answers jsonb) returns jsonb
language plpgsql immutable as $$
declare
  q jsonb;
  v_sel int;
  v_ok boolean;
  v_total int := 0;
  v_correct int := 0;
  v_earned int := 0;
  v_max int := 0;
  v_w int;
  v_review jsonb := '{}'::jsonb;
  v_rows jsonb := '[]'::jsonb;
  v_missed jsonb := '[]'::jsonb;
begin
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Send your answers as an object of question id to option.';
  end if;
  for q in select x from jsonb_array_elements(coalesce(p_questions, '[]')) x loop
    v_total := v_total + 1;
    v_w := greatest(coalesce((q ->> 'weight')::int, 1), 1);
    v_max := v_max + v_w;
    if not (p_answers ? (q ->> 'id')) then
      raise exception 'Answer every question before submitting.';
    end if;
    begin
      v_sel := (p_answers ->> (q ->> 'id'))::int;
    exception when others then
      raise exception 'Answers must be option numbers.';
    end;
    v_ok := v_sel = (q ->> 'correct_index')::int;
    if v_ok then
      v_correct := v_correct + 1;
      v_earned := v_earned + v_w;
    else
      v_missed := v_missed || jsonb_build_array(jsonb_build_object(
        'question_id', q ->> 'id', 'topic', q ->> 'topic', 'difficulty', q ->> 'difficulty'));
    end if;
    v_rows := v_rows || jsonb_build_array(jsonb_build_object(
      'question_id', q ->> 'id', 'selected', v_sel, 'correct', v_ok, 'weight', v_w,
      'topic', q ->> 'topic', 'difficulty', q ->> 'difficulty'));
    v_review := v_review || jsonb_build_object(q ->> 'id', jsonb_build_object(
      'correctIndex', (q ->> 'correct_index')::int, 'explanation', q ->> 'explanation',
      'whyWrong', nullif(btrim(coalesce(q ->> 'why_wrong', '')), ''),
      'learningOutcome', nullif(btrim(coalesce(q ->> 'learning_outcome', '')), '')));
  end loop;
  if v_total = 0 then
    raise exception 'There are no questions here yet.';
  end if;
  return jsonb_build_object(
    'grade', jsonb_build_object('correct', v_correct, 'total', v_total, 'earnedWeight', v_earned, 'maxWeight', v_max,
                                'percent', round(v_earned::numeric / v_max * 100)::int),
    'review', v_review, 'rows', v_rows, 'missed', v_missed);
end $$;
revoke execute on function public.programme_grade(jsonb, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Publishing a built-in programme updates what its pages and grading read
-- ---------------------------------------------------------------------------
create or replace function public.sync_builtin_programme(p_programme uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_slug text;
  c jsonb;
begin
  select p.slug, v.content into v_slug, c
    from public.programmes p
    join public.programme_versions v on v.programme_id = p.id and v.status = 'published'
   where p.id = p_programme and p.source = 'built-in';
  if c is null then
    return;
  end if;

  if v_slug = 'global-leadership' then
    -- The Life Skills Profile's statements (the current version).
    update public.career_readiness_assessment_questions q
       set statement = i ->> 'statement', reverse = coalesce((i ->> 'reverse')::boolean, q.reverse)
      from jsonb_array_elements(coalesce(c #> '{aptitude,items}', '[]')) i
     where q.id = i ->> 'id' and q.version = 2;

  elsif v_slug = 'digital-marketing' then
    update public.dm_aptitude_questions q
       set statement = i ->> 'statement', reverse = coalesce((i ->> 'reverse')::boolean, q.reverse)
      from jsonb_array_elements(coalesce(c #> '{aptitude,items}', '[]')) i
     where q.id = i ->> 'id';

    -- Practice: the answer, its weight and the review shown after an attempt.
    update public.decision_lab_answer_key k
       set correct_index    = (x.q ->> 'correct_index')::int,
           weight           = greatest(coalesce((x.q ->> 'weight')::int, k.weight), 1),
           why_correct      = coalesce(nullif(btrim(x.q ->> 'explanation'), ''), k.why_correct),
           why_others_wrong = coalesce(nullif(btrim(x.q ->> 'why_wrong'), ''), k.why_others_wrong),
           learning_outcome = coalesce(nullif(btrim(x.q ->> 'learning_outcome'), ''), k.learning_outcome),
           competency       = coalesce(nullif(btrim(x.q ->> 'topic'), ''), k.competency),
           difficulty       = coalesce(nullif(btrim(x.q ->> 'difficulty'), ''), k.difficulty),
           title            = coalesce(nullif(btrim(x.q ->> 'title'), ''), k.title)
      from (select q from jsonb_array_elements(coalesce(c -> 'modules', '[]')) m,
                          jsonb_array_elements(coalesce(m -> 'quiz', '[]')) q) x
     where k.question_id = x.q ->> 'id';

    -- The Foundation assessment is this programme's final assessment.
    update public.initial_assessment_questions f
       set question = x.q ->> 'question',
           options  = array(select jsonb_array_elements_text(x.q -> 'options')),
           category = coalesce(nullif(btrim(x.q ->> 'topic'), ''), f.category)
      from (select q from jsonb_array_elements(coalesce(c #> '{final,questions}', '[]')) q) x
     where f.id = x.q ->> 'id';
    update public.initial_assessment_answer_key k
       set correct_index = (x.q ->> 'correct_index')::int,
           explanation   = coalesce(nullif(btrim(x.q ->> 'explanation'), ''), k.explanation)
      from (select q from jsonb_array_elements(coalesce(c #> '{final,questions}', '[]')) q) x
     where k.question_id = x.q ->> 'id';
  end if;
end $$;
revoke execute on function public.sync_builtin_programme(uuid) from public, anon, authenticated;

-- The published wording of both, for the app's pages to load (no answers).
-- p_known is what the browser already has ({slug: version}); only programmes
-- with a newer version come back, so an unchanged programme costs nothing.
create or replace function public.get_builtin_programmes(p_known jsonb default '{}'::jsonb) returns jsonb
language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'versions', coalesce((select jsonb_object_agg(p.slug, v.version)
                            from public.programmes p
                            join public.programme_versions v on v.programme_id = p.id and v.status = 'published'
                           where p.source = 'built-in'), '{}'::jsonb),
    'changed', coalesce((select jsonb_object_agg(p.slug, jsonb_build_object(
                            'version', v.version, 'title', p.title, 'content', public.programme_public_content(v.content)))
                           from public.programmes p
                           join public.programme_versions v on v.programme_id = p.id and v.status = 'published'
                          where p.source = 'built-in'
                            and (coalesce(p_known, '{}'::jsonb) ->> p.slug) is distinct from v.version::text), '{}'::jsonb))
$$;
grant execute on function public.get_builtin_programmes(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. The team's functions, now knowing about built-in programmes
-- ---------------------------------------------------------------------------
drop function if exists public.admin_programmes();
create function public.admin_programmes()
returns table (id uuid, slug text, title text, kind text, status text, source text, current_version int,
               draft_version int, updated_at timestamptz, published_at timestamptz,
               modules int, questions int, problems int)
language plpgsql security definer set search_path = public stable as $$
#variable_conflict use_column
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  return query
  select p.id, p.slug, p.title, p.kind, p.status, p.source, p.current_version, d.version,
         greatest(p.updated_at, d.updated_at), l.published_at,
         coalesce(jsonb_array_length(coalesce(d.content, l.content) -> 'modules'), 0),
         coalesce((select sum(coalesce(jsonb_array_length(m -> 'quiz'), 0))::int
                     from jsonb_array_elements(coalesce(coalesce(d.content, l.content) -> 'modules', '[]')) m), 0)
           + coalesce(jsonb_array_length(coalesce(d.content, l.content) #> '{final,questions}'), 0),
         cardinality(public.programme_problems(p.id, coalesce(d.content, l.content)))
    from public.programmes p
    left join public.programme_versions d on d.programme_id = p.id and d.status = 'draft'
    left join public.programme_versions l on l.programme_id = p.id and l.status = 'published'
   order by p.source = 'engine', p.status = 'archived', p.title;
end $$;
revoke execute on function public.admin_programmes() from public, anon;
grant execute on function public.admin_programmes() to authenticated;

create or replace function public.admin_programme(p_slug text)
returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare
  p public.programmes;
  v public.programme_versions;
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  select * into p from public.programmes where slug = p_slug;
  if p.id is null then
    return null;
  end if;
  select * into v from public.programme_versions
   where programme_id = p.id and status in ('draft', 'published')
   order by status = 'draft' desc limit 1;
  return jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'title', p.title, 'kind', p.kind, 'status', p.status, 'source', p.source,
    'current_version', p.current_version,
    'editing_version', v.version, 'editing_status', v.status,
    'content', v.content, 'updated_at', v.updated_at,
    'problems', to_jsonb(public.programme_problems(p.id, v.content)),
    'versions', (select coalesce(jsonb_agg(jsonb_build_object(
                   'version', x.version, 'status', x.status, 'note', x.note,
                   'published_at', x.published_at, 'updated_at', x.updated_at) order by x.version desc), '[]'::jsonb)
                   from public.programme_versions x where x.programme_id = p.id));
end $$;

create or replace function public.admin_save_programme_draft(p_id uuid, p_content jsonb)
returns text[]
language plpgsql security definer set search_path = public as $$
declare
  v_next int;
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  if p_content is null or jsonb_typeof(p_content) <> 'object' then
    raise exception 'Nothing to save.';
  end if;
  if not exists (select 1 from public.programmes where id = p_id) then
    raise exception 'That programme no longer exists.';
  end if;
  update public.programme_versions
     set content = p_content, updated_at = now(), updated_by = auth.uid()
   where programme_id = p_id and status = 'draft';
  if not found then
    select coalesce(max(version), 0) + 1 into v_next from public.programme_versions where programme_id = p_id;
    insert into public.programme_versions (programme_id, version, status, content, updated_by)
    values (p_id, v_next, 'draft', p_content, auth.uid());
  end if;
  update public.programmes set updated_at = now() where id = p_id;
  return public.programme_problems(p_id, p_content);
end $$;

create or replace function public.admin_publish_programme(p_id uuid, p_note text default null)
returns int
language plpgsql security definer set search_path = public as $$
declare
  d public.programme_versions;
  v_problems text[];
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  select * into d from public.programme_versions where programme_id = p_id and status = 'draft';
  if d.programme_id is null then
    raise exception 'There is no draft to publish.';
  end if;
  v_problems := public.programme_problems(p_id, d.content);
  if cardinality(v_problems) > 0 then
    raise exception 'Not ready to publish: %', array_to_string(v_problems[1:3], '; ')
      || case when cardinality(v_problems) > 3 then ' (and ' || (cardinality(v_problems) - 3) || ' more)' else '' end;
  end if;
  update public.programme_versions set status = 'superseded' where programme_id = p_id and status = 'published';
  update public.programme_versions
     set status = 'published', published_at = now(), published_by = auth.uid(), note = nullif(btrim(p_note), '')
   where programme_id = p_id and version = d.version;
  update public.programmes set status = 'published', current_version = d.version, updated_at = now() where id = p_id;
  -- A built-in programme: the pages' and grading's own copies follow.
  perform public.sync_builtin_programme(p_id);
  return d.version;
end $$;

create or replace function public.admin_archive_programme(p_id uuid, p_archived boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  if exists (select 1 from public.programmes where id = p_id and source = 'built-in') then
    raise exception 'Global Leadership and Digital Marketing can’t be archived.';
  end if;
  update public.programmes
     set status = case when p_archived then 'archived'
                       when current_version is not null then 'published' else 'draft' end,
         updated_at = now()
   where id = p_id;
end $$;

-- ---------------------------------------------------------------------------
-- 5. The engine's own student pages are for engine programmes only
-- ---------------------------------------------------------------------------
create or replace function public.list_programmes()
returns table (slug text, title text, kind text, version int, summary text, audience text,
               level text, hours numeric, skills jsonb, modules int)
language sql security definer set search_path = public stable as $$
  select p.slug, p.title, p.kind, v.version, v.content #>> '{overview,summary}', v.content #>> '{overview,audience}',
         v.content #>> '{overview,level}', nullif(v.content #>> '{overview,hours}', '')::numeric,
         coalesce((select jsonb_agg(s ->> 'name') from jsonb_array_elements(coalesce(v.content -> 'skills', '[]')) s), '[]'::jsonb),
         coalesce(jsonb_array_length(v.content -> 'modules'), 0)
    from public.programmes p
    join public.programme_versions v on v.programme_id = p.id and v.status = 'published'
   where p.status = 'published' and p.source = 'engine'
   order by p.title;
$$;

create or replace function public.get_programme(p_slug text)
returns jsonb
language sql security definer set search_path = public stable as $$
  select jsonb_build_object('slug', p.slug, 'title', p.title, 'kind', p.kind, 'version', v.version,
                            'content', public.programme_public_content(v.content))
    from public.programmes p
    join public.programme_versions v on v.programme_id = p.id and v.status = 'published'
   where p.slug = p_slug and p.status = 'published' and p.source = 'engine';
$$;

create or replace function public.programme_for_student(p_slug text, out programme public.programmes,
                                                         out enrolment public.programme_enrolments)
language plpgsql security definer set search_path = public stable as $$
begin
  select * into programme from public.programmes where slug = p_slug and status = 'published' and source = 'engine';
  if programme.id is null then
    raise exception 'That programme isn’t available.';
  end if;
  select * into enrolment from public.programme_enrolments
   where student_id = auth.uid() and programme_id = programme.id;
end $$;
revoke execute on function public.programme_for_student(text) from public, anon, authenticated;

create or replace function public.preview_programme(p_slug text) returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare
  p public.programmes;
  v public.programme_versions;
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  select * into p from public.programmes where slug = p_slug and source = 'engine';
  if p.id is null then
    raise exception 'That programme can’t be previewed here.';
  end if;
  select * into v from public.programme_versions
   where programme_id = p.id and status in ('draft', 'published') order by status = 'draft' desc limit 1;
  return jsonb_build_object('slug', p.slug, 'title', p.title, 'kind', p.kind, 'version', v.version,
                            'status', v.status, 'content', v.content);
end $$;

-- ---------------------------------------------------------------------------
-- 6. The import: what students see today, as version 1 of each
-- ---------------------------------------------------------------------------
drop table if exists _bi_gl, _bi_dm_skills, _bi_dm_tracks, _bi_dm_questions;

-- The app's own content, generated from src/lib (module text, practice questions).
create temp table _bi_gl (skills jsonb, modules jsonb, intro text, outcomes jsonb);
insert into _bi_gl values ($j$[{"id":"self-awareness","name":"Self-awareness","description":"Knowing your strengths, weaknesses, values and emotions."},{"id":"empathy","name":"Empathy","description":"Understanding how other people feel and see things."},{"id":"critical-thinking","name":"Critical thinking","description":"Weighing evidence and questioning assumptions before you decide."},{"id":"creative-thinking","name":"Creative thinking","description":"Coming up with new ideas and other ways to approach a problem."},{"id":"decision-making","name":"Decision-making","description":"Choosing a course of action after weighing the options and what they lead to."},{"id":"problem-solving","name":"Problem-solving","description":"Finding the cause of a problem, weighing fixes and acting on one."},{"id":"effective-communication","name":"Effective communication","description":"Saying what you think, feel and need, clearly and appropriately."},{"id":"relationships","name":"Interpersonal relationships","description":"Building good relationships, working together and handling disagreements well."},{"id":"coping-stress","name":"Coping with stress","description":"Noticing what causes stress and managing it in healthy ways."},{"id":"coping-emotions","name":"Coping with emotions","description":"Recognising emotions in yourself and others, and responding well."},{"id":"goal-setting","name":"Goal setting","description":""},{"id":"leadership","name":"Leadership","description":""},{"id":"agile","name":"Agile working","description":""},{"id":"growth-mindset","name":"Growth mindset","description":""}]$j$::jsonb, $j$[{"id":"goal-setting","title":"Goal Setting","summary":"Turn “I want a good job” into specific, measurable goals — and a weekly plan that actually gets you there.","skill":"goal-setting","level":"foundation","outcome":"Turn a wish into a goal with a date, and a plan for next week.","minutes":45,"learn":[{"title":"A wish is not a goal","body":"“Get a good job” can’t be checked. “Apply to 10 digital marketing internships by 30 November” can. A real goal says what, how you’ll measure it, and by when."},{"title":"Work backwards","body":"Start from the finish line and split it into milestones, then into the actions you can do this week. If you can’t say what you’re doing on Monday, the goal is still too big."},{"title":"Check in every week","body":"Ten minutes a week: what did I plan, what did I do, what changes? Goals slip quietly — a weekly look is what catches it early."}],"tasks":[{"id":"t1","title":"Write one goal properly","prompt":"Pick one career goal for the next 90 days. Write it so it says what you will do, how you will know you’ve done it, and by when.","hint":"e.g. “Publish 6 blog posts on my portfolio site by 15 December, one every two weeks.”"},{"id":"t2","title":"Break it into milestones","prompt":"Split that goal into three or four milestones, each with a date. Work backwards from the finish.","hint":"What has to be true halfway? What has to be done by the end of the first month?"},{"id":"t3","title":"Plan your next week","prompt":"List three to five actions you’ll take this week toward the goal, and the day you’ll do each. Then name one thing that could get in the way, and what you’ll do about it.","hint":"Be concrete: “Tue evening — outline post 1”, not “work on blog”."}],"reflection":{"prompt":"Look at your goal and your plan. Which part are you least sure you’ll follow through on, and what will you change to make it more likely?","hint":"There’s no right answer — being honest about the weak spot is the point."},"quiz":[]},{"id":"communication","title":"Communication","summary":"Write and speak clearly — emails, presentations, and explaining your work to a client or an interviewer.","skill":"effective-communication","level":"foundation","outcome":"Say what you mean clearly — in writing and out loud.","minutes":45,"learn":[{"title":"Lead with the point","body":"Busy people read the first line. Say what you want or what you found first, then the reasons. Don’t make the reader dig for the ask."},{"title":"Know who’s listening","body":"The same news lands differently with a client, a lecturer and a friend. Before you write or speak, ask what they already know and what they need from you."},{"title":"Clear beats clever","body":"Short sentences, one idea at a time, and a specific next step at the end. “Could you review this by Thursday?” gets a reply; “let me know your thoughts” often doesn’t."}],"tasks":[{"id":"t1","title":"Write a message that opens with the ask","prompt":"Write a short email to a lecturer, manager or mentor asking for something real — a referral, an extension, ten minutes of their time. Put the ask in the first line.","hint":"Aim for under 120 words. Say what you need, why, and by when."},{"id":"t2","title":"Explain your work in 60 seconds","prompt":"Write what you would say to an interviewer who asks, “Tell me about a project you’re proud of.” It should take about a minute to say out loud.","hint":"What was the problem, what did you do, what happened? Read it aloud once to check the length."},{"id":"t3","title":"Handle a difficult message","prompt":"A client writes: “Your campaign report is late and I can’t tell what happened.” Write your reply — calm, honest, and clear about what happens next.","hint":"Acknowledge it, explain briefly without excuses, and give a date for the fix."}],"reflection":{"prompt":"Read back what you wrote. Where did you use more words than you needed, and what would you cut if you rewrote it?","hint":"Notice your habits — the filler, the hedging, the buried ask."},"quiz":[]},{"id":"leadership","title":"Leadership","summary":"Lead without a title: take ownership, run a small project, and bring people with you.","skill":"leadership","level":"foundation","outcome":"Take ownership and bring a small group with you.","minutes":45,"learn":[{"title":"Lead without a title","body":"Leadership at your stage is noticing what’s not getting done and quietly taking it on — then making it easy for others to join. Nobody has to appoint you."},{"title":"Clarity, ownership, follow-through","body":"People follow someone who makes the goal clear, says who does what, and checks back. Most group work stalls on the second: nobody knows whose job it is."},{"title":"Listen first, share the credit","body":"Ask before you tell. When it goes well, name the people who did the work; when it doesn’t, own your part first. It costs nothing and people remember it."}],"tasks":[{"id":"t1","title":"Take ownership","prompt":"Describe a group situation — real or imagined — where something wasn’t getting done and nobody had taken it on. What would you do, step by step, to take ownership?","hint":"Start with what you’d say to the group in the first five minutes."},{"id":"t2","title":"Plan a small project","prompt":"You’re leading a one-week project with three teammates. Write the goal, who does what, and how and when you’ll check in.","hint":"e.g. run a small social campaign for a campus event. Keep roles specific."},{"id":"t3","title":"Have the hard conversation","prompt":"A teammate keeps missing their part. Write what you would say to open the conversation, and one question you’d ask to understand what’s going on.","hint":"Start with the facts, not the blame. What will you do if they’re stuck?"}],"reflection":{"prompt":"When have you stepped up — or held back — in a group? What would you do differently next time?","hint":"A real example is more useful than a general answer."},"quiz":[]},{"id":"agile","title":"Agile Methodology","summary":"Work the way modern teams do — sprints, stand-ups, backlogs and short feedback loops.","skill":"agile","level":"foundation","outcome":"Work in short cycles: a backlog, a sprint, and a look back.","minutes":45,"learn":[{"title":"Small steps, short cycles","body":"Instead of one long push, work in one- or two-week sprints: pick a little, finish it, look at what happened. You learn sooner and waste less when a plan turns out wrong."},{"title":"The backlog","body":"A backlog is your to-do list in priority order. The top few items are small and clear; the rest can stay rough. Re-order it as you learn — it is never finished."},{"title":"Stand-ups and retros","body":"A stand-up is a two-minute check: what I did, what I’ll do, what’s blocking me. A retrospective at the end asks what went well, what didn’t, and one thing to change."}],"tasks":[{"id":"t1","title":"Build a backlog","prompt":"Pick a personal project — a portfolio site, a small campaign, a study plan. List eight to ten tasks, then put the top three first and say why.","hint":"Ask: what gives the most value for the least effort?"},{"id":"t2","title":"Plan a one-week sprint","prompt":"From your backlog, plan one week: a sprint goal in one sentence, the tasks you commit to, and what “done” means for each.","hint":"Commit to less than you think. A finished small sprint beats an unfinished big one."},{"id":"t3","title":"Run a retrospective","prompt":"Look back at a recent week of your own work. Write what went well, what didn’t, and one specific change you’ll make next week.","hint":"Keep the change small enough that you’ll really do it."}],"reflection":{"prompt":"Where in your studies or work would working in short cycles help most, and what’s stopping you from trying it?","hint":"Think about a task you keep putting off — could it be smaller?"},"quiz":[]},{"id":"growth-mindset","title":"Growth Mindset","summary":"Treat setbacks as information, and build the habits that keep you learning when things get hard.","skill":"growth-mindset","level":"foundation","outcome":"Treat setbacks as information and keep learning when it’s hard.","minutes":45,"learn":[{"title":"Not good at it — yet","body":"Skills grow with effort and better methods. “I’m bad at presenting” is a fixed verdict; “I’m not good at presenting yet” leaves room to improve — and to know what to practise."},{"title":"Setbacks are information","body":"A rejection or a poor result tells you something about what you did, not who you are. Separate the facts from the story, then ask what you’d change."},{"title":"Ask for feedback and use it","body":"Feedback is the fastest teacher. Ask about something specific, listen without defending, thank the person, and act on one thing. Then tell them what changed."}],"tasks":[{"id":"t1","title":"Look at a recent setback","prompt":"Describe one recent setback — a bad grade, a rejection, a project that went wrong. Write only what happened, then what it tells you.","hint":"Facts first, no judgement. Then: what would I do differently?"},{"id":"t2","title":"Reframe three thoughts","prompt":"Write three fixed thoughts you’ve had about yourself (“I’m no good at…”) and rewrite each one as a growth version.","hint":"e.g. “I can’t do maths” → “I haven’t found the way of practising that works for me yet.”"},{"id":"t3","title":"Ask for feedback","prompt":"Pick a person and a piece of your work. Write the specific question you’d ask them, and how you’ll use the answer.","hint":"“What’s one thing that would make this clearer?” beats “What do you think?”"}],"reflection":{"prompt":"Across these five modules, what is the one habit you most want to keep — and what will you do this week to start it?","hint":"Look back at your answers. What stood out?"},"quiz":[]},{"id":"self-awareness","title":"Self-Awareness","summary":"Know what you’re good at, what you find hard and what throws you, so you can plan around it instead of being surprised.","skill":"self-awareness","level":"foundation","outcome":"Know your strengths, your weak spots and what throws you, and use them on purpose.","minutes":25,"learn":[{"title":"Strengths are habits, not talents","body":"A strength is something you do well that also gives you energy. Notice what you do easily that others find hard, and what you lose track of time doing."},{"title":"Know what throws you","body":"Everyone has triggers: deadlines, criticism, being watched. Knowing yours lets you plan around them instead of being caught out every time."}],"tasks":[{"id":"t1","title":"Name your strengths","prompt":"List three things you do well, with one real example of each from the last few months.","hint":"e.g. “I explain things simply: friends ask me to go over topics before exams.”"},{"id":"t2","title":"Name what throws you","prompt":"Describe one situation that regularly throws you off: what happens, how you react, and what it costs you.","hint":"Be specific: “When I’m asked a question in class without warning, I go blank.”"}],"reflection":{"prompt":"Ask one person you trust what they think your biggest strength is. How does it compare with your own list, and what surprised you?","hint":"If you can’t ask anyone yet, write what you think they would say."},"quiz":[]},{"id":"empathy","title":"Empathy","summary":"Listen to understand rather than to reply, and see a situation from the other person’s side, even when you disagree.","skill":"empathy","level":"foundation","outcome":"Understand how someone else sees things, and show them you do.","minutes":25,"learn":[{"title":"Listen to understand, not to reply","body":"Most of us listen while planning our answer. Empathy starts with listening to the end, then checking you understood before you respond."},{"title":"Name the feeling","body":"Saying “That sounds frustrating” shows someone you heard more than their words. You don’t have to agree with someone to understand them."}],"tasks":[{"id":"t1","title":"Tell it from their side","prompt":"Think of a recent disagreement. Describe it as the other person would: what they wanted, what they felt, and why it made sense to them.","hint":"Write it in their voice: “I felt ignored because…”"},{"id":"t2","title":"Write a listening reply","prompt":"A friend tells you they failed an interview and feel useless. Write what you would say: first showing you understood, then, only if they want it, a suggestion.","hint":"Start with their feeling, not your advice."}],"reflection":{"prompt":"Where do you find empathy hardest — with whom, or in what kind of moment — and what will you try differently next time?","hint":"Most people find it hardest when they’re tired, stressed or sure they’re right."},"quiz":[]},{"id":"critical-thinking","title":"Critical Thinking","summary":"Check where a claim comes from, weigh the evidence, and test your own views before you act on them or share them.","skill":"critical-thinking","level":"foundation","outcome":"Check claims, weigh evidence and spot weak arguments before you act on them.","minutes":25,"learn":[{"title":"Who says so, and how do they know?","body":"Before you believe or share something, ask where it came from, what evidence backs it, and what the person gains if you believe it."},{"title":"Look for the other side","body":"A strong view survives its best counter-argument. Find the strongest case against what you think, then decide."}],"tasks":[{"id":"t1","title":"Check a claim","prompt":"Pick a claim you saw recently (a forward, a post, an ad). Check it: where did it come from, what evidence supports it, and is it true, false or unclear?","hint":"e.g. “This course guarantees a job in 30 days.”"},{"id":"t2","title":"Argue against yourself","prompt":"Write one opinion you hold about your career or studies, then the strongest argument against it. Has your view changed, and why or why not?","hint":"Make the counter-argument as good as you can, not a weak version."}],"reflection":{"prompt":"What kind of claim are you most likely to believe without checking, and why?","hint":"Think about claims from people you admire, or things you want to be true."},"quiz":[]},{"id":"creative-thinking","title":"Creative Thinking","summary":"Generate lots of ideas before judging them, borrow what works elsewhere, and find another way when the usual one fails.","skill":"creative-thinking","level":"foundation","outcome":"Come up with more and better ideas, and find another way when the usual one fails.","minutes":25,"learn":[{"title":"Quantity first, judge later","body":"Good ideas usually come after many ordinary ones. List ideas quickly without judging them, then pick the best."},{"title":"Borrow and combine","body":"Most new ideas mix existing ones: something that works in one place, used in another. Ask: who has solved a problem like this before?"}],"tasks":[{"id":"t1","title":"Ten ideas in ten minutes","prompt":"A small tea shop near a college wants more students to visit. Write at least ten ideas to help, without judging any of them.","hint":"Include a few silly ones: they often lead to good ones."},{"id":"t2","title":"Pick one and improve it","prompt":"Choose your best idea from Task 1. Explain why it could work, what it would cost, and one way to test it cheaply this week.","hint":"A test is small: one post, one offer, one conversation."}],"reflection":{"prompt":"When did you last solve something in an unusual way? What helped you think differently that time?","hint":"It can be anything: a study trick, a cheaper way to do something."},"quiz":[]},{"id":"decision-making","title":"Decision-Making","summary":"Lay out your options and what each leads to, choose by a date, and learn from how it turns out.","skill":"decision-making","level":"foundation","outcome":"Make decisions by weighing options and consequences, and stand by them.","minutes":25,"learn":[{"title":"Options, consequences, choice","body":"List at least two real options, write what each would lead to, then choose and say why. Writing it down beats going round in circles."},{"title":"Decide, then review","body":"You rarely have all the information. Set a date to decide, choose the best option you have, and check later what you learned."}],"tasks":[{"id":"t1","title":"Lay out a decision","prompt":"Pick a real decision you face (a course, a job, a project). Write two or three options and what each would likely lead to in a year.","hint":"Include the option of doing nothing."},{"id":"t2","title":"Choose and explain","prompt":"Choose one option from Task 1 and explain why, including what you are giving up. Set a date by which you will act on it.","hint":"“I’m choosing X because… I’m giving up Y… I’ll start by 1 November.”"}],"reflection":{"prompt":"Think of a decision you put off or let someone else make. What would you do differently now?","hint":"Being honest about why you avoided it is the useful part."},"quiz":[]},{"id":"problem-solving","title":"Problem-Solving","summary":"Get to the real cause of a problem, weigh the possible fixes, and take the first small step today.","skill":"problem-solving","level":"foundation","outcome":"Find the real cause of a problem, weigh fixes and act on one.","minutes":25,"learn":[{"title":"Ask why, more than once","body":"The first cause you see is often a symptom. Keep asking “why?” until you reach something you can actually change."},{"title":"Small steps you can test","body":"Break the fix into steps, try the first one, and see what happens. A small fix you try today beats a perfect plan you never start."}],"tasks":[{"id":"t1","title":"Find the cause","prompt":"Describe a problem that keeps happening to you (missed deadlines, late mornings, low marks). Ask “why?” at least three times and write down each answer.","hint":"“I miss deadlines → I start late → I don’t know where to start → the task feels too big.”"},{"id":"t2","title":"Plan a fix","prompt":"Based on Task 1, write two possible fixes, choose one, and list the first three steps you will take this week.","hint":"Make the first step something you can do in under 30 minutes."}],"reflection":{"prompt":"Which problem in your life have you been treating only on the surface? What would fixing the cause look like?","hint":"Think of something that keeps coming back."},"quiz":[]},{"id":"relationships","title":"Interpersonal Relationships","summary":"Build trust with the people you work and study with, and handle disagreements without damaging the relationship.","skill":"relationships","level":"foundation","outcome":"Build good working relationships and handle disagreements without falling out.","minutes":25,"learn":[{"title":"Built in small moments","body":"Remembering what someone told you, thanking them, keeping a promise: these small things build the trust you need when work gets hard."},{"title":"Disagree with the idea, not the person","body":"In a conflict, describe the problem and how it affects you, ask for their view, and look for an option that works for both of you."}],"tasks":[{"id":"t1","title":"Plan a hard conversation","prompt":"Think of a disagreement with someone you study or work with. Write how you would open the conversation: the problem, how it affects you, and a question asking their view.","hint":"“When the slides came in late, I had to rush my part. What made it hard for you?”"},{"id":"t2","title":"Strengthen one relationship","prompt":"Name one person whose relationship with you matters for your studies or work. Write two small things you will do in the next two weeks to strengthen it.","hint":"Small and specific: “Thank her for the notes”, “Ask how his interview went”."}],"reflection":{"prompt":"What do you usually do when a disagreement starts: avoid it, push harder, or talk it through? What would you like to do instead?","hint":"There’s no right answer; noticing the pattern is the point."},"quiz":[]},{"id":"coping-stress","title":"Coping with Stress","summary":"Spot the early signs of stress, plan and prioritise when there’s too much to do, and build habits that help you reset.","skill":"coping-stress","level":"foundation","outcome":"Notice what stresses you, and manage it with habits that work.","minutes":25,"learn":[{"title":"Know your signs","body":"Stress shows up before you notice it: poor sleep, snapping at people, scrolling instead of starting. Learn your early signs so you can act sooner."},{"title":"Plan, prioritise, recover","body":"When there’s too much to do, write everything down, pick the one thing that matters most, and do it first. Rest is part of the plan, not a reward at the end."}],"tasks":[{"id":"t1","title":"Map your stress","prompt":"Write your three biggest sources of stress right now, and the early signs that tell you stress is building.","hint":"e.g. “Exams in three weeks: I start sleeping late and avoiding my books.”"},{"id":"t2","title":"Build a reset","prompt":"Choose one source from Task 1. Write a plan for the next week: what you will do first, and one habit that helps you reset (a walk, a set bedtime, talking to someone).","hint":"Keep the habit small enough to do on a bad day."}],"reflection":{"prompt":"What has helped you get through a stressful time before, and how can you use it now?","hint":"If stress feels too heavy to manage alone, you can ask a counsellor privately in the Community."},"quiz":[]},{"id":"coping-emotions","title":"Coping with Emotions","summary":"Name strong feelings as they come, pause before you respond, and handle other people’s emotions with care.","skill":"coping-emotions","level":"foundation","outcome":"Recognise strong feelings in yourself and others, and respond rather than react.","minutes":25,"learn":[{"title":"Name it to tame it","body":"Putting a feeling into words (angry, worried, disappointed) makes it easier to handle. The more exactly you can name it, the better."},{"title":"Pause before you respond","body":"Between what happens and what you do, there is a moment. A breath, a short walk or waiting before you reply gives you room to choose."}],"tasks":[{"id":"t1","title":"Replay a strong moment","prompt":"Describe a recent moment when a strong feeling took over (anger, worry, embarrassment). What happened, what did you feel, and what did you do?","hint":"Name the feeling as exactly as you can."},{"id":"t2","title":"Rewrite the response","prompt":"Rewrite the moment from Task 1: what pause could you have taken, and what would you have said or done instead?","hint":"“I would have waited until the evening to reply, and asked what they meant.”"}],"reflection":{"prompt":"Which emotion is hardest for you to handle, and what is one thing you will try next time it comes up?","hint":"If your feelings often feel overwhelming, talking to a counsellor in the Community can help."},"quiz":[]}]$j$::jsonb, $t$Skills get you shortlisted; how you know yourself, think, decide, work with people and handle pressure gets you hired. Learn and practise all fourteen in writing — and get a human’s honest feedback before an interviewer gives you theirs.$t$, $j$["Clear, measurable career goals — and a plan to reach them","Confident communication in writing, presentations and interviews","Leadership experience you can point to, not just describe","Hands-on fluency with agile ways of working","A growth mindset backed by habits, not slogans","Mentor feedback on your progress, not just automated scores"]$j$::jsonb);

create temp table _bi_dm_skills (skills jsonb);
insert into _bi_dm_skills values ($j$[{"id":"noticing","name":"Noticing marketing","description":""},{"id":"offers","name":"Why offers work","description":""},{"id":"creativity","name":"Creativity & storytelling","description":""},{"id":"numbers","name":"Numbers & value","description":""},{"id":"curiosity","name":"Digital curiosity","description":""}]$j$::jsonb);

create temp table _bi_dm_tracks (ord int, id text, title text, summary text, skill text);
insert into _bi_dm_tracks values
  (0, $t$marketing-fundamentals$t$, $t$Marketing Fundamentals$t$, $t$Core concepts: STP, funnels, personas, and customer value.$t$, $t$noticing$t$),
  (1, $t$market-research$t$, $t$Market Research$t$, $t$Keyword research, primary research, and competitor analysis.$t$, $t$noticing$t$),
  (2, $t$meta-ads$t$, $t$Meta Ads$t$, $t$Campaign objectives, lookalike audiences, and retargeting.$t$, $t$offers$t$),
  (3, $t$google-ads$t$, $t$Google Ads$t$, $t$Campaign types, Quality Score, match types, and bidding.$t$, $t$offers$t$),
  (4, $t$seo-aeo$t$, $t$SEO & AEO$t$, $t$On-page SEO, backlinks, local SEO, and answer engines.$t$, $t$curiosity$t$),
  (5, $t$analytics$t$, $t$Analytics$t$, $t$GA4, attribution, conversions, and acquisition efficiency.$t$, $t$numbers$t$),
  (6, $t$content-marketing$t$, $t$Content Marketing$t$, $t$Content strategy, formats, and distribution decisions.$t$, $t$creativity$t$),
  (7, $t$marketing-automation-ai$t$, $t$Marketing Automation & AI$t$, $t$Workflows, lead scoring, and AI-assisted marketing tools.$t$, $t$curiosity$t$);

create temp table _bi_dm_questions (ord int, id text, track text, title text, difficulty text, topic text, question text, options jsonb, context jsonb);
insert into _bi_dm_questions values
  (0, $t$MF-S001$t$, $t$marketing-fundamentals$t$, $t$Launching an EdTech Startup$t$, $t$Beginner$t$, $t$Marketing Objectives$t$, $t$Which marketing channel should receive the highest initial investment?$t$, $j$["Google Search Campaign","SEO","Meta Lead Campaign","Influencer Marketing"]$j$::jsonb, $j${"company":"SkillSprint","role":"You are the first Marketing Manager.","industry":"EdTech","background":"SkillSprint has launched AI, Data Science and Digital Marketing courses. The platform is new, has no previous customers, no CRM, no SEO rankings and very limited brand awareness. The founders have allocated ₹15 lakh for the first three months and expect measurable growth before seeking investors.","objective":"Generate 1,500 qualified leads while maintaining a CPA below ₹900.","information":"Budget ₹15L; New website; No customer database; High search demand for courses.","constraints":"Limited team; Three-month deadline."}$j$::jsonb),
  (1, $t$MF-S002$t$, $t$marketing-fundamentals$t$, $t$Finding the Right Target Audience$t$, $t$Beginner$t$, $t$Segmentation$t$, $t$Which audience should be targeted first?$t$, $j$["Women 35–50 interested in premium skincare","Everyone aged 18+","Teenagers","Broad audience with no interests"]$j$::jsonb, $j${"company":"GlowSkin","role":"You are the Brand Manager.","industry":"Beauty","background":"GlowSkin is introducing a premium anti-ageing serum priced well above mass-market alternatives. Research shows interest from multiple demographics, but the launch budget is limited.","objective":"Achieve profitable online sales within 60 days.","information":"Premium pricing; ₹8L budget; Audience research completed.","constraints":"Cannot target everyone initially."}$j$::jsonb),
  (2, $t$MF-S003$t$, $t$marketing-fundamentals$t$, $t$Traffic Without Sales$t$, $t$Intermediate$t$, $t$Customer Journey$t$, $t$Which stage of the customer journey requires immediate attention?$t$, $j$["Awareness","Consideration","Conversion","Retention"]$j$::jsonb, $j${"company":"UrbanKart","role":"You are the Growth Manager.","industry":"E-commerce","background":"UrbanKart's website traffic increased by 80% after a successful advertising campaign, but sales remained almost unchanged.","objective":"Increase online purchases by 20%.","information":"CTR 4.8%; Bounce Rate 28%; Checkout completion 18%.","constraints":"No additional media budget this month."}$j$::jsonb),
  (3, $t$MF-S004$t$, $t$marketing-fundamentals$t$, $t$Building a Value Proposition$t$, $t$Intermediate$t$, $t$Value Proposition$t$, $t$Which value proposition is strongest?$t$, $j$["Cheapest protein","Scientifically formulated for busy professionals","Largest warehouse","Fastest delivery"]$j$::jsonb, $j${"company":"FitFuel","role":"You are the Product Marketing Manager.","industry":"Nutrition","background":"FitFuel is entering a crowded protein supplement market where competitors offer similar prices and ingredients.","objective":"Increase first-time purchases.","information":"Strong product quality; Limited brand awareness.","constraints":"Cannot compete on price alone."}$j$::jsonb),
  (4, $t$MF-S005$t$, $t$marketing-fundamentals$t$, $t$Choosing a Target Segment$t$, $t$Intermediate$t$, $t$STP$t$, $t$What is the best launch strategy?$t$, $j$["Target everyone","Ignore segmentation","Launch internationally","Choose one priority segment"]$j$::jsonb, $j${"company":"FinNest","role":"You are responsible for launching a budgeting app.","industry":"FinTech","background":"The app serves students, freelancers and families, but the launch budget is insufficient to market to everyone.","objective":"Acquire the first 10,000 users efficiently.","information":"Three researched personas available.","constraints":"Limited budget."}$j$::jsonb),
  (5, $t$MF-S006$t$, $t$marketing-fundamentals$t$, $t$Improving the Funnel$t$, $t$Intermediate$t$, $t$Marketing Funnel$t$, $t$What should be optimised first?$t$, $j$["Company logo","Landing page CTA and enquiry form","Office location","Facebook followers"]$j$::jsonb, $j${"company":"TravelGo","role":"You oversee digital acquisition.","industry":"Travel","background":"Thousands of visitors browse holiday packages every week, yet very few submit enquiry forms.","objective":"Increase enquiries by 25%.","information":"High traffic; Low enquiry rate.","constraints":"No increase in advertising spend."}$j$::jsonb),
  (6, $t$MF-S007$t$, $t$marketing-fundamentals$t$, $t$Responding to a Price War$t$, $t$Advanced$t$, $t$Competitive Positioning$t$, $t$What is the best strategic response?$t$, $j$["Strengthen differentiation and service quality","Immediately reduce prices","Stop advertising","Exit the market"]$j$::jsonb, $j${"company":"MedEase","role":"You are the Marketing Director.","industry":"Healthcare","background":"A competitor has reduced prices by 30%, but your customer satisfaction scores remain high.","objective":"Protect market share without damaging profitability.","information":"Strong reviews; Loyal customer base.","constraints":"Price cuts reduce margins."}$j$::jsonb),
  (7, $t$MF-S008$t$, $t$marketing-fundamentals$t$, $t$Allocating a Launch Budget$t$, $t$Advanced$t$, $t$Budget Allocation$t$, $t$Which allocation strategy is most appropriate?$t$, $j$["Spend everything on Meta","Only newspapers","Use a balanced mix of Search, Social and Remarketing","Only television"]$j$::jsonb, $j${"company":"HomeSpace","role":"You are planning a premium apartment launch.","industry":"Real Estate","background":"The developer has ₹50 lakh for marketing and wants qualified enquiries over the next six months.","objective":"Generate high-quality property enquiries.","information":"Long sales cycle; High-value purchases.","constraints":"Budget must cover multiple channels."}$j$::jsonb),
  (8, $t$MF-S009$t$, $t$marketing-fundamentals$t$, $t$Improving Customer Retention$t$, $t$Advanced$t$, $t$Retention$t$, $t$What should be prioritised?$t$, $j$["Acquire more customers","Increase prices","Pause marketing","Launch retention campaigns and loyalty programme"]$j$::jsonb, $j${"company":"QuickServe","role":"You lead lifecycle marketing.","industry":"Food Delivery","background":"Customer acquisition is strong, but repeat orders have declined steadily over three months.","objective":"Increase repeat purchases.","information":"Large customer database available.","constraints":"Acquisition costs are increasing."}$j$::jsonb),
  (9, $t$MF-S010$t$, $t$marketing-fundamentals$t$, $t$Creating an Integrated Strategy$t$, $t$Advanced$t$, $t$Marketing Strategy$t$, $t$Which strategy is most sustainable?$t$, $j$["Paid ads only","Social media only","Referral marketing only","SEO + Content + Search Ads + Email Nurturing"]$j$::jsonb, $j${"company":"LegalPro","role":"You are building the firm's first digital marketing plan.","industry":"Legal Services","background":"LegalPro wants sustainable growth rather than short-term spikes in enquiries.","objective":"Generate qualified consultations over the next year.","information":"Annual budget ₹20L; Small marketing team.","constraints":"Must balance short-term and long-term growth."}$j$::jsonb),
  (10, $t$MR-S001$t$, $t$market-research$t$, $t$Finding the Best Market Opportunity$t$, $t$Beginner$t$, $t$Competitor Analysis$t$, $t$Recommendation?$t$, $j$["Generic AI","AI Product Management","Delay","Copy competitors"]$j$::jsonb, $j${"company":"SkillSprint","role":"Market Research Analyst","industry":"EdTech","background":"AI course launch with crowded competitors but emerging niche demand.","objective":"Identify best opportunity.","information":"Trends show AI Product Management growing.","constraints":"Small budget."}$j$::jsonb),
  (11, $t$MR-S002$t$, $t$market-research$t$, $t$Understanding Search Demand$t$, $t$Beginner$t$, $t$Keyword Research$t$, $t$Priority?$t$, $j$["KD28","KD92","Both","Neither"]$j$::jsonb, $j${"company":"TaskFlow","role":"SEO Research Specialist","industry":"SaaS","background":"New SaaS wants SEO strategy.","objective":"Choose keyword.","information":"50k vol KD92 vs 8k vol KD28.","constraints":"New domain."}$j$::jsonb),
  (12, $t$MR-S003$t$, $t$market-research$t$, $t$Choosing the Right Segment$t$, $t$Intermediate$t$, $t$Audience Segmentation$t$, $t$Choose?$t$, $j$["Students","Families","Freelancers","Everyone"]$j$::jsonb, $j${"company":"FinNest","role":"Research Consultant","industry":"FinTech","background":"Three audience segments identified.","objective":"Recommend first target.","information":"Students, freelancers, families.","constraints":"Limited budget."}$j$::jsonb),
  (13, $t$MR-S004$t$, $t$market-research$t$, $t$Survey vs Analytics$t$, $t$Intermediate$t$, $t$Consumer Research$t$, $t$Next step?$t$, $j$["Ignore analytics","Run usability testing","Trust surveys","Redesign homepage"]$j$::jsonb, $j${"company":"UrbanKart","role":"Insights Analyst","industry":"E-commerce","background":"Survey says checkout easy but GA4 shows abandonment.","objective":"Find truth.","information":"Conflicting data.","constraints":"No usability tests."}$j$::jsonb),
  (14, $t$MR-S005$t$, $t$market-research$t$, $t$Using Google Trends$t$, $t$Intermediate$t$, $t$Trend Analysis$t$, $t$Priority?$t$, $j$["Old keyword","Ignore trends","New trend keyword","Pause SEO"]$j$::jsonb, $j${"company":"MedEase","role":"Market Analyst","industry":"Healthcare","background":"Search behaviour changing.","objective":"Recommend content.","information":"Trend data available.","constraints":"Fixed budget."}$j$::jsonb),
  (15, $t$MR-S006$t$, $t$market-research$t$, $t$Evaluating Competitors$t$, $t$Intermediate$t$, $t$Competitor Benchmarking$t$, $t$Analyse?$t$, $j$["SEO content","Office","Logo","Employees"]$j$::jsonb, $j${"company":"GlowSkin","role":"Research Lead","industry":"Beauty","background":"Competitor ranks #1 organically.","objective":"Find advantage.","information":"Weekly content.","constraints":"Limited backlinks."}$j$::jsonb),
  (16, $t$MR-S007$t$, $t$market-research$t$, $t$Market Sizing$t$, $t$Advanced$t$, $t$Market Sizing$t$, $t$Recommendation?$t$, $j$["Reject","Everyone","Reduce price","Launch niche"]$j$::jsonb, $j${"company":"TravelGo","role":"Business Analyst","industry":"Travel","background":"Luxury niche market.","objective":"Launch decision.","information":"High margin niche.","constraints":"₹20L budget."}$j$::jsonb),
  (17, $t$MR-S008$t$, $t$market-research$t$, $t$Validating Personas$t$, $t$Advanced$t$, $t$Persona Development$t$, $t$Next?$t$, $j$["Ignore interviews","Follow sales","Target all","Validate quantitatively"]$j$::jsonb, $j${"company":"HomeSpace","role":"Research Manager","industry":"Real Estate","background":"Sales and interviews disagree.","objective":"Recommend action.","information":"CRM + interviews.","constraints":"Team disagreement."}$j$::jsonb),
  (18, $t$MR-S009$t$, $t$market-research$t$, $t$Research Budget$t$, $t$Advanced$t$, $t$Research Planning$t$, $t$Allocate?$t$, $j$["Surveys only","Brand redesign","Balanced research","Social contests"]$j$::jsonb, $j${"company":"QuickServe","role":"Research Consultant","industry":"Food Delivery","background":"₹10L research budget.","objective":"Allocate budget.","information":"Need customer and competitor insights.","constraints":"Short timeline."}$j$::jsonb),
  (19, $t$MR-S010$t$, $t$market-research$t$, $t$Final Recommendation$t$, $t$Advanced$t$, $t$Strategic Research$t$, $t$Recommend?$t$, $j$["Phased launch","Reject","Wait","Acquire competitor"]$j$::jsonb, $j${"company":"LegalPro","role":"Head of Insights","industry":"Legal","background":"Research supports SME market.","objective":"Board decision.","information":"Growing demand.","constraints":"Evidence required."}$j$::jsonb),
  (20, $t$META-S001$t$, $t$meta-ads$t$, $t$Selecting the Right Campaign Objective$t$, $t$Beginner$t$, $t$Campaign Objective$t$, $t$Which objective should be used first?$t$, $j$["Awareness","Traffic","Leads","Engagement"]$j$::jsonb, $j${"company":"SkillSprint","role":"Performance Marketer","industry":"EdTech","background":"A new AI course is launching with no previous campaign history.","objective":"Generate qualified leads.","information":"Budget ₹10L; New landing page; No pixel history.","constraints":"Limited time."}$j$::jsonb),
  (21, $t$META-S002$t$, $t$meta-ads$t$, $t$Campaign Structure for Multiple Courses$t$, $t$Beginner$t$, $t$Campaign Structure$t$, $t$Best campaign structure?$t$, $j$["One campaign","Separate campaigns by audience","One ad set only","One ad per course"]$j$::jsonb, $j${"company":"FutureLearn","role":"Media Buyer","industry":"Education","background":"Three courses target different audiences.","objective":"Generate leads efficiently.","information":"MBA, AI and Data Science audiences differ.","constraints":"Budget ₹12L."}$j$::jsonb),
  (22, $t$META-S003$t$, $t$meta-ads$t$, $t$Choosing the Best Audience$t$, $t$Beginner$t$, $t$Audience Targeting$t$, $t$Which audience should be tested first?$t$, $j$["Broad 18-65","Random interests","Worldwide","Lookalike of existing patients"]$j$::jsonb, $j${"company":"MedEase","role":"Campaign Manager","industry":"Healthcare","background":"Launching online consultation services.","objective":"Acquire patients.","information":"Pixel has 5,000 purchasers.","constraints":"Limited budget."}$j$::jsonb),
  (23, $t$META-S004$t$, $t$meta-ads$t$, $t$Budget Allocation$t$, $t$Beginner$t$, $t$Budgeting$t$, $t$How should budget be allocated?$t$, $j$["Equal split","Spend on weakest products","Prioritize best-selling categories","Random split"]$j$::jsonb, $j${"company":"UrbanKart","role":"Performance Specialist","industry":"E-commerce","background":"Four product categories require promotion.","objective":"Maximize ROAS.","information":"Historical sales available.","constraints":"₹5L monthly budget."}$j$::jsonb),
  (24, $t$META-S005$t$, $t$meta-ads$t$, $t$Placement Strategy$t$, $t$Beginner$t$, $t$Placements$t$, $t$Which placement strategy?$t$, $j$["Manual Feed only","Stories only","Reels only","Advantage+ Placements"]$j$::jsonb, $j${"company":"StyleHub","role":"Media Buyer","industry":"Fashion","background":"Campaign targets online purchases.","objective":"Increase sales.","information":"Meta recommends Advantage+ placements.","constraints":"No creative limitations."}$j$::jsonb),
  (25, $t$META-S006$t$, $t$meta-ads$t$, $t$CTR vs CPC$t$, $t$Intermediate$t$, $t$Performance Analysis$t$, $t$What should be optimized first?$t$, $j$["Increase budget","Pause account","Change logo","Creative"]$j$::jsonb, $j${"company":"TaskFlow","role":"Optimization Specialist","industry":"SaaS","background":"CTR is 0.7%, CPC ₹85.","objective":"Improve efficiency.","information":"Low engagement.","constraints":"Budget unchanged."}$j$::jsonb),
  (26, $t$META-S007$t$, $t$meta-ads$t$, $t$Low Conversion Rate$t$, $t$Intermediate$t$, $t$Landing Page Analysis$t$, $t$What's the bottleneck?$t$, $j$["Audience","Landing page","Budget","Placements"]$j$::jsonb, $j${"company":"HomeSpace","role":"Growth Marketer","industry":"Real Estate","background":"CTR is 4.8% but conversion rate is 0.4%.","objective":"Increase enquiries.","information":"Landing page loads in 7 seconds.","constraints":"No new creatives."}$j$::jsonb),
  (27, $t$META-S008$t$, $t$meta-ads$t$, $t$High CPA$t$, $t$Intermediate$t$, $t$Optimization$t$, $t$First optimization?$t$, $j$["Analyze audience and conversion funnel","Double budget","Duplicate campaign","Pause all ads"]$j$::jsonb, $j${"company":"FinNest","role":"Performance Lead","industry":"FinTech","background":"CPA increased from ₹600 to ₹1,350.","objective":"Reduce CPA.","information":"Frequency 2.1; CTR stable.","constraints":"Budget unchanged."}$j$::jsonb),
  (28, $t$META-S009$t$, $t$meta-ads$t$, $t$Creative Fatigue$t$, $t$Intermediate$t$, $t$Creative Optimization$t$, $t$Best action?$t$, $j$["Increase budget","Reduce bids","Launch new creatives","Delete pixel"]$j$::jsonb, $j${"company":"QuickServe","role":"Creative Strategist","industry":"Food Delivery","background":"Frequency reached 8.5 and CTR is falling.","objective":"Recover performance.","information":"Same creatives running 6 weeks.","constraints":"Strong audience."}$j$::jsonb),
  (29, $t$META-S010$t$, $t$meta-ads$t$, $t$Lookalike vs Interests$t$, $t$Intermediate$t$, $t$Audience Testing$t$, $t$What should you do?$t$, $j$["Gradually increase Lookalike budget","Shift entire budget instantly","Pause Lookalike","Use interests only"]$j$::jsonb, $j${"company":"GlowSkin","role":"Ads Specialist","industry":"Beauty","background":"Interest audience CPA ₹950; Lookalike CPA ₹620.","objective":"Scale profitably.","information":"Stable conversion volume.","constraints":"Budget available."}$j$::jsonb),
  (30, $t$META-S011$t$, $t$meta-ads$t$, $t$Scaling a Winner$t$, $t$Advanced$t$, $t$Scaling$t$, $t$Best scaling approach?$t$, $j$["Increase 20% every few days","Increase 300% overnight","Duplicate 10 campaigns","Restart learning"]$j$::jsonb, $j${"company":"TravelGo","role":"Senior Media Buyer","industry":"Travel","background":"Campaign delivers ROAS 6.2 consistently.","objective":"Increase volume.","information":"Daily budget ₹20k.","constraints":"Need stable performance."}$j$::jsonb),
  (31, $t$META-S012$t$, $t$meta-ads$t$, $t$Pixel Attribution Issue$t$, $t$Advanced$t$, $t$Tracking$t$, $t$Likely first investigation?$t$, $j$["Pixel implementation","Logo update","Audience size","Campaign name"]$j$::jsonb, $j${"company":"UrbanKart","role":"Tracking Specialist","industry":"Retail","background":"CRM reports 180 purchases but Pixel reports 120.","objective":"Restore measurement.","information":"Recent website update.","constraints":"Limited developer time."}$j$::jsonb),
  (32, $t$META-S013$t$, $t$meta-ads$t$, $t$Conversion API$t$, $t$Advanced$t$, $t$CAPI$t$, $t$Best recommendation?$t$, $j$["Remove Pixel","Stop tracking","Use manual reporting","Implement Conversion API"]$j$::jsonb, $j${"company":"SecureLife","role":"Marketing Technologist","industry":"Insurance","background":"Browser tracking has declined after privacy updates.","objective":"Improve measurement.","information":"Pixel already installed.","constraints":"Developer support available."}$j$::jsonb),
  (33, $t$META-S014$t$, $t$meta-ads$t$, $t$Campaign Rescue$t$, $t$Advanced$t$, $t$Troubleshooting$t$, $t$First action?$t$, $j$["Increase budget","Launch new page only","Audit funnel before making changes","Pause account"]$j$::jsonb, $j${"company":"StayEasy","role":"Performance Manager","industry":"Hospitality","background":"₹2 lakh spent, only 18 bookings.","objective":"Recover campaign.","information":"CTR 1.9%, CVR 0.6%, CPA very high.","constraints":"One week remaining."}$j$::jsonb),
  (34, $t$META-S015$t$, $t$meta-ads$t$, $t$Performance Review$t$, $t$Expert$t$, $t$Strategic Optimization$t$, $t$Best recommendation?$t$, $j$["Increase spend everywhere","Reallocate budget to high-ROAS campaigns while testing new opportunities","Stop low performers immediately","Only refresh creatives"]$j$::jsonb, $j${"company":"DriveNow","role":"Digital Marketing Manager","industry":"Automotive","background":"Quarterly performance review shows mixed results across campaigns.","objective":"Recommend next-quarter strategy.","information":"ROAS varies from 1.8 to 5.9.","constraints":"Board presentation due."}$j$::jsonb),
  (35, $t$GA-S001$t$, $t$google-ads$t$, $t$Selecting the Right Campaign Type$t$, $t$Beginner$t$, $t$Campaign Selection$t$, $t$Which campaign type should you launch first?$t$, $j$["Display","Search","Video","Demand Gen"]$j$::jsonb, $j${"company":"SkillSprint","role":"Google Ads Specialist","industry":"EdTech","background":"A new AI certification program is launching.","objective":"Generate qualified leads.","information":"Budget ₹8L; strong search demand.","constraints":"Limited launch time."}$j$::jsonb),
  (36, $t$GA-S002$t$, $t$google-ads$t$, $t$Choosing Match Types$t$, $t$Beginner$t$, $t$Keywords$t$, $t$Which match type is best initially?$t$, $j$["Exact + Phrase","Broad","Broad Match with no negatives","Display keywords"]$j$::jsonb, $j${"company":"MedEase","role":"PPC Executive","industry":"Healthcare","background":"Online doctor consultation campaign is launching.","objective":"Maximize qualified traffic.","information":"Limited budget.","constraints":"Need high relevance."}$j$::jsonb),
  (37, $t$GA-S003$t$, $t$google-ads$t$, $t$Negative Keywords$t$, $t$Beginner$t$, $t$Optimization$t$, $t$What should you do first?$t$, $j$["Increase bids","Pause campaign","Raise budget","Add negative keywords"]$j$::jsonb, $j${"company":"UrbanKart","role":"Campaign Manager","industry":"E-commerce","background":"Ads appear for irrelevant searches.","objective":"Reduce wasted spend.","information":"Search terms include 'free' and 'jobs'.","constraints":"CPA increasing."}$j$::jsonb),
  (38, $t$GA-S004$t$, $t$google-ads$t$, $t$Quality Score Drop$t$, $t$Intermediate$t$, $t$Quality Score$t$, $t$What should you review first?$t$, $j$["Ad relevance","Office location","Campaign name","Account currency"]$j$::jsonb, $j${"company":"TaskFlow","role":"Performance Marketer","industry":"SaaS","background":"Quality Score dropped from 8 to 4.","objective":"Improve ad performance.","information":"CTR declined; landing page unchanged.","constraints":"Budget fixed."}$j$::jsonb),
  (39, $t$GA-S005$t$, $t$google-ads$t$, $t$Low CTR$t$, $t$Intermediate$t$, $t$Ad Copy$t$, $t$Best first action?$t$, $j$["Increase bids","Pause keywords","Rewrite ad copy and headlines","Change logo"]$j$::jsonb, $j${"company":"TravelGo","role":"SEM Specialist","industry":"Travel","background":"Search ads have 0.9% CTR.","objective":"Increase clicks.","information":"Impressions are high.","constraints":"Competitors have stronger offers."}$j$::jsonb),
  (40, $t$GA-S006$t$, $t$google-ads$t$, $t$High CPC$t$, $t$Intermediate$t$, $t$Bidding$t$, $t$What should you analyze first?$t$, $j$["Auction Insights","Website colors","Office address","Email signatures"]$j$::jsonb, $j${"company":"LegalPro","role":"Google Ads Manager","industry":"Legal","background":"Average CPC increased 40%.","objective":"Maintain profitability.","information":"Competitive auction.","constraints":"Conversion rate stable."}$j$::jsonb),
  (41, $t$GA-S007$t$, $t$google-ads$t$, $t$Landing Page Experience$t$, $t$Intermediate$t$, $t$Landing Pages$t$, $t$Main optimization?$t$, $j$["Add keywords","Increase budget","Improve landing page speed and UX","Pause ads"]$j$::jsonb, $j${"company":"HomeSpace","role":"Growth Manager","industry":"Real Estate","background":"CTR is 6% but conversions remain low.","objective":"Increase enquiries.","information":"Landing page loads in 8 seconds.","constraints":"Mobile bounce rate 72%."}$j$::jsonb),
  (42, $t$GA-S008$t$, $t$google-ads$t$, $t$Performance Max Evaluation$t$, $t$Intermediate$t$, $t$Performance Max$t$, $t$Recommendation?$t$, $j$["Continue while measuring business KPIs","Pause campaign","Move all budget to Display","Disable tracking"]$j$::jsonb, $j${"company":"StyleHub","role":"Digital Marketing Executive","industry":"Retail","background":"Performance Max delivers conversions but limited visibility.","objective":"Decide next action.","information":"ROAS 4.5.","constraints":"Limited search term insights."}$j$::jsonb),
  (43, $t$GA-S009$t$, $t$google-ads$t$, $t$Search Terms Analysis$t$, $t$Intermediate$t$, $t$Search Queries$t$, $t$First action?$t$, $j$["Increase bids","Duplicate campaign","Review search terms and add negatives","Pause account"]$j$::jsonb, $j${"company":"FutureLearn","role":"PPC Analyst","industry":"Education","background":"Search report contains many irrelevant queries.","objective":"Improve efficiency.","information":"CPA rising.","constraints":"Negative keywords missing."}$j$::jsonb),
  (44, $t$GA-S010$t$, $t$google-ads$t$, $t$Remarketing Strategy$t$, $t$Intermediate$t$, $t$Remarketing$t$, $t$Best campaign?$t$, $j$["Search only","Remarketing campaign","Display without audiences","Video awareness"]$j$::jsonb, $j${"company":"GlowSkin","role":"SEM Manager","industry":"Beauty","background":"Thousands abandon carts monthly.","objective":"Recover lost sales.","information":"GA4 audiences available.","constraints":"Budget ₹3L."}$j$::jsonb),
  (45, $t$GA-S011$t$, $t$google-ads$t$, $t$Scaling Search Campaigns$t$, $t$Advanced$t$, $t$Scaling$t$, $t$Best approach?$t$, $j$["Double budget overnight","Restart campaign","Gradually increase budget while monitoring CPA","Pause keywords"]$j$::jsonb, $j${"company":"SecureLife","role":"Senior PPC Manager","industry":"Insurance","background":"Campaign consistently achieves CPA below target.","objective":"Increase lead volume.","information":"Budget available.","constraints":"Stable Quality Score."}$j$::jsonb),
  (46, $t$GA-S012$t$, $t$google-ads$t$, $t$Conversion Tracking Failure$t$, $t$Advanced$t$, $t$Tracking$t$, $t$First investigation?$t$, $j$["Ad copy","Keyword bids","Extensions","Conversion tag implementation"]$j$::jsonb, $j${"company":"FinNest","role":"Tracking Specialist","industry":"Finance","background":"Conversions suddenly dropped to zero.","objective":"Restore measurement.","information":"Website updated yesterday.","constraints":"Traffic unchanged."}$j$::jsonb),
  (47, $t$GA-S013$t$, $t$google-ads$t$, $t$Budget Allocation$t$, $t$Advanced$t$, $t$Budget Strategy$t$, $t$What should you do?$t$, $j$["Equal budget","Pause all","Increase all budgets","Shift budget toward higher ROAS campaigns"]$j$::jsonb, $j${"company":"StayEasy","role":"SEM Lead","industry":"Hospitality","background":"Five campaigns compete for the same budget.","objective":"Maximize bookings.","information":"ROAS ranges from 2.0 to 7.1.","constraints":"Budget limited."}$j$::jsonb),
  (48, $t$GA-S014$t$, $t$google-ads$t$, $t$Campaign Rescue$t$, $t$Advanced$t$, $t$Troubleshooting$t$, $t$First action?$t$, $j$["Increase budget","Audit keywords, search terms and landing pages","Launch Display","Pause account"]$j$::jsonb, $j${"company":"DriveNow","role":"Performance Lead","industry":"Automotive","background":"₹5 lakh spent with poor lead quality.","objective":"Improve results quickly.","information":"CTR 5%, Conversion Rate 0.5%.","constraints":"One week remains."}$j$::jsonb),
  (49, $t$GA-S015$t$, $t$google-ads$t$, $t$Quarterly Account Review$t$, $t$Expert$t$, $t$Strategic Optimization$t$, $t$Best recommendation?$t$, $j$["Increase spend everywhere","Pause low performers immediately","Replace all keywords","Invest more in top-performing campaigns while testing new opportunities"]$j$::jsonb, $j${"company":"BuildPro","role":"Head of Digital","industry":"Manufacturing","background":"Executive team requests next-quarter growth strategy.","objective":"Increase qualified leads while improving ROAS.","information":"Mixed campaign performance.","constraints":"Board presentation tomorrow."}$j$::jsonb),
  (50, $t$SEO-S001$t$, $t$seo-aeo$t$, $t$Organic Traffic Decline$t$, $t$Beginner$t$, $t$Technical SEO$t$, $t$Where should you investigate first?$t$, $j$["Run influencer campaign","Audit redirects and technical SEO","Increase Meta Ads budget","Publish more social posts"]$j$::jsonb, $j${"company":"SkillSprint","role":"SEO Specialist","industry":"EdTech","background":"Organic traffic has dropped 35% after a website redesign.","objective":"Recover lost traffic.","information":"URLs changed, redirects may be missing, rankings declining.","constraints":"Limited developer time."}$j$::jsonb),
  (51, $t$SEO-S002$t$, $t$seo-aeo$t$, $t$Keyword Prioritization$t$, $t$Beginner$t$, $t$Keyword Research$t$, $t$Which keyword should be targeted first?$t$, $j$["Keyword A","Both equally","Keyword B","Neither"]$j$::jsonb, $j${"company":"MedEase","role":"SEO Executive","industry":"Healthcare","background":"A new healthcare blog is choosing target keywords.","objective":"Rank within 6 months.","information":"Keyword A: 60k volume/KD90. Keyword B: 7k volume/KD25.","constraints":"New domain authority."}$j$::jsonb),
  (52, $t$SEO-S003$t$, $t$seo-aeo$t$, $t$Content Gap Analysis$t$, $t$Beginner$t$, $t$Content Strategy$t$, $t$What should you do first?$t$, $j$["Copy competitor articles","Buy backlinks only","Perform a content gap analysis and build a content plan","Ignore competitors"]$j$::jsonb, $j${"company":"FinNest","role":"Content Strategist","industry":"Finance","background":"Competitors rank for topics your website does not cover.","objective":"Increase organic visibility.","information":"Competitors publish guides, calculators and FAQs.","constraints":"Small content team."}$j$::jsonb),
  (53, $t$SEO-S004$t$, $t$seo-aeo$t$, $t$Local SEO Challenge$t$, $t$Intermediate$t$, $t$Local SEO$t$, $t$What is the highest priority?$t$, $j$["Buy display ads","Optimize Google Business Profile and local citations","Change logo","Rewrite homepage only"]$j$::jsonb, $j${"company":"SpiceHouse","role":"Local SEO Manager","industry":"Restaurant","background":"The restaurant ranks nationally for recipes but not for local searches.","objective":"Increase local reservations.","information":"Google Business Profile exists but has few reviews.","constraints":"Budget limited."}$j$::jsonb),
  (54, $t$SEO-S005$t$, $t$seo-aeo$t$, $t$Core Web Vitals$t$, $t$Intermediate$t$, $t$Technical SEO$t$, $t$What should be prioritized?$t$, $j$["Improve page speed and Core Web Vitals","Add more keywords","Increase backlinks","Run paid ads"]$j$::jsonb, $j${"company":"UrbanKart","role":"Technical SEO Analyst","industry":"E-commerce","background":"Mobile pages load slowly and Core Web Vitals are failing.","objective":"Improve rankings and UX.","information":"LCP 5.8s, CLS 0.32, INP poor.","constraints":"Development sprint available."}$j$::jsonb),
  (55, $t$SEO-S006$t$, $t$seo-aeo$t$, $t$Backlink Strategy$t$, $t$Intermediate$t$, $t$Link Building$t$, $t$Best long-term strategy?$t$, $j$["Earn authoritative backlinks through partnerships and content","Buy hundreds of low-quality links","Ignore backlinks","Stuff keywords"]$j$::jsonb, $j${"company":"TravelGo","role":"SEO Consultant","industry":"Travel","background":"A competitor has twice as many high-quality backlinks.","objective":"Increase domain authority.","information":"Content quality is strong.","constraints":"Limited outreach budget."}$j$::jsonb),
  (56, $t$SEO-S007$t$, $t$seo-aeo$t$, $t$Schema Markup$t$, $t$Intermediate$t$, $t$Structured Data$t$, $t$What should you implement?$t$, $j$["More banner ads","Product schema markup","More pop-ups","More images only"]$j$::jsonb, $j${"company":"StyleHub","role":"SEO Manager","industry":"Retail","background":"Product pages rarely appear with rich results.","objective":"Improve SERP visibility.","information":"No structured data implemented.","constraints":"Developers available."}$j$::jsonb),
  (57, $t$SEO-S008$t$, $t$seo-aeo$t$, $t$Featured Snippet Opportunity$t$, $t$Advanced$t$, $t$Content Optimization$t$, $t$What should you do?$t$, $j$["Restructure content with concise answers, headings and FAQs","Increase PPC bids","Delete the page","Reduce content length drastically"]$j$::jsonb, $j${"company":"LegalPro","role":"Organic Growth Manager","industry":"Legal","background":"Competitor owns the featured snippet for an important keyword.","objective":"Win the snippet.","information":"Your article ranks #3.","constraints":"Content can be updated."}$j$::jsonb),
  (58, $t$SEO-S009$t$, $t$seo-aeo$t$, $t$AI Search & AEO$t$, $t$Advanced$t$, $t$Answer Engine Optimization$t$, $t$Which improvement is most valuable?$t$, $j$["Publish shorter ads","Pause SEO","Create expert, structured content with FAQs and schema","Focus only on backlinks"]$j$::jsonb, $j${"company":"TaskFlow","role":"AEO Specialist","industry":"SaaS","background":"AI-powered search engines summarize competitor content instead of yours.","objective":"Increase AI visibility.","information":"Content lacks direct answers and structured FAQs.","constraints":"Need future-ready SEO."}$j$::jsonb),
  (59, $t$SEO-S010$t$, $t$seo-aeo$t$, $t$Site Migration$t$, $t$Advanced$t$, $t$Technical SEO$t$, $t$What is the most critical preparation?$t$, $j$["Delete old URLs","Launch without testing","Create redirect mapping and test indexing","Pause Search Console"]$j$::jsonb, $j${"company":"BuildPro","role":"SEO Lead","industry":"Manufacturing","background":"The company is moving to a new CMS.","objective":"Protect organic traffic.","information":"20,000 indexed URLs.","constraints":"Migration in 30 days."}$j$::jsonb),
  (60, $t$SEO-S011$t$, $t$seo-aeo$t$, $t$Internal Linking$t$, $t$Advanced$t$, $t$Site Architecture$t$, $t$What should you do?$t$, $j$["Remove links","Reduce navigation","Duplicate pages","Build a strategic internal linking structure"]$j$::jsonb, $j${"company":"FutureLearn","role":"SEO Strategist","industry":"Education","background":"Important course pages receive little internal authority.","objective":"Improve rankings.","information":"Many orphan pages found.","constraints":"Content hub exists."}$j$::jsonb),
  (61, $t$SEO-S012$t$, $t$seo-aeo$t$, $t$Recovering from a Google Update$t$, $t$Advanced$t$, $t$Algorithm Recovery$t$, $t$Best first action?$t$, $j$["Buy backlinks","Audit content quality against search intent and E-E-A-T","Change domain","Pause publishing"]$j$::jsonb, $j${"company":"GlowSkin","role":"SEO Consultant","industry":"Beauty","background":"Traffic dropped after a major Google core update.","objective":"Recover rankings.","information":"No manual actions reported.","constraints":"Content quality inconsistent."}$j$::jsonb),
  (62, $t$SEO-S013$t$, $t$seo-aeo$t$, $t$Content Refresh Strategy$t$, $t$Advanced$t$, $t$Content Optimization$t$, $t$Best action?$t$, $j$["Delete blogs","Ignore them","Only change titles","Refresh and expand existing content"]$j$::jsonb, $j${"company":"QuickServe","role":"Content Manager","industry":"Food","background":"Blogs ranking on page two haven't been updated for two years.","objective":"Increase organic traffic.","information":"Competitors publish fresher information.","constraints":"Limited writers."}$j$::jsonb),
  (63, $t$SEO-S014$t$, $t$seo-aeo$t$, $t$SEO Reporting$t$, $t$Advanced$t$, $t$Measurement$t$, $t$Which KPI set is most useful?$t$, $j$["Followers and likes","Page colors","Bounce rate only","Organic conversions, rankings, CTR and revenue"]$j$::jsonb, $j${"company":"SecureLife","role":"SEO Analyst","industry":"Insurance","background":"The CEO wants proof that SEO is driving business value.","objective":"Build executive reporting.","information":"GA4 and Search Console connected.","constraints":"Monthly reporting required."}$j$::jsonb),
  (64, $t$SEO-S015$t$, $t$seo-aeo$t$, $t$Building a Long-Term SEO Roadmap$t$, $t$Expert$t$, $t$SEO Strategy$t$, $t$Which roadmap is strongest?$t$, $j$["Combine technical SEO, content, authority building, local SEO and AEO","Focus only on backlinks","Publish blogs only","Depend entirely on paid ads"]$j$::jsonb, $j${"company":"HomeSpace","role":"Head of Organic Growth","industry":"Real Estate","background":"The company wants to dominate organic search over the next three years.","objective":"Create a sustainable SEO strategy.","information":"Large content budget, development support and leadership buy-in.","constraints":"Highly competitive market."}$j$::jsonb),
  (65, $t$ANA-S001$t$, $t$analytics$t$, $t$GA4 Setup Validation$t$, $t$Beginner$t$, $t$GA4 Configuration$t$, $t$What should be done first?$t$, $j$["Configure key events and conversions","Launch ads immediately","Change website colors","Increase budget"]$j$::jsonb, $j${"company":"SkillSprint","role":"Marketing Analyst","industry":"EdTech","background":"A new website has launched and management wants reliable analytics before campaigns begin.","objective":"Ensure accurate tracking.","information":"GA4 installed; no conversions configured.","constraints":"Launch in one week."}$j$::jsonb),
  (66, $t$ANA-S002$t$, $t$analytics$t$, $t$Traffic Increased but Leads Didn't$t$, $t$Beginner$t$, $t$Traffic Analysis$t$, $t$What should you investigate first?$t$, $j$["Increase ad spend","Logo redesign","Landing page engagement and conversion funnel","Social media followers"]$j$::jsonb, $j${"company":"MedEase","role":"Digital Analyst","industry":"Healthcare","background":"Organic traffic has grown by 45% over two months, but lead volume has remained flat.","objective":"Identify the reason.","information":"Sessions ↑45%; Leads unchanged; Bounce rate 70%.","constraints":"Limited development resources."}$j$::jsonb),
  (67, $t$ANA-S003$t$, $t$analytics$t$, $t$Attribution Conflict$t$, $t$Intermediate$t$, $t$Attribution$t$, $t$What is the best explanation?$t$, $j$["One platform is broken","GA4 lost all data","Meta inflates every conversion","Different attribution windows and models produce different numbers"]$j$::jsonb, $j${"company":"UrbanKart","role":"Performance Analyst","industry":"E-commerce","background":"Meta Ads reports 320 purchases while GA4 attributes only 210 purchases to Meta.","objective":"Explain reporting differences.","information":"Different attribution models are being used.","constraints":"Executive meeting tomorrow."}$j$::jsonb),
  (68, $t$ANA-S004$t$, $t$analytics$t$, $t$Funnel Drop-off$t$, $t$Intermediate$t$, $t$Funnel Analysis$t$, $t$Where should optimization efforts begin?$t$, $j$["Homepage redesign","Increase impressions","Pause campaigns","Checkout process and payment experience"]$j$::jsonb, $j${"company":"TravelGo","role":"Growth Analyst","industry":"Travel","background":"A booking funnel shows 10,000 users visiting package pages, 3,200 reaching checkout and only 180 completing payment.","objective":"Increase completed bookings.","information":"Checkout abandonment is very high.","constraints":"No increase in media budget."}$j$::jsonb),
  (69, $t$ANA-S005$t$, $t$analytics$t$, $t$Campaign ROI Comparison$t$, $t$Intermediate$t$, $t$ROI Analysis$t$, $t$Which recommendation is best?$t$, $j$["Split budget equally","Allocate more budget to the higher ROAS channel while continuing controlled tests","Pause Meta","Spend only on Google"]$j$::jsonb, $j${"company":"TaskFlow","role":"Marketing Analyst","industry":"SaaS","background":"Google Ads generated ₹12 lakh revenue from ₹3 lakh spend. Meta generated ₹9 lakh revenue from ₹2 lakh spend.","objective":"Recommend budget allocation.","information":"Need profitable growth.","constraints":"Budget fixed at ₹6 lakh."}$j$::jsonb),
  (70, $t$ANA-S006$t$, $t$analytics$t$, $t$Conversion Tracking Failure$t$, $t$Intermediate$t$, $t$Measurement$t$, $t$What should be checked first?$t$, $j$["Campaign names","Ad headlines","Conversion event implementation","Audience settings"]$j$::jsonb, $j${"company":"HomeSpace","role":"Analytics Specialist","industry":"Real Estate","background":"Lead conversions suddenly dropped to zero in GA4 after a website update.","objective":"Restore reporting.","information":"Traffic unchanged; Forms still working.","constraints":"Developer available today."}$j$::jsonb),
  (71, $t$ANA-S007$t$, $t$analytics$t$, $t$Dashboard for Executives$t$, $t$Advanced$t$, $t$Reporting$t$, $t$Which KPI set should be prioritized?$t$, $j$["Likes and followers","Revenue, Leads, CPA, ROAS and Conversion Rate","Impressions only","CTR only"]$j$::jsonb, $j${"company":"FinNest","role":"BI Analyst","industry":"Finance","background":"The CEO wants a monthly dashboard focused on business outcomes instead of marketing metrics.","objective":"Build an executive dashboard.","information":"GA4, CRM and ad data available.","constraints":"Monthly review meetings."}$j$::jsonb),
  (72, $t$ANA-S008$t$, $t$analytics$t$, $t$Audience Behaviour Analysis$t$, $t$Advanced$t$, $t$Audience Insights$t$, $t$What is the best recommendation?$t$, $j$["Ignore bounce rate","Pause remarketing","Increase prices","Improve landing pages and targeting for new visitors"]$j$::jsonb, $j${"company":"StyleHub","role":"Customer Insights Analyst","industry":"Retail","background":"New visitors bounce at 72%, while returning visitors bounce at 28% and convert 5x more often.","objective":"Improve acquisition quality.","information":"Traffic sources available.","constraints":"Budget unchanged."}$j$::jsonb),
  (73, $t$ANA-S009$t$, $t$analytics$t$, $t$Marketing Mix Evaluation$t$, $t$Advanced$t$, $t$Channel Performance$t$, $t$What strategy is most appropriate?$t$, $j$["Increase investment in top-performing channels while maintaining diversification","Invest equally everywhere","Pause SEO","Remove email"]$j$::jsonb, $j${"company":"QuickServe","role":"Growth Analyst","industry":"Food Delivery","background":"The company invests in SEO, Google Ads, Meta Ads and Email Marketing.","objective":"Recommend next-quarter investment.","information":"Email has highest ROI but smallest volume; Google delivers largest revenue; SEO is growing steadily.","constraints":"Budget increase limited."}$j$::jsonb),
  (74, $t$ANA-S010$t$, $t$analytics$t$, $t$Executive Performance Review$t$, $t$Expert$t$, $t$Strategic Analytics$t$, $t$What is the strongest approach?$t$, $j$["Show only traffic charts","Present business insights, trends, attribution, ROI analysis and strategic recommendations","Export raw GA4 reports","Focus only on conversion rate"]$j$::jsonb, $j${"company":"BuildPro","role":"Head of Analytics","industry":"Manufacturing","background":"The board requests a data-driven recommendation for next year's digital marketing strategy.","objective":"Present strategic insights.","information":"12 months of channel, revenue and customer data available.","constraints":"Need actionable recommendations."}$j$::jsonb),
  (75, $t$CM-S001$t$, $t$content-marketing$t$, $t$Building a Content Strategy$t$, $t$Beginner$t$, $t$Content Strategy$t$, $t$Which content strategy should be prioritized first?$t$, $j$["Only promotional posts","Educational content answering student questions","Memes only","Daily discount posts"]$j$::jsonb, $j${"company":"SkillSprint","role":"Content Marketing Manager","industry":"EdTech","background":"SkillSprint is launching new AI and Data Science programs. The website has very little content and almost no organic visibility.","objective":"Build awareness and generate qualified leads.","information":"Budget ₹5 lakh; Blog section empty; Social channels active.","constraints":"Small content team."}$j$::jsonb),
  (76, $t$CM-S002$t$, $t$content-marketing$t$, $t$Choosing the Right Content Format$t$, $t$Beginner$t$, $t$Content Planning$t$, $t$Which format should be created first?$t$, $j$["Short educational videos with supporting articles","Long PDF only","Radio ads","Banner ads only"]$j$::jsonb, $j${"company":"MedEase","role":"Content Strategist","industry":"Healthcare","background":"A hospital wants to educate patients about diabetes prevention.","objective":"Increase awareness and consultations.","information":"Audience prefers mobile content.","constraints":"Limited production budget."}$j$::jsonb),
  (77, $t$CM-S003$t$, $t$content-marketing$t$, $t$Editorial Calendar Planning$t$, $t$Beginner$t$, $t$Content Calendar$t$, $t$What should you implement first?$t$, $j$["Monthly editorial calendar aligned with campaigns","Daily random posts","Post only when sales drop","Stop publishing"]$j$::jsonb, $j${"company":"StyleHub","role":"Content Executive","industry":"Retail","background":"The marketing team publishes content randomly without a schedule.","objective":"Improve consistency.","information":"Multiple product launches planned.","constraints":"Two writers available."}$j$::jsonb),
  (78, $t$CM-S004$t$, $t$content-marketing$t$, $t$Low Blog Engagement$t$, $t$Intermediate$t$, $t$Content Optimization$t$, $t$What should you improve first?$t$, $j$["Publish fewer blogs","Increase ad spend","Delete all articles","Improve readability, structure and user experience"]$j$::jsonb, $j${"company":"TravelGo","role":"SEO Content Specialist","industry":"Travel","background":"Blog traffic is increasing but average time on page is only 28 seconds.","objective":"Increase engagement.","information":"Bounce rate 82%; Articles exceed 2,500 words.","constraints":"No redesign budget."}$j$::jsonb),
  (79, $t$CM-S005$t$, $t$content-marketing$t$, $t$Content for Different Funnel Stages$t$, $t$Intermediate$t$, $t$Marketing Funnel$t$, $t$What is the best approach?$t$, $j$["Only sales content","Create TOFU, MOFU and BOFU content","Stop blogging","Use only testimonials"]$j$::jsonb, $j${"company":"FinNest","role":"Content Manager","industry":"Finance","background":"The company creates only promotional content and struggles to generate trust.","objective":"Improve conversions.","information":"Awareness traffic is growing.","constraints":"Limited creative resources."}$j$::jsonb),
  (80, $t$CM-S006$t$, $t$content-marketing$t$, $t$Repurposing High-Performing Content$t$, $t$Intermediate$t$, $t$Content Repurposing$t$, $t$What should be done next?$t$, $j$["Leave it unchanged","Delete after campaign","Rewrite from scratch","Repurpose into videos, infographics, email and social content"]$j$::jsonb, $j${"company":"TaskFlow","role":"Growth Content Lead","industry":"SaaS","background":"One blog generated 50,000 visits organically.","objective":"Maximize its value.","information":"Strong engagement metrics.","constraints":"Small design team."}$j$::jsonb),
  (81, $t$CM-S007$t$, $t$content-marketing$t$, $t$Thought Leadership Strategy$t$, $t$Advanced$t$, $t$Brand Authority$t$, $t$Which strategy is strongest?$t$, $j$["Publish only company news","Focus only on paid ads","Publish expert insights, case studies and educational guides","Use stock content"]$j$::jsonb, $j${"company":"LegalPro","role":"Head of Content","industry":"Legal","background":"The firm wants to become the most trusted legal resource for SMEs.","objective":"Build authority.","information":"Experienced lawyers available.","constraints":"Competitive market."}$j$::jsonb),
  (82, $t$CM-S008$t$, $t$content-marketing$t$, $t$Social Content Performance$t$, $t$Advanced$t$, $t$Social Media Content$t$, $t$What should you recommend?$t$, $j$["Continue equal posting","Stop image posts forever","Shift more resources toward high-performing video content while testing new ideas","Ignore analytics"]$j$::jsonb, $j${"company":"QuickServe","role":"Social Content Manager","industry":"Food Delivery","background":"Short-form videos outperform image posts by 4x in engagement.","objective":"Increase orders.","information":"Video production is affordable.","constraints":"Budget fixed."}$j$::jsonb),
  (83, $t$CM-S009$t$, $t$content-marketing$t$, $t$Measuring Content Success$t$, $t$Advanced$t$, $t$Content Analytics$t$, $t$Which KPI set is most valuable?$t$, $j$["Page views only","Followers only","Leads, engagement, assisted conversions and revenue impact","Likes only"]$j$::jsonb, $j${"company":"GlowSkin","role":"Content Analyst","industry":"Beauty","background":"The CEO measures success only by page views.","objective":"Create meaningful reporting.","information":"GA4 and CRM connected.","constraints":"Monthly executive review."}$j$::jsonb),
  (84, $t$CM-S010$t$, $t$content-marketing$t$, $t$Integrated Content Campaign$t$, $t$Expert$t$, $t$Campaign Planning$t$, $t$Which campaign approach is strongest?$t$, $j$["Only paid social posts","Only YouTube videos","Only email newsletters","Coordinate blogs, videos, email, SEO and social content around one campaign theme"]$j$::jsonb, $j${"company":"HomeSpace","role":"Content Marketing Lead","industry":"Real Estate","background":"A premium apartment launch requires a three-month content campaign.","objective":"Generate qualified enquiries and build brand trust.","information":"Blog, email, YouTube and social channels available.","constraints":"Highly competitive market."}$j$::jsonb),
  (85, $t$MAI-S001$t$, $t$marketing-automation-ai$t$, $t$Welcome Email Automation$t$, $t$Beginner$t$, $t$Email Automation$t$, $t$What should be automated first?$t$, $j$["Weekly newsletter only","Welcome email sequence","Monthly sales email","No automation"]$j$::jsonb, $j${"company":"SkillSprint","role":"Marketing Automation Specialist","industry":"EdTech","background":"Every new lead receives the same generic email, resulting in low engagement.","objective":"Increase email open and click rates.","information":"CRM and email platform are connected.","constraints":"Limited content resources."}$j$::jsonb),
  (86, $t$MAI-S002$t$, $t$marketing-automation-ai$t$, $t$Lead Nurturing Workflow$t$, $t$Beginner$t$, $t$Lead Nurturing$t$, $t$What is the best solution?$t$, $j$["Call every lead","Send one reminder email","Automated nurturing workflow based on user actions","Pause free trials"]$j$::jsonb, $j${"company":"TaskFlow","role":"CRM Executive","industry":"SaaS","background":"Thousands of trial users never become paying customers.","objective":"Increase trial-to-paid conversions.","information":"User behavior data is available.","constraints":"Small sales team."}$j$::jsonb),
  (87, $t$MAI-S003$t$, $t$marketing-automation-ai$t$, $t$WhatsApp Automation$t$, $t$Beginner$t$, $t$WhatsApp Marketing$t$, $t$What should be implemented?$t$, $j$["Automated appointment reminders","Manual reminders","Daily promotional messages","SMS only"]$j$::jsonb, $j${"company":"MedEase","role":"Automation Manager","industry":"Healthcare","background":"Patients frequently miss appointment reminders.","objective":"Reduce no-show rate.","information":"WhatsApp Business API is available.","constraints":"Must comply with consent requirements."}$j$::jsonb),
  (88, $t$MAI-S004$t$, $t$marketing-automation-ai$t$, $t$Lead Scoring$t$, $t$Intermediate$t$, $t$Lead Scoring$t$, $t$What should be introduced?$t$, $j$["Lead scoring model","Random lead assignment","More cold calls","Ignore website activity"]$j$::jsonb, $j${"company":"HomeSpace","role":"CRM Manager","industry":"Real Estate","background":"Sales teams spend time calling low-quality leads.","objective":"Prioritize high-intent prospects.","information":"CRM captures website visits, downloads and enquiries.","constraints":"Sales capacity is limited."}$j$::jsonb),
  (89, $t$MAI-S005$t$, $t$marketing-automation-ai$t$, $t$Cart Abandonment Automation$t$, $t$Intermediate$t$, $t$E-commerce Automation$t$, $t$Best first workflow?$t$, $j$["Automated cart abandonment reminders","Weekly newsletter","Mass promotional email","Delete inactive carts"]$j$::jsonb, $j${"company":"StyleHub","role":"Lifecycle Marketer","industry":"Retail","background":"Many shoppers abandon carts before checkout.","objective":"Recover lost sales.","information":"Email and SMS integrations available.","constraints":"Limited discount budget."}$j$::jsonb),
  (90, $t$MAI-S006$t$, $t$marketing-automation-ai$t$, $t$AI Copy Generation$t$, $t$Intermediate$t$, $t$AI Content$t$, $t$How should AI be used?$t$, $j$["Publish AI output without review","Avoid AI completely","Generate first drafts and review before publishing","Replace the content team"]$j$::jsonb, $j${"company":"GlowSkin","role":"Content Manager","industry":"Beauty","background":"The marketing team spends hours writing ad copy for every campaign.","objective":"Increase productivity.","information":"AI writing tools are available.","constraints":"Human review is required."}$j$::jsonb),
  (91, $t$MAI-S007$t$, $t$marketing-automation-ai$t$, $t$AI Audience Insights$t$, $t$Intermediate$t$, $t$AI Analytics$t$, $t$Best approach?$t$, $j$["Manual spreadsheets","Ignore older data","Random segmentation","Use AI to identify audience patterns and validate findings"]$j$::jsonb, $j${"company":"FinNest","role":"Growth Analyst","industry":"Finance","background":"Customer data is growing too quickly for manual analysis.","objective":"Identify high-value segments.","information":"Historical CRM data available.","constraints":"Need weekly insights."}$j$::jsonb),
  (92, $t$MAI-S008$t$, $t$marketing-automation-ai$t$, $t$Marketing Workflow Automation$t$, $t$Advanced$t$, $t$Workflow Design$t$, $t$What should be implemented?$t$, $j$["Automated workflow integrations","Continue manual exports","Hire more administrators","Print spreadsheets"]$j$::jsonb, $j${"company":"TravelGo","role":"Marketing Operations Manager","industry":"Travel","background":"The team manually transfers leads between multiple tools.","objective":"Reduce manual work.","information":"CRM, email and forms support integrations.","constraints":"Need reliable processes."}$j$::jsonb),
  (93, $t$MAI-S009$t$, $t$marketing-automation-ai$t$, $t$AI Chatbot Strategy$t$, $t$Advanced$t$, $t$Conversational AI$t$, $t$Best solution?$t$, $j$["Remove support","Use only email","Disable live chat","Deploy an AI chatbot with human escalation"]$j$::jsonb, $j${"company":"FutureLearn","role":"Digital Experience Manager","industry":"Education","background":"Support teams receive hundreds of repetitive course enquiries every day.","objective":"Reduce response time.","information":"FAQ database exists.","constraints":"Complex issues still require humans."}$j$::jsonb),
  (94, $t$MAI-S010$t$, $t$marketing-automation-ai$t$, $t$Re-engagement Campaign$t$, $t$Advanced$t$, $t$Lifecycle Marketing$t$, $t$Best campaign?$t$, $j$["Ignore inactive users","Automated personalized re-engagement sequence","Only social media ads","Acquire new users only"]$j$::jsonb, $j${"company":"QuickServe","role":"Retention Specialist","industry":"Food Delivery","background":"20,000 customers haven't ordered in six months.","objective":"Win back inactive users.","information":"Purchase history available.","constraints":"Budget limited."}$j$::jsonb),
  (95, $t$MAI-S011$t$, $t$marketing-automation-ai$t$, $t$Prompt Engineering for Marketing$t$, $t$Advanced$t$, $t$Prompt Engineering$t$, $t$Best improvement?$t$, $j$["Write shorter prompts only","Stop using AI","Create structured prompts with context, goals and constraints","Generate random prompts"]$j$::jsonb, $j${"company":"CreativeSpark","role":"AI Marketing Consultant","industry":"Agency","background":"The team gets inconsistent AI-generated campaign ideas.","objective":"Improve AI output quality.","information":"Uses multiple AI tools.","constraints":"Need repeatable process."}$j$::jsonb),
  (96, $t$MAI-S012$t$, $t$marketing-automation-ai$t$, $t$Automation Performance Audit$t$, $t$Advanced$t$, $t$Automation Optimization$t$, $t$First step?$t$, $j$["Create more workflows","Delete all workflows","Increase ad spend","Audit existing automations and optimize weak points"]$j$::jsonb, $j${"company":"SecureLife","role":"Marketing Operations Lead","industry":"Insurance","background":"Several automations exist but performance has declined.","objective":"Improve efficiency.","information":"Email opens falling; workflows outdated.","constraints":"No additional budget."}$j$::jsonb),
  (97, $t$MAI-S013$t$, $t$marketing-automation-ai$t$, $t$AI Ethics in Marketing$t$, $t$Advanced$t$, $t$Responsible AI$t$, $t$Best policy?$t$, $j$["Publish everything AI creates","Require human review, transparency and compliance checks","Avoid AI forever","Hide AI usage"]$j$::jsonb, $j${"company":"MedEase","role":"Digital Strategy Manager","industry":"Healthcare","background":"The team plans to use AI-generated patient content.","objective":"Maintain trust and compliance.","information":"Healthcare regulations apply.","constraints":"Brand reputation is critical."}$j$::jsonb),
  (98, $t$MAI-S014$t$, $t$marketing-automation-ai$t$, $t$Cross-Channel Automation$t$, $t$Expert$t$, $t$Omnichannel Automation$t$, $t$Best strategy?$t$, $j$["Separate campaigns by channel only","Create unified cross-channel automation journeys","Email only","Meta Ads only"]$j$::jsonb, $j${"company":"DriveNow","role":"Marketing Automation Architect","industry":"Automotive","background":"Customers interact through website, email, WhatsApp and paid ads.","objective":"Deliver consistent experiences.","information":"Integrated customer data platform available.","constraints":"Need personalization at scale."}$j$::jsonb),
  (99, $t$MAI-S015$t$, $t$marketing-automation-ai$t$, $t$Building an AI Marketing Roadmap$t$, $t$Expert$t$, $t$AI Strategy$t$, $t$Which roadmap is strongest?$t$, $j$["Replace all marketers immediately","Buy every AI tool available","Implement AI in phases with training, governance, automation and continuous measurement","Delay AI adoption indefinitely"]$j$::jsonb, $j${"company":"BuildPro","role":"Head of Marketing Innovation","industry":"Manufacturing","background":"Leadership wants to integrate AI into marketing over the next three years.","objective":"Create a practical roadmap.","information":"Budget approved; Teams need training.","constraints":"Must balance innovation with governance."}$j$::jsonb);

do $$
declare
  v_rubric jsonb := (public.programme_blank_content() #> '{project,rubric}');
  v_gl jsonb;
  v_dm jsonb;
  v_problems text[];
  v_id uuid;
begin
  if exists (select 1 from public.programmes where slug in ('global-leadership', 'digital-marketing')) then
    raise notice 'Global Leadership and Digital Marketing are already on the course engine; nothing changed.';
    return;
  end if;

  v_gl := jsonb_build_object(
    'overview', jsonb_build_object(
      'summary', (select intro from _bi_gl),
      'audience', 'students and graduates building the life skills employers look for',
      'outcomes', (select outcomes from _bi_gl), 'level', 'beginner', 'hours', 40),
    'skills', (select skills from _bi_gl),
    'aptitude', jsonb_build_object('items', coalesce((
      select jsonb_agg(jsonb_build_object('id', q.id, 'skill', q.skill, 'statement', q.statement, 'reverse', q.reverse) order by q.sort_order)
        from public.career_readiness_assessment_questions q where q.version = 2), '[]'::jsonb)),
    'modules', (select modules from _bi_gl),
    'final', jsonb_build_object('minutes', 30, 'pass_percent', 60, 'questions', '[]'::jsonb),
    'project', jsonb_build_object(
      'brief', 'A project that puts the programme into practice on something real, guided and graded by a mentor.',
      'deliverables', '[]'::jsonb, 'rubric', v_rubric));

  v_dm := jsonb_build_object(
    'overview', jsonb_build_object(
      'summary', 'Eight skill tracks of real business scenarios, from marketing fundamentals to analytics and AI, then the Foundation assessment and a project with a mentor.',
      'audience', 'students who want a career in digital marketing',
      'outcomes', jsonb_build_array(
        'Make the marketing decisions a real business faces, and explain why',
        'Plan, run and measure campaigns on Google and Meta',
        'Use search, content, analytics and AI tools the way employers expect',
        'Earn the Foundation certificate and a mentor-graded project'),
      'level', 'beginner', 'hours', 40),
    'skills', (select skills from _bi_dm_skills),
    'aptitude', jsonb_build_object('items', coalesce((
      select jsonb_agg(jsonb_build_object('id', q.id, 'skill', q.skill, 'statement', q.statement, 'reverse', q.reverse) order by q.sort_order)
        from public.dm_aptitude_questions q), '[]'::jsonb)),
    'modules', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', t.id, 'title', t.title, 'summary', t.summary, 'skill', t.skill, 'level', 'foundation',
               'outcome', '', 'minutes', 30,
               'learn', '[]'::jsonb, 'tasks', '[]'::jsonb, 'reflection', jsonb_build_object('prompt', '', 'hint', ''),
               'quiz', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'id', q.id, 'title', q.title, 'scenario', '', 'question', q.question, 'options', q.options,
                          'correct_index', k.correct_index, 'explanation', k.why_correct,
                          'why_wrong', k.why_others_wrong, 'learning_outcome', k.learning_outcome,
                          'difficulty', q.difficulty, 'topic', q.topic, 'weight', k.weight, 'context', q.context) order by q.ord)
                   from _bi_dm_questions q
                   join public.decision_lab_answer_key k on k.question_id = q.id
                  where q.track = t.id), '[]'::jsonb)) order by t.ord)
        from _bi_dm_tracks t), '[]'::jsonb),
    'final', jsonb_build_object('minutes', 45, 'pass_percent', 60, 'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', f.id, 'scenario', '', 'question', f.question, 'options', to_jsonb(f.options),
               'correct_index', k.correct_index, 'explanation', k.explanation,
               'difficulty', 'Intermediate', 'topic', f.category, 'weight', 1) order by f.sort_order, f.id)
        from public.initial_assessment_questions f
        join public.initial_assessment_answer_key k on k.question_id = f.id), '[]'::jsonb)),
    'project', jsonb_build_object(
      'brief', 'A marketing project for a real or realistic business, guided and graded by a mentor.',
      'deliverables', '[]'::jsonb, 'rubric', v_rubric));

  -- Every practice question must have its answer in the database.
  if (select count(*) from _bi_dm_questions) <> (select count(*) from _bi_dm_questions q join public.decision_lab_answer_key k on k.question_id = q.id) then
    raise exception 'Some practice questions have no answer in decision_lab_answer_key; nothing was imported.';
  end if;

  v_problems := public.programme_content_problems(v_gl);
  if cardinality(v_problems) > 0 then
    raise exception 'Global Leadership didn''t import cleanly; nothing was changed: %', array_to_string(v_problems, '; ');
  end if;
  v_problems := public.programme_content_problems(v_dm);
  if cardinality(v_problems) > 0 then
    raise exception 'Digital Marketing didn''t import cleanly; nothing was changed: %', array_to_string(v_problems, '; ');
  end if;

  insert into public.programmes (slug, title, kind, status, current_version, source, structure)
  values ('global-leadership', 'Global Leadership', 'personal', 'published', 1, 'built-in', public.programme_structure(v_gl))
  returning id into v_id;
  insert into public.programme_versions (programme_id, version, status, content, note, published_at)
  values (v_id, 1, 'published', v_gl, 'Imported from the app', now());

  insert into public.programmes (slug, title, kind, status, current_version, source, structure)
  values ('digital-marketing', 'Digital Marketing', 'professional', 'published', 1, 'built-in', public.programme_structure(v_dm))
  returning id into v_id;
  insert into public.programme_versions (programme_id, version, status, content, note, published_at)
  values (v_id, 1, 'published', v_dm, 'Imported from the app', now());
end $$;

drop table if exists _bi_gl, _bi_dm_skills, _bi_dm_tracks, _bi_dm_questions;

notify pgrst, 'reload schema';

-- Check: both, with their size.
select slug, source, current_version,
       jsonb_array_length(v.content -> 'modules') as modules,
       jsonb_array_length(v.content #> '{aptitude,items}') as statements,
       jsonb_array_length(v.content #> '{final,questions}') as final_questions
  from public.programmes p join public.programme_versions v on v.programme_id = p.id and v.version = p.current_version
 where p.source = 'built-in';
