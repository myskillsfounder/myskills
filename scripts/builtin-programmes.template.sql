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
create or replace function public.programme_problems(p_programme uuid, p_content jsonb) returns text[]
language sql stable security definer set search_path = public as $$
  select case
           when pr.source = 'built-in' and public.programme_structure(p_content) is distinct from pr.structure then
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

-- @@DATA@@

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
