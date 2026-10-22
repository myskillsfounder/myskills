-- Question health: how every practice and Foundation question performs, from
-- the answers kept since docs/supabase-learner-events.sql. Step 1 of the
-- Assessment Agent; read-only, nothing here changes a question or a score.
--
-- For each question:
--   answered     how many students answered it (first time only, see below)
--   answers      every answer kept, retakes included
--   correct_pct  % of students who got it right (the "difficulty index")
--   options      how many students picked each option (A-D)
--   separation   % right among the top third of students on that test minus
--                % right among the bottom third (the "discrimination index").
--                Good questions are answered right more often by students who
--                do well overall; near 0 means it doesn't tell them apart, and
--                below 0 usually means the question or its answer is wrong.
--
-- First time only: a student's first attempt at a practice track that has its
-- answers kept. Retakes come after seeing the answers, so they would make
-- every question look easier than it is.
--
-- Since a date (p_since, optional): only answers from then on, e.g. since a
-- new version of a programme was published, so the course team can compare
-- versions (Admin → Question health → "Answers since", and "Download for the
-- course team"). Without it, every answer kept.
--
-- Run once, BEFORE OR AFTER the deploy (the page says "run the SQL" until it
-- is in). Safe to re-run. Depends on docs/supabase-learner-events.sql.
-- Who: the Foundation questions section ('assessment'), as editing them is.

drop function if exists public.admin_question_health();
create or replace function public.admin_question_health(p_since timestamptz default null)
returns table (
  bank          text,
  question_id   text,
  grp           text,
  topic         text,
  difficulty    text,
  title         text,
  question      text,
  options       text[],
  correct_index int,
  answered      int,
  answers       int,
  correct_pct   numeric,
  option_counts int[],
  separation    numeric,
  upper_n       int,
  lower_n       int
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not public.has_section_access('assessment') then
    raise exception 'Not authorised.';
  end if;

  return query
  with firsts as (
    -- Each student's first practice attempt per track with its answers kept.
    select distinct on (a.profile_id, a.track_slug) a.id, a.track_slug, a.percent
      from public.practice_attempts a
     where exists (select 1 from public.practice_answers pa where pa.attempt_id = a.id)
       and (p_since is null or a.attempted_at >= p_since)
     order by a.profile_id, a.track_slug, a.attempted_at
  ),
  thirds as (
    select f.id, f.track_slug, ntile(3) over (partition by f.track_slug order by f.percent) as third
      from firsts f
  ),
  firsts_ans as (
    select pa.question_id, pa.selected, pa.correct, t.third
      from public.practice_answers pa
      join thirds t on t.id = pa.attempt_id
  ),
  stats as (
    select fa.question_id,
           count(*)::int as n,
           round(100.0 * avg(case when fa.correct then 1 else 0 end), 1) as pct,
           array[count(*) filter (where fa.selected = 0), count(*) filter (where fa.selected = 1),
                 count(*) filter (where fa.selected = 2), count(*) filter (where fa.selected = 3)]::int[] as opts,
           count(*) filter (where fa.third = 3)::int as up_n,
           count(*) filter (where fa.third = 1)::int as lo_n,
           avg(case when fa.correct then 1.0 else 0 end) filter (where fa.third = 3) as up_p,
           avg(case when fa.correct then 1.0 else 0 end) filter (where fa.third = 1) as lo_p
      from firsts_ans fa
     group by fa.question_id
  ),
  everything as (
    select pa.question_id, count(*)::int as n from public.practice_answers pa
     where p_since is null or pa.answered_at >= p_since
     group by pa.question_id
  )
  select 'practice'::text, k.question_id, k.track_slug, k.competency, k.difficulty, k.title,
         null::text, null::text[], k.correct_index,
         coalesce(s.n, 0), coalesce(e.n, 0), s.pct, coalesce(s.opts, array[0, 0, 0, 0]),
         case when s.up_n >= 5 and s.lo_n >= 5 then round(100 * (s.up_p - s.lo_p), 1) end,
         coalesce(s.up_n, 0), coalesce(s.lo_n, 0)
    from public.decision_lab_answer_key k
    left join stats s on s.question_id = k.question_id
    left join everything e on e.question_id = k.question_id

  union all

  select 'foundation'::text, q.id, q.category, q.category, null::text, null::text,
         q.question, q.options, ak.correct_index,
         coalesce(fs.n, 0), coalesce(fs.n, 0), fs.pct, coalesce(fs.opts, array[0, 0, 0, 0]),
         case when fs.up_n >= 5 and fs.lo_n >= 5 then round(100 * (fs.up_p - fs.lo_p), 1) end,
         coalesce(fs.up_n, 0), coalesce(fs.lo_n, 0)
    from public.initial_assessment_questions q
    left join public.initial_assessment_answer_key ak on ak.question_id = q.id
    left join (
      select f.question_id,
             count(*)::int as n,
             round(100.0 * avg(case when f.correct then 1 else 0 end), 1) as pct,
             array[count(*) filter (where f.selected = 0), count(*) filter (where f.selected = 1),
                   count(*) filter (where f.selected = 2), count(*) filter (where f.selected = 3)]::int[] as opts,
             count(*) filter (where r.third = 3)::int as up_n,
             count(*) filter (where r.third = 1)::int as lo_n,
             avg(case when f.correct then 1.0 else 0 end) filter (where r.third = 3) as up_p,
             avg(case when f.correct then 1.0 else 0 end) filter (where r.third = 1) as lo_p
        from public.foundation_answers f
        join (select ir.profile_id, ntile(3) over (order by ir.percent) as third
                from public.initial_assessment_results ir) r on r.profile_id = f.profile_id
       where p_since is null or f.answered_at >= p_since
       group by f.question_id
    ) fs on fs.question_id = q.id;
end;
$$;
revoke execute on function public.admin_question_health(timestamptz) from public, anon;
grant execute on function public.admin_question_health(timestamptz) to authenticated;

notify pgrst, 'reload schema';
