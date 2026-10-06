-- Portal sign-ups: show the team who has ALREADY applied.
--
-- The three public application forms (become a mentor, partner institution,
-- internship company) and the Community portal sign-up are two halves of one
-- journey: the application is the detail, the sign-up is the account. When the
-- team verifies a sign-up, they should see the person's application beside it,
-- and for a mentor, which listing it created.
--
-- admin_portal_requests() gains:
--   application_status  the status of an application with the same email:
--                       mentor / institution: pending, approved, rejected;
--                       internship company: new, contacted. Null if none.
--   application_on      when they applied
--   suggested_mentor    for a mentor: the listing their approved application
--                       created, so approving is one click
--
-- Read-only. Run once, after docs/supabase-portal-signup.sql. Safe to re-run.
-- Until it is run, the verification list works without the extras.

drop function if exists public.admin_portal_requests();
create function public.admin_portal_requests()
returns table (
  id                 uuid,
  created_at         timestamptz,
  user_id            uuid,
  full_name          text,
  email              text,
  role               text,
  organisation       text,
  phone              text,
  message            text,
  status             text,
  note               text,
  reviewed_at        timestamptz,
  application_status text,
  application_on     timestamptz,
  suggested_mentor   uuid
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
  select r.id, r.created_at, r.user_id, p.full_name, u.email::text, r.role, r.organisation, r.phone,
         r.message, r.status, r.note, r.reviewed_at,
         app.status, app.created_at, app.mentor_id
    from public.portal_requests r
    left join public.profiles p on p.id = r.user_id
    left join auth.users u on u.id = r.user_id
    left join lateral (
      select a.status::text as status, a.created_at,
             (select m.id from public.mentors m where m.application_id = a.id) as mentor_id
        from public.mentor_applications a
       where r.role = 'mentor' and lower(a.email) = lower(u.email)
       order by a.created_at desc limit 1
    ) m_app on r.role = 'mentor'
    left join lateral (
      select a.status::text as status, a.created_at, null::uuid as mentor_id
        from public.institution_partner_applications a
       where r.role = 'institutions' and lower(a.email) = lower(u.email)
       order by a.created_at desc limit 1
    ) i_app on r.role = 'institutions'
    left join lateral (
      select (case when l.contacted then 'contacted' else 'new' end)::text as status, l.created_at, null::uuid as mentor_id
        from public.internship_partner_leads l
       where r.role = 'internships' and lower(l.email) = lower(u.email)
       order by l.created_at desc limit 1
    ) c_app on r.role = 'internships'
    cross join lateral (
      select coalesce(m_app.status, i_app.status, c_app.status) as status,
             coalesce(m_app.created_at, i_app.created_at, c_app.created_at) as created_at,
             m_app.mentor_id as mentor_id
    ) app
   order by (r.status = 'pending') desc, r.created_at desc;
end;
$$;
revoke execute on function public.admin_portal_requests() from public, anon;
grant execute on function public.admin_portal_requests() to authenticated;
