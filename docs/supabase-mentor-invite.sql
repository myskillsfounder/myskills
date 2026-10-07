-- Link a listed mentor to an email BEFORE they have an account.
--
-- A mentor can be listed in Community (added by the team, or approved from an
-- application) long before they ever sign in. Until now their listing could
-- only be linked to an account that already existed, so the team was stuck:
-- "No account uses that email."
--
-- Now the team can reserve an email on the listing. Nothing else is needed:
--   * if an account with that email already exists, it is linked straight away
--     (exactly as before);
--   * if not, the email is held for that listing, and the moment someone signs
--     up with it, confirms it, and opens the Community portal, they are linked
--     to the listing and land on their mentor profile.
--
-- Is that still verified? Yes. The team has named the person by putting their
-- email on the listing (which needs the Mentors section), and the email has to
-- be confirmed with the emailed code before the link happens. It replaces the
-- second "verify" click for people the team has already vouched for; anyone
-- who signs up WITHOUT a reserved email still waits for verification.
--
-- Run once, after docs/supabase-mentor-portal.sql and
-- docs/supabase-portal-signup.sql. Safe to re-run. Until it is run, the admin
-- page links existing accounts only, as before.

create table if not exists public.mentor_invites (
  mentor_id  uuid primary key references public.mentors (id) on delete cascade,
  email      text not null check (length(email) between 5 and 254),
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
-- One listing per email.
create unique index if not exists mentor_invites_email_idx on public.mentor_invites (lower(email));

-- No policies: read and written only through the functions below.
alter table public.mentor_invites enable row level security;

-- ---------------------------------------------------------------------------
-- The team: put an email on a listing
-- Returns 'linked' (an account existed and is now linked) or 'reserved'.
-- ---------------------------------------------------------------------------
create or replace function public.admin_reserve_mentor_email(p_mentor uuid, p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   text := lower(btrim(coalesce(p_email, '')));
  v_current uuid;
  v_user    uuid;
  v_other   text;
begin
  if not public.has_section_access('mentors') then
    raise exception 'not authorized';
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a full email address.';
  end if;

  select m.profile_id into v_current from public.mentors m where m.id = p_mentor;
  if not found then
    raise exception 'That mentor no longer exists.';
  end if;
  if v_current is not null then
    raise exception 'This mentor is already linked to an account. Unlink it first to change the email.';
  end if;

  -- An account that is ready to be linked: do it now, as before.
  select u.id into v_user from auth.users u where lower(u.email) = v_email;
  if v_user is not null and exists (select 1 from public.profiles pr where pr.id = v_user) then
    perform public.link_mentor_account(p_mentor, v_email);
    delete from public.mentor_invites i where i.mentor_id = p_mentor;
    return 'linked';
  end if;

  select m.full_name into v_other
    from public.mentor_invites i join public.mentors m on m.id = i.mentor_id
   where lower(i.email) = v_email and i.mentor_id <> p_mentor;
  if found then
    raise exception 'That email is already reserved for %.', v_other;
  end if;

  insert into public.mentor_invites (mentor_id, email, invited_by)
  values (p_mentor, v_email, auth.uid())
  on conflict (mentor_id) do update
    set email = excluded.email, invited_by = excluded.invited_by, created_at = now();
  return 'reserved';
end;
$$;
revoke execute on function public.admin_reserve_mentor_email(uuid, text) from public, anon;
grant execute on function public.admin_reserve_mentor_email(uuid, text) to authenticated;

create or replace function public.admin_cancel_mentor_invite(p_mentor uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_section_access('mentors') then
    raise exception 'not authorized';
  end if;
  delete from public.mentor_invites i where i.mentor_id = p_mentor;
end;
$$;
revoke execute on function public.admin_cancel_mentor_invite(uuid) from public, anon;
grant execute on function public.admin_cancel_mentor_invite(uuid) to authenticated;

-- The emails being held, for the Mentors page.
create or replace function public.admin_mentor_invites()
returns table (mentor_id uuid, email text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not public.has_section_access('mentors') then
    raise exception 'not authorized';
  end if;
  return query select i.mentor_id, i.email, i.created_at from public.mentor_invites i;
end;
$$;
revoke execute on function public.admin_mentor_invites() from public, anon;
grant execute on function public.admin_mentor_invites() to authenticated;

-- ---------------------------------------------------------------------------
-- The mentor: claim the listing held for my email
-- Called when the Community portal opens for an account with no access yet.
-- True when it linked them.
-- ---------------------------------------------------------------------------
create or replace function public.claim_mentor_invite()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_user   auth.users;
  v_invite public.mentor_invites;
  v_name   text;
  v_linked int;
begin
  if v_uid is null then
    return false;
  end if;
  select * into v_user from auth.users where id = v_uid;
  -- The email must be proven to be theirs.
  if v_user.email_confirmed_at is null then
    return false;
  end if;

  select * into v_invite from public.mentor_invites i where lower(i.email) = lower(v_user.email);
  if not found then
    return false;
  end if;
  -- Already a mentor under another listing: nothing to claim.
  if exists (select 1 from public.mentors m where m.profile_id = v_uid) then
    return false;
  end if;

  select m.full_name into v_name from public.mentors m where m.id = v_invite.mentor_id;

  -- A profile row: a mentor's account needs one.
  insert into public.profiles (id, full_name)
  values (v_uid, coalesce(nullif(btrim(v_user.raw_user_meta_data ->> 'name'), ''), v_name))
  on conflict (id) do nothing;

  -- Only if the listing is still free.
  update public.mentors set profile_id = v_uid where id = v_invite.mentor_id and profile_id is null;
  get diagnostics v_linked = row_count;
  if v_linked = 0 then
    return false;
  end if;

  delete from public.mentor_invites i where i.mentor_id = v_invite.mentor_id;
  perform public.refresh_mentor_ready(v_invite.mentor_id);

  -- Record it as an approved portal account: kept out of the students list, and
  -- a sign-up request they filed a moment ago stops waiting for a decision.
  begin
    insert into public.portal_requests (user_id, role, status, reviewed_by, reviewed_at)
    values (v_uid, 'mentor', 'approved', v_invite.invited_by, now())
    on conflict (user_id) do update
      set status = 'approved', reviewed_by = excluded.reviewed_by, reviewed_at = now()
      where public.portal_requests.status = 'pending';
  exception when others then
    null;
  end;

  -- Tell the team it happened. Never a reason to fail the link.
  begin
    perform public.notify_email(
      format('[MySkills · Mentors] %s signed up and is linked', v_name),
      public.notify_layout(
        'A mentor you invited has signed up',
        public.notify_row('Mentor', v_name)
        || public.notify_row('Email', v_user.email)
        || public.notify_row('What happened', 'They signed up with the email reserved on their listing and confirmed it, so they were linked automatically. Students can ask them once their profile is complete.'),
        'Open Mentors',
        'https://myskills.org.in/admin/mentors'
      )
    );
  exception when others then
    null;
  end;

  return true;
end;
$$;
revoke execute on function public.claim_mentor_invite() from public, anon;
grant execute on function public.claim_mentor_invite() to authenticated;
