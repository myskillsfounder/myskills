-- Course agents: regular checks once a month instead of once a week.
--
-- Paul (21 Oct 2026): "schedule revisal for once in every month". Only the
-- interval changes: a programme switched to regular checks gets an improve
-- job when no job has been asked for it in the last month. The names
-- (agent_weekly, agent_queue_weekly, the jobs' weekly flag) stay, so the
-- worker on the server needs no change.
--
-- Run once, any time (before or after the deploy). Safe to re-run.
-- Depends on docs/supabase-course-agents.sql.

-- Queue the monthly checks that are due: programmes switched to regular
-- checks, with no job asked for in the last month. Returns how many were
-- queued. (Named weekly from the first design; the column and flag too.)
create or replace function public.agent_queue_weekly()
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_n int;
begin
  insert into public.agent_jobs (programme_id, kind, brief, weekly, base_version, base_updated_at)
  select p.id, 'improve',
         'Monthly check: research what has changed in this field since this version was written, check the programme against it, and improve what is out of date or weak.',
         true, v.version, v.updated_at
    from public.programmes p
    join lateral (select x.version, x.updated_at, x.content from public.programme_versions x
                   where x.programme_id = p.id and x.status in ('draft', 'published')
                   order by x.status = 'draft' desc limit 1) v on true
   where p.agent_weekly and p.status <> 'archived'
     and coalesce(jsonb_array_length(v.content -> 'modules'), 0) > 0
     and not exists (select 1 from public.agent_jobs j
                      where j.programme_id = p.id
                        and (j.status in ('queued', 'running') or j.created_at > now() - interval '1 month'))
  on conflict do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

revoke execute on function public.agent_queue_weekly() from public, anon, authenticated;
grant execute on function public.agent_queue_weekly() to service_role;
