-- The Community portal: one sign-in for everyone who serves students in
-- Community, with access granted per resource, and a record of which students
-- are using which resource.
--
-- Five resources, matching the Community page's tiles:
--   mentors       a mentor's students and session log. Unchanged, and still
--                 driven by the mentors/mentor_matches tables: anyone linked
--                 to a mentor listing has it. Not granted here.
--   wellness      a counsellor: the students assigned to them, and a log of
--                 sessions held.
--   guidance      a career guide: the same.
--   internships   a company: the students interning with it now.
--   institutions  an institution: the students enrolled with it now.
--
-- HOW A STUDENT IS CONNECTED
--   wellness / guidance  the team assigns a student's support request to one
--                        counsellor or guide (admin_assign_support_request).
--                        Students don't pick from a list.
--   internships / institutions  the organisation adds its own students by
--                        email (add_community_student); admins can too.
--
-- PRIVACY: the session log holds a date and nothing else. There is no notes
-- column on purpose — what a student and a counsellor talk about is never
-- stored. Admins see that a student is using a resource and how many sessions
-- there have been, not what was said.
--
-- THE SCORE: nothing here feeds the Career Readiness Score. Mentor sessions
-- keep counting through live_session_attendance, as before.
--
-- Run once in the Supabase SQL editor. Safe to re-run. No ordering against the
-- deploy: the portal falls back to its mentor-only behaviour until this is in.
-- Depends on: public.is_admin(), public.profiles, public.mentors,
-- public.wellness_requests (docs/supabase-wellness-requests.sql).

-- ---------------------------------------------------------------------------
-- Who may use which resource
-- ---------------------------------------------------------------------------
create table if not exists public.community_access (
  user_id      uuid not null references auth.users (id) on delete cascade,
  resource     text not null check (resource in ('wellness', 'guidance', 'internships', 'institutions')),
  -- For internships and institutions: the company or institution this account
  -- acts for. Shown to admins beside the students it lists.
  organisation text check (length(organisation) <= 160),
  granted_by   uuid references auth.users (id),
  created_at   timestamptz not null default now(),
  primary key (user_id, resource)
);

alter table public.community_access enable row level security;

-- Read your own grants; admins read all. Every write goes through a function.
drop policy if exists "read own community access" on public.community_access;
create policy "read own community access"
  on public.community_access for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- A student working with a provider
-- ---------------------------------------------------------------------------
create table if not exists public.community_engagements (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  resource    text not null check (resource in ('wellness', 'guidance', 'internships', 'institutions')),
  student_id  uuid not null references auth.users (id) on delete cascade,
  -- The counsellor, guide, company or institution account.
  provider_id uuid not null references auth.users (id) on delete cascade,
  status      text not null default 'active' check (status in ('active', 'ended')),
  started_on  date not null default current_date,
  ended_on    date,
  -- The support request this came from, when the team assigned one.
  request_id  uuid references public.wellness_requests (id) on delete set null,
  created_by  uuid references auth.users (id)
);

-- A student is live with a given provider once per resource.
create unique index if not exists community_engagements_one_active
  on public.community_engagements (resource, student_id, provider_id) where status = 'active';
create index if not exists community_engagements_provider_idx
  on public.community_engagements (provider_id, resource, status);
create index if not exists community_engagements_student_idx
  on public.community_engagements (student_id);

alter table public.community_engagements enable row level security;

drop policy if exists "read own community engagements" on public.community_engagements;
create policy "read own community engagements"
  on public.community_engagements for select
  to authenticated
  using (student_id = auth.uid() or provider_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- The session log: a date per session, and deliberately nothing else
-- ---------------------------------------------------------------------------
create table if not exists public.community_sessions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  engagement_id uuid not null references public.community_engagements (id) on delete cascade,
  held_on       date not null default current_date,
  created_by    uuid references auth.users (id),
  -- One entry per day per student; logging the same day twice is a no-op.
  unique (engagement_id, held_on)
);

alter table public.community_sessions enable row level security;

drop policy if exists "read own community sessions" on public.community_sessions;
create policy "read own community sessions"
  on public.community_sessions for select
  to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.community_engagements e
                where e.id = engagement_id and (e.provider_id = auth.uid() or e.student_id = auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- The portal: what am I allowed to see?
-- ---------------------------------------------------------------------------
create or replace function public.my_community_access()
returns table (resource text, organisation text)
language sql
security definer
set search_path = public
stable
as $$
  select 'mentors'::text, null::text
   where exists (select 1 from public.mentors m where m.profile_id = auth.uid())
  union all
  select a.resource, a.organisation from public.community_access a where a.user_id = auth.uid();
$$;
revoke execute on function public.my_community_access() from public, anon;
grant execute on function public.my_community_access() to authenticated;

-- ---------------------------------------------------------------------------
-- The portal: my students in one resource
-- ---------------------------------------------------------------------------
create or replace function public.my_community_students(p_resource text)
returns table (
  id            uuid,
  status        text,
  started_on    date,
  ended_on      date,
  student_id    uuid,
  student_name  text,
  student_email text,
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
                  where a.user_id = auth.uid() and a.resource = p_resource) then
    raise exception 'You don''t have access to this part of the Community portal.';
  end if;

  return query
  select e.id, e.status, e.started_on, e.ended_on, e.student_id,
         p.full_name, u.email::text,
         (select count(*)::int from public.community_sessions s where s.engagement_id = e.id),
         (select max(s.held_on) from public.community_sessions s where s.engagement_id = e.id)
    from public.community_engagements e
    left join public.profiles p on p.id = e.student_id
    left join auth.users u on u.id = e.student_id
   where e.provider_id = auth.uid() and e.resource = p_resource
   order by (e.status = 'active') desc, e.started_on desc, e.created_at desc;
end;
$$;
revoke execute on function public.my_community_students(text) from public, anon;
grant execute on function public.my_community_students(text) to authenticated;

-- Counsellors and career guides: record that a session happened.
create or replace function public.log_community_session(p_engagement uuid, p_held_on date default current_date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.community_engagements;
begin
  select * into e from public.community_engagements where id = p_engagement;
  if e.id is null or e.provider_id is distinct from auth.uid() then
    raise exception 'That student isn''t on your list.';
  end if;
  if e.resource not in ('wellness', 'guidance') then
    raise exception 'Sessions are logged for counselling and career guidance only.';
  end if;
  if e.status <> 'active' then
    raise exception 'This student is marked as finished. Ask the team to re-open them.';
  end if;
  if p_held_on > current_date then
    raise exception 'A session can only be logged once it has happened.';
  end if;

  insert into public.community_sessions (engagement_id, held_on, created_by)
  values (p_engagement, coalesce(p_held_on, current_date), auth.uid())
  on conflict (engagement_id, held_on) do nothing;
end;
$$;
revoke execute on function public.log_community_session(uuid, date) from public, anon;
grant execute on function public.log_community_session(uuid, date) to authenticated;

-- Companies and institutions: add one of their students, by the email the
-- student signed up to MySkills with.
create or replace function public.add_community_student(p_resource text, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid;
begin
  if p_resource not in ('internships', 'institutions') then
    raise exception 'Students for this resource are assigned by the MySkills team.';
  end if;
  if not exists (select 1 from public.community_access a
                  where a.user_id = auth.uid() and a.resource = p_resource) then
    raise exception 'You don''t have access to this part of the Community portal.';
  end if;

  select u.id into v_student from auth.users u where lower(u.email) = lower(btrim(p_email));
  if v_student is null then
    raise exception 'No MySkills account uses that email. Ask the student to sign up first, then add them.';
  end if;
  if v_student = auth.uid() then
    raise exception 'That is your own account.';
  end if;

  insert into public.community_engagements (resource, student_id, provider_id, created_by)
  values (p_resource, v_student, auth.uid(), auth.uid())
  on conflict (resource, student_id, provider_id) where status = 'active' do nothing;
end;
$$;
revoke execute on function public.add_community_student(text, text) from public, anon;
grant execute on function public.add_community_student(text, text) to authenticated;

-- Mark a student as finished (the provider, or an admin).
create or replace function public.end_community_engagement(p_engagement uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.community_engagements
     set status = 'ended', ended_on = current_date
   where id = p_engagement and status = 'active'
     and (provider_id = auth.uid() or public.is_admin());
  if not found then
    raise exception 'That student isn''t on your active list.';
  end if;
end;
$$;
revoke execute on function public.end_community_engagement(uuid) from public, anon;
grant execute on function public.end_community_engagement(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Admin: grant and revoke access
-- ---------------------------------------------------------------------------
create or replace function public.admin_grant_community_access(p_email text, p_resource text, p_organisation text default null)
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
  if p_resource not in ('wellness', 'guidance', 'internships', 'institutions') then
    raise exception 'Unknown resource. Mentors get access by being linked to a mentor listing.';
  end if;
  if p_resource in ('internships', 'institutions') and coalesce(btrim(p_organisation), '') = '' then
    raise exception 'Say which company or institution this account is for.';
  end if;

  select u.id into v_user from auth.users u where lower(u.email) = lower(btrim(p_email));
  if v_user is null then
    raise exception 'No account uses that email. Ask them to request access at the Community portal sign-up (myskills.org.in/community-portal/signup), then approve them in Portal access & usage.';
  end if;

  insert into public.community_access (user_id, resource, organisation, granted_by)
  values (v_user, p_resource, nullif(btrim(p_organisation), ''), auth.uid())
  on conflict (user_id, resource) do update set organisation = excluded.organisation;
end;
$$;
revoke execute on function public.admin_grant_community_access(text, text, text) from public, anon;
grant execute on function public.admin_grant_community_access(text, text, text) to authenticated;

create or replace function public.admin_revoke_community_access(p_user uuid, p_resource text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_section_access('portal-access') then
    raise exception 'Not authorised.';
  end if;
  -- Their students stay on record (ended), so the usage history survives.
  update public.community_engagements
     set status = 'ended', ended_on = current_date
   where provider_id = p_user and resource = p_resource and status = 'active';
  delete from public.community_access where user_id = p_user and resource = p_resource;
end;
$$;
revoke execute on function public.admin_revoke_community_access(uuid, text) from public, anon;
grant execute on function public.admin_revoke_community_access(uuid, text) to authenticated;

create or replace function public.admin_community_access()
returns table (
  user_id      uuid,
  email        text,
  full_name    text,
  resource     text,
  organisation text,
  created_at   timestamptz,
  active       int,
  sessions     int
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
           where e.provider_id = a.user_id and e.resource = a.resource)
    from public.community_access a
    left join auth.users u on u.id = a.user_id
    left join public.profiles p on p.id = a.user_id
   order by a.resource, a.created_at;
end;
$$;
revoke execute on function public.admin_community_access() from public, anon;
grant execute on function public.admin_community_access() to authenticated;

-- ---------------------------------------------------------------------------
-- Admin: assign a support request to a counsellor or career guide
-- ---------------------------------------------------------------------------
create or replace function public.admin_assign_support_request(p_request uuid, p_provider uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.wellness_requests;
  v_resource text;
begin
  if not (public.is_admin() or public.has_section_access('wellness')) then
    raise exception 'Not authorised.';
  end if;
  select * into r from public.wellness_requests where id = p_request;
  if r.id is null then
    raise exception 'That request no longer exists.';
  end if;
  v_resource := case r.type when 'psychologist' then 'wellness' else 'guidance' end;

  if not exists (select 1 from public.community_access a
                  where a.user_id = p_provider and a.resource = v_resource) then
    raise exception 'That person doesn''t have % access in the Community portal.',
      case v_resource when 'wellness' then 'Wellness' else 'Career Guidance' end;
  end if;

  insert into public.community_engagements (resource, student_id, provider_id, request_id, created_by)
  values (v_resource, r.requested_by, p_provider, r.id, auth.uid())
  on conflict (resource, student_id, provider_id) where status = 'active' do nothing;

  update public.wellness_requests
     set status = 'contacted', contacted_at = coalesce(contacted_at, now()), contacted_by = coalesce(contacted_by, auth.uid())
   where id = p_request and status = 'pending';
end;
$$;
revoke execute on function public.admin_assign_support_request(uuid, uuid) from public, anon;
grant execute on function public.admin_assign_support_request(uuid, uuid) to authenticated;

-- The counsellors and career guides a request can be handed to, and who (if
-- anyone) each request has already gone to. For admins and Wellness staff.
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
   where a.resource in ('wellness', 'guidance')
   order by p.full_name nulls last;
end;
$$;
revoke execute on function public.support_providers() from public, anon;
grant execute on function public.support_providers() to authenticated;

create or replace function public.support_request_assignments()
returns table (request_id uuid, provider_id uuid, provider_name text)
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
  select e.request_id, e.provider_id, coalesce(p.full_name, u.email::text)
    from public.community_engagements e
    left join public.profiles p on p.id = e.provider_id
    left join auth.users u on u.id = e.provider_id
   where e.request_id is not null;
end;
$$;
revoke execute on function public.support_request_assignments() from public, anon;
grant execute on function public.support_request_assignments() to authenticated;

-- ---------------------------------------------------------------------------
-- Admin: which Community resources is each student using?
-- One row per student who is using at least one. Counts and names only.
-- ---------------------------------------------------------------------------
create or replace function public.admin_community_usage()
returns table (
  student_id        uuid,
  full_name         text,
  email             text,
  mentors           text,
  mentor_sessions   int,
  wellness_active   boolean,
  wellness_sessions int,
  guidance_active   boolean,
  guidance_sessions int,
  internship        text,
  institution       text
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
  with students as (
    select mm.student_id as id from public.mentor_matches mm where mm.status = 'active'
    union
    select e.student_id from public.community_engagements e
  )
  select s.id, p.full_name, u.email::text,
         (select string_agg(distinct m.full_name, ', ')
            from public.mentor_matches mm join public.mentors m on m.id = mm.mentor_id
           where mm.student_id = s.id and mm.status = 'active'),
         (select count(*)::int from public.live_session_attendance l
           where l.student_id = s.id and l.host_kind = 'mentor'),
         exists (select 1 from public.community_engagements e
                  where e.student_id = s.id and e.resource = 'wellness' and e.status = 'active'),
         (select count(*)::int from public.community_sessions cs
            join public.community_engagements e on e.id = cs.engagement_id
           where e.student_id = s.id and e.resource = 'wellness'),
         exists (select 1 from public.community_engagements e
                  where e.student_id = s.id and e.resource = 'guidance' and e.status = 'active'),
         (select count(*)::int from public.community_sessions cs
            join public.community_engagements e on e.id = cs.engagement_id
           where e.student_id = s.id and e.resource = 'guidance'),
         (select string_agg(distinct coalesce(a.organisation, 'A partner company'), ', ')
            from public.community_engagements e
            left join public.community_access a on a.user_id = e.provider_id and a.resource = e.resource
           where e.student_id = s.id and e.resource = 'internships' and e.status = 'active'),
         (select string_agg(distinct coalesce(a.organisation, 'A partner institution'), ', ')
            from public.community_engagements e
            left join public.community_access a on a.user_id = e.provider_id and a.resource = e.resource
           where e.student_id = s.id and e.resource = 'institutions' and e.status = 'active')
    from students s
    left join public.profiles p on p.id = s.id
    left join auth.users u on u.id = s.id
   order by p.full_name nulls last;
end;
$$;
revoke execute on function public.admin_community_usage() from public, anon;
grant execute on function public.admin_community_usage() to authenticated;

-- ---------------------------------------------------------------------------
-- By hand, until you use the Admin screen:
--   select public.admin_grant_community_access('counsellor@example.com', 'wellness');
--   select public.admin_grant_community_access('hr@acme.com', 'internships', 'Acme Digital');
-- (run those while signed in as an admin in the app, or grant from Admin >
--  Community > Portal access)
-- ---------------------------------------------------------------------------
