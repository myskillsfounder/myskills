-- Community portal sign-up, with verification before any access.
--
-- Anyone can create a Community portal account (/community-portal/signup), but
-- an account on its own opens nothing. Access needs two checks:
--
--   1. The email address is confirmed (the emailed 6-digit code, same as the
--      student sign-up). A request can't be filed before that.
--   2. A member of the MySkills team verifies the person and approves the
--      request in Admin > Community > Portal access & usage. Approving is what
--      gives access: a mentor is linked to their listing, anyone else is granted
--      their section. Until then the portal only says "waiting for
--      verification". Rejecting leaves them with no access and a message.
--
-- What someone asks for (mentor, counsellor, career guide, company, institution)
-- is a request, not an entitlement: the team decides, and can approve something
-- different from what was asked by granting access in Portal access & usage.
--
-- Portal sign-ups are kept out of the Admin "All students" list: they have a
-- profile (the mentor link needs one) but they are not students.
--
-- Run once, AFTER docs/supabase-admin-inbox.sql and the Community portal SQL
-- files. Safe to re-run. Order against the deploy doesn't matter: until it is
-- run the portal sign-up page says it isn't set up yet.

-- ---------------------------------------------------------------------------
-- The requests
-- ---------------------------------------------------------------------------
create table if not exists public.portal_requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  user_id      uuid not null unique references auth.users (id) on delete cascade,
  role         text not null check (role in ('mentor', 'wellness', 'guidance', 'internships', 'institutions')),
  organisation text check (length(organisation) <= 160),
  phone        text check (length(phone) <= 32),
  message      text check (length(message) <= 1000),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by  uuid references auth.users (id),
  reviewed_at  timestamptz,
  -- Written to the person (shown to them, and emailed), never an internal note.
  note         text check (length(note) <= 1000)
);

create index if not exists portal_requests_status_idx on public.portal_requests (status, created_at);

alter table public.portal_requests enable row level security;

-- You can read your own request; every write goes through a function.
drop policy if exists "read own portal request" on public.portal_requests;
create policy "read own portal request"
  on public.portal_requests for select
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Is this account a portal sign-up (so not a student)?
-- ---------------------------------------------------------------------------
create or replace function public.is_portal_account(p_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.portal_requests r where r.user_id = p_user);
$$;
revoke execute on function public.is_portal_account(uuid) from public, anon;
grant execute on function public.is_portal_account(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- File a request (the person, once their email is confirmed)
-- The details come from what they typed at sign-up (kept with their account) or
-- from the arguments, if given. Safe to call again: it never overwrites.
-- Returns 'pending', 'approved' or 'rejected'.
-- ---------------------------------------------------------------------------
create or replace function public.submit_portal_request(
  p_role         text default null,
  p_organisation text default null,
  p_phone        text default null,
  p_message      text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_user  auth.users;
  v_meta  jsonb;
  v_req   jsonb;
  v_role  text;
  v_org   text;
  v_phone text;
  v_msg   text;
  v_name  text;
  v_status text;
begin
  if v_uid is null then
    raise exception 'You are not signed in.';
  end if;

  select * into v_user from auth.users where id = v_uid;
  if v_user.email_confirmed_at is null then
    raise exception 'Confirm your email address first.';
  end if;

  -- Already has access, or already asked: report where it stands.
  if exists (select 1 from public.mentors m where m.profile_id = v_uid)
     or exists (select 1 from public.community_access a where a.user_id = v_uid) then
    return 'approved';
  end if;
  select r.status into v_status from public.portal_requests r where r.user_id = v_uid;
  if found then
    return v_status;
  end if;

  v_meta := coalesce(v_user.raw_user_meta_data, '{}'::jsonb);
  v_req  := coalesce(v_meta -> 'portal_request', '{}'::jsonb);
  v_role  := coalesce(nullif(btrim(p_role), ''), v_req ->> 'role');
  v_org   := nullif(btrim(coalesce(p_organisation, v_req ->> 'organisation', '')), '');
  v_phone := nullif(btrim(coalesce(p_phone, v_req ->> 'phone', '')), '');
  v_msg   := nullif(btrim(coalesce(p_message, v_req ->> 'message', '')), '');
  v_name  := coalesce(nullif(btrim(v_meta ->> 'name'), ''), split_part(v_user.email, '@', 1));

  if v_role is null or v_role not in ('mentor', 'wellness', 'guidance', 'internships', 'institutions') then
    raise exception 'Say what you do: mentor, counsellor, career guide, company or institution.';
  end if;
  if v_role in ('internships', 'institutions') and coalesce(length(v_org), 0) < 2 then
    raise exception 'Add the name of your company or institution.';
  end if;
  if v_phone is not null and v_phone !~ '^[0-9+() -]{7,20}$' then
    raise exception 'Enter a phone number with digits, spaces, + or - only.';
  end if;

  -- A profile row: linking a mentor needs one. They are kept out of the
  -- students list by is_portal_account.
  insert into public.profiles (id, full_name, phone)
  values (v_uid, v_name, v_phone)
  on conflict (id) do nothing;

  insert into public.portal_requests (user_id, role, organisation, phone, message)
  values (v_uid, v_role, v_org, v_phone, v_msg);

  perform public.notify_email(
    format('[MySkills · Portal sign-up] %s asked for access', v_name),
    public.notify_layout(
      'A Community portal sign-up to verify',
      public.notify_row('Name', v_name)
      || public.notify_row('Email', v_user.email)
      || public.notify_row('Asking to be', case v_role when 'mentor' then 'a mentor' when 'wellness' then 'a counsellor'
                                            when 'guidance' then 'a career guide' when 'internships' then 'a company offering internships'
                                            else 'a training institution' end)
      || public.notify_row('Organisation', v_org)
      || public.notify_row('Phone', v_phone)
      || public.notify_row('Message', v_msg),
      'Verify and decide',
      'https://myskills.org.in/admin/community-portal'
    )
  );

  return 'pending';
end;
$$;
revoke execute on function public.submit_portal_request(text, text, text, text) from public, anon;
grant execute on function public.submit_portal_request(text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- The person's own request
-- ---------------------------------------------------------------------------
create or replace function public.my_portal_request()
returns table (status text, role text, organisation text, created_at timestamptz, note text)
language sql
security definer
set search_path = public
stable
as $$
  select r.status, r.role, r.organisation, r.created_at, r.note
    from public.portal_requests r where r.user_id = auth.uid();
$$;
revoke execute on function public.my_portal_request() from public, anon;
grant execute on function public.my_portal_request() to authenticated;

-- ---------------------------------------------------------------------------
-- The team: the requests waiting for verification
-- ---------------------------------------------------------------------------
create or replace function public.admin_portal_requests()
returns table (
  id            uuid,
  created_at    timestamptz,
  user_id       uuid,
  full_name     text,
  email         text,
  role          text,
  organisation  text,
  phone         text,
  message       text,
  status        text,
  note          text,
  reviewed_at   timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('portal-access') then
    raise exception 'Not authorised.';
  end if;
  return query
  select r.id, r.created_at, r.user_id, p.full_name, u.email::text, r.role, r.organisation, r.phone,
         r.message, r.status, r.note, r.reviewed_at
    from public.portal_requests r
    left join public.profiles p on p.id = r.user_id
    left join auth.users u on u.id = r.user_id
   order by (r.status = 'pending') desc, r.created_at desc;
end;
$$;
revoke execute on function public.admin_portal_requests() from public, anon;
grant execute on function public.admin_portal_requests() to authenticated;

-- ---------------------------------------------------------------------------
-- The team: verify and decide
-- Approving gives the access: a mentor is linked to the listing the team picks
-- (so it needs the Mentors section too); anyone else is granted their section.
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
      if p_mentor is null then
        raise exception 'Choose which mentor listing this person is. Add the listing first (Mentors > Listed mentors > Add a mentor) if they are not listed yet.';
      end if;
      -- Checks the Mentors section, that the account has a profile, and that it is not linked elsewhere.
      perform public.link_mentor_account(p_mentor, v_email);
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

  -- A mentor is emailed by the link itself; everyone else is told here.
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
-- Not students: leave portal sign-ups out of the Admin students list.
-- Done by rewriting the live admin_students() definition, so the rest of the
-- function isn't copied here or changed. Skipped with a notice if its text has
-- changed shape.
-- ---------------------------------------------------------------------------
do $$
declare
  d text := pg_get_functiondef('public.admin_students(text, int)'::regprocedure);
begin
  if position('is_portal_account' in d) > 0 then
    return;
  end if;
  if position($a$where p_search is null or btrim(p_search) = ''$a$ in d) = 0
     or position($b$or u.email ilike '%' || btrim(p_search) || '%'$b$ in d) = 0 then
    raise notice 'admin_students() has a different shape; portal sign-ups are not hidden from the students list.';
    return;
  end if;
  d := replace(d, $a$where p_search is null or btrim(p_search) = ''$a$,
                  $a$where not public.is_portal_account(p.id) and (p_search is null or btrim(p_search) = ''$a$);
  d := replace(d, $b$or u.email ilike '%' || btrim(p_search) || '%'$b$,
                  $b$or u.email ilike '%' || btrim(p_search) || '%')$b$);
  execute d;
end $$;

-- ---------------------------------------------------------------------------
-- The Inbox: sign-ups waiting to be verified (rewrites the live admin_inbox()).
-- ---------------------------------------------------------------------------
do $$
declare
  d text := pg_get_functiondef('public.admin_inbox()'::regprocedure);
begin
  if position('portal-request' in d) > 0 then
    return;
  end if;
  if position('order by 5 asc;' in d) = 0 then
    raise notice 'admin_inbox() has a different shape; portal sign-ups are not added to the Inbox.';
    return;
  end if;
  d := replace(d, 'order by 5 asc;', $c$union all
  select 'portal-request', r.id, coalesce(p.full_name, u.email::text, 'A new sign-up'),
         case r.role when 'mentor' then 'Mentor' when 'wellness' then 'Counsellor' when 'guidance' then 'Career guide'
                     when 'internships' then 'Company' else 'Institution' end
           || coalesce(' · ' || nullif(r.organisation, ''), ''),
         r.created_at
    from public.portal_requests r
    left join public.profiles p on p.id = r.user_id
    left join auth.users u on u.id = r.user_id
   where r.status = 'pending' and public.has_section_access('portal-access')

  order by 5 asc;$c$);
  execute d;
end $$;
