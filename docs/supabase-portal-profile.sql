-- Community portal profile: say WHEN the team verified someone.
--
-- The portal's My profile page shows a partner where their verification
-- stands. my_portal_request() gains reviewed_at, so it can say "Verified by
-- the MySkills team on 7 Oct 2026" instead of only "Verified".
--
-- Read-only. Run once, after docs/supabase-portal-signup.sql. Safe to re-run.
-- Until it is run, the page works and simply leaves the date out.

drop function if exists public.my_portal_request();
create function public.my_portal_request()
returns table (status text, role text, organisation text, created_at timestamptz, note text, reviewed_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select r.status, r.role, r.organisation, r.created_at, r.note, r.reviewed_at
    from public.portal_requests r where r.user_id = auth.uid();
$$;
revoke execute on function public.my_portal_request() from public, anon;
grant execute on function public.my_portal_request() to authenticated;
