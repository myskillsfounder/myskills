-- Admin, tidied: internships get one section and one list of companies, and
-- Global Leadership leads get a section of their own.
--
-- 1. A new team section, 'leads', for Global Leadership leads. Until now the
--    same section ('partner-leads') opened those AND everything internships.
--    'partner-leads' stays the internships section (shown as "Internships"),
--    so nothing about internships changes. EVERYONE WHO HAS 'partner-leads'
--    IS GIVEN 'leads' TOO, so nobody loses anything; a full admin can take
--    either away under Team & access afterwards.
--
-- 2. admin_internship_companies(): every company, however it arrived: the
--    ones that filled in "post internships with MySkills", the ones that
--    signed up in the Community portal (waiting to be verified, or turned
--    down), and the ones in the portal now, with their roles, applicants and
--    interns. Matched on email. For Admin > Internships > Companies.
--
-- Nothing here changes what students or partners see, or any score.
--
-- RUN THIS BEFORE THE DEPLOY. The new admin pages ask for the 'leads'
-- section; run after, a team member's Global Leadership leads page would be
-- closed to them until it is. (Full admins are never affected.) Safe to re-run.
-- Depends on: docs/supabase-admin-team.sql, -admin-team-role.sql,
-- -inbox-internships.sql, -career-readiness-leads.sql, -internships.sql,
-- -portal-signup.sql, -partner-profiles.sql.

-- ---------------------------------------------------------------------------
-- 1. The 'leads' section
-- ---------------------------------------------------------------------------
alter table public.staff_permissions drop constraint if exists staff_permissions_section_check;
alter table public.staff_permissions add constraint staff_permissions_section_check
  check (section in (
    'users', 'assessment', 'certificates', 'feedback',
    'mentors', 'institution-partners', 'demo-requests', 'blog', 'ads', 'wellness',
    'verification', 'mentor-reviews',
    'overview', 'portal-access', 'partner-leads', 'leads'
  ));

-- The two functions that list every section (what a full admin has, and what
-- may be given): 'leads' added, each otherwise exactly as it is live.
do $$
declare
  f record;
  d text;
  n text;
begin
  for f in
    select p.oid from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public' and p.proname in ('my_staff_sections', 'admin_set_staff_access')
  loop
    d := pg_get_functiondef(f.oid);
    if d not like '%''partner-leads'', ''leads''%' then
      n := replace(d, '''portal-access'', ''partner-leads''', '''portal-access'', ''partner-leads'', ''leads''');
      if n <> d then
        execute n;
      end if;
    end if;
  end loop;
end $$;

-- Whoever could open Global Leadership leads still can.
insert into public.staff_permissions (user_id, section)
select sp.user_id, 'leads' from public.staff_permissions sp where sp.section = 'partner-leads'
on conflict (user_id, section) do nothing;

-- The Global Leadership leads table follows its new section.
drop policy if exists "admins read leads" on public.career_readiness_leads;
create policy "admins read leads"
  on public.career_readiness_leads for select
  to authenticated
  using (public.has_section_access('leads'));

drop policy if exists "admins update leads" on public.career_readiness_leads;
create policy "admins update leads"
  on public.career_readiness_leads for update
  to authenticated
  using (public.has_section_access('leads'))
  with check (public.has_section_access('leads'));

-- And so does its line in the Inbox; the function otherwise exactly as it is live.
do $$
declare
  f record;
  d text;
  n text;
begin
  for f in
    select p.oid from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public' and p.proname = 'admin_inbox'
  loop
    d := pg_get_functiondef(f.oid);
    n := regexp_replace(
      d,
      '(career_readiness_leads l\s+where not l\.contacted and public\.has_section_access\()''partner-leads''',
      '\1''leads''');
    if n <> d then
      execute n;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Every company, in one list
-- ---------------------------------------------------------------------------
create or replace function public.admin_internship_companies()
returns table (
  key text,
  -- interested: filled in the form, not in the portal. signed_up: asked for the
  -- portal, waiting to be verified. in_portal: can post roles. turned_down: the
  -- sign-up was refused. removed: was verified, access since taken away.
  stage text,
  organisation text, contact_name text, email text, phone text, city text,
  -- What they wrote: the roles they offer (the form) or their sign-up message.
  note text,
  since timestamptz,
  lead_id uuid, contacted boolean, contacted_at timestamptz,
  request_id uuid, user_id uuid, has_account boolean,
  about text, website text,
  roles_live int, roles_pending int, applicants_waiting int, interns_now int, internships_confirmed int
)
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
  with accounts as (
    -- Every account that is, or asked to be, a company in the portal.
    select u.id as uid, lower(u.email::text) as em, u.email::text as email_shown,
           c.user_id is not null as in_portal, c.organisation as access_org, c.created_at as access_at,
           pr.id as req_id, pr.status as req_status, pr.organisation as req_org, pr.phone as req_phone,
           pr.message as req_msg, pr.created_at as req_at
      from auth.users u
      left join public.community_access c
        on c.user_id = u.id and c.resource = 'internships' and not coalesce(c.sees_all, false)
      left join public.portal_requests pr on pr.user_id = u.id and pr.role = 'internships'
     where c.user_id is not null or pr.id is not null
  ),
  leads as (
    select l.*, lower(btrim(l.email)) as em from public.internship_partner_leads l
  ),
  joined as (
    select a.*, l.id as l_id, l.company, l.contact_name as l_contact, l.email as l_email, l.phone as l_phone,
           l.city as l_city, l.roles_offered, l.created_at as l_at, l.contacted as l_contacted,
           l.contacted_at as l_contacted_at, coalesce(a.em, l.em) as any_em
      from accounts a
      full outer join leads l on l.em = a.em
  )
  select coalesce(j.uid::text, j.l_id::text),
         case
           when j.in_portal then 'in_portal'
           when j.req_status = 'pending' then 'signed_up'
           when j.req_status = 'rejected' then 'turned_down'
           when j.req_status = 'approved' then 'removed'
           else 'interested'
         end,
         coalesce(nullif(btrim(j.access_org), ''), nullif(btrim(j.req_org), ''), nullif(btrim(pp.display_name), ''),
                  j.company, 'A company'),
         coalesce(nullif(btrim(pp.contact_name), ''), j.l_contact, nullif(btrim(pf.full_name), '')),
         coalesce(j.email_shown, j.l_email),
         coalesce(nullif(btrim(pp.phone), ''), j.req_phone, j.l_phone),
         coalesce(nullif(btrim(pp.city), ''), j.l_city),
         coalesce(j.roles_offered, j.req_msg),
         -- When they first came: LEAST skips the dates that aren't there.
         least(j.l_at, j.req_at, j.access_at),
         j.l_id, j.l_contacted, j.l_contacted_at,
         j.req_id, j.uid,
         j.uid is not null or exists (select 1 from auth.users x where lower(x.email) = j.any_em),
         pp.about, pp.website,
         (select count(*)::int from public.internship_roles r
           where r.provider_id = j.uid and r.status = 'live' and (r.apply_by is null or r.apply_by >= current_date)),
         (select count(*)::int from public.internship_roles r where r.provider_id = j.uid and r.status = 'pending'),
         (select count(*)::int from public.internship_applications ia join public.internship_roles r on r.id = ia.role_id
           where r.provider_id = j.uid and ia.status = 'applied'),
         (select count(*)::int from public.internship_applications ia join public.internship_roles r on r.id = ia.role_id
           where r.provider_id = j.uid and ia.status in ('accepted', 'signoff_pending')),
         (select count(*)::int from public.internship_applications ia join public.internship_roles r on r.id = ia.role_id
           where r.provider_id = j.uid and ia.status = 'completed')
    from joined j
    left join public.partner_profiles pp on pp.user_id = j.uid
    left join public.profiles pf on pf.id = j.uid
   order by case
              when j.req_status = 'pending' and not coalesce(j.in_portal, false) then 0
              when j.uid is null and not coalesce(j.l_contacted, false) then 1
              when j.in_portal then 2
              else 3
            end,
            least(j.l_at, j.req_at, j.access_at) desc;
end;
$$;
revoke execute on function public.admin_internship_companies() from public, anon;
grant execute on function public.admin_internship_companies() to authenticated;

-- Check 1: who now has 'leads' (everyone who has 'partner-leads').
select u.email, array_agg(sp.section order by sp.section) as sections
  from public.staff_permissions sp join auth.users u on u.id = sp.user_id
 where sp.section in ('partner-leads', 'leads')
 group by u.email order by 1;

-- Check 2: the companies function is there. (It answers only a signed-in
-- team member, so it can't be tried from the SQL editor; open Admin >
-- Internships > Companies instead.)
select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and proname = 'admin_internship_companies';
