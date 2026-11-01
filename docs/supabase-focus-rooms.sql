-- Focus Rooms (Paul, 1 Nov 2026): a live study room for each programme a
-- student is in. Students turn their camera on (no microphone, ever), say
-- what they are working on, and post and upvote the topics that matter.
--
-- Who is in the room and the camera video travel over Supabase Realtime
-- (presence, and broadcast for the video handshake); the video itself goes
-- student to student and is never recorded or stored. This file holds:
--   focus_room_member(slug)  who may enter a room
--   my_focus_rooms()         the rooms a student may enter
--   focus_topics / votes     the topics board
--   focus_reports            reports about a student in a room
--   realtime policies        only members can join a room's channel
--
-- Run after: supabase-course-engine-students.sql, supabase-dm-aptitude-assessment.sql,
-- supabase-career-readiness-assessment.sql, supabase-mentor-onboarding.sql (is_admin).
--
-- After running it: Supabase dashboard → Realtime → Settings → turn OFF
-- "Allow public access", so a room can only be joined as a private channel
-- (the app uses no public channels).

-- ─── Tables ────────────────────────────────────────────────────────────────
-- Created first: my_focus_rooms() counts the topics.
create table if not exists public.focus_topics (
  id          uuid primary key default gen_random_uuid(),
  room        text not null,
  author_id   uuid not null references auth.users (id) on delete cascade,
  body        text not null check (length(btrim(body)) between 3 and 160),
  created_at  timestamptz not null default now(),
  hidden_at   timestamptz
);
create index if not exists focus_topics_room on public.focus_topics (room, created_at desc);

create table if not exists public.focus_topic_votes (
  topic_id  uuid not null references public.focus_topics (id) on delete cascade,
  voter_id  uuid not null references auth.users (id) on delete cascade,
  primary key (topic_id, voter_id)
);

alter table public.focus_topics enable row level security;
alter table public.focus_topic_votes enable row level security;

-- ─── Who may enter ──────────────────────────────────────────────────────────
-- Digital Marketing and Global Leadership are built in: a student is in them
-- once they have taken the programme's aptitude assessment (or, for Digital
-- Marketing, the older initial assessment). Every other room is a course-engine
-- programme the student has enrolled in. Admins may enter any room.
create or replace function public.focus_room_member(p_room text) returns boolean
language sql security definer set search_path = public stable as $$
  select auth.uid() is not null and (
    case p_room
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

-- The rooms the student may enter, built-in programmes first.
create or replace function public.my_focus_rooms() returns jsonb
language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(jsonb_build_object('slug', slug, 'title', title, 'topics', topics) order by ord, title), '[]'::jsonb)
    from (
      select r.slug, r.title, r.ord,
             (select count(*) from public.focus_topics t
               where t.room = r.slug and t.hidden_at is null and t.created_at > now() - interval '14 days') as topics
        from (
          select 'digital-marketing' as slug, 'Digital Marketing' as title, 0 as ord
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

-- ─── Topics board ───────────────────────────────────────────────────────────
-- A topic is a doubt or a subject worth the room's time. The board shows the
-- last 14 days, most upvoted first. Nothing is read or written directly: the
-- functions below check membership.

create or replace function public.focus_room_topics(p_room text) returns jsonb
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.focus_room_member(p_room) then
    raise exception 'You are not in this programme yet';
  end if;
  return (
    select coalesce(jsonb_agg(x order by (x ->> 'votes')::int desc, x ->> 'created_at' desc), '[]'::jsonb)
      from (
        select jsonb_build_object(
                 'id', t.id,
                 'body', t.body,
                 'created_at', t.created_at,
                 'author', coalesce(nullif(btrim(pr.full_name), ''), 'A student'),
                 'mine', t.author_id = auth.uid(),
                 'votes', (select count(*) from public.focus_topic_votes v where v.topic_id = t.id),
                 'voted', exists (select 1 from public.focus_topic_votes v where v.topic_id = t.id and v.voter_id = auth.uid())
               ) as x
          from public.focus_topics t
          left join public.profiles pr on pr.id = t.author_id
         where t.room = p_room and t.hidden_at is null and t.created_at > now() - interval '14 days'
         limit 100
      ) s
  );
end $$;

-- Ten topics a day per student per room keeps the board readable.
create or replace function public.focus_add_topic(p_room text, p_body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if not public.focus_room_member(p_room) then
    raise exception 'You are not in this programme yet';
  end if;
  if (select count(*) from public.focus_topics
       where room = p_room and author_id = auth.uid() and created_at > now() - interval '1 day') >= 10 then
    raise exception 'That is 10 topics today. Upvote the ones already there, or come back tomorrow';
  end if;
  insert into public.focus_topics (room, author_id, body)
  values (p_room, auth.uid(), btrim(p_body))
  returning id into v_id;
  return v_id;
end $$;

-- Upvote, or take the upvote back. Returns whether the student now upvotes it.
create or replace function public.focus_vote_topic(p_topic uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_room text;
begin
  select room into v_room from public.focus_topics where id = p_topic and hidden_at is null;
  if v_room is null or not public.focus_room_member(v_room) then
    raise exception 'That topic is not open';
  end if;
  delete from public.focus_topic_votes where topic_id = p_topic and voter_id = auth.uid();
  if found then
    return false;
  end if;
  insert into public.focus_topic_votes (topic_id, voter_id) values (p_topic, auth.uid());
  return true;
end $$;

-- The author takes a topic down (once answered, say), or an admin hides it.
create or replace function public.focus_remove_topic(p_topic uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.focus_topics set hidden_at = now()
   where id = p_topic and hidden_at is null
     and (author_id = auth.uid() or public.is_admin());
end $$;

-- ─── Reports ────────────────────────────────────────────────────────────────
create table if not exists public.focus_reports (
  id           uuid primary key default gen_random_uuid(),
  room         text not null,
  reporter_id  uuid not null references auth.users (id) on delete cascade,
  reported_id  uuid not null references auth.users (id) on delete cascade,
  reason       text not null check (length(btrim(reason)) between 3 and 300),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);
alter table public.focus_reports enable row level security;

create or replace function public.focus_report(p_room text, p_user uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.focus_room_member(p_room) then
    raise exception 'You are not in this programme yet';
  end if;
  if p_user = auth.uid() then
    raise exception 'You cannot report yourself';
  end if;
  insert into public.focus_reports (room, reporter_id, reported_id, reason)
  values (p_room, auth.uid(), p_user, btrim(p_reason));
end $$;

-- For the admin: open reports, newest first.
create or replace function public.admin_focus_reports() returns jsonb
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', r.id, 'room', r.room, 'reason', r.reason, 'created_at', r.created_at,
             'reporter', coalesce(a.full_name, ''), 'reported', coalesce(b.full_name, ''),
             'reported_id', r.reported_id
           ) order by r.created_at desc), '[]'::jsonb)
      from public.focus_reports r
      left join public.profiles a on a.id = r.reporter_id
      left join public.profiles b on b.id = r.reported_id
     where r.resolved_at is null
  );
end $$;

revoke execute on function public.focus_room_topics(text) from public, anon;
revoke execute on function public.focus_add_topic(text, text) from public, anon;
revoke execute on function public.focus_vote_topic(uuid) from public, anon;
revoke execute on function public.focus_remove_topic(uuid) from public, anon;
revoke execute on function public.focus_report(text, uuid, text) from public, anon;
revoke execute on function public.admin_focus_reports() from public, anon;
grant execute on function public.focus_room_topics(text) to authenticated;
grant execute on function public.focus_add_topic(text, text) to authenticated;
grant execute on function public.focus_vote_topic(uuid) to authenticated;
grant execute on function public.focus_remove_topic(uuid) to authenticated;
grant execute on function public.focus_report(text, uuid, text) to authenticated;
grant execute on function public.admin_focus_reports() to authenticated;

-- ─── Realtime: only members join a room ─────────────────────────────────────
-- The app joins channel "focus:<programme slug>" as a private channel; these
-- policies let a member receive and send presence and broadcast there.
drop policy if exists "focus room members receive" on realtime.messages;
create policy "focus room members receive" on realtime.messages
  for select to authenticated
  using (realtime.topic() like 'focus:%' and public.focus_room_member(substr(realtime.topic(), 7)));

drop policy if exists "focus room members send" on realtime.messages;
create policy "focus room members send" on realtime.messages
  for insert to authenticated
  with check (realtime.topic() like 'focus:%' and public.focus_room_member(substr(realtime.topic(), 7)));
