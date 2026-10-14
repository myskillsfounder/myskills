-- Retire the live support chat ("Talk to a mentor" on the LaunchPad).
--
-- The app no longer has the chat: the LaunchPad card, /support and /mentor
-- are gone (the two addresses now redirect). This closes what was left open
-- behind it. Nothing is deleted: the chat tables stay as they are.
--
--   1. Profiles flagged as support-chat mentors (profiles.is_mentor) were
--      readable by anyone, signed in or not, every column. Mentors are listed
--      from the mentors table now, so that rule goes.
--   2. People in a chat could read each other's profile. No chat, no need.
--   3. No new chat can be started, so an old copy of the app still open in
--      someone's browser can't leave a request that nobody will see.
--
-- The last statement lists any request still waiting or open, with the
-- contact details the student left, so nobody who asked is left without an
-- answer.
--
-- Run once in the Supabase SQL editor, then deploy (either order is fine).
-- Safe to re-run.

drop policy if exists profiles_select_mentors on public.profiles;
drop policy if exists profiles_select_support_peer on public.profiles;
drop policy if exists sessions_insert_own on public.support_sessions;

select s.created_at, s.status, s.topic, s.details,
       coalesce(s.contact_name, p.full_name) as name,
       coalesce(s.email, u.email::text) as email,
       coalesce(s.phone, p.phone) as phone
  from public.support_sessions s
  left join public.profiles p on p.id = s.user_id
  left join auth.users u on u.id = s.user_id
 where s.status in ('waiting', 'active')
 order by s.created_at desc;
