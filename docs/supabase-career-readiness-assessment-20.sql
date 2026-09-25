-- Career Readiness assessment: 25 statements -> 20.
--
-- Run once against Supabase Cloud (SQL editor), AFTER
-- docs/supabase-career-readiness-assessment.sql, and just before deploying the
-- matching frontend. Safe to re-run.
--
-- 25 was too many for a baseline. This keeps four statements per skill (the
-- five that overlapped most are dropped), still exactly one reverse-scored per
-- skill, in four rounds that cycle through the skills. A skill now scores
-- 4-16 (was 5-20); the frontend's level bands move with it:
--   Emerging 4-7 · Developing 8-10 · Established 11-13 · Standout 14-16
-- "Always" to everything still lands on Established (13), not Standout.
--
-- submit_career_readiness_assessment needs no change: it scores whatever is
-- in the question table, so it now expects 20 answers.

-- Dropped (each overlapped a statement kept for the same skill):
--   cr-11 communication  · think about what the other person needs to hear
--   cr-12 goal setting   · say what I want to achieve in six months
--   cr-15 agile          · get something small working early
--   cr-23 growth mindset · practise skills regularly
--   cr-24 leadership     · get people to try my idea
delete from public.career_readiness_assessment_questions
 where id in ('cr-11', 'cr-12', 'cr-15', 'cr-23', 'cr-24');

-- New running order. sort_order is unique, so park everything out of range
-- first, then assign 1..20 — never two rows sharing a value mid-update.
update public.career_readiness_assessment_questions set sort_order = sort_order + 1000;

update public.career_readiness_assessment_questions q
   set sort_order = o.n
  from (values
    -- round 1
    ('cr-01', 1), ('cr-02', 2), ('cr-03', 3), ('cr-04', 4), ('cr-05', 5),
    -- round 2
    ('cr-06', 6), ('cr-07', 7), ('cr-13', 8), ('cr-14', 9), ('cr-10', 10),
    -- round 3
    ('cr-16', 11), ('cr-17', 12), ('cr-08', 13), ('cr-09', 14), ('cr-20', 15),
    -- round 4
    ('cr-21', 16), ('cr-22', 17), ('cr-18', 18), ('cr-19', 19), ('cr-25', 20)
  ) as o(id, n)
 where q.id = o.id;

-- Re-score anyone who has already taken it. Their raw answers are stored by
-- question id, so scores can be re-derived against the 20 that remain; the
-- answers to the five dropped statements are simply no longer counted.
update public.career_readiness_assessment_results r
   set scores = s.scores
  from (
    select x.profile_id, jsonb_object_agg(x.skill, x.total) as scores
      from (
        select r2.profile_id, q.skill,
               sum(case when q.reverse then 5 - a.value::int else a.value::int end)::int as total
          from public.career_readiness_assessment_results r2
          join jsonb_each_text(r2.answers) a on true
          join public.career_readiness_assessment_questions q on q.id = a.key
         group by r2.profile_id, q.skill
      ) x
     group by x.profile_id
  ) s
 where s.profile_id = r.profile_id;

-- Check it:
--   select count(*) from public.career_readiness_assessment_questions;            -- 20
--   select skill, count(*), count(*) filter (where reverse)
--     from public.career_readiness_assessment_questions group by skill;           -- 4 and 1 each
--   select p.full_name, r.scores from public.career_readiness_assessment_results r
--     join public.profiles p on p.id = r.profile_id;                              -- each skill 4-16
--
-- To retake the assessment yourself while testing, delete your own result
-- (this is the only way — the app allows one attempt):
--   delete from public.career_readiness_assessment_results
--    where profile_id = (select id from auth.users where email = 'you@example.com');
