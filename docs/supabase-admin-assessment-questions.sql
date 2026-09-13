-- Lets admins manage the initial-assessment question bank and its answer key
-- from the admin panel, instead of hand-editing the seed SQL in
-- docs/supabase-server-side-grading.sql and re-running it.
--
-- initial_assessment_questions already has a public "questions are public"
-- select policy (anon + authenticated can read it, since it carries no
-- correct-answer data) but no write policy at all. initial_assessment_answer_key
-- was deliberately created with RLS enabled and ZERO policies — by design,
-- only the security-definer grade_initial_assessment() function could ever
-- touch it, not even an admin's own client. This adds the same
-- `is_admin()`-gated "manage everything" policy already used for blog_posts
-- and ads (see docs/supabase-admin.sql) to both tables, so an admin can now
-- read and edit questions and correct answers directly. This doesn't weaken
-- the original threat model: is_admin() is the same trust boundary every
-- other admin-only table in this app already relies on, and grading itself
-- still only ever happens through the RPC.
--
-- Depends on public.is_admin() from docs/supabase-mentor-onboarding.sql.
-- Run this once against Supabase Cloud (SQL editor).

drop policy if exists "admins manage assessment questions" on public.initial_assessment_questions;
create policy "admins manage assessment questions"
  on public.initial_assessment_questions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage assessment answer key" on public.initial_assessment_answer_key;
create policy "admins manage assessment answer key"
  on public.initial_assessment_answer_key for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Verify (as an admin)
-- ---------------------------------------------------------------------------
--   select count(*) from public.initial_assessment_answer_key; -- was 0 rows visible before, now 35
--   update public.initial_assessment_questions set sort_order = sort_order where id = 'MF001'; -- should succeed
