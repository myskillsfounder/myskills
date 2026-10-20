-- Agents' work: every course-agent job across all programmes, for the new
-- Courses > Agents' work page (with the playbook and this month's spending).
-- Read-only; nothing here changes a job.
--
-- Run once, BEFORE OR AFTER the deploy (the page says "run the SQL" until it
-- is in). Safe to re-run. Depends on docs/supabase-course-agents.sql.
-- Who: the 'programmes' staff section, as on each programme's Agents tab.

create or replace function public.admin_agent_work()
returns jsonb
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  return jsonb_build_object(
    'jobs', coalesce((
      select jsonb_agg(public.agent_job_row(j) || jsonb_build_object('programme_slug', p.slug, 'programme_title', p.title)
                       order by j.created_at desc)
        from (select * from public.agent_jobs order by created_at desc limit 100) j
        join public.programmes p on p.id = j.programme_id), '[]'::jsonb),
    -- Programmes switched to the monthly check.
    'monthly', coalesce((select jsonb_agg(jsonb_build_object('slug', slug, 'title', title) order by title)
                           from public.programmes where agent_weekly and status <> 'archived'), '[]'::jsonb),
    'month_cost_usd', coalesce((select round(sum(coalesce((usage ->> 'cost_usd')::numeric, 0)), 2)
                                  from public.agent_jobs where created_at >= date_trunc('month', now())), 0),
    'worker_seen_at', (select seen_at from public.agent_worker_status where id = 1),
    'worker_info', (select info from public.agent_worker_status where id = 1));
end $$;

revoke execute on function public.admin_agent_work() from public, anon;
grant execute on function public.admin_agent_work() to authenticated;
