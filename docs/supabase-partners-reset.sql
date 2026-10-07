-- ONE-TIME RESET: clear every partner's access to the Community portal.
--
-- The companion to docs/supabase-mentors-reset.sql, for the other partners:
-- counsellors (Wellness), career guides (Career Guidance), internship
-- companies and institutions. Run it ONCE, when you want every partner to come
-- back in through the sign-up and be verified again. DO NOT re-run it later:
-- it would remove the partners you have onboarded since.
--
-- What it removes
--   * every partner's access to their section of the Community portal
--     (so an account that was a career guide, counsellor, company or
--     institution opens the portal and has to ask to be verified)
-- What it ends (kept as history, no longer "under way")
--   * students currently placed with a counsellor, guide, company or
--     institution: each is marked as finished today
-- What it keeps
--   * every account (nobody is signed out or deleted)
--   * the MySkills team's read-only overview of each section (the founder
--     login keeps seeing everything)
--   * the dates of sessions already logged
--   * institution listings on the Community page, internship company leads,
--     and students' support requests. Those are not portal access.
--
-- People who signed up and had been approved are put back in "Waiting for
-- verification" (Admin > Community > Portal access & usage), so verifying them
-- again is one click. Nobody is emailed by this script.
--
-- Everything changed is copied first to the "backups" schema, which the app
-- and the public cannot read. It all runs as one step: if any part fails,
-- nothing is changed.
--
-- To see FIRST what would go, without changing anything, run only this:
--   select u.email, a.resource, a.organisation
--     from public.community_access a join auth.users u on u.id = a.user_id
--    where not a.sees_all order by a.resource, u.email;

begin;

-- 1. Copy it all somewhere safe. Not in "public", so it is never served by the app.
create schema if not exists backups;
revoke all on schema backups from public, anon, authenticated;

drop table if exists backups.community_access_before_reset;
create table backups.community_access_before_reset as select * from public.community_access;
drop table if exists backups.community_engagements_before_reset;
create table backups.community_engagements_before_reset as select * from public.community_engagements;
drop table if exists backups.portal_requests_before_reset;
create table backups.portal_requests_before_reset as select * from public.portal_requests;

-- 2. Students placed with a partner right now: finished as of today, kept as history.
update public.community_engagements
   set status = 'ended', ended_on = current_date
 where status = 'active';

-- 3. Remove every partner's access. The team's overview stays.
delete from public.community_access where not sees_all;

-- 4. Approved partner sign-ups go back to waiting, to be verified again.
update public.portal_requests
   set status = 'pending', reviewed_by = null, reviewed_at = null, note = null
 where role <> 'mentor' and status = 'approved';

commit;

-- 5. The result: whose access was removed (the people to invite or verify
--    again), and how many partner grants are left (should be 0).
select coalesce(u.email::text, 'account deleted') as account_email,
       b.resource as was_given,
       b.organisation,
       (select count(*) from public.community_access a where not a.sees_all) as partner_access_left_now
  from backups.community_access_before_reset b
  left join auth.users u on u.id = b.user_id
 where not b.sees_all
 order by b.resource, u.email;

-- Undo (only if needed, and before onboarding anyone new):
--   insert into public.community_access select * from backups.community_access_before_reset b
--     where not b.sees_all on conflict (user_id, resource) do nothing;
--   update public.community_engagements e set status = b.status, ended_on = b.ended_on
--     from backups.community_engagements_before_reset b where b.id = e.id;
--   update public.portal_requests r set status = b.status, reviewed_by = b.reviewed_by,
--          reviewed_at = b.reviewed_at, note = b.note
--     from backups.portal_requests_before_reset b where b.id = r.id;
