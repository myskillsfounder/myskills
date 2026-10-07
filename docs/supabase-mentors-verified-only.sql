-- Mentors: ONE way in.
--
-- A mentor is someone with a MySkills account whose email is confirmed AND whom
-- the team has verified. Nothing else makes a mentor.
--
-- Before this there were four ways a mentor listing could come to exist, three
-- of them with no account behind it (an approved application, "Add a mentor",
-- a reserved email), so a person could be shown to students as a verified
-- mentor without ever having signed in. After this:
--
--   * A listing is CREATED at the moment the team verifies an account, and it
--     belongs to that account from its first second. There is no such thing as
--     a listing without an account: the database refuses to create one.
--   * The two doors:
--       1. The person signs up at the Community portal as a mentor, confirms
--          their email, and the team approves them (Mentors, or Portal access
--          & usage > Waiting for verification).
--       2. The team adds someone who ALREADY has an account with a confirmed
--          email: Mentors > Add a mentor (their email).
--   * Students see a mentor only once that mentor has finished their profile
--     in the portal (the app filters on this).
--   * The old doors are shut: approving an application, creating a listing by
--     hand, linking / unlinking an email, and reserving an email.
--
-- Run once, after docs/supabase-portal-signup.sql. Safe to re-run.
-- To also clear the mentors that exist today, run
-- docs/supabase-mentors-reset.sql afterwards (once).

-- ---------------------------------------------------------------------------
-- 1. No listing without an account
-- ---------------------------------------------------------------------------
create or replace function public.mentors_require_account()
returns trigger
language plpgsql
as $$
begin
  if new.profile_id is null then
    raise exception 'A mentor listing is created when the team verifies the mentor''s account. Use Mentors > Add a mentor, or verify their sign-up.';
  end if;
  return new;
end;
$$;

drop trigger if exists mentors_require_account on public.mentors;
create trigger mentors_require_account
  before insert on public.mentors
  for each row execute function public.mentors_require_account();

-- One listing per account.
create unique index if not exists mentors_one_per_account on public.mentors (profile_id) where profile_id is not null;

-- ---------------------------------------------------------------------------
-- 2. Make a verified account a mentor (used by both doors; not callable from
--    the app directly)
-- ---------------------------------------------------------------------------
create or replace function public.make_mentor(p_user uuid, p_phone text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  auth.users;
  v_id    uuid;
  v_name  text;
begin
  select * into v_user from auth.users where id = p_user;
  if v_user.id is null then
    raise exception 'That account no longer exists.';
  end if;
  if v_user.email_confirmed_at is null then
    raise exception 'They haven''t confirmed their email yet. Ask them to enter the code we emailed them, then try again.';
  end if;

  select m.id into v_id from public.mentors m where m.profile_id = p_user;
  if v_id is not null then
    return v_id;
  end if;

  v_name := coalesce(
    (select nullif(btrim(p.full_name), '') from public.profiles p where p.id = p_user),
    nullif(btrim(v_user.raw_user_meta_data ->> 'name'), ''),
    split_part(v_user.email, '@', 1)
  );
  insert into public.profiles (id, full_name) values (p_user, v_name) on conflict (id) do nothing;

  -- Their name and nothing else: the title, bio, expertise and photo are theirs
  -- to write in the portal, and students don't see them until they have.
  insert into public.mentors (full_name, headline, bio, expertise, profile_id, sort_order)
  values (v_name, 'Mentor', '', '{}', p_user, coalesce((select max(sort_order) from public.mentors), 0) + 1)
  returning id into v_id;

  if nullif(btrim(coalesce(p_phone, '')), '') is not null then
    insert into public.mentor_private (mentor_id, phone, updated_at) values (v_id, btrim(p_phone), now())
    on conflict (mentor_id) do update set phone = excluded.phone, updated_at = now();
  end if;
  perform public.refresh_mentor_ready(v_id);

  begin
    perform public.notify_email_address(
      v_user.email::text,
      'You''re verified as a MySkills mentor',
      public.notify_layout(
        'You''re verified as a MySkills mentor',
        public.notify_row('Hi', v_name)
        || public.notify_row('Next step',
             'Sign in to the Community portal and finish your profile: your title, bio, areas of expertise, LinkedIn, phone and a photo. Students can see and ask you once it is complete.'),
        'Open the Community portal',
        'https://myskills.org.in/community-portal/profile'
      )
    );
  exception when others then
    null;
  end;

  return v_id;
end;
$$;
revoke execute on function public.make_mentor(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Door 1: verify a sign-up (replaces the version that asked which existing
--    listing to link). p_mentor is kept so an older page still calls it; it is
--    ignored.
-- ---------------------------------------------------------------------------
create or replace function public.admin_review_portal_request(
  p_id       uuid,
  p_decision text,
  p_mentor   uuid default null,
  p_note     text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r      public.portal_requests;
  v_email text;
  v_name  text;
  v_note  text := nullif(btrim(p_note), '');
begin
  if not public.has_section_access('portal-access') then
    raise exception 'Not authorised.';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected.';
  end if;

  select * into r from public.portal_requests where id = p_id;
  if r.id is null then
    raise exception 'That request no longer exists.';
  end if;
  select u.email::text into v_email from auth.users u where u.id = r.user_id;
  select coalesce(p.full_name, split_part(v_email, '@', 1)) into v_name from public.profiles p where p.id = r.user_id;

  if p_decision = 'approved' then
    if r.role = 'mentor' then
      -- Creates their listing, tied to their account, and emails them.
      perform public.make_mentor(r.user_id, r.phone);
    else
      insert into public.community_access (user_id, resource, organisation, granted_by)
      values (r.user_id, r.role, r.organisation, auth.uid())
      on conflict (user_id, resource) do update set organisation = excluded.organisation;
    end if;
  elsif v_note is null then
    raise exception 'Say why, so the person knows what to do next.';
  end if;

  update public.portal_requests
     set status = p_decision, reviewed_by = auth.uid(), reviewed_at = now(), note = v_note
   where id = p_id;

  if p_decision = 'approved' and r.role <> 'mentor' then
    perform public.notify_email_address(
      v_email,
      'You''re verified for the MySkills Community portal',
      public.notify_layout(
        'You''re verified',
        public.notify_row('Hi', v_name)
        || public.notify_row('Next step', 'Sign in to the Community portal to see your section.')
        || public.notify_row('Note from the team', v_note),
        'Open the Community portal',
        'https://myskills.org.in/community-portal'
      )
    );
  elsif p_decision = 'rejected' then
    perform public.notify_email_address(
      v_email,
      'About your MySkills Community portal request',
      public.notify_layout(
        'We couldn''t verify your request',
        public.notify_row('Hi', v_name)
        || public.notify_row('From the team', v_note),
        'Contact MySkills',
        'https://myskills.org.in/community'
      )
    );
  end if;
end;
$$;
revoke execute on function public.admin_review_portal_request(uuid, text, uuid, text) from public, anon;
grant execute on function public.admin_review_portal_request(uuid, text, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Door 2: the team adds someone who already has a confirmed account
-- ---------------------------------------------------------------------------
create or replace function public.admin_add_mentor(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_user  uuid;
  v_id    uuid;
begin
  if not public.has_section_access('mentors') then
    raise exception 'Not authorised.';
  end if;

  select u.id into v_user from auth.users u where lower(u.email) = v_email;
  if v_user is null then
    raise exception 'No account uses that email yet. Send them the sign-up link; once they have signed up and confirmed their email they appear here to verify.';
  end if;
  if exists (select 1 from public.mentors m where m.profile_id = v_user) then
    raise exception 'That account is already a mentor.';
  end if;

  v_id := public.make_mentor(v_user);

  -- If they had also signed up and were waiting, that is now decided.
  update public.portal_requests
     set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), note = null
   where user_id = v_user and role = 'mentor' and status <> 'approved';

  return v_id;
end;
$$;
revoke execute on function public.admin_add_mentor(text) from public, anon;
grant execute on function public.admin_add_mentor(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Remove a mentor: the listing goes, and the account loses its mentor
--    section. Refused while students are waiting on or working with them.
-- ---------------------------------------------------------------------------
create or replace function public.admin_remove_mentor(p_mentor uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if not public.has_section_access('mentors') then
    raise exception 'Not authorised.';
  end if;
  select m.profile_id into v_user from public.mentors m where m.id = p_mentor;
  if not found then
    raise exception 'That mentor no longer exists.';
  end if;
  if exists (select 1 from public.mentor_matches mm where mm.mentor_id = p_mentor and mm.status in ('requested', 'active')) then
    raise exception 'This mentor has students waiting or working with them. Ask them to finish or end those first.';
  end if;

  delete from public.mentors where id = p_mentor;

  -- So their portal says where they stand instead of "waiting".
  if v_user is not null then
    update public.portal_requests
       set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
           note = 'Your mentor access was removed by the MySkills team. Contact us if you think this is a mistake.'
     where user_id = v_user and role = 'mentor';
  end if;
end;
$$;
revoke execute on function public.admin_remove_mentor(uuid) from public, anon;
grant execute on function public.admin_remove_mentor(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Shut the old doors
-- Each is skipped if that function was never created.
-- ---------------------------------------------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.approve_mentor_application(uuid)',
    'public.link_mentor_account(uuid, text)',
    'public.unlink_mentor_account(uuid)',
    'public.admin_reserve_mentor_email(uuid, text)',
    'public.admin_cancel_mentor_invite(uuid)',
    'public.admin_mentor_invites()',
    'public.claim_mentor_invite()'
  ] loop
    begin
      execute format('revoke execute on function %s from public, anon, authenticated', f);
    exception when undefined_function then
      raise notice 'Skipped % (not there).', f;
    end;
  end loop;
end $$;

-- An emailed address that was being held for a listing is no longer a way in.
drop table if exists public.mentor_invites;

-- Check: mentors as they stand, and whether each has an account.
select m.full_name, (m.profile_id is not null) as has_account, m.ready as profile_complete, u.email
  from public.mentors m left join auth.users u on u.id = m.profile_id
 order by m.created_at;
