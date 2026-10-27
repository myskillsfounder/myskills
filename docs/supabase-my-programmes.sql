-- The course-engine programmes a student has joined, with their progress, for
-- the Practice page's programme cards (Paul, 27 Oct 2026: "there is more than
-- two programmes, so Practice should show the enrolled programme cards and
-- clicking one should take them to progress and practice").
--
-- Only the signed-in student's own enrolments; nothing about anyone else.
-- Digital Marketing and Global Leadership are built into the app and read
-- their progress as before.
--
-- Safe to run before or after the deploy (Practice shows the two built-in
-- programmes until this exists). Safe to re-run. Depends on
-- docs/supabase-course-engine-students.sql.

create or replace function public.my_programmes()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(jsonb_agg(x order by x ->> 'started_at'), '[]'::jsonb)
    from (
      select jsonb_build_object(
               'slug', p.slug,
               'title', p.title,
               'kind', p.kind,
               'started_at', e.started_at,
               'modules_total', coalesce(jsonb_array_length(v.content -> 'modules'), 0),
               'modules_done', (select count(*) from jsonb_array_elements(coalesce(v.content -> 'modules', '[]')) m
                                 where public.programme_module_done(e.student_id, p.id, m)),
               'aptitude_done', exists (select 1 from public.programme_aptitude_results a
                                         where a.student_id = e.student_id and a.programme_id = p.id),
               'final_passed', e.final_passed_at is not null
             ) as x
        from public.programme_enrolments e
        join public.programmes p on p.id = e.programme_id and p.status = 'published'
        join public.programme_versions v on v.programme_id = e.programme_id and v.version = e.version
       where e.student_id = auth.uid()
    ) t;
$$;
revoke execute on function public.my_programmes() from public, anon;
grant execute on function public.my_programmes() to authenticated;
