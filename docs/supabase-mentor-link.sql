-- Link a listed mentor to their MySkills account, from the admin panel.
--
-- Approving a mentor application publishes their listing (public.mentors) but
-- leaves mentors.profile_id empty. Until that is set the mentor can't receive
-- requests, doesn't appear in the students' "Find a mentor" list, and has no
-- "My students" page. This replaces the hand-run UPDATE with three functions
-- the Admin -> Mentors page calls.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on: public.mentors, public.mentor_matches
-- (docs/supabase-mentor-matches.sql), public.has_section_access()
-- (docs/supabase-staff-permissions.sql).

-- Every listed mentor with whether (and to whom) they're linked. The email
-- comes from auth.users, so this is a function rather than a client query.
create or replace function public.admin_listed_mentors()
returns table (
  id            uuid,
  full_name     text,
  headline      text,
  expertise     text[],
  created_at    timestamptz,
  linked        boolean,
  account_email text,
  account_name  text
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not public.has_section_access('mentors') then
    raise exception 'not authorized';
  end if;

  return query
  select m.id, m.full_name, m.headline, m.expertise, m.created_at,
         m.profile_id is not null,
         u.email::text,
         p.full_name
    from public.mentors m
    left join auth.users u on u.id = m.profile_id
    left join public.profiles p on p.id = m.profile_id
   order by m.sort_order, m.created_at;
end;
$$;

-- Link a listing to the account with that email.
create or replace function public.link_mentor_account(p_mentor uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current uuid;
  v_user    uuid;
  v_other   text;
begin
  if not public.has_section_access('mentors') then
    raise exception 'not authorized';
  end if;

  select m.profile_id into v_current from public.mentors m where m.id = p_mentor;
  if not found then
    raise exception 'That mentor no longer exists.';
  end if;

  select u.id into v_user from auth.users u where lower(u.email) = lower(btrim(p_email));
  if v_user is null then
    raise exception 'There is no MySkills account with that email. Ask them to sign up first, then try again.';
  end if;
  if not exists (select 1 from public.profiles pr where pr.id = v_user) then
    raise exception 'That account hasn''t finished signing up yet. Ask them to complete onboarding, then try again.';
  end if;

  -- One account, one mentor listing: a second link would make "My students"
  -- and the requests ambiguous.
  select m.full_name into v_other from public.mentors m where m.profile_id = v_user and m.id <> p_mentor;
  if found then
    raise exception 'That account is already linked to %.', v_other;
  end if;

  -- Requests copy the mentor's account when they're made, so moving a listing
  -- to a different account would strand its open students.
  if v_current is not null and v_current <> v_user and exists (
    select 1 from public.mentor_matches mm
     where mm.mentor_id = p_mentor and mm.status in ('requested', 'active')
  ) then
    raise exception 'This mentor has open students. Ask them to end or finish those before changing the account.';
  end if;

  update public.mentors set profile_id = v_user where id = p_mentor;
end;
$$;

-- Take the link off (they stop receiving requests and lose "My students").
create or replace function public.unlink_mentor_account(p_mentor uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_section_access('mentors') then
    raise exception 'not authorized';
  end if;

  if exists (
    select 1 from public.mentor_matches mm
     where mm.mentor_id = p_mentor and mm.status in ('requested', 'active')
  ) then
    raise exception 'This mentor has open students. Ask them to end or finish those before unlinking.';
  end if;

  update public.mentors set profile_id = null where id = p_mentor;
  if not found then
    raise exception 'That mentor no longer exists.';
  end if;
end;
$$;

revoke execute on function public.admin_listed_mentors() from public, anon;
revoke execute on function public.link_mentor_account(uuid, text) from public, anon;
revoke execute on function public.unlink_mentor_account(uuid) from public, anon;
grant execute on function public.admin_listed_mentors() to authenticated;
grant execute on function public.link_mentor_account(uuid, text) to authenticated;
grant execute on function public.unlink_mentor_account(uuid) to authenticated;
