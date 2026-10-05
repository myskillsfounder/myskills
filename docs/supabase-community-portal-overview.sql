-- Community portal: an overview role, and Mentors as a section like the rest.
--
-- Until now each account saw only its own students. This adds "sees
-- everything" to a grant: an account with it sees every student in that
-- resource, whoever they are working with, read-only. It is how the
-- MySkills team (founder@myskills.org.in) follows what students are using
-- across mentors, counsellors, career guides, companies and institutions.
--
-- It also lets 'mentors' be granted as an overview, so the Community portal
-- has a Mentors section for someone who is not a mentor themselves. Mentors
-- keep getting their own section by being linked to a mentor listing.
--
-- What an overview shows is the same as a provider sees for their own
-- students: names, emails, dates and session counts. Never what was discussed
-- (the session log holds only dates) and not the students' aptitude answers or
-- request messages.
--
-- Run once, AFTER docs/supabase-community-portal.sql. Safe to re-run. Run it
-- before deploying the matching frontend, or right after: the old frontend
-- ignores the new columns, and the new one works without them (no overview).

-- ---------------------------------------------------------------------------
-- The grant: mentors allowed, and a "sees everything" flag
-- ---------------------------------------------------------------------------
alter table public.community_access add column if not exists sees_all boolean not null default false;

alter table public.community_access drop constraint if exists community_access_resource_check;
alter table public.community_access add constraint community_access_resource_check
  check (resource in ('mentors', 'wellness', 'guidance', 'internships', 'institutions'));
-- 'mentors' can only be granted as an overview: a mentor's own section comes
-- from their listing.
alter table public.community_access drop constraint if exists community_access_mentors_overview;
alter table public.community_access add constraint community_access_mentors_overview
  check (resource <> 'mentors' or sees_all);

-- ---------------------------------------------------------------------------
-- What am I allowed to see? (now with sees_all; return shape changed, so drop)
-- ---------------------------------------------------------------------------
drop function if exists public.my_community_access();
create function public.my_community_access()
returns table (resource text, organisation text, sees_all boolean)
language sql
security definer
set search_path = public
stable
as $$
  -- A linked mentor's own section.
  select 'mentors'::text, null::text, false
   where exists (select 1 from public.mentors m where m.profile_id = auth.uid())
     and not exists (select 1 from public.community_access a
                      where a.user_id = auth.uid() and a.resource = 'mentors')
  union all
  select a.resource, a.organisation, a.sees_all from public.community_access a where a.user_id = auth.uid();
$$;
revoke execute on function public.my_community_access() from public, anon;
grant execute on function public.my_community_access() to authenticated;

-- ---------------------------------------------------------------------------
-- My students in one resource — or everyone's, with an overview grant
-- ---------------------------------------------------------------------------
drop function if exists public.my_community_students(text);
create function public.my_community_students(p_resource text)
returns table (
  id            uuid,
  status        text,
  started_on    date,
  ended_on      date,
  student_id    uuid,
  student_name  text,
  student_email text,
  sessions      int,
  last_session  date,
  -- Who the student is with, and whether that is the signed-in account (only
  -- then can they log a session or mark the student finished).
  provider_name text,
  mine          boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_all boolean;
begin
  select a.sees_all into v_all from public.community_access a
   where a.user_id = auth.uid() and a.resource = p_resource;
  if v_all is null then
    raise exception 'You don''t have access to this part of the Community portal.';
  end if;

  return query
  select e.id, e.status, e.started_on, e.ended_on, e.student_id,
         p.full_name, u.email::text,
         (select count(*)::int from public.community_sessions s where s.engagement_id = e.id),
         (select max(s.held_on) from public.community_sessions s where s.engagement_id = e.id),
         coalesce(pa.organisation, pp.full_name, pu.email::text),
         e.provider_id = auth.uid()
    from public.community_engagements e
    left join public.profiles p on p.id = e.student_id
    left join auth.users u on u.id = e.student_id
    left join public.profiles pp on pp.id = e.provider_id
    left join auth.users pu on pu.id = e.provider_id
    left join public.community_access pa on pa.user_id = e.provider_id and pa.resource = e.resource
   where e.resource = p_resource and (v_all or e.provider_id = auth.uid())
   order by (e.status = 'active') desc, e.started_on desc, e.created_at desc;
end;
$$;
revoke execute on function public.my_community_students(text) from public, anon;
grant execute on function public.my_community_students(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Mentors overview: every student working with (or waiting on) a mentor
-- ---------------------------------------------------------------------------
create or replace function public.community_mentor_students()
returns table (
  id            uuid,
  status        text,
  programme     text,
  started_on    date,
  student_id    uuid,
  student_name  text,
  student_email text,
  mentor_name   text,
  sessions      int,
  last_session  date
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not exists (select 1 from public.community_access a
                  where a.user_id = auth.uid() and a.resource = 'mentors' and a.sees_all) then
    raise exception 'You don''t have access to this part of the Community portal.';
  end if;

  return query
  select mm.id, mm.status::text, mm.programme, coalesce(mm.decided_at, mm.created_at)::date,
         mm.student_id, p.full_name, u.email::text, m.full_name,
         (select count(*)::int from public.live_session_attendance l
           where l.student_id = mm.student_id and l.programme = mm.programme and l.recorded_by = mm.mentor_user),
         (select max(l.held_on) from public.live_session_attendance l
           where l.student_id = mm.student_id and l.programme = mm.programme and l.recorded_by = mm.mentor_user)
    from public.mentor_matches mm
    join public.mentors m on m.id = mm.mentor_id
    left join public.profiles p on p.id = mm.student_id
    left join auth.users u on u.id = mm.student_id
   where mm.status in ('requested', 'active', 'ended')
   order by (mm.status = 'active') desc, (mm.status = 'requested') desc, mm.created_at desc;
end;
$$;
revoke execute on function public.community_mentor_students() from public, anon;
grant execute on function public.community_mentor_students() to authenticated;

-- ---------------------------------------------------------------------------
-- Admin: grant with "sees everything"; list shows it
-- ---------------------------------------------------------------------------
drop function if exists public.admin_grant_community_access(text, text, text);
create or replace function public.admin_grant_community_access(
  p_email text, p_resource text, p_organisation text default null, p_sees_all boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if not public.has_section_access('portal-access') then
    raise exception 'Not authorised.';
  end if;
  if p_resource not in ('mentors', 'wellness', 'guidance', 'internships', 'institutions') then
    raise exception 'Unknown resource.';
  end if;
  if p_resource = 'mentors' and not coalesce(p_sees_all, false) then
    raise exception 'A mentor gets their own section by being linked to a mentor listing. Grant Mentors here only as an overview (sees everything).';
  end if;
  if p_resource in ('internships', 'institutions') and not coalesce(p_sees_all, false)
     and coalesce(btrim(p_organisation), '') = '' then
    raise exception 'Say which company or institution this account is for.';
  end if;

  select u.id into v_user from auth.users u where lower(u.email) = lower(btrim(p_email));
  if v_user is null then
    raise exception 'No account uses that email. Ask them to create one at the Community portal sign-in, then grant access.';
  end if;

  insert into public.community_access (user_id, resource, organisation, sees_all, granted_by)
  values (v_user, p_resource, nullif(btrim(p_organisation), ''), coalesce(p_sees_all, false), auth.uid())
  on conflict (user_id, resource) do update
    set organisation = excluded.organisation, sees_all = excluded.sees_all;
end;
$$;
revoke execute on function public.admin_grant_community_access(text, text, text, boolean) from public, anon;
grant execute on function public.admin_grant_community_access(text, text, text, boolean) to authenticated;

drop function if exists public.admin_community_access();
create function public.admin_community_access()
returns table (
  user_id      uuid,
  email        text,
  full_name    text,
  resource     text,
  organisation text,
  created_at   timestamptz,
  active       int,
  sessions     int,
  sees_all     boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('portal-access') then
    raise exception 'Not authorised.';
  end if;
  return query
  select a.user_id, u.email::text, p.full_name, a.resource, a.organisation, a.created_at,
         (select count(*)::int from public.community_engagements e
           where e.provider_id = a.user_id and e.resource = a.resource and e.status = 'active'),
         (select count(*)::int from public.community_sessions s
            join public.community_engagements e on e.id = s.engagement_id
           where e.provider_id = a.user_id and e.resource = a.resource),
         a.sees_all
    from public.community_access a
    left join auth.users u on u.id = a.user_id
    left join public.profiles p on p.id = a.user_id
   order by a.resource, a.created_at;
end;
$$;
revoke execute on function public.admin_community_access() from public, anon;
grant execute on function public.admin_community_access() to authenticated;

-- An overview account isn't a counsellor to assign requests to.
create or replace function public.support_providers()
returns table (user_id uuid, full_name text, email text, resource text, active int)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not (public.is_admin() or public.has_section_access('wellness')) then
    raise exception 'Not authorised.';
  end if;
  return query
  select a.user_id, p.full_name, u.email::text, a.resource,
         (select count(*)::int from public.community_engagements e
           where e.provider_id = a.user_id and e.resource = a.resource and e.status = 'active')
    from public.community_access a
    left join auth.users u on u.id = a.user_id
    left join public.profiles p on p.id = a.user_id
   where a.resource in ('wellness', 'guidance') and not a.sees_all
   order by p.full_name nulls last;
end;
$$;

-- ---------------------------------------------------------------------------
-- founder@myskills.org.in sees everything, in all five sections
-- ---------------------------------------------------------------------------
insert into public.community_access (user_id, resource, organisation, sees_all)
select u.id, r.resource, null, true
  from auth.users u
 cross join (values ('mentors'), ('wellness'), ('guidance'), ('internships'), ('institutions')) as r(resource)
 where lower(u.email) = 'founder@myskills.org.in'
on conflict (user_id, resource) do update set sees_all = true, organisation = null;

-- Check:
select u.email, a.resource, a.sees_all
  from public.community_access a join auth.users u on u.id = a.user_id
 where lower(u.email) = 'founder@myskills.org.in'
 order by a.resource;
