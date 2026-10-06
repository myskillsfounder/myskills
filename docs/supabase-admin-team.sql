-- Admin: give the internal team access from the admin panel, and the numbers
-- behind the new Dashboard.
--
-- Until now a team member's access to /admin could only be changed by editing
-- the staff_permissions table by hand in this SQL editor. This adds:
--
--   admin_team()                 who has access to /admin, and to what
--   admin_set_staff_access(...)  give one person a set of sections (or none)
--   admin_dashboard_extra()      trends and community numbers for the Dashboard
--
-- Rules that do not change:
--   * Only a FULL ADMIN (a row in public.admins) can see or change the team.
--   * Access can only be given to an @myskills.org.in account that already
--     exists (the table's own trigger enforces the email domain).
--   * Making someone a full admin stays a deliberate step in this editor: see
--     the commented line at the bottom.
--
-- Run once, after docs/supabase-admin-team-role.sql and
-- docs/supabase-portal-signup.sql. Safe to re-run. Until it is run, the
-- Dashboard works without its trends and the Team page says it isn't set up.

-- ---------------------------------------------------------------------------
-- 1. Who has access
-- ---------------------------------------------------------------------------
create or replace function public.admin_team()
returns table (
  user_id         uuid,
  email           text,
  full_name       text,
  is_admin        boolean,
  sections        text[],
  last_sign_in_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not public.is_admin() then
    raise exception 'Only a full admin can see the team.';
  end if;
  return query
  select u.id,
         u.email::text,
         coalesce(p.full_name, u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name')::text,
         exists (select 1 from public.admins a where a.user_id = u.id),
         coalesce((select array_agg(sp.section order by sp.section)
                     from public.staff_permissions sp where sp.user_id = u.id), '{}'::text[]),
         u.last_sign_in_at
    from auth.users u
    left join public.profiles p on p.id = u.id
   where exists (select 1 from public.admins a where a.user_id = u.id)
      or exists (select 1 from public.staff_permissions sp where sp.user_id = u.id)
   order by exists (select 1 from public.admins a where a.user_id = u.id) desc, lower(u.email);
end;
$$;
revoke execute on function public.admin_team() from public, anon;
grant execute on function public.admin_team() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Give (or take away) one person's sections
-- The list REPLACES what they had: an empty list removes their access.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_staff_access(p_email text, p_sections text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email    text := lower(btrim(coalesce(p_email, '')));
  v_user     uuid;
  v_sections text[];
  v_allowed  constant text[] := array[
    'users', 'assessment', 'certificates', 'feedback',
    'mentors', 'institution-partners', 'demo-requests', 'blog', 'ads', 'wellness',
    'verification', 'mentor-reviews',
    'overview', 'portal-access', 'partner-leads'
  ];
begin
  if not public.is_admin() then
    raise exception 'Only a full admin can change the team''s access.';
  end if;
  if v_email not like '%@myskills.org.in' then
    raise exception 'Team access is only for @myskills.org.in accounts.';
  end if;

  select u.id into v_user from auth.users u where lower(u.email) = v_email;
  if v_user is null then
    raise exception 'No account uses % yet. They need to create an account with that email first, then you can give it access.', v_email;
  end if;
  if exists (select 1 from public.admins a where a.user_id = v_user) then
    raise exception '% is a full admin and already has everything.', v_email;
  end if;

  select coalesce(array_agg(distinct s), '{}'::text[]) into v_sections
    from unnest(coalesce(p_sections, '{}'::text[])) as s;
  if exists (select 1 from unnest(v_sections) as s where not (s = any (v_allowed))) then
    raise exception 'That list has a section that doesn''t exist.';
  end if;

  delete from public.staff_permissions sp
   where sp.user_id = v_user and not (sp.section = any (v_sections));
  insert into public.staff_permissions (user_id, section)
  select v_user, s from unnest(v_sections) as s
  on conflict (user_id, section) do nothing;
end;
$$;
revoke execute on function public.admin_set_staff_access(text, text[]) from public, anon;
grant execute on function public.admin_set_staff_access(text, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Dashboard: trends and community numbers
-- Each block is worked out on its own, so one missing table (a script not yet
-- run) leaves that block empty instead of breaking the Dashboard.
-- Portal sign-ups (mentors, companies...) are not counted as students.
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard_extra()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_days      jsonb;
  v_weeks     jsonb;
  v_community jsonb;
  v_recent    jsonb;
begin
  if not public.has_section_access('overview') then
    return null;
  end if;

  -- The last 30 days, one entry a day: new students and students who signed in.
  begin
    select jsonb_agg(jsonb_build_object('day', d.day, 'signups', coalesce(s.n, 0), 'active', coalesce(a.n, 0)) order by d.day)
      into v_days
      from (select generate_series(current_date - 29, current_date, interval '1 day')::date as day) d
      left join (
        select p.created_at::date as day, count(*) as n
          from public.profiles p
         where p.created_at >= current_date - 29 and not public.is_portal_account(p.id)
         group by 1
      ) s on s.day = d.day
      left join (
        select e.at::date as day, count(distinct e.profile_id) as n
          from public.login_events e
         where e.at >= current_date - 29
         group by 1
      ) a on a.day = d.day;
  exception when others then
    v_days := null;
  end;

  -- This week against the one before it.
  begin
    select jsonb_build_object(
      'new_this_week',    (select count(*) from public.profiles p
                            where p.created_at >= now() - interval '7 days' and not public.is_portal_account(p.id)),
      'new_last_week',    (select count(*) from public.profiles p
                            where p.created_at >= now() - interval '14 days' and p.created_at < now() - interval '7 days'
                              and not public.is_portal_account(p.id)),
      'active_this_week', (select count(distinct e.profile_id) from public.login_events e
                            where e.at >= now() - interval '7 days'),
      'active_last_week', (select count(distinct e.profile_id) from public.login_events e
                            where e.at >= now() - interval '14 days' and e.at < now() - interval '7 days')
    ) into v_weeks;
  exception when others then
    v_weeks := null;
  end;

  -- The people and organisations around the students.
  begin
    select jsonb_build_object(
      'mentors_listed',        (select count(*) from public.mentors),
      'mentors_taking',        (select count(*) from public.mentors m
                                 where m.profile_id is not null and m.ready and m.accepting),
      'institutions_listed',   (select count(*) from public.institution_partners),
      'partner_accounts',      (select count(*) from (
                                  select m.profile_id as id from public.mentors m where m.profile_id is not null
                                  union
                                  select a.user_id from public.community_access a where not a.sees_all
                                ) x),
      'signups_waiting',       (select count(*) from public.portal_requests r where r.status = 'pending'),
      'students_with_mentor',  (select count(distinct mm.student_id) from public.mentor_matches mm where mm.status = 'active'),
      'mentor_requests_waiting', (select count(*) from public.mentor_matches mm where mm.status = 'requested'),
      'students_with_provider', (select count(distinct e.student_id) from public.community_engagements e where e.status = 'active'),
      'sessions_30d',          (select count(*) from public.community_sessions s where s.held_on >= current_date - 29)
    ) into v_community;
  exception when others then
    v_community := null;
  end;

  -- The newest students.
  begin
    select jsonb_agg(jsonb_build_object('id', r.id, 'name', r.full_name, 'created_at', r.created_at) order by r.created_at desc)
      into v_recent
      from (
        select p.id, p.full_name, p.created_at
          from public.profiles p
         where not public.is_portal_account(p.id)
         order by p.created_at desc
         limit 6
      ) r;
  exception when others then
    v_recent := null;
  end;

  return jsonb_build_object('days', v_days, 'weeks', v_weeks, 'community', v_community, 'recent', v_recent);
end;
$$;
revoke execute on function public.admin_dashboard_extra() from public, anon;
grant execute on function public.admin_dashboard_extra() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Check: who is a FULL ADMIN (the only accounts that can open Team & access)
-- ---------------------------------------------------------------------------
-- To make someone a full admin, run this with their email (deliberately not a
-- button in the app):
--   insert into public.admins (user_id)
--   select id from auth.users where lower(email) = 'someone@myskills.org.in'
--   on conflict do nothing;

select u.email as full_admin, u.last_sign_in_at
  from public.admins a join auth.users u on u.id = a.user_id
 order by u.email;
