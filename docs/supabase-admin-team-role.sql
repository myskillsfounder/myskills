-- The internal team role: Overview, Portal access & usage, Internships and the
-- leads become sections you can grant one person at a time, and the students
-- list can show who each student is working with.
--
-- Until now those pages were for a full admin only (the account listed in the
-- `admins` table), which meant giving a team member everything — ads,
-- certificates, assessment content — to let them see an overview. They are now
-- three more grantable sections, like Blog or Feedback:
--
--   overview        the Overview page (the numbers across both programmes)
--   portal-access   Community > Portal access & usage: giving partners access
--                   to the Community portal, and seeing which students use what
--   partner-leads   Community > Internships (companies that applied to post
--                   internships) and Leads > Career Readiness leads
--
-- A full admin still passes every check. Grants only work for
-- @myskills.org.in accounts, as before.
--
-- Run once, AFTER docs/supabase-community-portal*.sql. Safe to re-run. At the
-- end it grants admin1@myskills.org.in the team role; edit the email list at
-- the bottom to give it to someone else.
--
-- Run it BEFORE deploying the matching frontend, or right after: the old
-- frontend ignores the new sections, and the new one just hides these pages
-- from anyone who hasn't been granted them.

-- ---------------------------------------------------------------------------
-- 1. The three new section slugs
-- ---------------------------------------------------------------------------
alter table public.staff_permissions drop constraint if exists staff_permissions_section_check;
alter table public.staff_permissions add constraint staff_permissions_section_check
  check (section in (
    'users', 'assessment', 'certificates', 'feedback',
    'mentors', 'institution-partners', 'demo-requests', 'blog', 'ads', 'wellness',
    'verification', 'mentor-reviews',
    'overview', 'portal-access', 'partner-leads'
  ));

create or replace function public.my_staff_sections()
returns text[]
language sql
security definer
set search_path = public
stable
as $$
  select case
    when public.is_admin() then array[
      'users', 'assessment', 'certificates', 'feedback',
      'mentors', 'institution-partners', 'demo-requests', 'blog', 'ads', 'wellness',
      'verification', 'mentor-reviews',
      'overview', 'portal-access', 'partner-leads'
    ]
    else coalesce(
      (select array_agg(sp.section) from public.staff_permissions sp
        join auth.users u on u.id = sp.user_id
       where sp.user_id = auth.uid() and lower(u.email) like '%@myskills.org.in'),
      array[]::text[]
    )
  end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Let those sections through the functions behind each page.
-- The checks were `if not public.is_admin() then`; each becomes a check for the
-- section (which a full admin passes anyway). Done by rewriting the live
-- definition, so nothing else in these functions is touched or needs copying.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  d text;
begin
  for r in
    select * from (values
      ('public.admin_overview_v2()'::text,                                         'overview'),
      ('public.admin_community_access()',                                          'portal-access'),
      ('public.admin_grant_community_access(text, text, text, boolean)',            'portal-access'),
      ('public.admin_revoke_community_access(uuid, text)',                          'portal-access'),
      ('public.admin_community_usage()',                                            'portal-access')
    ) as t(fn, section)
  loop
    d := pg_get_functiondef(r.fn::regprocedure);
    if position('if not public.is_admin() then' in d) > 0 then
      d := replace(d, 'if not public.is_admin() then',
                   format('if not public.has_section_access(%L) then', r.section));
      execute d;
    end if;
  end loop;
end $$;

-- The two lead lists: readable and updatable by the partner-leads section.
drop policy if exists "admins read leads" on public.internship_partner_leads;
create policy "admins read leads"
  on public.internship_partner_leads for select
  to authenticated
  using (public.has_section_access('partner-leads'));

drop policy if exists "admins update leads" on public.internship_partner_leads;
create policy "admins update leads"
  on public.internship_partner_leads for update
  to authenticated
  using (public.has_section_access('partner-leads'))
  with check (public.has_section_access('partner-leads'));

drop policy if exists "admins read leads" on public.career_readiness_leads;
create policy "admins read leads"
  on public.career_readiness_leads for select
  to authenticated
  using (public.has_section_access('partner-leads'));

drop policy if exists "admins update leads" on public.career_readiness_leads;
create policy "admins update leads"
  on public.career_readiness_leads for update
  to authenticated
  using (public.has_section_access('partner-leads'))
  with check (public.has_section_access('partner-leads'));

-- ---------------------------------------------------------------------------
-- 3. The students list: who each student is working with
-- One row per student with at least one mentor (active or waiting). Needs the
-- students section, the same as the list itself.
-- ---------------------------------------------------------------------------
create or replace function public.admin_student_mentors()
returns table (student_id uuid, mentor_names text, waiting boolean)
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
  select mm.student_id,
         string_agg(distinct m.full_name, ', ' order by m.full_name),
         bool_and(mm.status = 'requested')
    from public.mentor_matches mm
    join public.mentors m on m.id = mm.mentor_id
   where mm.status in ('active', 'requested')
   group by mm.student_id;
end;
$$;
revoke execute on function public.admin_student_mentors() from public, anon;
grant execute on function public.admin_student_mentors() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Give the team role to admin1@myskills.org.in
-- Profile verification, blog, feedback, the students list, demo requests, and
-- the three new sections. Anything they already had is kept.
-- ---------------------------------------------------------------------------
insert into public.staff_permissions (user_id, section)
select u.id, s.section
  from auth.users u
 cross join unnest(array[
   'verification', 'blog', 'feedback', 'users', 'demo-requests',
   'overview', 'portal-access', 'partner-leads'
 ]) as s(section)
 where lower(u.email) = 'admin1@myskills.org.in'
on conflict (user_id, section) do nothing;

-- Check: what admin1 now has.
select u.email, sp.section
  from public.staff_permissions sp join auth.users u on u.id = sp.user_id
 where lower(u.email) = 'admin1@myskills.org.in'
 order by sp.section;
