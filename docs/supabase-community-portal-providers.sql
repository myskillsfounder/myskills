-- Community portal overview: the people and organisations, not only the students.
--
-- An overview account (a "sees everything" grant) already lists the students
-- working with each resource. This adds the other half: WHO they are working
-- with — every mentor, counsellor, career guide, company and institution, with
-- their status and how many students are active with each. Without it a
-- section with no active students looks empty even when mentors exist.
--
-- Read-only, and only for accounts with the overview grant for that resource.
-- Shows names, status and counts. Nothing about what was discussed.
--
-- Run once, after docs/supabase-community-portal-overview.sql. Safe to re-run.
-- Until it is run the portal works as before; the provider lists just don't
-- appear above the students.

-- ---------------------------------------------------------------------------
-- Mentors: every listing, linked or not
-- ---------------------------------------------------------------------------
create or replace function public.community_mentors()
returns table (
  id          uuid,
  full_name   text,
  headline    text,
  expertise   text[],
  avatar_url  text,
  -- Has an account linked, so they can sign in to the portal.
  linked      boolean,
  -- Profile complete, so students are offered them.
  ready       boolean,
  accepting   boolean,
  active      int,
  waiting     int,
  ended       int,
  sessions    int
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
  select m.id, m.full_name, m.headline, m.expertise, m.avatar_url,
         m.profile_id is not null, m.ready, m.accepting,
         (select count(*)::int from public.mentor_matches mm where mm.mentor_id = m.id and mm.status = 'active'),
         (select count(*)::int from public.mentor_matches mm where mm.mentor_id = m.id and mm.status = 'requested'),
         (select count(*)::int from public.mentor_matches mm where mm.mentor_id = m.id and mm.status = 'ended'),
         (select count(*)::int
            from public.live_session_attendance l
            join public.mentor_matches mm
              on mm.student_id = l.student_id and mm.programme = l.programme and mm.mentor_user = l.recorded_by
           where mm.mentor_id = m.id)
    from public.mentors m
   order by (select count(*) from public.mentor_matches mm where mm.mentor_id = m.id and mm.status = 'active') desc,
            m.sort_order, m.full_name;
end;
$$;
revoke execute on function public.community_mentors() from public, anon;
grant execute on function public.community_mentors() to authenticated;

-- ---------------------------------------------------------------------------
-- Counsellors, career guides, companies, institutions: the accounts given access
-- ---------------------------------------------------------------------------
create or replace function public.community_providers(p_resource text)
returns table (
  user_id      uuid,
  full_name    text,
  email        text,
  organisation text,
  since        date,
  active       int,
  ended        int,
  sessions     int,
  last_session date
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if p_resource not in ('wellness', 'guidance', 'internships', 'institutions') then
    raise exception 'Unknown resource.';
  end if;
  if not exists (select 1 from public.community_access a
                  where a.user_id = auth.uid() and a.resource = p_resource and a.sees_all) then
    raise exception 'You don''t have access to this part of the Community portal.';
  end if;

  return query
  select a.user_id, p.full_name, u.email::text, a.organisation, a.created_at::date,
         (select count(*)::int from public.community_engagements e
           where e.provider_id = a.user_id and e.resource = a.resource and e.status = 'active'),
         (select count(*)::int from public.community_engagements e
           where e.provider_id = a.user_id and e.resource = a.resource and e.status = 'ended'),
         (select count(*)::int from public.community_sessions s
            join public.community_engagements e on e.id = s.engagement_id
           where e.provider_id = a.user_id and e.resource = a.resource),
         (select max(s.held_on) from public.community_sessions s
            join public.community_engagements e on e.id = s.engagement_id
           where e.provider_id = a.user_id and e.resource = a.resource)
    from public.community_access a
    left join auth.users u on u.id = a.user_id
    left join public.profiles p on p.id = a.user_id
   -- Overview accounts are the team, not a provider to list.
   where a.resource = p_resource and not a.sees_all
   order by 6 desc, coalesce(a.organisation, p.full_name, u.email::text);
end;
$$;
revoke execute on function public.community_providers(text) from public, anon;
grant execute on function public.community_providers(text) to authenticated;
