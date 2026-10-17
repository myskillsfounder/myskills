-- The Community portal for internship companies: one list of every
-- application across a company's roles, and closing a role answers the
-- students still waiting on it.
--
-- 1. my_internship_pipeline(): every application to the signed-in company's
--    roles, with the role it is for. The portal's Home uses it for what needs
--    attention (new applicants, offers not answered, internships past their
--    end date), and the Internships page for "Your interns", where each one is
--    marked complete. It shows the same fields internship_applicants() already
--    shows, by the same rules: contact details only from shortlisted on, and
--    nobody who withdrew.
--
-- 2. close_internship_role(): until now, closing a role left everyone who had
--    applied (or been shortlisted) waiting on "Applied" for good. Closing now
--    tells them it didn't go through, by email, exactly as "Not selected" does.
--    An offer already made stands: the student can still accept it, or the
--    company can withdraw it.
--
-- Nothing here touches the Global Readiness Score.
--
-- Run once in the Supabase SQL editor; either order with the deploy (the
-- portal works without it, with less on Home). Safe to re-run.
-- Depends on: docs/supabase-internships.sql.

-- ---------------------------------------------------------------------------
-- 1. Every application to this company's roles
-- ---------------------------------------------------------------------------
create or replace function public.my_internship_pipeline()
returns table (
  id uuid, role_id uuid, role_title text, duration_weeks int, status text,
  applied_on date, updated_at timestamptz, note text,
  student_id uuid, student_name text, headline text, location text,
  score int, certificates text[],
  email text, phone text,
  started_on date, ended_on date, supervisor_name text, signoff_note text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  perform public.my_internship_company();
  return query
  select a.id, r.id, r.title, r.duration_weeks, a.status,
         a.created_at::date, a.updated_at, a.note,
         a.student_id, p.full_name, p.headline, p.location,
         (select s.score::int from public.career_readiness_scores s where s.user_id = a.student_id),
         coalesce((select array_agg(c.title order by c.issued_at desc)
                     from public.certificates c where c.profile_id = a.student_id), '{}'::text[]),
         case when a.status in ('shortlisted', 'offered', 'accepted', 'signoff_pending', 'completed') then u.email::text end,
         case when a.status in ('shortlisted', 'offered', 'accepted', 'signoff_pending', 'completed') then p.phone end,
         a.started_on, a.ended_on, a.supervisor_name, a.signoff_note
    from public.internship_applications a
    join public.internship_roles r on r.id = a.role_id
    left join public.profiles p on p.id = a.student_id
    left join auth.users u on u.id = a.student_id
   where r.provider_id = auth.uid() and a.status <> 'withdrawn'
   order by case a.status when 'signoff_pending' then 0 when 'accepted' then 1 when 'offered' then 2
                          when 'shortlisted' then 3 when 'applied' then 4 when 'completed' then 5 else 6 end,
            a.created_at desc;
end;
$$;
revoke execute on function public.my_internship_pipeline() from public, anon;
grant execute on function public.my_internship_pipeline() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Closing a role answers whoever is still waiting on it
-- ---------------------------------------------------------------------------
create or replace function public.close_internship_role(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org text;
  v_title text;
  w record;
begin
  update public.internship_roles
     set status = 'closed', updated_at = now()
   where id = p_id and provider_id = auth.uid() and status <> 'closed'
  returning title into v_title;
  if not found then
    raise exception 'That role is already closed.';
  end if;

  select coalesce(nullif(btrim(c.organisation), ''), 'A partner company') into v_org
    from public.community_access c where c.user_id = auth.uid() and c.resource = 'internships';

  -- Applied or shortlisted, and never answered: they hear, as with "Not selected".
  for w in
    update public.internship_applications a
       set status = 'rejected', updated_at = now()
     where a.role_id = p_id and a.status in ('applied', 'shortlisted')
    returning a.student_id
  loop
    perform public.internship_notify(
      (select u.email::text from auth.users u where u.id = w.student_id),
      'An update on your internship application', 'This role has closed',
      public.notify_row('Role', v_title) || public.notify_row('Company', coalesce(v_org, 'A partner company'))
      || public.notify_row('What now', 'Other roles are open, and your score keeps counting.'),
      'See open roles', 'https://myskills.org.in/community?category=internships');
  end loop;
end;
$$;
revoke execute on function public.close_internship_role(uuid) from public, anon;
grant execute on function public.close_internship_role(uuid) to authenticated;

-- Check: both functions are there.
select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and proname in ('my_internship_pipeline', 'close_internship_role')
 order by 1;
