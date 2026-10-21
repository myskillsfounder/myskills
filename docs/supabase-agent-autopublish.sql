-- Course agents: publish automatically when the review says ready.
--
-- Paul (21 Oct 2026) chose auto-publish. A programme's Agents tab gets a
-- switch, off by default. With it on, when a job finishes and the Assessment
-- Agent's last review says "ready" (nothing must be fixed, every automatic
-- and publish check passes), the worker publishes the result as the next
-- version, as if someone had loaded, saved and published it. With the
-- monthly check on as well, the programme keeps itself current.
--
-- It never publishes:
--   - Global Leadership or Digital Marketing (students' scores count on them);
--   - when the draft was saved after the job started (someone is editing it:
--     the result waits for them instead);
--   - anything the publish checks refuse.
-- Every auto-publish is recorded on the job, and the version history shows
-- it, so it can be undone by publishing the earlier content again.
--
-- Run once, BEFORE OR AFTER the deploy (the switch appears once both are
-- in). Safe to re-run. Depends on docs/supabase-course-agents.sql and
-- docs/supabase-builtin-programmes.sql.

alter table public.programmes add column if not exists agent_autopublish boolean not null default false;
alter table public.agent_jobs
  add column if not exists published_version int,
  add column if not exists autopublish_note text check (length(autopublish_note) <= 500);

-- A job as the page shows it, now with what auto-publish did.
create or replace function public.agent_job_row(j public.agent_jobs) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', j.id, 'created_at', j.created_at, 'kind', j.kind, 'brief', j.brief, 'weekly', j.weekly,
    'status', j.status, 'stage', j.stage, 'started_at', j.started_at, 'heartbeat_at', j.heartbeat_at,
    'finished_at', j.finished_at, 'base_version', j.base_version, 'usage', j.usage, 'error', j.error,
    'has_result', j.result is not null, 'loaded_at', j.loaded_at,
    'published_version', j.published_version, 'autopublish_note', j.autopublish_note,
    'requested_by', (select coalesce(nullif(btrim(p.full_name), ''), split_part(u.email::text, '@', 1))
                       from auth.users u left join public.profiles p on p.id = u.id where u.id = j.requested_by))
$$;
revoke execute on function public.agent_job_row(public.agent_jobs) from public, anon, authenticated;

-- A programme's jobs, now with the auto-publish switch.
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
    'autopublish', coalesce((select agent_autopublish from public.programmes where id = p_programme), false),
    'month_cost_usd', coalesce((select round(sum(coalesce((usage ->> 'cost_usd')::numeric, 0)), 2)
                                  from public.agent_jobs where created_at >= date_trunc('month', now())), 0),
    'worker_seen_at', (select seen_at from public.agent_worker_status where id = 1));
end $$;

create or replace function public.admin_set_agent_autopublish(p_programme uuid, p_on boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  if coalesce(p_on, false) and exists (select 1 from public.programmes where id = p_programme and source = 'built-in') then
    raise exception 'Global Leadership and Digital Marketing are never published automatically: students’ scores count on them.';
  end if;
  update public.programmes set agent_autopublish = coalesce(p_on, false) where id = p_programme;
end $$;
revoke execute on function public.admin_set_agent_autopublish(uuid, boolean) from public, anon;
grant execute on function public.admin_set_agent_autopublish(uuid, boolean) to authenticated;

-- The worker calls this after a job whose last review said "ready". Returns
-- what happened, in a sentence; publishes only when every condition holds.
create or replace function public.agent_autopublish_job(p_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  j public.agent_jobs;
  p public.programmes;
  v_current timestamptz;
  v_problems text[];
  v_version int;
  v_note text;
begin
  select * into j from public.agent_jobs where id = p_id;
  if j.id is null or j.status <> 'done' or j.result is null then
    return null;
  end if;
  select * into p from public.programmes where id = j.programme_id;
  if not p.agent_autopublish then
    return null;
  end if;

  if p.source = 'built-in' then
    v_note := 'Not published automatically: a built-in programme always waits for the team.';
  else
    select updated_at into v_current from public.programme_versions
     where programme_id = p.id and status in ('draft', 'published')
     order by status = 'draft' desc limit 1;
    if v_current is distinct from j.base_updated_at then
      v_note := 'Not published automatically: the draft was saved while the agents worked, so the result waits for you.';
    else
      v_problems := public.programme_problems(p.id, j.result);
      if cardinality(v_problems) > 0 then
        v_note := left('Not published automatically: ' || array_to_string(v_problems[1:3], '; '), 500);
      end if;
    end if;
  end if;

  if v_note is null then
    -- The result becomes the draft, and the draft is published, as the
    -- editor's Save draft and Publish do.
    update public.programme_versions set content = j.result, updated_at = now(), updated_by = null
     where programme_id = p.id and status = 'draft'
    returning version into v_version;
    if v_version is null then
      select coalesce(max(version), 0) + 1 into v_version from public.programme_versions where programme_id = p.id;
      insert into public.programme_versions (programme_id, version, status, content)
      values (p.id, v_version, 'draft', j.result);
    end if;
    update public.programme_versions set status = 'superseded' where programme_id = p.id and status = 'published';
    update public.programme_versions
       set status = 'published', published_at = now(), published_by = null,
           note = left('Published automatically by the course agents (' || case when j.kind = 'draft' then 'draft' when j.weekly then 'monthly check' else 'improve' end || ' job of ' || to_char(j.created_at, 'DD Mon YYYY') || ')', 500)
     where programme_id = p.id and version = v_version;
    update public.programmes set status = 'published', current_version = v_version, updated_at = now() where id = p.id;
    v_note := 'Published automatically as v' || v_version || '.';
    update public.agent_jobs set published_version = v_version, loaded_at = now(), autopublish_note = v_note where id = p_id;
  else
    update public.agent_jobs set autopublish_note = v_note where id = p_id;
  end if;
  return v_note;
end $$;
revoke execute on function public.agent_autopublish_job(uuid) from public, anon, authenticated;
grant execute on function public.agent_autopublish_job(uuid) to service_role;
