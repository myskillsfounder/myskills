-- The cards at the top of Admin > Students > All students: how many students
-- there are, and how many are in each programme. Counted here because the
-- list below them shows at most 200 rows.
--
-- IN A PROGRAMME means the student has done something in it, the same rule
-- the Dashboard's funnels use:
--   Digital Marketing     took its aptitude assessment, practised a track, or
--                         took the Foundation assessment
--   Global Leadership     took the Leadership Aptitude Test, or wrote in a
--                         module
-- A student can be in both.
--
-- Read-only. Run once; either order with the deploy (until it is run, the page
-- shows the list without the cards). Safe to re-run.
-- Depends on: docs/supabase-admin-v2.sql, docs/supabase-life-readiness-
-- modules.sql (career_readiness_items), docs/supabase-staff-permissions.sql.

create or replace function public.admin_student_counts()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('users') then
    raise exception 'Not authorised.';
  end if;
  return (
    with dm as (
      select profile_id from public.dm_aptitude_results
      union select profile_id from public.practice_attempts
      union select profile_id from public.initial_assessment_results
    ),
    gl as (
      select profile_id from public.career_readiness_assessment_results
      union select profile_id from public.career_readiness_responses
    ),
    tracks as (
      select profile_id, count(distinct track_slug) as n from public.practice_attempts group by profile_id
    ),
    -- Global Leadership modules with every item written, per student.
    modules_done as (
      select cr.profile_id, c.module
        from public.career_readiness_items() c
        join public.career_readiness_responses cr on cr.module = c.module and cr.item = c.item
       group by cr.profile_id, c.module
      having count(*) = (select count(*) from public.career_readiness_items() i where i.module = c.module)
    )
    select jsonb_build_object(
      'total', (select count(*) from public.profiles),
      'new_this_week', (select count(*) from public.profiles p join auth.users u on u.id = p.id
                        where u.created_at >= now() - interval '7 days'),
      'dm', (select count(*) from dm),
      'dm_practising', (select count(*) from tracks),
      'dm_all_tracks', (select count(*) from tracks where n >= 8),
      'gl', (select count(*) from gl),
      'gl_writing', (select count(distinct profile_id) from public.career_readiness_responses),
      'gl_all_modules', (select count(*) from (select profile_id from modules_done group by profile_id having count(*) >= 14) x),
      'both', (select count(*) from dm join gl using (profile_id)),
      'neither', (select count(*) from public.profiles p
                   where not exists (select 1 from dm where dm.profile_id = p.id)
                     and not exists (select 1 from gl where gl.profile_id = p.id))
    )
  );
end;
$$;
revoke execute on function public.admin_student_counts() from public, anon;
grant execute on function public.admin_student_counts() to authenticated;

-- Check: the function is there. (It answers only a signed-in team member, so
-- open Admin > All students to see the numbers.)
select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and proname = 'admin_student_counts';
