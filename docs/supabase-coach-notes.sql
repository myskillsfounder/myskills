-- The coach's note: a short, personal note written by AI from a student's
-- aptitude test, shown above their result (Paul, 25 Oct 2026: "add a real AI
-- moment" to the guide).
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run. Run it BEFORE
-- the server's agents worker is updated (agents/worker.mjs calls
-- coach_claim_note). The website works with or without it: until a note
-- exists, the result simply shows none.
--
-- How it works: saving an aptitude result (Digital Marketing or Global
-- Leadership) queues a note. The agents worker on the server claims it, asks
-- Claude Haiku for a few sentences, and saves it here; the result page shows
-- it. A note costs about $0.0003 and counts toward the agents' monthly budget.
-- Only tests taken from now on get one.

create table if not exists public.coach_notes (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  test       text not null check (test in ('dm-aptitude', 'gl-aptitude')),
  status     text not null default 'queued' check (status in ('queued', 'writing', 'done', 'failed')),
  note       text check (note is null or length(note) <= 2000),
  usage      jsonb,
  error      text,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  done_at    timestamptz,
  unique (student_id, test)
);

create index if not exists coach_notes_queue_idx on public.coach_notes (status, created_at);

alter table public.coach_notes enable row level security;

-- A student reads their own notes; the team reads all of them. Nobody writes
-- from the browser: the queue (trigger) and the worker (functions below) do.
drop policy if exists "students read own coach notes" on public.coach_notes;
create policy "students read own coach notes"
  on public.coach_notes for select
  to authenticated
  using (student_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------- the queue

create or replace function public.queue_coach_note()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.coach_notes (student_id, test)
  values (new.profile_id, tg_argv[0])
  on conflict (student_id, test) do nothing;
  return null;
end;
$$;

drop trigger if exists dm_aptitude_coach_note on public.dm_aptitude_results;
create trigger dm_aptitude_coach_note
  after insert on public.dm_aptitude_results
  for each row execute function public.queue_coach_note('dm-aptitude');

drop trigger if exists gl_aptitude_coach_note on public.career_readiness_assessment_results;
create trigger gl_aptitude_coach_note
  after insert on public.career_readiness_assessment_results
  for each row execute function public.queue_coach_note('gl-aptitude');

-- ------------------------------------------------------- the worker's side

-- The oldest waiting note, with what the worker needs to write it, and the
-- month's agent spend so far (jobs and notes) so it can respect the budget.
-- A note left "writing" for ten minutes (the server restarted) is offered again.
create or replace function public.coach_claim_note()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  n public.coach_notes;
  v_scores jsonb;
  v_reflection text;
  v_name text;
  v_meta jsonb;
begin
  update public.coach_notes
     set status = 'queued'
   where status = 'writing' and claimed_at < now() - interval '10 minutes';

  select * into n from public.coach_notes
   where status = 'queued'
   order by created_at
   limit 1
   for update skip locked;
  if not found then return null; end if;

  update public.coach_notes set status = 'writing', claimed_at = now() where id = n.id;

  if n.test = 'dm-aptitude' then
    select r.scores, r.reflection into v_scores, v_reflection
      from public.dm_aptitude_results r where r.profile_id = n.student_id;
  else
    select r.scores, r.reflection into v_scores, v_reflection
      from public.career_readiness_assessment_results r where r.profile_id = n.student_id;
  end if;
  select split_part(btrim(coalesce(p.full_name, '')), ' ', 1) into v_name
    from public.profiles p where p.id = n.student_id;
  select u.raw_user_meta_data -> 'profile' into v_meta from auth.users u where u.id = n.student_id;

  return jsonb_build_object(
    'id', n.id,
    'test', n.test,
    'first_name', nullif(v_name, ''),
    'scores', v_scores,
    'reflection', v_reflection,
    'career_stage', v_meta ->> 'career_stage',
    'goal', v_meta -> 'goals' ->> 0,
    'month_cost_usd',
      coalesce((select sum(coalesce((usage ->> 'cost_usd')::numeric, 0)) from public.agent_jobs
                 where created_at >= date_trunc('month', now())), 0)
      + coalesce((select sum(coalesce((usage ->> 'cost_usd')::numeric, 0)) from public.coach_notes
                   where done_at >= date_trunc('month', now())), 0));
end;
$$;

create or replace function public.coach_finish_note(p_id uuid, p_ok boolean, p_note text, p_usage jsonb, p_error text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coach_notes
     set status = case when p_ok then 'done' else 'failed' end,
         note = case when p_ok then left(btrim(p_note), 2000) end,
         usage = p_usage,
         error = case when p_ok then null else left(p_error, 1000) end,
         done_at = now()
   where id = p_id;
end;
$$;

-- Only the worker (service role) may claim and finish notes.
revoke all on function public.coach_claim_note() from public, anon, authenticated;
revoke all on function public.coach_finish_note(uuid, boolean, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.queue_coach_note() from public, anon, authenticated;
grant execute on function public.coach_claim_note() to service_role;
grant execute on function public.coach_finish_note(uuid, boolean, text, jsonb, text) to service_role;

-- Check:
--   select test, status, count(*) from public.coach_notes group by 1, 2;
--   select created_at, test, status, note, usage ->> 'cost_usd' as cost from public.coach_notes order by created_at desc limit 10;
