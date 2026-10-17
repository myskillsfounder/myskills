-- The team's view of the whole internship flow, in admin.
--
-- 1. admin_internship_pipeline(p_student): every application across every
--    company's roles, with where it stands and how long it has waited, for
--    Admin > Internship roles. With p_student, one student's own, for their
--    page under All students.
-- 2. admin_internship_overview(): the numbers for the Dashboard: companies
--    interested (from "post internships with MySkills"), roles, applications,
--    interns and confirmed internships.
-- 3. admin_student_connections(p_student): which counsellors, guides,
--    companies and institutions a student is with, or was, or has been asked
--    by. For the student's page.
-- 4. admin_internship_lead_status(): for each company that filled in "post
--    internships with MySkills", whether that email has an account, has asked
--    for the portal, and is in it. For Admin > Internship companies.
--
-- All read-only; nothing here changes what students or partners see, or the
-- Global Readiness Score.
--
-- Run in the Supabase SQL editor; either order with the deploy (each admin
-- page works without it, with less on it). Safe to re-run: run it again
-- after it changes (the companies were added to the Dashboard numbers).
-- Depends on: docs/supabase-internships.sql, docs/supabase-community-portal.sql,
-- docs/supabase-community-consent.sql, docs/supabase-portal-signup.sql,
-- docs/supabase-staff-permissions.sql (has_section_access).

-- ---------------------------------------------------------------------------
-- 1. Every application, or one student's
-- ---------------------------------------------------------------------------
create or replace function public.admin_internship_pipeline(p_student uuid default null)
returns table (
  id uuid, role_id uuid, role_title text, organisation text, duration_weeks int, status text,
  applied_on date, updated_at timestamptz, started_on date, ended_on date, supervisor_name text,
  student_id uuid, student_name text, student_email text, score int
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  -- Whoever handles internships sees all of them; whoever can open a student's
  -- page sees that student's.
  if not (public.has_section_access('partner-leads')
          or (p_student is not null and public.has_section_access('users'))) then
    raise exception 'Not authorised.';
  end if;
  return query
  select a.id, r.id, r.title, coalesce(nullif(btrim(c.organisation), ''), 'A partner company'), r.duration_weeks,
         a.status, a.created_at::date, a.updated_at, a.started_on, a.ended_on, a.supervisor_name,
         a.student_id, p.full_name, u.email::text,
         (select s.score::int from public.career_readiness_scores s where s.user_id = a.student_id)
    from public.internship_applications a
    join public.internship_roles r on r.id = a.role_id
    left join public.community_access c on c.user_id = r.provider_id and c.resource = 'internships'
    left join public.profiles p on p.id = a.student_id
    left join auth.users u on u.id = a.student_id
   where p_student is null or a.student_id = p_student
   order by a.updated_at desc;
end;
$$;
revoke execute on function public.admin_internship_pipeline(uuid) from public, anon;
grant execute on function public.admin_internship_pipeline(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. The Dashboard's internship numbers
-- ---------------------------------------------------------------------------
create or replace function public.admin_internship_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not (public.has_section_access('overview') or public.has_section_access('partner-leads')) then
    raise exception 'Not authorised.';
  end if;
  return jsonb_build_object(
    -- Companies that filled in "post internships with MySkills": all, not yet
    -- contacted, and already in the portal; and the newest one.
    'companies_interested', (select count(*) from public.internship_partner_leads),
    'companies_new', (select count(*) from public.internship_partner_leads l where not l.contacted),
    'companies_in_portal', (select count(*) from public.internship_partner_leads l
                             join auth.users u on lower(u.email) = lower(btrim(l.email))
                             join public.community_access c on c.user_id = u.id and c.resource = 'internships'
                                  and not coalesce(c.sees_all, false)),
    'newest_company', (select l.company from public.internship_partner_leads l order by l.created_at desc limit 1),
    'newest_company_at', (select l.created_at from public.internship_partner_leads l order by l.created_at desc limit 1),
    -- Live and still taking applications (students stop seeing a role after its apply-by date).
    'roles_live', (select count(*) from public.internship_roles r
                    where r.status = 'live' and (r.apply_by is null or r.apply_by >= current_date)),
    'roles_pending', (select count(*) from public.internship_roles r where r.status = 'pending'),
    'companies_posting', (select count(distinct r.provider_id) from public.internship_roles r
                           where r.status = 'live' and (r.apply_by is null or r.apply_by >= current_date)),
    'applications', (select count(*) from public.internship_applications a where a.status <> 'withdrawn'),
    'applications_30d', (select count(*) from public.internship_applications a
                          where a.status <> 'withdrawn' and a.created_at >= now() - interval '30 days'),
    'students_applied', (select count(distinct a.student_id) from public.internship_applications a),
    -- Applied a week ago or more and the company hasn't looked.
    'waiting_on_company', (select count(*) from public.internship_applications a
                            where a.status = 'applied' and a.created_at < now() - interval '7 days'),
    'offers_waiting', (select count(*) from public.internship_applications a where a.status = 'offered'),
    'interns_now', (select count(*) from public.internship_applications a where a.status in ('accepted', 'signoff_pending')),
    'signoffs_pending', (select count(*) from public.internship_applications a where a.status = 'signoff_pending'),
    'confirmed', (select count(*) from public.internship_signoffs),
    'students_confirmed', (select count(distinct s.student_id) from public.internship_signoffs s),
    -- The funnel: students at each stage, ever.
    'funnel_offered', (select count(distinct a.student_id) from public.internship_applications a
                        where a.status in ('offered', 'accepted', 'signoff_pending', 'completed')),
    'funnel_interned', (select count(distinct a.student_id) from public.internship_applications a
                         where a.status in ('accepted', 'signoff_pending', 'completed'))
  );
end;
$$;
revoke execute on function public.admin_internship_overview() from public, anon;
grant execute on function public.admin_internship_overview() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Who a student is with
-- ---------------------------------------------------------------------------
create or replace function public.admin_student_connections(p_student uuid)
returns table (
  id uuid, resource text, partner text, status text, started_on date, ended_on date, asked_on date
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('users') then
    raise exception 'Not authorised.';
  end if;
  return query
  select e.id, e.resource,
         coalesce(nullif(btrim(a.organisation), ''), nullif(btrim(p.full_name), ''), u.email::text, 'A partner'),
         e.status, e.started_on, e.ended_on, e.created_at::date
    from public.community_engagements e
    left join public.community_access a on a.user_id = e.provider_id and a.resource = e.resource
    left join public.profiles p on p.id = e.provider_id
    left join auth.users u on u.id = e.provider_id
   where e.student_id = p_student
      -- A company or institution's request finds the student by email until they answer.
      or (e.status in ('invited', 'declined') and e.invited_email = (select lower(x.email) from auth.users x where x.id = p_student))
   order by (e.status = 'active') desc, e.created_at desc;
end;
$$;
revoke execute on function public.admin_student_connections(uuid) from public, anon;
grant execute on function public.admin_student_connections(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Where each interested company stands with the portal
-- ---------------------------------------------------------------------------
create or replace function public.admin_internship_lead_status()
returns table (lead_id uuid, has_account boolean, request_status text, in_portal boolean)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('partner-leads') then
    raise exception 'Not authorised.';
  end if;
  return query
  select l.id,
         u.id is not null,
         (select pr.status from public.portal_requests pr where pr.user_id = u.id),
         exists (select 1 from public.community_access c
                  where c.user_id = u.id and c.resource = 'internships' and not coalesce(c.sees_all, false))
    from public.internship_partner_leads l
    left join auth.users u on lower(u.email) = lower(btrim(l.email));
end;
$$;
revoke execute on function public.admin_internship_lead_status() from public, anon;
grant execute on function public.admin_internship_lead_status() to authenticated;

-- Check: the four functions are there.
select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and proname in ('admin_internship_pipeline', 'admin_internship_overview',
                   'admin_student_connections', 'admin_internship_lead_status')
 order by 1;
