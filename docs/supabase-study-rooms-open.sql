-- Study rooms (Paul, 3 Nov 2026): Focus Rooms became Study rooms, the app's
-- first tab and where a student lands after signing in, with no onboarding
-- questions first. A new student is in no programme yet, so there is one room
-- for everyone: "open", the Open study room. Programme rooms stay as they were.
--
-- Run after: supabase-focus-rooms.sql. Safe to run again.
-- Run it BEFORE deploying the site, or the Open study room doesn't appear.

create or replace function public.focus_room_member(p_room text) returns boolean
language sql security definer set search_path = public stable as $$
  select auth.uid() is not null and (
    case p_room
      when 'open' then true
      when 'digital-marketing' then
        exists (select 1 from public.dm_aptitude_results where profile_id = auth.uid())
        or exists (select 1 from public.initial_assessment_results where profile_id = auth.uid())
      when 'career-readiness' then
        exists (select 1 from public.career_readiness_assessment_results where profile_id = auth.uid())
      else
        exists (select 1 from public.programme_enrolments e
                  join public.programmes p on p.id = e.programme_id and p.status = 'published'
                 where e.student_id = auth.uid() and p.slug = p_room)
    end
    or public.is_admin()
  );
$$;
revoke execute on function public.focus_room_member(text) from public, anon;
grant execute on function public.focus_room_member(text) to authenticated;

-- The Open study room first, then the built-in programmes, then the rest.
create or replace function public.my_focus_rooms() returns jsonb
language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(jsonb_build_object('slug', slug, 'title', title, 'topics', topics) order by ord, title), '[]'::jsonb)
    from (
      select r.slug, r.title, r.ord,
             (select count(*) from public.focus_topics t
               where t.room = r.slug and t.hidden_at is null and t.created_at > now() - interval '14 days') as topics
        from (
          select 'open' as slug, 'Open study room' as title, -1 as ord
           where auth.uid() is not null
          union all
          select 'digital-marketing', 'Digital Marketing', 0
           where public.focus_room_member('digital-marketing')
          union all
          select 'career-readiness', 'Global Leadership', 1
           where public.focus_room_member('career-readiness')
          union all
          select p.slug, p.title, 2
            from public.programmes p
           where p.status = 'published'
             and (public.is_admin()
                  or exists (select 1 from public.programme_enrolments e
                              where e.student_id = auth.uid() and e.programme_id = p.id))
        ) r
    ) x;
$$;
revoke execute on function public.my_focus_rooms() from public, anon;
grant execute on function public.my_focus_rooms() to authenticated;
