-- Study rooms, more alive (Paul, 11 Nov 2026: "the study room is not
-- interactive at all, the doubts session and upvoting looks less engaging").
--
--   focus_replies            answers to a doubt; its author marks the one that solved it
--   focus_room_topics()      now also returns each doubt's answer count and whether it's solved
--   focus_study_log          minutes studied per student, room and day (India time)
--   focus_log_minutes()      the room adds a minute at a time while the student is in it
--   focus_my_study()         today, this week and the day streak, for the student
--   focus_room_leaders()     this week's top five in a room
--
-- The focus timer, reactions and "raise hand" need no SQL: they travel over
-- the room's Realtime channel and nothing is stored.
--
-- Run after: supabase-focus-rooms.sql and supabase-study-rooms-open.sql.
-- Safe to run again. The site works before it is run: the answers, study
-- time and leaderboard simply don't show until then.

-- ─── Answers ────────────────────────────────────────────────────────────────
alter table public.focus_topics add column if not exists solved_reply uuid;

create table if not exists public.focus_replies (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references public.focus_topics (id) on delete cascade,
  author_id   uuid not null references auth.users (id) on delete cascade,
  body        text not null check (length(btrim(body)) between 1 and 500),
  created_at  timestamptz not null default now(),
  hidden_at   timestamptz
);
create index if not exists focus_replies_topic on public.focus_replies (topic_id, created_at);
alter table public.focus_replies enable row level security;

-- The board, now with each doubt's answers counted and whether it's solved.
-- Unsolved first by votes, then newest; solved ones still show (the client
-- splits them into their own tab).
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
                 'voted', exists (select 1 from public.focus_topic_votes v where v.topic_id = t.id and v.voter_id = auth.uid()),
                 'replies', (select count(*) from public.focus_replies r where r.topic_id = t.id and r.hidden_at is null),
                 'solved', t.solved_reply is not null
               ) as x
          from public.focus_topics t
          left join public.profiles pr on pr.id = t.author_id
         where t.room = p_room and t.hidden_at is null and t.created_at > now() - interval '14 days'
         limit 100
      ) s
  );
end $$;

-- A doubt's answers, oldest first, the accepted one marked.
create or replace function public.focus_topic_replies(p_topic uuid) returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare
  v_room text;
  v_solved uuid;
begin
  select room, solved_reply into v_room, v_solved from public.focus_topics where id = p_topic and hidden_at is null;
  if v_room is null or not public.focus_room_member(v_room) then
    raise exception 'That doubt is not open';
  end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', r.id,
             'body', r.body,
             'created_at', r.created_at,
             'author', coalesce(nullif(btrim(pr.full_name), ''), 'A student'),
             'avatar', pr.avatar_url,
             'mine', r.author_id = auth.uid(),
             'accepted', r.id = v_solved
           ) order by r.created_at), '[]'::jsonb)
      from public.focus_replies r
      left join public.profiles pr on pr.id = r.author_id
     where r.topic_id = p_topic and r.hidden_at is null
  );
end $$;

-- Thirty answers a day per student keeps it to real help.
create or replace function public.focus_add_reply(p_topic uuid, p_body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_room text;
  v_id uuid;
begin
  select room into v_room from public.focus_topics where id = p_topic and hidden_at is null;
  if v_room is null or not public.focus_room_member(v_room) then
    raise exception 'That doubt is not open';
  end if;
  if (select count(*) from public.focus_replies
       where author_id = auth.uid() and created_at > now() - interval '1 day') >= 30 then
    raise exception 'That is 30 answers today. Thank you for helping! Come back tomorrow';
  end if;
  insert into public.focus_replies (topic_id, author_id, body)
  values (p_topic, auth.uid(), btrim(p_body))
  returning id into v_id;
  return v_id;
end $$;

-- The answer's author takes it down, or an admin hides it.
create or replace function public.focus_remove_reply(p_reply uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.focus_replies set hidden_at = now()
   where id = p_reply and hidden_at is null
     and (author_id = auth.uid() or public.is_admin());
  update public.focus_topics set solved_reply = null where solved_reply = p_reply
     and exists (select 1 from public.focus_replies where id = p_reply and hidden_at is not null);
end $$;

-- The doubt's author marks the answer that solved it, or takes the mark back.
create or replace function public.focus_accept_reply(p_topic uuid, p_reply uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_current uuid;
begin
  select solved_reply into v_current from public.focus_topics
   where id = p_topic and hidden_at is null and author_id = auth.uid();
  if not found then
    raise exception 'Only the student who asked can mark it solved';
  end if;
  if not exists (select 1 from public.focus_replies where id = p_reply and topic_id = p_topic and hidden_at is null) then
    raise exception 'That answer is not there any more';
  end if;
  if v_current = p_reply then
    update public.focus_topics set solved_reply = null where id = p_topic;
    return false;
  end if;
  update public.focus_topics set solved_reply = p_reply where id = p_topic;
  return true;
end $$;

-- ─── Study time ─────────────────────────────────────────────────────────────
create table if not exists public.focus_study_log (
  user_id  uuid not null references auth.users (id) on delete cascade,
  room     text not null,
  day      date not null,
  minutes  int  not null default 0 check (minutes between 0 and 1440),
  primary key (user_id, room, day)
);
create index if not exists focus_study_log_room_day on public.focus_study_log (room, day);
alter table public.focus_study_log enable row level security;

-- India time: a student's "today" turns over at their midnight.
create or replace function public.focus_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Kolkata')::date $$;

-- The room calls this once a minute while the student is in it with the tab
-- open, so at most a minute is added per call, and sixteen hours a day.
create or replace function public.focus_log_minutes(p_room text, p_minutes int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.focus_room_member(p_room) then
    raise exception 'You are not in this programme yet';
  end if;
  insert into public.focus_study_log (user_id, room, day, minutes)
  values (auth.uid(), p_room, public.focus_today(), least(greatest(p_minutes, 0), 1))
  on conflict (user_id, room, day)
  do update set minutes = least(public.focus_study_log.minutes + least(greatest(p_minutes, 0), 1), 960);
end $$;

-- The student's own time: today, the last 7 days, and the streak of days in a
-- row (still alive if they studied yesterday but not yet today).
create or replace function public.focus_my_study() returns jsonb
language sql security definer set search_path = public stable as $$
  with days as (
    select day, sum(minutes) as minutes
      from public.focus_study_log
     where user_id = auth.uid() and minutes > 0
     group by day
  ),
  runs as (
    select day, day - (row_number() over (order by day))::int as run from days
  ),
  last_run as (
    select run from runs where day = (select max(day) from days)
  )
  select jsonb_build_object(
    'today', coalesce((select minutes from days where day = public.focus_today()), 0),
    'week', coalesce((select sum(minutes) from days where day > public.focus_today() - 7), 0),
    'streak', case
      when (select max(day) from days) >= public.focus_today() - 1
        then (select count(*) from runs where run = (select run from last_run))
      else 0 end
  );
$$;

-- This week's five who studied longest in the room.
create or replace function public.focus_room_leaders(p_room text) returns jsonb
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.focus_room_member(p_room) then
    raise exception 'You are not in this programme yet';
  end if;
  return (
    select coalesce(jsonb_agg(x order by (x ->> 'minutes')::int desc), '[]'::jsonb)
      from (
        select jsonb_build_object(
                 'name', coalesce(nullif(btrim(pr.full_name), ''), 'A student'),
                 'avatar', pr.avatar_url,
                 'minutes', sum(l.minutes),
                 'mine', l.user_id = auth.uid()
               ) as x
          from public.focus_study_log l
          left join public.profiles pr on pr.id = l.user_id
         where l.room = p_room and l.day > public.focus_today() - 7
         group by l.user_id, pr.full_name, pr.avatar_url
         order by sum(l.minutes) desc
         limit 5
      ) s
  );
end $$;

revoke execute on function public.focus_topic_replies(uuid) from public, anon;
revoke execute on function public.focus_add_reply(uuid, text) from public, anon;
revoke execute on function public.focus_remove_reply(uuid) from public, anon;
revoke execute on function public.focus_accept_reply(uuid, uuid) from public, anon;
revoke execute on function public.focus_log_minutes(text, int) from public, anon;
revoke execute on function public.focus_my_study() from public, anon;
revoke execute on function public.focus_room_leaders(text) from public, anon;
grant execute on function public.focus_topic_replies(uuid) to authenticated;
grant execute on function public.focus_add_reply(uuid, text) to authenticated;
grant execute on function public.focus_remove_reply(uuid) to authenticated;
grant execute on function public.focus_accept_reply(uuid, uuid) to authenticated;
grant execute on function public.focus_log_minutes(text, int) to authenticated;
grant execute on function public.focus_my_study() to authenticated;
grant execute on function public.focus_room_leaders(text) to authenticated;
