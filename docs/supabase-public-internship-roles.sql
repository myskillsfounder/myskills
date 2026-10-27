-- Open internships for visitors (Paul, 27 Oct 2026: "show open internships at
-- the top where students can apply"). The public Internships page
-- (routes/internships.tsx) lists the roles students can apply to before they
-- have an account; applying still needs one (apply_for_internship).
--
-- Only what a role's card shows: the same roles open_internship_roles() gives a
-- signed-in student (live, not past their apply-by date, from a company that
-- still has its place in the portal), without the description's full text,
-- applicants or anything about the student. At most 12, newest first.
--
-- Safe to run before or after the deploy (the page shows "opening soon"
-- until this exists). Safe to re-run. Depends on docs/supabase-internships.sql.

create or replace function public.public_internship_roles()
returns table (
  id uuid, posted_on date, organisation text, title text, summary text, skills text[], mode text,
  location text, duration_weeks int, stipend text, openings int, apply_by date
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, coalesce(r.reviewed_at, r.created_at)::date,
         coalesce(nullif(btrim(c.organisation), ''), 'A partner company'),
         r.title,
         -- The first lines of the description, for the card.
         case when length(r.description) > 220 then left(r.description, 217) || '…' else r.description end,
         r.skills, r.mode, r.location, r.duration_weeks, r.stipend, r.openings, r.apply_by
    from public.internship_roles r
    join public.community_access c on c.user_id = r.provider_id and c.resource = 'internships'
   where r.status = 'live' and (r.apply_by is null or r.apply_by >= current_date)
   order by coalesce(r.reviewed_at, r.created_at) desc
   limit 12;
$$;
revoke execute on function public.public_internship_roles() from public;
grant execute on function public.public_internship_roles() to anon, authenticated;
