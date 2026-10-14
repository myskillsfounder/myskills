-- The Admin Inbox (and the Dashboard, which reads it): the internship queues.
--
-- Two kinds of item are added to admin_inbox(), for whoever has the
-- partner-leads section (the one that opens Admin > Internship roles):
--   internship-role     a role a company has posted, waiting to be approved
--   internship-signoff  an internship a company has marked complete, waiting
--                       for MySkills to confirm it (nothing reaches the
--                       student's score or profile until it is confirmed)
-- and, if an earlier script didn't already add it, partner sign-ups waiting to
-- be verified (portal-request, for the portal-access section).
--
-- It rewrites the LIVE admin_inbox() in place, adding only what is missing, so
-- whatever else is in it now stays as it is. Read-only otherwise; it changes
-- no data.
--
-- DEPLOY FIRST, then run this: the Inbox page before this deploy doesn't know
-- the new kinds. Safe to re-run. Depends on docs/supabase-admin-inbox.sql and
-- docs/supabase-internships.sql.

do $$
declare
  d text := pg_get_functiondef('public.admin_inbox()'::regprocedure);
  extra text := '';
begin
  if position('order by 5 asc;' in d) = 0 then
    raise exception 'admin_inbox() has a different shape than expected; nothing was changed.';
  end if;

  if position('portal-request' in d) = 0 then
    extra := extra || $p$union all
  -- Partner sign-ups waiting to be verified.
  select 'portal-request', r.id, coalesce(p.full_name, u.email::text, 'A new sign-up'),
         case r.role when 'mentor' then 'Mentor' when 'wellness' then 'Counsellor' when 'guidance' then 'Career guide'
                     when 'internships' then 'Company' else 'Institution' end
           || coalesce(' · ' || nullif(r.organisation, ''), ''),
         r.created_at
    from public.portal_requests r
    left join public.profiles p on p.id = r.user_id
    left join auth.users u on u.id = r.user_id
   where r.status = 'pending' and public.has_section_access('portal-access')

  $p$;
  end if;

  if position('internship-role' in d) = 0 then
    extra := extra || $r$union all
  -- Internship roles a company has posted, waiting for approval.
  select 'internship-role', ir.id, coalesce(nullif(btrim(ca.organisation), ''), 'A partner company'),
         ir.title, ir.updated_at
    from public.internship_roles ir
    left join public.community_access ca on ca.user_id = ir.provider_id and ca.resource = 'internships'
   where ir.status = 'pending' and public.has_section_access('partner-leads')

  $r$;
  end if;

  if position('internship-signoff' in d) = 0 then
    extra := extra || $s$union all
  -- Internships a company has signed off, waiting for MySkills to confirm.
  select 'internship-signoff', ia.id, coalesce(sp.full_name, su.email::text, 'A student'),
         ir2.title || ' · ' || coalesce(nullif(btrim(ca2.organisation), ''), 'A partner company'),
         ia.updated_at
    from public.internship_applications ia
    join public.internship_roles ir2 on ir2.id = ia.role_id
    left join public.community_access ca2 on ca2.user_id = ir2.provider_id and ca2.resource = 'internships'
    left join public.profiles sp on sp.id = ia.student_id
    left join auth.users su on su.id = ia.student_id
   where ia.status = 'signoff_pending' and public.has_section_access('partner-leads')

  $s$;
  end if;

  if extra = '' then
    return;
  end if;
  d := replace(d, 'order by 5 asc;', extra || 'order by 5 asc;');
  execute d;
end $$;

-- What the Inbox now draws from, for a quick look.
select k as inbox_includes
  from unnest(array['portal-request', 'internship-role', 'internship-signoff']) k
 where position(k in pg_get_functiondef('public.admin_inbox()'::regprocedure)) > 0;
