-- The Admin Inbox: everything waiting on your team, in one list, oldest first.
--
-- Until now each queue lived on its own page and the Overview only counted
-- them ("7 verification requests"), with no sense of how long anything had
-- waited. admin_inbox() returns one row per waiting item with its age, for the
-- sections the signed-in person has — a Verification-only account sees only
-- verification requests, a full admin sees everything.
--
--   kind            what it is (the page it opens is decided by the frontend)
--   title           the person or organisation it is from
--   detail          a few words of context (programme, role, city)
--   created_at      when it started waiting
--
-- Read-only; it changes nothing. Nothing personal beyond a name and a line of
-- context is returned: the page each row opens shows the detail, behind that
-- page's own permission.
--
-- Run once. Safe to re-run. No ordering against the deploy: until it is run
-- the Inbox page says it isn't set up yet.

create or replace function public.admin_inbox()
returns table (
  kind       text,
  ref        uuid,
  title      text,
  detail     text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_any_staff_access() then
    raise exception 'Not authorised.';
  end if;

  return query
  -- Projects waiting to be graded.
  select 'project'::text, r.id, coalesce(p.full_name, u.email::text, 'A student'),
         (case r.programme when 'digital-marketing' then 'Digital Marketing' else 'Career Readiness' end
           || coalesce(' · ' || nullif(r.project_title, ''), '')),
         r.created_at
    from public.mentor_reviews r
    left join public.profiles p on p.id = r.user_id
    left join auth.users u on u.id = r.user_id
   where r.status = 'requested' and public.has_section_access('mentor-reviews')

  union all
  -- Identity verification: asked for, or booked but not done.
  select 'verification', v.id, coalesce(p.full_name, u.email::text, 'A student'),
         case v.status when 'scheduled' then 'Call booked' else 'Waiting to be booked' end,
         v.created_at
    from public.verification_requests v
    left join public.profiles p on p.id = v.user_id
    left join auth.users u on u.id = v.user_id
   where v.status in ('requested', 'scheduled') and public.has_section_access('verification')

  union all
  select 'mentor-application', a.id, a.full_name, null::text, a.created_at
    from public.mentor_applications a
   where a.status = 'pending' and public.has_section_access('mentors')

  union all
  select 'institution-application', a.id, a.legal_name, null::text, a.created_at
    from public.institution_partner_applications a
   where a.status = 'pending' and public.has_section_access('institution-partners')

  union all
  select 'demo-request', d.id, coalesce(nullif(d.institution, ''), d.full_name),
         nullif(d.city, ''), d.created_at
    from public.institution_demo_requests d
   where d.status = 'pending' and public.has_section_access('demo-requests')

  union all
  -- Counselling and career-guidance requests nobody has picked up yet.
  select 'support-request', w.id, w.full_name,
         case w.type when 'psychologist' then 'Counselling' else 'Career guidance' end,
         w.created_at
    from public.wellness_requests w
   where w.status = 'pending' and public.has_section_access('wellness')

  union all
  select 'internship-lead', l.id, l.company,
         nullif(l.city, ''), l.created_at
    from public.internship_partner_leads l
   where not l.contacted and public.has_section_access('partner-leads')

  union all
  select 'cr-lead', l.id, l.full_name, null::text, l.created_at
    from public.career_readiness_leads l
   where not l.contacted and public.has_section_access('partner-leads')

  union all
  -- Listed mentors with no account linked: students can't ask them yet.
  select 'unlinked-mentor', m.id, m.full_name, 'No account linked', m.created_at
    from public.mentors m
   where m.profile_id is null and public.has_section_access('mentors')

  order by 5 asc;
end;
$$;
revoke execute on function public.admin_inbox() from public, anon;
grant execute on function public.admin_inbox() to authenticated;
