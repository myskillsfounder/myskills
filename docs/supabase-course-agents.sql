-- Course agents: the Course Architect and the Assessment Agent drafting and
-- improving programmes together.
--
-- The team asks from a programme's editor (the Agents tab): draft this
-- programme, or improve it, with optional instructions. The request is queued
-- here as a job. The worker on the server (agents/, see agents/README.md)
-- picks it up and:
--   1. researches the field on the web, with sources (Assessment Agent);
--   2. drafts the programme, or starts from the current one (Course Architect);
--   3. checks it: the publish checks plus test-writing checks, then a full
--      review against the research (Assessment Agent);
--   4. revises what the review found (Course Architect), and reviews again,
--      for at most three rounds;
--   5. leaves the result on the job with a review report.
-- Nothing reaches students: the team loads the result into the draft, reads
-- it, saves and publishes as usual.
--
-- The playbook is how the Assessment Agent trains the Course Architect: rules
-- learned from reviews, which both agents follow on every later job. The team
-- can switch any rule off, edit it, or add its own.
--
-- Weekly: a programme can be checked every week (off by default, since each
-- run costs money). The worker queues those jobs itself.
--
-- Who: the 'programmes' staff section asks for jobs, reads results and edits
-- the playbook. Only the worker, with the service_role key on the server,
-- claims and finishes jobs.
--
-- Run once, BEFORE the deploy (the new Agents tab says "run the SQL" until it
-- is in, so after is safe too). Safe to re-run. Depends on
-- docs/supabase-course-engine.sql and docs/supabase-builtin-programmes.sql.

-- ---------------------------------------------------------------------------
-- 1. Jobs, the playbook, and the worker's heartbeat
-- ---------------------------------------------------------------------------
create table if not exists public.agent_jobs (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  programme_id    uuid not null references public.programmes (id) on delete cascade,
  -- draft: write the programme from its name and brief; improve: start from
  -- the current draft (or the live version) and make it better.
  kind            text not null check (kind in ('draft', 'improve')),
  brief           text check (length(brief) <= 4000),
  weekly          boolean not null default false,
  requested_by    uuid references auth.users (id) on delete set null,
  status          text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed', 'cancelled')),
  -- What it is doing now, for the page ("Reviewing, round 2").
  stage           text check (length(stage) <= 200),
  started_at      timestamptz,
  heartbeat_at    timestamptz,
  finished_at     timestamptz,
  -- The version it started from, and when that was last saved: the page warns
  -- when the draft has changed since, before the result replaces it.
  base_version    int,
  base_updated_at timestamptz,
  result          jsonb check (result is null or (jsonb_typeof(result) = 'object' and octet_length(result::text) < 2000000)),
  report          text check (length(report) <= 200000),
  research        text check (length(research) <= 100000),
  -- Tokens, web searches and cost in US dollars, kept up to date as it runs.
  usage           jsonb not null default '{}'::jsonb,
  error           text check (length(error) <= 2000),
  loaded_at       timestamptz,
  loaded_by       uuid references auth.users (id) on delete set null
);
create index if not exists agent_jobs_programme on public.agent_jobs (programme_id, created_at desc);
-- One job at a time per programme.
create unique index if not exists agent_jobs_one_active on public.agent_jobs (programme_id) where status in ('queued', 'running');
alter table public.agent_jobs enable row level security;

create table if not exists public.agent_playbook (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  rule       text not null check (length(btrim(rule)) between 10 and 600),
  why        text check (length(why) <= 1000),
  active     boolean not null default true,
  -- seed: from the first review (21 Oct 2026); review: learned by the
  -- Assessment Agent on a job; team: written by the team.
  source     text not null default 'team' check (source in ('seed', 'review', 'team')),
  job_id     uuid references public.agent_jobs (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.agent_playbook enable row level security;

-- When the worker last checked in, so the page can say when it isn't running.
create table if not exists public.agent_worker_status (
  id      int primary key default 1 check (id = 1),
  seen_at timestamptz not null default now(),
  info    jsonb not null default '{}'::jsonb
);
alter table public.agent_worker_status enable row level security;
-- No policies on any of the three: everything goes through the functions below.

alter table public.programmes add column if not exists agent_weekly boolean not null default false;

-- The lessons from reviewing the first Data Analytics draft by hand.
insert into public.agent_playbook (rule, why, source)
select r.rule, r.why, 'seed'
  from (values
    ('The right answer must not be the longest option more often than chance would make it (about one question in four). Write wrong options of similar length and detail, each a real mistake learners make.',
     'In the first Data Analytics draft the right answer was the longest option in 45 of 55 questions, so students could pass by picking the long one.'),
    ('Code, formula and query questions need wrong options that look just as complete as the right one: the same function with a wrong argument, a missing clause, a wrong default.',
     'Short, obviously broken code options give the answer away even when the student cannot read the code.'),
    ('Overview hours must equal the module minutes plus the project and final test. A module with two hands-on tasks takes 60 to 120 minutes, not 40.',
     'The first draft said 50 hours while its modules added up to 9.'),
    ('Write the project rubric for the field: 4 or 5 criteria that say what good work looks like there (for data analytics: problem framing, data quality, analysis, dashboard, recommendation), never the generic relevance/quality/presentation set.',
     'A generic rubric lets every mentor grade differently.'),
    ('State laws and regulations exactly: what they allow as well as what they forbid (India''s Digital Personal Data Protection Act, 2023 allows processing with consent or for certain legitimate uses). If unsure of a detail, say less rather than guess.',
     'The first draft described the DPDP Act more narrowly than the law is.'),
    ('"Why the others are wrong" must say briefly why each wrong option is wrong, and must not start with "The others" (the page already labels it).',
     'The page shows the note under the heading "The others:".'),
    ('Every task that mentions a paid tool (Copilot, Power BI Pro, paid AI plans) must also be possible with a free one (Google Colab, Looker Studio, free AI assistants), and say so.',
     'Most MySkills students are in college and have no paid licences.'),
    ('When software behaviour depends on the data or settings (for example how pandas reads 05/04/2026), say "can" or name the condition. Never state a default that is not always true.',
     'An explanation in the first draft said pandas always reads such dates month-first; it depends on the data.')
  ) as r(rule, why)
 where not exists (select 1 from public.agent_playbook p where p.rule = r.rule);

-- ---------------------------------------------------------------------------
-- 2. The team: ask, follow, read, load, cancel; the playbook; weekly checks
-- ---------------------------------------------------------------------------

-- A job as the page shows it. The result, report and research are only sent
-- for one job at a time (admin_agent_job), as they are large.
create or replace function public.agent_job_row(j public.agent_jobs) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', j.id, 'created_at', j.created_at, 'kind', j.kind, 'brief', j.brief, 'weekly', j.weekly,
    'status', j.status, 'stage', j.stage, 'started_at', j.started_at, 'heartbeat_at', j.heartbeat_at,
    'finished_at', j.finished_at, 'base_version', j.base_version, 'usage', j.usage, 'error', j.error,
    'has_result', j.result is not null, 'loaded_at', j.loaded_at,
    'requested_by', (select coalesce(nullif(btrim(p.full_name), ''), split_part(u.email::text, '@', 1))
                       from auth.users u left join public.profiles p on p.id = u.id where u.id = j.requested_by))
$$;
revoke execute on function public.agent_job_row(public.agent_jobs) from public, anon, authenticated;

-- A programme's jobs, newest first, with what the page needs around them.
create or replace function public.admin_agent_jobs(p_programme uuid)
returns jsonb
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  return jsonb_build_object(
    'jobs', coalesce((select jsonb_agg(public.agent_job_row(j) order by j.created_at desc)
                        from (select * from public.agent_jobs where programme_id = p_programme
                               order by created_at desc limit 30) j), '[]'::jsonb),
    'weekly', coalesce((select agent_weekly from public.programmes where id = p_programme), false),
    'month_cost_usd', coalesce((select round(sum(coalesce((usage ->> 'cost_usd')::numeric, 0)), 2)
                                  from public.agent_jobs where created_at >= date_trunc('month', now())), 0),
    'worker_seen_at', (select seen_at from public.agent_worker_status where id = 1));
end $$;

-- One job in full, and whether the draft has changed since it started.
create or replace function public.admin_agent_job(p_id uuid)
returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare
  j public.agent_jobs;
  v_now timestamptz;
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  select * into j from public.agent_jobs where id = p_id;
  if j.id is null then
    return null;
  end if;
  select v.updated_at into v_now from public.programme_versions v
   where v.programme_id = j.programme_id and v.status in ('draft', 'published')
   order by v.status = 'draft' desc limit 1;
  return public.agent_job_row(j) || jsonb_build_object(
    'result', j.result, 'report', j.report, 'research', j.research,
    'draft_changed', j.base_updated_at is not null and v_now is distinct from j.base_updated_at);
end $$;

-- Ask the agents. A programme with no modules yet is drafted; any other is
-- improved, starting from its draft or, without one, its live version.
create or replace function public.admin_request_agent_job(p_programme uuid, p_brief text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v public.programme_versions;
  v_id uuid;
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  if not exists (select 1 from public.programmes where id = p_programme) then
    raise exception 'That programme no longer exists.';
  end if;
  if exists (select 1 from public.agent_jobs where programme_id = p_programme and status in ('queued', 'running')) then
    raise exception 'The agents are already working on this programme. Wait for that job to finish, or cancel it.';
  end if;
  select * into v from public.programme_versions
   where programme_id = p_programme and status in ('draft', 'published')
   order by status = 'draft' desc limit 1;
  insert into public.agent_jobs (programme_id, kind, brief, requested_by, base_version, base_updated_at)
  values (p_programme,
          case when coalesce(jsonb_array_length(v.content -> 'modules'), 0) = 0 then 'draft' else 'improve' end,
          nullif(btrim(left(p_brief, 4000)), ''), auth.uid(), v.version, v.updated_at)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.admin_cancel_agent_job(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  -- A running job stops at its next step; what it has spent stays on the job.
  update public.agent_jobs
     set status = 'cancelled', stage = 'Cancelled', finished_at = now()
   where id = p_id and status in ('queued', 'running');
end $$;

-- The page calls this after putting a result into the editor.
create or replace function public.admin_mark_agent_job_loaded(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  update public.agent_jobs set loaded_at = now(), loaded_by = auth.uid() where id = p_id and result is not null;
end $$;

create or replace function public.admin_set_agent_weekly(p_programme uuid, p_on boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  update public.programmes set agent_weekly = coalesce(p_on, false) where id = p_programme;
end $$;

create or replace function public.admin_agent_playbook()
returns jsonb
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', r.id, 'created_at', r.created_at, 'updated_at', r.updated_at, 'rule', r.rule, 'why', r.why,
             'active', r.active, 'source', r.source, 'job_id', r.job_id,
             'programme', (select p.title from public.agent_jobs j join public.programmes p on p.id = j.programme_id where j.id = r.job_id))
           order by r.active desc, r.created_at)
      from public.agent_playbook r), '[]'::jsonb);
end $$;

-- Add a rule (p_id null) or change one.
create or replace function public.admin_save_agent_rule(p_id uuid, p_rule text, p_why text, p_active boolean)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := p_id;
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  if length(btrim(coalesce(p_rule, ''))) < 10 then
    raise exception 'Write the rule in a sentence (at least 10 characters).';
  end if;
  if v_id is null then
    insert into public.agent_playbook (rule, why, active, source, updated_by)
    values (btrim(p_rule), nullif(btrim(p_why), ''), coalesce(p_active, true), 'team', auth.uid())
    returning id into v_id;
  else
    update public.agent_playbook
       set rule = btrim(p_rule), why = nullif(btrim(p_why), ''), active = coalesce(p_active, active),
           updated_at = now(), updated_by = auth.uid()
     where id = v_id;
  end if;
  return v_id;
end $$;

revoke execute on function public.admin_agent_jobs(uuid) from public, anon;
revoke execute on function public.admin_agent_job(uuid) from public, anon;
revoke execute on function public.admin_request_agent_job(uuid, text) from public, anon;
revoke execute on function public.admin_cancel_agent_job(uuid) from public, anon;
revoke execute on function public.admin_mark_agent_job_loaded(uuid) from public, anon;
revoke execute on function public.admin_set_agent_weekly(uuid, boolean) from public, anon;
revoke execute on function public.admin_agent_playbook() from public, anon;
revoke execute on function public.admin_save_agent_rule(uuid, text, text, boolean) from public, anon;
grant execute on function public.admin_agent_jobs(uuid) to authenticated;
grant execute on function public.admin_agent_job(uuid) to authenticated;
grant execute on function public.admin_request_agent_job(uuid, text) to authenticated;
grant execute on function public.admin_cancel_agent_job(uuid) to authenticated;
grant execute on function public.admin_mark_agent_job_loaded(uuid) to authenticated;
grant execute on function public.admin_set_agent_weekly(uuid, boolean) to authenticated;
grant execute on function public.admin_agent_playbook() to authenticated;
grant execute on function public.admin_save_agent_rule(uuid, text, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. The worker (service_role only)
-- ---------------------------------------------------------------------------
create or replace function public.agent_worker_ping(p_info jsonb)
returns void
language sql security definer set search_path = public as $$
  insert into public.agent_worker_status (id, seen_at, info) values (1, now(), coalesce(p_info, '{}'::jsonb))
  on conflict (id) do update set seen_at = now(), info = excluded.info
$$;

-- Take the oldest waiting job. Returns null when there is none. A job whose
-- worker stopped answering (no heartbeat for 20 minutes) is marked failed
-- first, so one crash never blocks a programme.
create or replace function public.agent_claim_job()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  j public.agent_jobs;
  p public.programmes;
  v public.programme_versions;
begin
  update public.agent_jobs
     set status = 'failed', finished_at = now(), stage = 'Stopped',
         error = 'The agents’ server stopped while working on this job. Ask again.'
   where status = 'running' and coalesce(heartbeat_at, started_at) < now() - interval '20 minutes';

  select * into j from public.agent_jobs where status = 'queued' order by created_at limit 1 for update skip locked;
  if j.id is null then
    return null;
  end if;
  select * into p from public.programmes where id = j.programme_id;
  select * into v from public.programme_versions
   where programme_id = p.id and status in ('draft', 'published')
   order by status = 'draft' desc limit 1;
  update public.agent_jobs
     set status = 'running', started_at = now(), heartbeat_at = now(), stage = 'Starting',
         base_version = v.version, base_updated_at = v.updated_at
   where id = j.id;
  return jsonb_build_object(
    'job', jsonb_build_object('id', j.id, 'kind', j.kind, 'brief', j.brief, 'weekly', j.weekly, 'created_at', j.created_at),
    'programme', jsonb_build_object('id', p.id, 'slug', p.slug, 'title', p.title, 'kind', p.kind, 'source', p.source,
                                    'status', p.status, 'current_version', p.current_version),
    'version', v.version,
    'content', v.content,
    'playbook', coalesce((select jsonb_agg(jsonb_build_object('rule', r.rule, 'why', r.why) order by r.created_at)
                            from public.agent_playbook r where r.active), '[]'::jsonb),
    'month_cost_usd', coalesce((select sum(coalesce((usage ->> 'cost_usd')::numeric, 0))
                                  from public.agent_jobs where created_at >= date_trunc('month', now())), 0));
end $$;

-- Progress while it runs. Returns the job's status: 'cancelled' tells the
-- worker to stop.
create or replace function public.agent_job_progress(p_id uuid, p_stage text, p_usage jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_status text;
begin
  update public.agent_jobs
     set stage = case when status = 'running' then left(p_stage, 200) else stage end,
         heartbeat_at = now(),
         usage = coalesce(p_usage, usage)
   where id = p_id
  returning status into v_status;
  return v_status;
end $$;

-- The end of a job: the result and report, or what went wrong, and the
-- lessons the review found (at most five new rules per job).
create or replace function public.agent_finish_job(
  p_id uuid, p_ok boolean, p_result jsonb, p_report text, p_research text, p_usage jsonb, p_error text, p_lessons jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  l jsonb;
  v_added int := 0;
begin
  update public.agent_jobs
     set status = case when status = 'cancelled' then 'cancelled' when p_ok then 'done' else 'failed' end,
         stage = case when status = 'cancelled' then 'Cancelled' when p_ok then 'Finished' else 'Failed' end,
         finished_at = coalesce(finished_at, now()),
         result = case when status = 'cancelled' then null else p_result end,
         report = left(p_report, 200000), research = left(p_research, 100000),
         usage = coalesce(p_usage, usage), error = left(p_error, 2000)
   where id = p_id;
  if p_ok and jsonb_typeof(p_lessons) = 'array' then
    for l in select x from jsonb_array_elements(p_lessons) x loop
      exit when v_added >= 5;
      if length(btrim(coalesce(l ->> 'rule', ''))) between 10 and 600
         and not exists (select 1 from public.agent_playbook where lower(rule) = lower(btrim(l ->> 'rule'))) then
        insert into public.agent_playbook (rule, why, source, job_id)
        values (btrim(l ->> 'rule'), left(nullif(btrim(l ->> 'why'), ''), 1000), 'review', p_id);
        v_added := v_added + 1;
      end if;
    end loop;
  end if;
end $$;

-- Queue the weekly checks that are due: programmes switched to weekly, with
-- no job asked for in the last 7 days. Returns how many were queued.
create or replace function public.agent_queue_weekly()
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_n int;
begin
  insert into public.agent_jobs (programme_id, kind, brief, weekly, base_version, base_updated_at)
  select p.id, 'improve',
         'Weekly check: research what has changed in this field since this version was written, check the programme against it, and improve what is out of date or weak.',
         true, v.version, v.updated_at
    from public.programmes p
    join lateral (select x.version, x.updated_at, x.content from public.programme_versions x
                   where x.programme_id = p.id and x.status in ('draft', 'published')
                   order by x.status = 'draft' desc limit 1) v on true
   where p.agent_weekly and p.status <> 'archived'
     and coalesce(jsonb_array_length(v.content -> 'modules'), 0) > 0
     and not exists (select 1 from public.agent_jobs j
                      where j.programme_id = p.id
                        and (j.status in ('queued', 'running') or j.created_at > now() - interval '7 days'))
  on conflict do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

revoke execute on function public.agent_worker_ping(jsonb) from public, anon, authenticated;
revoke execute on function public.agent_claim_job() from public, anon, authenticated;
revoke execute on function public.agent_job_progress(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.agent_finish_job(uuid, boolean, jsonb, text, text, jsonb, text, jsonb) from public, anon, authenticated;
revoke execute on function public.agent_queue_weekly() from public, anon, authenticated;
grant execute on function public.agent_worker_ping(jsonb) to service_role;
grant execute on function public.agent_claim_job() to service_role;
grant execute on function public.agent_job_progress(uuid, text, jsonb) to service_role;
grant execute on function public.agent_finish_job(uuid, boolean, jsonb, text, text, jsonb, text, jsonb) to service_role;
grant execute on function public.agent_queue_weekly() to service_role;
