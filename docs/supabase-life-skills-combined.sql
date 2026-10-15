-- One Career Readiness assessment: WHO's ten life skills and the programme's
-- own four, together.
--
-- docs/supabase-life-skills.sql made the Life Skills Profile (WHO's ten,
-- 30 statements) and offered it to students who had taken the earlier
-- five-skill assessment. This makes it the ONE assessment, for new students:
--   * Adds the programme's own skills that WHO doesn't list: goal setting,
--     leadership, agile working and growth mindset (communication is already
--     there as "effective communication"). Three statements each, carried
--     over from the earlier assessment, one of each three scored in reverse.
--     42 statements in all, in three rounds through the fourteen skills.
--   * One attempt per student, whichever version they took: a student with an
--     earlier result keeps it and is not asked again.
--
-- Run AFTER docs/supabase-life-skills.sql, then deploy (either order with the
-- deploy). Safe to re-run.

-- ---------------------------------------------------------------------------
-- The four programme skills, three statements each
-- ---------------------------------------------------------------------------
insert into public.career_readiness_assessment_questions (id, skill, statement, reverse, sort_order, version) values
  ('ls-31', 'goal-setting',   'I write down specific goals with a deadline, instead of keeping them in my head.', false, 2031, 2),
  ('ls-32', 'goal-setting',   'When a goal feels too big, I turn it into a smaller step I can do this week.', false, 2032, 2),
  ('ls-33', 'goal-setting',   'I set goals and then forget about them within a couple of weeks.', true, 2033, 2),
  ('ls-34', 'leadership',     'When something goes wrong in a team, I take responsibility instead of blaming others.', false, 2034, 2),
  ('ls-35', 'leadership',     'I make sure quieter people in a group get a chance to share their ideas.', false, 2035, 2),
  ('ls-36', 'leadership',     'When a teammate is struggling, I tend to leave them to sort it out themselves.', true, 2036, 2),
  ('ls-37', 'agile',          'I break big tasks into small steps and finish one before starting the next.', false, 2037, 2),
  ('ls-38', 'agile',          'When my plan isn''t working, I change it quickly instead of sticking with it.', false, 2038, 2),
  ('ls-39', 'agile',          'When priorities suddenly change, I get stuck and find it hard to adapt.', true, 2039, 2),
  ('ls-40', 'growth-mindset', 'When I fail or get criticised, I ask myself what I can learn from it.', false, 2040, 2),
  ('ls-41', 'growth-mindset', 'I ask people for honest feedback on my work, even when it might be hard to hear.', false, 2041, 2),
  ('ls-42', 'growth-mindset', 'When I struggle with something, I tend to think "I''m just not good at this."', true, 2042, 2)
on conflict (id) do update
  set skill = excluded.skill, statement = excluded.statement, reverse = excluded.reverse, version = excluded.version;

-- ---------------------------------------------------------------------------
-- The running order: three rounds through the fourteen skills, the
-- reverse-worded statements in the last round. sort_order is unique, so
-- everything is parked out of range first.
-- ---------------------------------------------------------------------------
update public.career_readiness_assessment_questions set sort_order = sort_order + 10000 where version = 2;

update public.career_readiness_assessment_questions q
   set sort_order = 100 + o.n
  from (
    select x.id, row_number() over (order by x.round, x.pos) as n
      from (values
        -- round 1
        ('ls-01', 1, 1), ('ls-31', 1, 2), ('ls-02', 1, 3), ('ls-03', 1, 4), ('ls-34', 1, 5),
        ('ls-04', 1, 6), ('ls-05', 1, 7), ('ls-37', 1, 8), ('ls-06', 1, 9), ('ls-07', 1, 10),
        ('ls-40', 1, 11), ('ls-08', 1, 12), ('ls-09', 1, 13), ('ls-10', 1, 14),
        -- round 2
        ('ls-11', 2, 1), ('ls-32', 2, 2), ('ls-12', 2, 3), ('ls-13', 2, 4), ('ls-35', 2, 5),
        ('ls-14', 2, 6), ('ls-15', 2, 7), ('ls-38', 2, 8), ('ls-16', 2, 9), ('ls-17', 2, 10),
        ('ls-41', 2, 11), ('ls-18', 2, 12), ('ls-19', 2, 13), ('ls-20', 2, 14),
        -- round 3: worded the other way round, scored in reverse
        ('ls-21', 3, 1), ('ls-33', 3, 2), ('ls-22', 3, 3), ('ls-23', 3, 4), ('ls-36', 3, 5),
        ('ls-24', 3, 6), ('ls-25', 3, 7), ('ls-39', 3, 8), ('ls-26', 3, 9), ('ls-27', 3, 10),
        ('ls-42', 3, 11), ('ls-28', 3, 12), ('ls-29', 3, 13), ('ls-30', 3, 14)
      ) as x(id, round, pos)
  ) o
 where q.id = o.id;

-- ---------------------------------------------------------------------------
-- One attempt per student, whichever version they took
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
  v_expected   int;
  v_valid      int;
  v_scores     jsonb;
  v_reflection text := nullif(btrim(coalesce(p_reflection, '')), '');
begin
  if v_uid is null then
    raise exception 'You are not signed in.';
  end if;
  if exists (select 1 from public.career_readiness_assessment_results where profile_id = v_uid) then
    raise exception 'You have already taken this assessment.';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Please answer every question.';
  end if;

  -- Every statement of the current assessment answered, with a value of 1-4.
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
  values (v_uid, p_answers, v_scores, v_reflection, 2);

  return jsonb_build_object('scores', v_scores, 'reflection', v_reflection);
end;
$$;
revoke execute on function public.submit_career_readiness_assessment(jsonb, text) from public, anon;
grant execute on function public.submit_career_readiness_assessment(jsonb, text) to authenticated;

-- Check: fourteen skills, three statements each, one in reverse.
select skill, count(*) as statements, count(*) filter (where reverse) as reversed
  from public.career_readiness_assessment_questions
 where version = 2
 group by skill
 order by skill;
