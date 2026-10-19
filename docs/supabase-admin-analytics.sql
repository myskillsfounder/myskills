-- Admin Dashboard analytics: the numbers the Dashboard didn't have yet.
--
--   students        every account that isn't a portal (partner) account
--   returning       students who came back: signed in on two or more different days
--   returning_30d   students who signed in in the last 30 days on a later day
--                   than the one they joined (came back recently)
--   active_30d      students who signed in in the last 30 days
--   dm / gl         students in Digital Marketing (aptitude, practice or
--                   foundation) and in Global Leadership (aptitude or a module);
--                   the same rule as All students
--   leads           institution leads: all, open, enrolled; Global Leadership leads
--
-- Portal accounts (mentors, companies, institutions) are never counted as students.
-- Gated by the "Dashboard numbers" section ('overview'), like the rest of the
-- Dashboard. Each block is worked out on its own, so a missing table leaves
-- that block empty instead of breaking the page.
--
-- Run once, BEFORE OR AFTER the deploy: without it those cards show a dash.
-- Safe to re-run.
-- Depends on: docs/supabase-staff-permissions.sql, -portal-signup.sql
-- (is_portal_account), -institution-leads.sql.

create or replace function public.admin_dashboard_analytics()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_users jsonb;
  v_programmes jsonb;
  v_leads jsonb;
begin
  if not public.has_section_access('overview') then
    return null;
  end if;

  begin
    with days as (
      select e.profile_id, count(distinct e.at::date) as n
        from public.login_events e
       where not public.is_portal_account(e.profile_id)
       group by e.profile_id
    )
    select jsonb_build_object(
      'students',      (select count(*) from public.profiles p where not public.is_portal_account(p.id)),
      'returning',     (select count(*) from days where n >= 2),
      'returning_30d', (select count(distinct e.profile_id)
                          from public.login_events e
                          join public.profiles p on p.id = e.profile_id
                         where e.at >= now() - interval '30 days'
                           and e.at::date > p.created_at::date
                           and not public.is_portal_account(e.profile_id)),
      'active_30d',    (select count(distinct e.profile_id)
                          from public.login_events e
                         where e.at >= now() - interval '30 days'
                           and not public.is_portal_account(e.profile_id))
    ) into v_users;
  exception when others then
    v_users := null;
  end;

  begin
    with dm as (
      select profile_id from public.dm_aptitude_results
      union select profile_id from public.practice_attempts
      union select profile_id from public.initial_assessment_results
    ),
    gl as (
      select profile_id from public.career_readiness_assessment_results
      union select profile_id from public.career_readiness_responses
    )
    select jsonb_build_object(
      'dm', (select count(*) from dm),
      'gl', (select count(*) from gl)
    ) into v_programmes;
  exception when others then
    v_programmes := null;
  end;

  begin
    select jsonb_build_object(
      'institution_total',    (select count(*) from public.institution_leads),
      'institution_open',     (select count(*) from public.institution_leads where stage in ('new', 'contacted', 'visit')),
      'institution_enrolled', (select count(*) from public.institution_leads where stage = 'enrolled'),
      'gl_total',             (select count(*) from public.career_readiness_leads)
    ) into v_leads;
  exception when others then
    v_leads := null;
  end;

  return jsonb_build_object('users', v_users, 'programmes', v_programmes, 'leads', v_leads);
end;
$$;
revoke execute on function public.admin_dashboard_analytics() from public, anon;
grant execute on function public.admin_dashboard_analytics() to authenticated;

notify pgrst, 'reload schema';
