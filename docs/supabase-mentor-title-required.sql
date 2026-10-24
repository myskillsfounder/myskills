-- A mentor's profile isn't finished until they have written a real title.
--
-- When the team verifies a mentor, their listing starts with the placeholder
-- title "Mentor". The check for "is this profile complete?" didn't look at the
-- title, so a mentor could fill in the rest and go live to students with
-- "Mentor" under their name.
--
-- Now a title that is blank or still "Mentor" counts as missing, alongside the
-- bio, areas of expertise, LinkedIn and phone. Every mentor is re-checked at
-- the end, so anyone live with the placeholder stops being shown to students
-- until a title is written (in their portal, or by the team with Edit profile).
--
-- Run once, after docs/supabase-mentors-verified-only.sql. Safe to re-run.

create or replace function public.mentor_missing(p_mentor uuid)
returns text[]
language sql
security definer
set search_path = public
stable
as $$
  select array_remove(array[
    case when lower(btrim(coalesce(m.headline, ''))) in ('', 'mentor') then 'headline' end,
    case when length(btrim(coalesce(m.bio, ''))) < 20         then 'bio' end,
    case when coalesce(array_length(m.expertise, 1), 0) = 0   then 'expertise' end,
    case when nullif(btrim(coalesce(m.linkedin_url, '')), '') is null then 'linkedin' end,
    case when nullif(btrim(coalesce(pr.phone, '')), '') is null       then 'phone' end
  ], null)
    from public.mentors m
    left join public.mentor_private pr on pr.mentor_id = m.id
   where m.id = p_mentor;
$$;
revoke execute on function public.mentor_missing(uuid) from public, anon, authenticated;

-- Re-check everyone against the new rule.
do $$
declare
  r record;
begin
  for r in select id from public.mentors loop
    perform public.refresh_mentor_ready(r.id);
  end loop;
end $$;

-- Where each mentor stands now.
select m.full_name, m.headline as title, m.ready as shown_to_students,
       array_to_string(public.mentor_missing(m.id), ', ') as still_missing
  from public.mentors m
 order by m.ready desc, m.full_name;
