-- The Global Readiness Score over time, so the LaunchPad can say how it moved
-- ("6 points up since last week").
--
-- career_readiness_scores keeps only each student's current score. This adds
-- one row per student per day the score was worked out
-- (career_readiness_score_history), written by a trigger whenever the score
-- is stored, so nothing else changes. A day keeps that day's latest score.
--
-- my_score_trend(): the signed-in student's score now, and what it was a week
-- and a month ago (the latest day on or before each), when there is one.
--
-- History starts when this is run: every current score is written as today's,
-- and the LaunchPad shows a change from the next day the score moves.
--
-- Run once; either order with the deploy (until it's run, the LaunchPad just
-- shows no trend). Safe to re-run. Read-only for students.
-- Depends on: docs/supabase-career-readiness-score.sql.

create table if not exists public.career_readiness_score_history (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null default current_date,
  score   int  not null check (score between 0 and 100),
  primary key (user_id, day)
);
alter table public.career_readiness_score_history enable row level security;

drop policy if exists "students read their own score history" on public.career_readiness_score_history;
create policy "students read their own score history"
  on public.career_readiness_score_history for select
  to authenticated
  using (user_id = auth.uid());

-- Every time a score is stored, today's row follows it.
create or replace function public.record_score_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.career_readiness_score_history (user_id, day, score)
  values (new.user_id, current_date, new.score)
  on conflict (user_id, day) do update set score = excluded.score;
  return null;
exception when others then
  -- History must never stop a score being stored.
  return null;
end;
$$;
revoke execute on function public.record_score_history() from public, anon, authenticated;

drop trigger if exists record_score_history on public.career_readiness_scores;
create trigger record_score_history
  after insert or update of score on public.career_readiness_scores
  for each row execute function public.record_score_history();

-- Start from today with everyone's current score.
insert into public.career_readiness_score_history (user_id, day, score)
select s.user_id, current_date, s.score from public.career_readiness_scores s
on conflict (user_id, day) do nothing;

create or replace function public.my_score_trend()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'now',        (select s.score from public.career_readiness_scores s where s.user_id = auth.uid()),
    'week_ago',   (select h.score from public.career_readiness_score_history h
                    where h.user_id = auth.uid() and h.day <= current_date - 7 order by h.day desc limit 1),
    'month_ago',  (select h.score from public.career_readiness_score_history h
                    where h.user_id = auth.uid() and h.day <= current_date - 30 order by h.day desc limit 1),
    -- The oldest day on record, and its score: "since you started" before a week has passed.
    'first_day',  (select min(h.day) from public.career_readiness_score_history h where h.user_id = auth.uid()),
    'first',      (select h.score from public.career_readiness_score_history h
                    where h.user_id = auth.uid() order by h.day asc limit 1)
  );
$$;
revoke execute on function public.my_score_trend() from public, anon;
grant execute on function public.my_score_trend() to authenticated;

-- Check: history rows written today.
select count(*) as students_with_history from public.career_readiness_score_history where day = current_date;
