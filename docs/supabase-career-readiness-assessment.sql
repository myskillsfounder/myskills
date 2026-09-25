-- Career Readiness initial assessment: question bank, one result per learner,
-- server-side scoring, and the summary mentors see when reviewing.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on: public.profiles, public.is_admin(), public.has_section_access()
-- and docs/supabase-mentor-reviews.sql (this replaces its queue function).
--
-- A self-awareness BASELINE, not a test. 25 statements, five per skill for the
-- five programme modules, each rated Never / Sometimes / Often / Always
-- (1-4). One statement per skill is worded negatively and scored in reverse,
-- so answering "Always" to everything doesn't max the score. A skill's score
-- is 5-20; the levels (Emerging / Developing / Established / Standout) are
-- derived in the frontend from that. Nothing here feeds the 30-point
-- Personal Development score — that's still earned through the programme.

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
create table if not exists public.career_readiness_assessment_questions (
  id         text primary key,
  skill      text not null check (skill in ('communication', 'goal-setting', 'growth-mindset', 'leadership', 'agile')),
  statement  text not null,
  -- Worded negatively: the learner's answer is flipped (5 - value) when scored.
  reverse    boolean not null default false,
  sort_order int not null unique
);

alter table public.career_readiness_assessment_questions enable row level security;

-- Nothing secret in here (there's no answer key), so any signed-in learner reads it.
drop policy if exists "learners read questions" on public.career_readiness_assessment_questions;
create policy "learners read questions"
  on public.career_readiness_assessment_questions for select
  to authenticated
  using (true);

drop policy if exists "admins manage questions" on public.career_readiness_assessment_questions;
create policy "admins manage questions"
  on public.career_readiness_assessment_questions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Five rounds that cycle through the skills (communication, goal setting,
-- growth mindset, leadership, agile), so it doesn't read as five blocks.
insert into public.career_readiness_assessment_questions (id, skill, statement, reverse, sort_order) values
  -- round 1
  ('cr-01', 'communication',   'I notice when someone speaks really well, and think about what made it work.', false, 1),
  ('cr-02', 'goal-setting',    'I write down specific goals with a deadline, instead of keeping them in my head.', false, 2),
  ('cr-03', 'growth-mindset',  'When I fail or get criticised, I ask myself what I can learn from it.', false, 3),
  ('cr-04', 'leadership',      'In group work, I step up to organise things even when nobody asked me to.', false, 4),
  ('cr-05', 'agile',           'I break big tasks into small steps and finish one before starting the next.', false, 5),
  -- round 2
  ('cr-06', 'communication',   'I work on how I talk to people, using tips, podcasts, videos or practice.', false, 6),
  ('cr-07', 'goal-setting',    'At the end of a week, I check what I planned against what I actually did.', false, 7),
  ('cr-08', 'growth-mindset',  'I try things I’m not good at yet, even if I might look bad.', false, 8),
  ('cr-09', 'leadership',      'When a teammate is struggling, I tend to leave them to sort it out themselves.', true, 9),
  ('cr-10', 'agile',           'When my plan isn’t working, I change it quickly instead of sticking with it.', false, 10),
  -- round 3
  ('cr-11', 'communication',   'Before an important conversation or message, I think about what the other person needs to hear.', false, 11),
  ('cr-12', 'goal-setting',    'I can say clearly what I want to achieve in the next six months.', false, 12),
  ('cr-13', 'growth-mindset',  'When I struggle with something, I tend to think “I’m just not good at this.”', true, 13),
  ('cr-14', 'leadership',      'When something goes wrong in a team, I take responsibility instead of blaming others.', false, 14),
  ('cr-15', 'agile',           'I get something small working early and improve it, instead of waiting until it’s perfect.', false, 15),
  -- round 4
  ('cr-16', 'communication',   'When I explain something, I check that the other person has actually understood.', false, 16),
  ('cr-17', 'goal-setting',    'I set goals and then forget about them within a couple of weeks.', true, 17),
  ('cr-18', 'growth-mindset',  'I ask people for honest feedback on my work, even when it might be hard to hear.', false, 18),
  ('cr-19', 'leadership',      'I make sure quieter people in a group get a chance to share their ideas.', false, 19),
  ('cr-20', 'agile',           'After finishing a task or project, I note what went well and what I’d do differently next time.', false, 20),
  -- round 5
  ('cr-21', 'communication',   'While someone is still talking, I’m often already planning what I’ll say next.', true, 21),
  ('cr-22', 'goal-setting',    'When a goal feels too big, I turn it into a smaller step I can do this week.', false, 22),
  ('cr-23', 'growth-mindset',  'I practise skills regularly to get better, instead of assuming I’m either good at them or not.', false, 23),
  ('cr-24', 'leadership',      'I can get people to try my idea by explaining it well, without pushing.', false, 24),
  ('cr-25', 'agile',           'When priorities suddenly change, I get stuck and find it hard to adapt.', true, 25)
on conflict (id) do update
  set skill = excluded.skill, statement = excluded.statement,
      reverse = excluded.reverse, sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Results — one row per learner, written ONLY by the function below.
-- ---------------------------------------------------------------------------
create table if not exists public.career_readiness_assessment_results (
  profile_id   uuid primary key references public.profiles (id) on delete cascade,
  completed_at timestamptz not null default now(),
  -- The raw 1-4 answers by question id, so scoring can be re-derived.
  answers      jsonb not null,
  -- Per-skill totals after reverse scoring, e.g. {"communication": 14, ...}.
  scores       jsonb not null,
  -- The optional closing question, in the learner's own words.
  reflection   text check (reflection is null or length(reflection) <= 500)
);

alter table public.career_readiness_assessment_results enable row level security;

drop policy if exists "learners read own result" on public.career_readiness_assessment_results;
create policy "learners read own result"
  on public.career_readiness_assessment_results for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists "admins read results" on public.career_readiness_assessment_results;
create policy "admins read results"
  on public.career_readiness_assessment_results for select
  to authenticated
  using (public.is_admin());

-- No insert/update/delete policy: the client has no write access at all.

-- ---------------------------------------------------------------------------
-- Scoring + saving. security definer so it can write past RLS; every check
-- that matters is inside it.
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

  -- Every question answered exactly once, with a value of 1-4. Comparing
  -- text values means a non-numeric answer fails this check instead of
  -- raising a cast error.
  select count(*) into v_expected from public.career_readiness_assessment_questions;
  select count(*) into v_valid
    from public.career_readiness_assessment_questions q
    join jsonb_each_text(p_answers) a on a.key = q.id
   where a.value in ('1', '2', '3', '4');
  if v_valid <> v_expected then
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
       group by q.skill
    ) s;

  insert into public.career_readiness_assessment_results (profile_id, answers, scores, reflection)
  values (v_uid, p_answers, v_scores, v_reflection);

  return jsonb_build_object('scores', v_scores, 'reflection', v_reflection);
end;
$$;

revoke execute on function public.submit_career_readiness_assessment(jsonb, text) from public, anon;
grant execute on function public.submit_career_readiness_assessment(jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Mentor summary: the review queue now carries the learner's Career Readiness
-- result too. A function's return columns can't be changed in place, so it's
-- dropped and recreated — same body as docs/supabase-mentor-reviews.sql, plus
-- one column. career_readiness is null until the learner has taken it.
-- ---------------------------------------------------------------------------
drop function if exists public.admin_mentor_review_queue();

create or replace function public.admin_mentor_review_queue()
returns table (
  id            uuid,
  created_at    timestamptz,
  user_id       uuid,
  programme     text,
  status        public.mentor_review_status,
  student_note  text,
  reviewer_note text,
  reviewed_at   timestamptz,
  full_name     text,
  email         text,
  assessment_percent int,
  tracks        jsonb,
  career_readiness jsonb
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('mentor-reviews') then
    raise exception 'Not authorised.';
  end if;

  return query
  select r.id, r.created_at, r.user_id, r.programme, r.status, r.student_note, r.reviewer_note, r.reviewed_at,
         p.full_name, u.email::text,
         (select a.percent from public.initial_assessment_results a
           where a.profile_id = r.user_id order by a.completed_at desc limit 1),
         coalesce((
           select jsonb_agg(jsonb_build_object('track', b.track_slug, 'percent', b.best, 'attempts', b.n)
                            order by b.track_slug)
             from (select pa.track_slug, max(pa.percent) as best, count(*) as n
                     from public.practice_attempts pa
                    where pa.profile_id = r.user_id
                    group by pa.track_slug) b
         ), '[]'::jsonb),
         (select jsonb_build_object('scores', c.scores, 'reflection', c.reflection, 'completed_at', c.completed_at)
            from public.career_readiness_assessment_results c
           where c.profile_id = r.user_id)
    from public.mentor_reviews r
    left join public.profiles p on p.id = r.user_id
    left join auth.users u on u.id = r.user_id
   where r.status <> 'cancelled'
   order by (r.status = 'requested') desc, r.created_at asc;
end;
$$;

revoke execute on function public.admin_mentor_review_queue() from public, anon;
grant execute on function public.admin_mentor_review_queue() to authenticated;

-- ---------------------------------------------------------------------------
-- Check it (as a signed-in learner, in the app) — or read results as admin:
--   select p.full_name, r.completed_at, r.scores, r.reflection
--     from public.career_readiness_assessment_results r
--     join public.profiles p on p.id = r.profile_id
--    order by r.completed_at desc;
-- ---------------------------------------------------------------------------
