-- Aptitude tests before sign-up: a visitor can read the statements.
--
-- Run once against Supabase Cloud (SQL editor), BEFORE deploying the matching
-- frontend: until then a signed-out visitor who taps Digital Marketing or
-- Global Leadership sees "The assessment isn't available right now". Safe to
-- re-run.
--
-- Paul (25 Oct 2026): a visitor tries the programme's aptitude test first and
-- signs up to see the result. The statements carry no answer key (each is "how
-- often is this true for you", and the server scores them), so letting a
-- signed-out visitor read them gives nothing away. Scoring still needs an
-- account: submit_dm_aptitude_assessment and submit_career_readiness_assessment
-- are unchanged, and the browser keeps the answers until the visitor signs up.

drop policy if exists "visitors read questions" on public.dm_aptitude_questions;
create policy "visitors read questions"
  on public.dm_aptitude_questions for select
  to anon
  using (true);

drop policy if exists "visitors read questions" on public.career_readiness_assessment_questions;
create policy "visitors read questions"
  on public.career_readiness_assessment_questions for select
  to anon
  using (true);

grant select on public.dm_aptitude_questions to anon;
grant select on public.career_readiness_assessment_questions to anon;

-- Check (as a visitor would): both counts above zero.
--   set role anon;
--   select (select count(*) from public.dm_aptitude_questions) as dm,
--          (select count(*) from public.career_readiness_assessment_questions) as gl;
--   reset role;
