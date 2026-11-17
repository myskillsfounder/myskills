-- Study rooms by topic (Paul, 17 Nov 2026): there is a room for every programme
-- topic (Digital Marketing, Global Leadership, and each published programme such
-- as Entrepreneurship and Data Analytics), and every signed-in student may enter
-- any of them, not only the students enrolled in that programme. The Open study
-- room stays for any subject.
--
-- Two functions change; every doubt, answer, vote and the Realtime channel rule
-- already call focus_room_member(), so this one change opens them all.
--
-- Run after: supabase-study-rooms-open.sql (and supabase-study-rooms-engage.sql).
-- Safe to run again. Until it is run, students only see the rooms they were
-- already in; the site works either way, so run it with the deploy.

create or replace function public.focus_room_member(p_room text) returns boolean
language sql security definer set search_path = public stable as $$
  select auth.uid() is not null and (
    p_room in ('open', 'digital-marketing', 'career-readiness')
    or exists (select 1 from public.programmes p where p.slug = p_room and p.status = 'published')
    or public.is_admin()
  );
$$;
revoke execute on function public.focus_room_member(text) from public, anon;
grant execute on function public.focus_room_member(text) to authenticated;

-- The Open study room first, then Digital Marketing and Global Leadership, then
-- every other published programme. The same list for every signed-in student.
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
           where auth.uid() is not null
          union all
          select 'career-readiness', 'Global Leadership', 1
           where auth.uid() is not null
          union all
          select p.slug, p.title, 2
            from public.programmes p
           where auth.uid() is not null
             and p.status = 'published'
             and p.slug not in ('open', 'digital-marketing', 'career-readiness')
        ) r
    ) x;
$$;
revoke execute on function public.my_focus_rooms() from public, anon;
grant execute on function public.my_focus_rooms() to authenticated;
