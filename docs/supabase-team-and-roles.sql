-- The team, run from the admin panel: founder@myskills.org.in as the super
-- admin, named roles, and team members added by email before they even have
-- an account.
--
-- 1. founder@myskills.org.in becomes a full admin (super admin). Its main job
--    is Team & roles: adding the internal team and deciding what each can open.
--    myskillsfounder@gmail.com stays a full admin for now, so nobody is locked
--    out; step 6 (commented) removes it once founder has signed in and you're happy.
--
-- 2. ROLES: a named set of sections (staff_roles), e.g. "Operations". Seeded
--    with the four starting points the page already offered. Changing a role's
--    sections changes them for everyone who has that role.
--
-- 3. TEAM MEMBERS (staff_members): one row per @myskills.org.in email, with a
--    role, or a custom set of sections. An email can be added BEFORE that person
--    has an account: their access starts the moment they sign up with it.
--
--    staff_permissions stays what every admin check reads; this keeps it in
--    step with each member's role. Nothing else changes.
--
-- 4. Everyone already on the team (admin1@myskills.org.in, ...) is carried over
--    as a member with exactly the sections they have now, under a role when
--    their sections match one exactly.
--
-- Run once in the Supabase SQL editor; either order with the deploy (the old
-- Team & access page keeps working until the new one is deployed). Safe to re-run.
-- Depends on: docs/supabase-mentor-onboarding.sql (admins, is_admin),
-- -staff-permissions.sql, -admin-team.sql, -admin-team-role.sql, -admin-tidy.sql.

-- ---------------------------------------------------------------------------
-- 0. Every section that can be given, in one place
-- ---------------------------------------------------------------------------
create or replace function public.staff_sections_all()
returns text[]
language sql
immutable
as $$
  select array[
    'overview', 'users', 'verification', 'mentor-reviews', 'certificates', 'assessment',
    'partner-leads', 'portal-access', 'mentors', 'wellness', 'institution-partners',
    'demo-requests', 'leads', 'blog', 'ads', 'feedback'
  ]::text[];
$$;

-- ---------------------------------------------------------------------------
-- 1. founder@myskills.org.in is the super admin
-- ---------------------------------------------------------------------------
insert into public.admins (user_id)
select u.id from auth.users u where lower(u.email) = 'founder@myskills.org.in'
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Roles
-- ---------------------------------------------------------------------------
create table if not exists public.staff_roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (length(btrim(name)) between 2 and 40),
  description text check (length(description) <= 200),
  sections    text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.staff_roles enable row level security;

insert into public.staff_roles (name, description, sections) values
  ('Operations', 'Day-to-day: students, verification, partners, internships, leads, blog and feedback',
   array['overview', 'users', 'verification', 'portal-access', 'partner-leads', 'leads', 'demo-requests', 'blog', 'feedback']),
  ('Programmes', 'Grading and content: students, projects, certificates, foundation questions',
   array['overview', 'users', 'mentor-reviews', 'certificates', 'assessment']),
  ('Content', 'The site only: blog, ads and feedback',
   array['blog', 'ads', 'feedback']),
  ('Everything', 'Every section (still not a full admin: can''t manage the team)',
   public.staff_sections_all())
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Team members, by email
-- ---------------------------------------------------------------------------
create table if not exists public.staff_members (
  email      text primary key check (email = lower(btrim(email)) and email like '%@myskills.org.in'),
  -- A role, or null for a custom set of sections (below).
  role_id    uuid references public.staff_roles (id) on delete set null,
  sections   text[] not null default '{}',
  added_by   uuid references auth.users (id),
  added_at   timestamptz not null default now()
);
alter table public.staff_members enable row level security;

-- What a member can open: their role's sections, or their own.
create or replace function public.staff_member_sections(p_email text)
returns text[]
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(r.sections, m.sections, '{}'::text[])
    from public.staff_members m
    left join public.staff_roles r on r.id = m.role_id
   where m.email = lower(btrim(p_email));
$$;
revoke execute on function public.staff_member_sections(text) from public, anon, authenticated;

-- Write a member's sections into staff_permissions, if they have an account.
create or replace function public.sync_staff_member(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_sections text[];
begin
  select u.id into v_user from auth.users u where lower(u.email) = lower(btrim(p_email));
  if v_user is null then
    return;
  end if;
  v_sections := coalesce(public.staff_member_sections(p_email), '{}'::text[]);
  delete from public.staff_permissions sp where sp.user_id = v_user and not (sp.section = any (v_sections));
  insert into public.staff_permissions (user_id, section)
  select v_user, s from unnest(v_sections) as s
  on conflict (user_id, section) do nothing;
end;
$$;
revoke execute on function public.sync_staff_member(text) from public, anon, authenticated;

-- An email added before its account existed: access starts at sign-up.
create or replace function public.apply_staff_member_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.staff_members m where m.email = lower(new.email)) then
    perform public.sync_staff_member(new.email);
  end if;
  return new;
exception when others then
  -- Never block a sign-up over team access.
  return new;
end;
$$;
drop trigger if exists staff_member_on_signup on auth.users;
create trigger staff_member_on_signup
  after insert on auth.users
  for each row execute function public.apply_staff_member_on_signup();

-- ---------------------------------------------------------------------------
-- 4. Carry over everyone already on the team
-- ---------------------------------------------------------------------------
insert into public.staff_members (email, role_id, sections)
select lower(u.email),
       (select r.id from public.staff_roles r
         where (select array_agg(x order by x) from unnest(r.sections) x) = t.secs
         limit 1),
       t.secs
  from (select sp.user_id, array_agg(sp.section order by sp.section) as secs
          from public.staff_permissions sp group by sp.user_id) t
  join auth.users u on u.id = t.user_id
 where lower(u.email) like '%@myskills.org.in'
on conflict (email) do nothing;

-- ---------------------------------------------------------------------------
-- 5. What the Team & roles page calls (full admins only)
-- ---------------------------------------------------------------------------
create or replace function public.admin_staff_roles()
returns table (id uuid, name text, description text, sections text[], members int)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Only a full admin can see the roles.';
  end if;
  return query
  select r.id, r.name, r.description, r.sections,
         (select count(*)::int from public.staff_members m where m.role_id = r.id)
    from public.staff_roles r
   order by r.name;
end;
$$;
revoke execute on function public.admin_staff_roles() from public, anon;
grant execute on function public.admin_staff_roles() to authenticated;

-- Create a role (p_id null) or change one; everyone with it follows.
create or replace function public.admin_save_staff_role(p_id uuid, p_name text, p_description text, p_sections text[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := p_id;
  v_sections text[];
  m record;
begin
  if not public.is_admin() then
    raise exception 'Only a full admin can change roles.';
  end if;
  select coalesce(array_agg(distinct s), '{}'::text[]) into v_sections
    from unnest(coalesce(p_sections, '{}'::text[])) s;
  if exists (select 1 from unnest(v_sections) s where not (s = any (public.staff_sections_all()))) then
    raise exception 'That list has a section that doesn''t exist.';
  end if;
  if cardinality(v_sections) = 0 then
    raise exception 'Choose at least one section for the role.';
  end if;
  if length(btrim(coalesce(p_name, ''))) < 2 then
    raise exception 'Give the role a name.';
  end if;

  if v_id is null then
    insert into public.staff_roles (name, description, sections)
    values (btrim(p_name), nullif(btrim(coalesce(p_description, '')), ''), v_sections)
    returning id into v_id;
  else
    update public.staff_roles
       set name = btrim(p_name), description = nullif(btrim(coalesce(p_description, '')), ''),
           sections = v_sections, updated_at = now()
     where id = v_id;
    if not found then
      raise exception 'That role no longer exists.';
    end if;
    for m in select email from public.staff_members where role_id = v_id loop
      perform public.sync_staff_member(m.email);
    end loop;
  end if;
  return v_id;
exception when unique_violation then
  raise exception 'There is already a role called %.', btrim(p_name);
end;
$$;
revoke execute on function public.admin_save_staff_role(uuid, text, text, text[]) from public, anon;
grant execute on function public.admin_save_staff_role(uuid, text, text, text[]) to authenticated;

-- Delete a role. Its members keep exactly what they had, as their own sections.
create or replace function public.admin_delete_staff_role(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only a full admin can change roles.';
  end if;
  update public.staff_members m
     set sections = r.sections, role_id = null
    from public.staff_roles r
   where r.id = p_id and m.role_id = p_id;
  delete from public.staff_roles where id = p_id;
end;
$$;
revoke execute on function public.admin_delete_staff_role(uuid) from public, anon;
grant execute on function public.admin_delete_staff_role(uuid) to authenticated;

-- Every full admin and team member, including emails with no account yet.
create or replace function public.admin_team_members()
returns table (
  email text, user_id uuid, full_name text, is_admin boolean, has_account boolean,
  role_id uuid, role_name text, sections text[], last_sign_in_at timestamptz, added_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Only a full admin can see the team.';
  end if;
  return query
  select lower(u.email::text), u.id,
         coalesce(p.full_name, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')::text,
         true, true, null::uuid, null::text, public.staff_sections_all(), u.last_sign_in_at, a.created_at
    from public.admins a
    join auth.users u on u.id = a.user_id
    left join public.profiles p on p.id = u.id
  union all
  select m.email, u.id,
         coalesce(p.full_name, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')::text,
         false, u.id is not null, m.role_id, r.name,
         coalesce(r.sections, m.sections), u.last_sign_in_at, m.added_at
    from public.staff_members m
    left join public.staff_roles r on r.id = m.role_id
    left join auth.users u on lower(u.email) = m.email
    left join public.profiles p on p.id = u.id
   where not exists (select 1 from public.admins a where a.user_id = u.id)
   order by 4 desc, 10;
end;
$$;
revoke execute on function public.admin_team_members() from public, anon;
grant execute on function public.admin_team_members() to authenticated;

-- Add a member, or change one: a role (p_role), or their own sections (p_role null).
create or replace function public.admin_set_team_member(p_email text, p_role uuid, p_sections text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_sections text[];
begin
  if not public.is_admin() then
    raise exception 'Only a full admin can change the team.';
  end if;
  if v_email !~ '^[^@\s]+@myskills\.org\.in$' then
    raise exception 'Team members need an @myskills.org.in email.';
  end if;
  if exists (select 1 from public.admins a join auth.users u on u.id = a.user_id where lower(u.email) = v_email) then
    raise exception '% is a full admin and already has everything.', v_email;
  end if;
  if p_role is not null and not exists (select 1 from public.staff_roles r where r.id = p_role) then
    raise exception 'That role no longer exists.';
  end if;
  select coalesce(array_agg(distinct s), '{}'::text[]) into v_sections
    from unnest(coalesce(p_sections, '{}'::text[])) s;
  if exists (select 1 from unnest(v_sections) s where not (s = any (public.staff_sections_all()))) then
    raise exception 'That list has a section that doesn''t exist.';
  end if;
  if p_role is null and cardinality(v_sections) = 0 then
    raise exception 'Choose a role, or at least one section.';
  end if;

  insert into public.staff_members (email, role_id, sections, added_by)
  values (v_email, p_role, case when p_role is null then v_sections else '{}'::text[] end, auth.uid())
  on conflict (email) do update
    set role_id = excluded.role_id, sections = excluded.sections;
  perform public.sync_staff_member(v_email);
end;
$$;
revoke execute on function public.admin_set_team_member(text, uuid, text[]) from public, anon;
grant execute on function public.admin_set_team_member(text, uuid, text[]) to authenticated;

-- Take someone off the team: they can no longer open the admin panel.
create or replace function public.admin_remove_team_member(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if not public.is_admin() then
    raise exception 'Only a full admin can change the team.';
  end if;
  delete from public.staff_members where email = v_email;
  delete from public.staff_permissions sp
   using auth.users u
   where u.id = sp.user_id and lower(u.email) = v_email;
end;
$$;
revoke execute on function public.admin_remove_team_member(text) from public, anon;
grant execute on function public.admin_remove_team_member(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. LATER, by hand: once founder@myskills.org.in has signed in to /admin and
--    you're happy, take full admin away from the public Gmail. Uncomment and run:
-- delete from public.admins a using auth.users u
--  where u.id = a.user_id and lower(u.email) = 'myskillsfounder@gmail.com';
-- ---------------------------------------------------------------------------

-- Check: the full admins, the roles, and the team.
select 'Full admin' as kind, u.email as who, null as detail
  from public.admins a join auth.users u on u.id = a.user_id
union all
select 'Role', r.name, array_to_string(r.sections, ', ') from public.staff_roles r
union all
select 'Team member', m.email, coalesce(r.name, 'custom: ' || array_to_string(m.sections, ', '))
  from public.staff_members m left join public.staff_roles r on r.id = m.role_id
order by 1, 2;
