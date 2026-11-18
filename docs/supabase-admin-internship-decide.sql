-- The MySkills team handles internship applications (Paul, 18 Nov 2026:
-- "Internship Applications and Leads will be handled by internal team").
--
-- Admin > Roles & applications was read-only: only the company could
-- shortlist, offer or turn down an applicant. These let the team do it:
--
-- 1. admin_internship_application(p_application): what the team needs to
--    decide: the student's note, phone, and their latest CV (from an
--    application with a CV on Home, docs/supabase-internship-interest.sql).
-- 2. admin_decide_internship_application(p_application, p_action): shortlist,
--    offer or reject, with the same emails to the student as when the company
--    does it. The company sees the new stage in its portal.
--
-- Run in the Supabase SQL editor BEFORE deploying the site version that uses
-- it (until then the buttons say it isn't ready). Safe to run again.
-- Depends on: docs/supabase-internships.sql, docs/supabase-internship-interest.sql,
-- docs/supabase-staff-permissions.sql (has_section_access).

create or replace function public.admin_internship_application(p_application uuid)
returns table (note text, phone text, cv_path text, cv_name text)
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
  select a.note, p.phone,
         (select i.cv_path from public.internship_interest i where i.student_id = a.student_id order by i.updated_at desc limit 1),
         (select i.cv_name from public.internship_interest i where i.student_id = a.student_id order by i.updated_at desc limit 1)
    from public.internship_applications a
    left join public.profiles p on p.id = a.student_id
   where a.id = p_application;
end;
$$;
revoke execute on function public.admin_internship_application(uuid) from public, anon;
grant execute on function public.admin_internship_application(uuid) to authenticated;

create or replace function public.admin_decide_internship_application(p_application uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.internship_applications;
  v_title text;
  v_org text;
  v_email text;
  v_new text;
begin
  if not public.has_section_access('partner-leads') then
    raise exception 'Not authorised.';
  end if;
  select x.* into a from public.internship_applications x where x.id = p_application for update;
  if a.id is null then
    raise exception 'That application no longer exists.';
  end if;
  select r.title, coalesce(nullif(btrim(c.organisation), ''), 'A partner company')
    into v_title, v_org
    from public.internship_roles r
    left join public.community_access c on c.user_id = r.provider_id and c.resource = 'internships'
   where r.id = a.role_id;

  if p_action = 'shortlist' and a.status = 'applied' then
    v_new := 'shortlisted';
  elsif p_action = 'offer' and a.status in ('applied', 'shortlisted') then
    v_new := 'offered';
  elsif p_action = 'reject' and a.status in ('applied', 'shortlisted', 'offered') then
    v_new := 'rejected';
  else
    raise exception 'That can''t be done at this stage of the application.';
  end if;

  update public.internship_applications set status = v_new, updated_at = now() where id = a.id;

  select u.email::text into v_email from auth.users u where u.id = a.student_id;
  if v_new = 'shortlisted' then
    perform public.internship_notify(v_email, format('%s shortlisted you', v_org), 'You''ve been shortlisted',
      public.notify_row('Role', v_title) || public.notify_row('Company', v_org)
      || public.notify_row('What happens now', 'The MySkills team may contact you about the next step.'),
      'See your application', 'https://myskills.org.in/community?category=internships');
  elsif v_new = 'offered' then
    perform public.internship_notify(v_email, format('%s has offered you an internship', v_org), 'You have an internship offer',
      public.notify_row('Role', v_title) || public.notify_row('Company', v_org)
      || public.notify_row('Next step', 'Accept or decline the offer in MySkills.'),
      'Answer the offer', 'https://myskills.org.in/community?category=internships');
  else
    perform public.internship_notify(v_email, 'An update on your internship application', 'This one didn''t go through',
      public.notify_row('Role', v_title) || public.notify_row('Company', v_org)
      || public.notify_row('What now', 'Other roles are open, and your score keeps counting.'),
      'See open roles', 'https://myskills.org.in/community?category=internships');
  end if;
end;
$$;
revoke execute on function public.admin_decide_internship_application(uuid, text) from public, anon;
grant execute on function public.admin_decide_internship_application(uuid, text) to authenticated;
