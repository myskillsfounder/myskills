-- "Top 6% of learners": where the signed-in student's Global Readiness Score
-- stands among everyone's, for the LaunchPad's numbers strip.
--
-- my_score_rank() returns the student's score, how many students have a score
-- above zero, and how many of those score higher. The LaunchPad shows
-- "Top n%" only when the student has a score and there are at least 10
-- students with one, so a handful of early accounts can't make it meaningless.
-- Only counts are returned: nobody else's score or name.
--
-- Run once; either order with the deploy (until it's run, that part of the
-- strip shows the student's best streak instead). Safe to re-run.
-- Depends on: docs/supabase-career-readiness-score.sql.

create or replace function public.my_score_rank()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with mine as (
    select s.score from public.career_readiness_scores s where s.user_id = auth.uid()
  )
  select jsonb_build_object(
    'score',  (select score from mine),
    'scored', (select count(*) from public.career_readiness_scores s where s.score > 0),
    'above',  (select count(*) from public.career_readiness_scores s where s.score > coalesce((select score from mine), 0))
  );
$$;
revoke execute on function public.my_score_rank() from public, anon;
grant execute on function public.my_score_rank() to authenticated;

-- Check: the function is there.
select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and proname = 'my_score_rank';
