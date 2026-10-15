-- The last of the live support chat (retired in docs/supabase-support-chat-
-- retire.sql): who was "online" to answer it.
--
-- mentor_presence was readable by anyone, signed in or not (a mentor's id and
-- an online flag), and writable by the mentors it listed. The app no longer
-- reads or writes it. This closes it; it deletes nothing, and the table stays.
--
-- Run once; either order with the deploy. Safe to re-run.

drop policy if exists presence_read_all on public.mentor_presence;
drop policy if exists presence_update_own on public.mentor_presence;
drop policy if exists presence_upsert_own on public.mentor_presence;

-- Policies left on it (should be none).
select policyname from pg_policies where schemaname = 'public' and tablename = 'mentor_presence';
