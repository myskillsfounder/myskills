-- ONE-TIME RESET: remove every mentor that exists today.
--
-- Run this ONCE, after docs/supabase-mentors-verified-only.sql, when you are
-- ready for every mentor to come back in through the new single flow (sign up,
-- confirm email, verified by the team). DO NOT re-run it later: it would
-- remove the mentors you have onboarded since.
--
-- What it removes
--   * every mentor listing (the cards students see)
--   * with them, automatically: every student's mentor request and active
--     match, and each mentor's private phone number
-- What it keeps
--   * every account (nobody is signed out or deleted)
--   * skill badges and projects mentors recorded (they stay on the student;
--     only the mentor's name is no longer attached)
--   * live sessions already logged, and every student's score history
--   * the old mentor applications, as a record (waiting ones are closed)
--
-- Everything removed is copied first to the "backups" schema, which the app
-- and the public cannot read, so this can be undone by hand if needed.
--
-- It all runs as one step: if any part fails, nothing is changed.
--
-- To see FIRST what would go, without changing anything, run only this:
--   select 'mentor listings' as what, count(*) as how_many from public.mentors
--   union all select 'of those, with an account', count(*) from public.mentors where profile_id is not null
--   union all select 'student requests and matches', count(*) from public.mentor_matches
--   union all select 'of those, active right now', count(*) from public.mentor_matches where status = 'active'
--   union all select 'applications still waiting', count(*) from public.mentor_applications where status = 'pending';

begin;

-- 1. Copy it all somewhere safe. Not in "public", so it is never served by the app.
create schema if not exists backups;
revoke all on schema backups from public, anon, authenticated;

drop table if exists backups.mentors_before_reset;
create table backups.mentors_before_reset as select * from public.mentors;
drop table if exists backups.mentor_private_before_reset;
create table backups.mentor_private_before_reset as select * from public.mentor_private;
drop table if exists backups.mentor_matches_before_reset;
create table backups.mentor_matches_before_reset as select * from public.mentor_matches;

-- 2. Remove the mentors. Their matches and phone numbers go with them.
delete from public.mentors;

-- 3. Close the applications that were still waiting: that form is retired, and
--    nobody is emailed by this. Their details stay on record so you can invite
--    them to sign up.
update public.mentor_applications
   set status = 'rejected',
       reviewed_at = now(),
       review_note = 'The application form was retired. Invited to create a partner account instead.'
 where status = 'pending';

-- 4. Anyone who had signed up as a mentor and been approved is put back in
--    "Waiting for verification", so approving them again creates their listing
--    the new way.
update public.portal_requests
   set status = 'pending', reviewed_by = null, reviewed_at = null, note = null
 where role = 'mentor' and status = 'approved';

commit;

-- 5. The result: who was removed (the people to invite back), what went with
--    them, and how many mentors are left (should be 0).
select b.full_name as removed_mentor,
       coalesce(u.email::text, 'no account') as account_email,
       (select count(*) from backups.mentor_matches_before_reset mm where mm.mentor_id = b.id) as student_matches_removed,
       (select count(*) from public.mentors) as mentors_left_now
  from backups.mentors_before_reset b
  left join auth.users u on u.id = b.profile_id
 order by b.created_at;

-- Undo (only if needed, and before onboarding anyone new). Listings that had no
-- account cannot be put back: the new rule refuses them.
--   insert into public.mentors select * from backups.mentors_before_reset where profile_id is not null;
--   insert into public.mentor_private select p.* from backups.mentor_private_before_reset p
--     join public.mentors m on m.id = p.mentor_id;
--   insert into public.mentor_matches select mm.* from backups.mentor_matches_before_reset mm
--     join public.mentors m on m.id = mm.mentor_id;
