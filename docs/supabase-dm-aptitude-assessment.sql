-- Digital Marketing aptitude assessment: question bank, one result per learner,
-- server-side scoring.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on: public.profiles, public.is_admin().
--
-- The FIRST step of the Digital Marketing programme: a quick look at whether
-- marketing comes naturally — do you read billboards when you travel, notice
-- a struck-through price, follow what's trending — before any knowledge is
-- tested (that's the Foundation assessment, the old initial assessment).
-- 20 statements, four per aptitude, each rated Never / Sometimes / Often /
-- Always (1-4). One per aptitude is worded negatively and scored in reverse,
-- so "Always" to everything lands on Strong (13), not Natural. An aptitude
-- scores 4-16 (Emerging 4-7 · Developing 8-10 · Strong 11-13 · Natural 14-16).
--
-- Same shape as docs/supabase-career-readiness-assessment.sql: no answer key,
-- no client write access, one attempt, scored by a security-definer function.

create table if not exists public.dm_aptitude_questions (
  id         text primary key,
  skill      text not null check (skill in ('noticing', 'offers', 'creativity', 'numbers', 'curiosity')),
  statement  text not null,
  -- Worded negatively: the learner's answer is flipped (5 - value) when scored.
  reverse    boolean not null default false,
  sort_order int not null unique
);

alter table public.dm_aptitude_questions enable row level security;

drop policy if exists "learners read questions" on public.dm_aptitude_questions;
create policy "learners read questions"
  on public.dm_aptitude_questions for select
  to authenticated
  using (true);

drop policy if exists "admins manage questions" on public.dm_aptitude_questions;
create policy "admins manage questions"
  on public.dm_aptitude_questions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Four rounds cycling through the five aptitudes (noticing, offers,
-- creativity, numbers, curiosity). Round 1 is all positive so it opens
-- gently; the five reverse-scored statements are spread out, never adjacent.
insert into public.dm_aptitude_questions (id, skill, statement, reverse, sort_order) values
  -- round 1
  ('ap-01', 'noticing',   'When I travel, I read the billboards and hoardings I pass.', false, 1),
  ('ap-02', 'offers',     'On a shopping app or website, I notice deals like limited-time sales.', false, 2),
  ('ap-03', 'creativity', 'I come up with ideas for how a brand could advertise itself better.', false, 3),
  ('ap-04', 'numbers',    'I compare prices or plans and work out which is the better deal.', false, 4),
  ('ap-05', 'curiosity',  'I try new apps, platforms or features soon after they come out.', false, 5),
  -- round 2
  ('ap-06', 'noticing',   'I notice the colours and design of an ad, and how they make me feel.', false, 6),
  ('ap-07', 'offers',     'I buy things without thinking about what made me want them.', true, 7),
  ('ap-08', 'creativity', 'I like explaining a product or an idea through a story or an example.', false, 8),
  ('ap-09', 'numbers',    'I like looking at numbers, like likes, views and results, and working out what they say.', false, 9),
  ('ap-10', 'curiosity',  'I follow marketing pages, creators or newsletters to see what’s trending.', false, 10),
  -- round 3
  ('ap-11', 'noticing',   'I scroll past ads without really noticing which brand they were for.', true, 11),
  ('ap-12', 'offers',     'When a price is struck out and shown lower, I think about why it’s shown that way.', false, 12),
  ('ap-13', 'creativity', 'I enjoy making things people look at, like posts, designs, videos or presentations.', false, 13),
  ('ap-14', 'numbers',    'I avoid numbers and charts when I can.', true, 14),
  ('ap-15', 'curiosity',  'I notice why a post or video goes viral, and look for the pattern.', false, 15),
  -- round 4
  ('ap-16', 'noticing',   'A tagline or jingle sticks in my head, and I wonder why it worked.', false, 16),
  ('ap-17', 'offers',     'I notice cashback and coupon offers at checkout, and they change what I do.', false, 17),
  ('ap-18', 'creativity', 'I find it hard to come up with a fresh angle when someone asks for ideas.', true, 18),
  ('ap-19', 'numbers',    'When something works well, I want to know why, and by how much.', false, 19),
  ('ap-20', 'curiosity',  'I stick to the same few apps and rarely explore anything new online.', true, 20)
on conflict (id) do update
  set skill = excluded.skill, statement = excluded.statement,
      reverse = excluded.reverse, sort_order = excluded.sort_order;

-- Results — one row per learner, written ONLY by the function below.
create table if not exists public.dm_aptitude_results (
  profile_id   uuid primary key references public.profiles (id) on delete cascade,
  completed_at timestamptz not null default now(),
  -- The raw 1-4 answers by question id, so scoring can be re-derived.
  answers      jsonb not null,
  -- Per-aptitude totals after reverse scoring, e.g. {"noticing": 12, ...}.
  scores       jsonb not null,
  -- The optional closing question, in the learner's own words.
  reflection   text check (reflection is null or length(reflection) <= 500)
);

alter table public.dm_aptitude_results enable row level security;

drop policy if exists "learners read own result" on public.dm_aptitude_results;
create policy "learners read own result"
  on public.dm_aptitude_results for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists "admins read results" on public.dm_aptitude_results;
create policy "admins read results"
  on public.dm_aptitude_results for select
  to authenticated
  using (public.is_admin());

-- No insert/update/delete policy: the client has no write access at all.

create or replace function public.submit_dm_aptitude_assessment(
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

  if exists (select 1 from public.dm_aptitude_results where profile_id = v_uid) then
    raise exception 'You have already taken this assessment.';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Please answer every question.';
  end if;

  -- Every question answered, with a value of 1-4. Comparing text values means
  -- a non-numeric answer fails this check instead of raising a cast error.
  select count(*) into v_expected from public.dm_aptitude_questions;
  select count(*) into v_valid
    from public.dm_aptitude_questions q
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
        from public.dm_aptitude_questions q
        join jsonb_each_text(p_answers) a on a.key = q.id
       group by q.skill
    ) s;

  insert into public.dm_aptitude_results (profile_id, answers, scores, reflection)
  values (v_uid, p_answers, v_scores, v_reflection);

  return jsonb_build_object('scores', v_scores, 'reflection', v_reflection);
end;
$$;

revoke execute on function public.submit_dm_aptitude_assessment(jsonb, text) from public, anon;
grant execute on function public.submit_dm_aptitude_assessment(jsonb, text) to authenticated;

-- Read results as admin:
--   select p.full_name, r.completed_at, r.scores, r.reflection
--     from public.dm_aptitude_results r
--     join public.profiles p on p.id = r.profile_id
--    order by r.completed_at desc;
--
-- To retake it yourself while testing (the app allows one attempt):
--   delete from public.dm_aptitude_results
--    where profile_id = (select id from auth.users where email = 'you@example.com');
