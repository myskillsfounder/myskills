-- NOTE: docs/supabase-life-skills-combined.sql comes after this file: it adds
-- the programme's own four skills, re-orders the statements and makes it one
-- attempt per student. Don't re-run this file after that one.
--
-- The Life Skills Profile: WHO's ten life skills as the Global Leadership
-- Programme's starting assessment.
--
-- It takes the place of the earlier five-skill assessment (goal setting,
-- communication, leadership, agile, growth mindset) in the same tables:
--   * 30 new statements, three per life skill, version 2. One of each three
--     is worded the other way round and scored in reverse, so answering
--     "Always" to everything doesn't max a skill. A skill scores 3-12.
--   * The earlier 20 statements stay, as version 1, so earlier results can
--     still be read; nobody is asked them again.
--   * A student with an earlier result keeps it until they take the profile,
--     once. Taking it replaces the result; the earlier scores are kept beside
--     it (previous_scores).
--
-- Unchanged: it never counts toward the Global Readiness Score, and only the
-- student, their mentor and the team see it (companies don't).
--
-- Run once; either order with the deploy (until it's run, the app keeps
-- asking the earlier statements). Safe to re-run.
-- Depends on: docs/supabase-career-readiness-assessment.sql and -20.sql.

-- ---------------------------------------------------------------------------
-- Statements: a version, and the ten new skills
-- ---------------------------------------------------------------------------
alter table public.career_readiness_assessment_questions
  add column if not exists version int not null default 1;

do $$
declare
  c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.career_readiness_assessment_questions'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%skill%'
  loop
    execute format('alter table public.career_readiness_assessment_questions drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.career_readiness_assessment_questions
  add constraint career_readiness_assessment_questions_skill_check
  check (skill in (
    -- the earlier version
    'communication', 'goal-setting', 'growth-mindset', 'leadership', 'agile',
    -- WHO's ten life skills
    'self-awareness', 'empathy', 'critical-thinking', 'creative-thinking', 'decision-making',
    'problem-solving', 'effective-communication', 'relationships', 'coping-stress', 'coping-emotions'));

-- Three rounds that cycle through the ten skills, so it doesn't read as ten
-- blocks; the reverse-worded statement of each skill comes in the last round.
insert into public.career_readiness_assessment_questions (id, skill, statement, reverse, sort_order, version) values
  -- round 1
  ('ls-01', 'self-awareness',          'I can name the things I''m good at and the things I find hard.', false, 101, 2),
  ('ls-02', 'empathy',                 'When a friend shares a problem, I listen without jumping in with advice.', false, 102, 2),
  ('ls-03', 'critical-thinking',       'Before I share something I read online, I check whether it''s true.', false, 103, 2),
  ('ls-04', 'creative-thinking',       'When something doesn''t work, I come up with a different way to try it.', false, 104, 2),
  ('ls-05', 'decision-making',         'Before a big decision, I compare my options and what each would lead to.', false, 105, 2),
  ('ls-06', 'problem-solving',         'When something keeps going wrong, I look for the cause before trying a fix.', false, 106, 2),
  ('ls-07', 'effective-communication', 'I can explain my ideas so that people understand what I mean.', false, 107, 2),
  ('ls-08', 'relationships',           'I get along with people who are different from me.', false, 108, 2),
  ('ls-09', 'coping-stress',           'I can tell when I''m getting stressed, and what is causing it.', false, 109, 2),
  ('ls-10', 'coping-emotions',         'I can name what I''m feeling, like anger, worry or disappointment.', false, 110, 2),
  -- round 2
  ('ls-11', 'self-awareness',          'I notice how my mood affects the way I work or study.', false, 111, 2),
  ('ls-12', 'empathy',                 'I try to understand why someone feels the way they do, even when I disagree.', false, 112, 2),
  ('ls-13', 'critical-thinking',       'I look for evidence before I make up my mind.', false, 113, 2),
  ('ls-14', 'creative-thinking',       'I enjoy finding new or unusual ideas for a task.', false, 114, 2),
  ('ls-15', 'decision-making',         'Once I''ve decided something, I can explain why I chose it.', false, 115, 2),
  ('ls-16', 'problem-solving',         'I break a big problem into smaller steps I can act on.', false, 116, 2),
  ('ls-17', 'effective-communication', 'In a group, I say what I expect from others clearly and politely.', false, 117, 2),
  ('ls-18', 'relationships',           'When I disagree with someone, we can talk it through without falling out.', false, 118, 2),
  ('ls-19', 'coping-stress',           'When I have a lot to do, I plan and prioritise instead of panicking.', false, 119, 2),
  ('ls-20', 'coping-emotions',         'When I''m upset, I calm down before I respond.', false, 120, 2),
  -- round 3: worded the other way round, scored in reverse
  ('ls-21', 'self-awareness',          'I''m surprised by how other people describe me.', true, 121, 2),
  ('ls-22', 'empathy',                 'I find it hard to see a situation from someone else''s side.', true, 122, 2),
  ('ls-23', 'critical-thinking',       'I accept what I''m told without questioning it.', true, 123, 2),
  ('ls-24', 'creative-thinking',       'I stick to the usual way of doing things, even when it isn''t working.', true, 124, 2),
  ('ls-25', 'decision-making',         'I put off decisions until someone else makes them for me.', true, 125, 2),
  ('ls-26', 'problem-solving',         'When I''m stuck, I give up rather than try another way.', true, 126, 2),
  ('ls-27', 'effective-communication', 'I keep quiet, even when I have something useful to say.', true, 127, 2),
  ('ls-28', 'relationships',           'Small disagreements with people around me turn into bigger fights.', true, 128, 2),
  ('ls-29', 'coping-stress',           'When I''m under pressure, I freeze and can''t get started.', true, 129, 2),
  ('ls-30', 'coping-emotions',         'I say or do things in anger that I regret later.', true, 130, 2)
on conflict (id) do update
  set skill = excluded.skill, statement = excluded.statement, reverse = excluded.reverse,
      sort_order = excluded.sort_order, version = excluded.version;

-- ---------------------------------------------------------------------------
-- Results: which version, and the earlier scores kept beside a new result
-- ---------------------------------------------------------------------------
alter table public.career_readiness_assessment_results
  add column if not exists version int not null default 1;
alter table public.career_readiness_assessment_results
  add column if not exists previous_scores jsonb;
alter table public.career_readiness_assessment_results
  add column if not exists previous_completed_at timestamptz;

-- ---------------------------------------------------------------------------
-- Scoring and saving: the profile's statements only. Someone with an earlier
-- result may take it once; nobody can take it twice.
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

-- Check: ten skills, three statements each, one in reverse.
select skill, count(*) as statements, count(*) filter (where reverse) as reversed
  from public.career_readiness_assessment_questions
 where version = 2
 group by skill
 order by skill;
