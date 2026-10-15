-- Learning progress that follows the student, not the browser.
--
-- Until now three things lived only in the browser they happened in:
--   * the vocabulary words learned (which also open the Foundation assessment
--     at 70% of the Beginner words),
--   * the daily streak and the visit count on the LaunchPad,
--   * the hours spent, on the LaunchPad.
-- A student on a phone and a computer saw two different sets of numbers, and
-- clearing the browser lost them. This keeps them with the account.
--
--   vocab_learned   one row per word a student has learned
--   activity_days   one row per day the student used MySkills, with the
--                   seconds spent that day
--
-- Neither feeds the Career Readiness Score.
--
-- The app keeps working before this is run (it falls back to the browser), and
-- the first time a student opens it afterwards, what that browser already
-- holds is added to their account. Run once; either order with the deploy.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Vocabulary
-- ---------------------------------------------------------------------------
create table if not exists public.vocab_learned (
  user_id    uuid not null references auth.users (id) on delete cascade,
  term_id    text not null check (length(term_id) between 1 and 60),
  learned_at timestamptz not null default now(),
  primary key (user_id, term_id)
);

alter table public.vocab_learned enable row level security;

drop policy if exists "read own vocab" on public.vocab_learned;
create policy "read own vocab"
  on public.vocab_learned for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "add own vocab" on public.vocab_learned;
create policy "add own vocab"
  on public.vocab_learned for insert
  to authenticated
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Days used and time spent
-- ---------------------------------------------------------------------------
create table if not exists public.activity_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  seconds int  not null default 0 check (seconds between 0 and 86400),
  primary key (user_id, day)
);

alter table public.activity_days enable row level security;

drop policy if exists "read own activity" on public.activity_days;
create policy "read own activity"
  on public.activity_days for select
  to authenticated
  using (user_id = auth.uid());

-- Today's use: a visit (p_seconds 0) or a few minutes of time spent. The day
-- is the student's own (their time zone), so a day either side of the
-- server's is accepted; a single call adds at most 15 minutes.
create or replace function public.record_activity(p_day date, p_seconds int default 0)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_add int := least(greatest(coalesce(p_seconds, 0), 0), 900);
begin
  if auth.uid() is null then
    return;
  end if;
  if p_day is null or p_day < current_date - 1 or p_day > current_date + 1 then
    raise exception 'That day isn''t today.';
  end if;
  insert into public.activity_days (user_id, day, seconds)
  values (auth.uid(), p_day, v_add)
  on conflict (user_id, day) do update
    set seconds = least(86400, public.activity_days.seconds + v_add);
end;
$$;
revoke execute on function public.record_activity(date, int) from public, anon;
grant execute on function public.record_activity(date, int) to authenticated;

-- What one browser had recorded before this existed, added once per browser:
-- {"2026-10-01": 1800, ...}, the last 90 days only, at most 12 hours a day.
create or replace function public.import_activity(p_days jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  v_day date;
  v_seconds int;
begin
  if auth.uid() is null or p_days is null or jsonb_typeof(p_days) <> 'object' then
    return;
  end if;
  for rec in select key, value from jsonb_each_text(p_days) loop
    begin
      v_day := rec.key::date;
      v_seconds := least(greatest(rec.value::int, 0), 43200);
    exception when others then
      continue;
    end;
    continue when v_day < current_date - 90 or v_day > current_date + 1;
    insert into public.activity_days (user_id, day, seconds)
    values (auth.uid(), v_day, v_seconds)
    on conflict (user_id, day) do update
      set seconds = least(86400, public.activity_days.seconds + excluded.seconds);
  end loop;
end;
$$;
revoke execute on function public.import_activity(jsonb) from public, anon;
grant execute on function public.import_activity(jsonb) to authenticated;
