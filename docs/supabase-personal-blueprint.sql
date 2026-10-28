-- The Personal Blueprint on a student's profile: their vision, mission,
-- purpose, values and goals for the year, written by the student.
--
-- Paul (22 Oct 2026): "vision, mission, purpose and values [are] important
-- for a personal profile". Private to the student for now (no one else reads
-- this table); mentors and the Learner Coach may read it later, with the
-- student's say-so.
--
-- Run once, BEFORE OR AFTER the deploy (the profile shows an empty blueprint
-- until it is in, and saving says to try later). Safe to re-run.

create table if not exists public.personal_blueprints (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  vision     text check (length(vision) <= 400),
  mission    text check (length(mission) <= 400),
  purpose    text check (length(purpose) <= 400),
  -- Up to 7 short values ("Integrity").
  core_values text[] not null default '{}' check (cardinality(core_values) <= 7),
  -- [{ id, text, done }], up to 10, for goals_year.
  goals      jsonb not null default '[]'::jsonb check (jsonb_typeof(goals) = 'array' and jsonb_array_length(goals) <= 10),
  goals_year int check (goals_year between 2020 and 2100),
  updated_at timestamptz not null default now()
);
alter table public.personal_blueprints enable row level security;

drop policy if exists "Own blueprint: read" on public.personal_blueprints;
drop policy if exists "Own blueprint: add" on public.personal_blueprints;
drop policy if exists "Own blueprint: change" on public.personal_blueprints;
create policy "Own blueprint: read" on public.personal_blueprints for select using (user_id = auth.uid());
create policy "Own blueprint: add" on public.personal_blueprints for insert with check (user_id = auth.uid());
create policy "Own blueprint: change" on public.personal_blueprints for update using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update on public.personal_blueprints to authenticated;
