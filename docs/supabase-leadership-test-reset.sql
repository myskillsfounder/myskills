-- A fresh start for the Leadership Aptitude Test: everyone's earlier result
-- is cleared, so every student takes the new 42-statement test.
--
-- WHAT IT CLEARS: career_readiness_assessment_results, every row (the
-- earlier five-skill results and any taken since the new test went in).
-- WHAT IT DOESN'T TOUCH: the Global Readiness Score and everything that earns
-- it (modules, practice, projects, internships). The test never counted toward
-- the score, so no score moves.
--
-- A copy of every result is kept first, in backups.leadership_test_results_before_reset.
-- Re-running keeps that first copy and clears whatever has been taken since,
-- so run it ONCE.
--
-- What students notice: the LaunchPad and Practice ask them to take the test
-- again. Until they do, the module cards don't show a starting level, and a
-- student whose only first step was this test sees Practice's "where would
-- you like to start" again. Mentors see the new result once it's taken.
--
-- Either order with the deploy.

create schema if not exists backups;
create table if not exists backups.leadership_test_results_before_reset as
  select * from public.career_readiness_assessment_results;

delete from public.career_readiness_assessment_results;

-- The earlier test's statements stay in the table (version 1) for the backup
-- to make sense; the app only ever asks version 2.

-- What was kept, and what is left (should be 0).
select (select count(*) from backups.leadership_test_results_before_reset) as results_backed_up,
       (select count(*) from public.career_readiness_assessment_results) as results_left;
