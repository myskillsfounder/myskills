-- Admin-authored practice question sets — a generalization of the
-- assessment-questions editor so an admin can create as many additional
-- MCQ sets as they want (separate from the one-time initial assessment).
--
-- Deliberately NOT the same table as initial_assessment_questions: that
-- table's rows are ALL graded together as one 35-question exam by
-- grade_initial_assessment() (docs/supabase-server-side-grading.sql), which
-- has no concept of "sets" — adding rows there for a second quiz would
-- silently fold them into the one-time assessment's score. These are a
-- fully separate bank with no consumer wired up yet; they're admin content
-- only until a practice UI is built to read them (see note on RLS below).
--
-- Depends on public.is_admin() from docs/supabase-mentor-onboarding.sql.
-- Run this once against Supabase Cloud (SQL editor).

create table if not exists public.practice_question_sets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.practice_set_questions (
  id            uuid primary key default gen_random_uuid(),
  set_id        uuid not null references public.practice_question_sets (id) on delete cascade,
  category      text not null default '',
  question      text not null,
  options       text[] not null,
  -- Kept alongside the question (not split into a separate answer-key table
  -- like the initial assessment) because nothing but an admin can read this
  -- table right now — see the RLS note below. Revisit if/when a real
  -- practice UI reads these for end users.
  correct_index int not null default 0,
  explanation   text not null default '',
  sort_order    int not null default 0
);

alter table public.practice_question_sets enable row level security;
alter table public.practice_set_questions enable row level security;

-- Admin-only for now, both read and write — there's no end-user-facing
-- practice experience reading these yet, so there's nothing to expose. Add
-- a public/authenticated select policy alongside this (not instead of it)
-- when that UI gets built, mirroring how initial_assessment_questions has
-- both a public read policy and this same admin-manage-everything one.
drop policy if exists "admins manage practice question sets" on public.practice_question_sets;
create policy "admins manage practice question sets"
  on public.practice_question_sets for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage practice set questions" on public.practice_set_questions;
create policy "admins manage practice set questions"
  on public.practice_set_questions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Verify (as an admin)
-- ---------------------------------------------------------------------------
--   insert into public.practice_question_sets (name) values ('Test set') returning id;
--   -- then insert a question with that id as set_id, then:
--   select s.name, count(q.id) from public.practice_question_sets s
--     left join public.practice_set_questions q on q.set_id = s.id
--     group by s.id, s.name;
