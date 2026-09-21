-- Profile verification ("KYC") — students request a video call; the MySkills
-- team checks identity and each credential live, then marks what it saw proof
-- for. Only verified entries count toward the Career Readiness Score.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on: public.is_admin(), public.has_section_access() and
-- public.staff_permissions (docs/supabase-staff-permissions.sql, extended by
-- docs/supabase-wellness-requests.sql), and the notify_* helpers
-- (docs/supabase-email-notifications.sql).
--
-- PRIVACY BY DESIGN. Nothing a student shows on the call is stored: no ID
-- numbers, no scans, no marksheets, no recording. The database only records
-- THAT an item was verified, by whom, when — plus a snapshot of the entry as
-- it was when checked, so a later edit visibly lapses its verification. This
-- keeps MySkills out of Aadhaar-storage territory and keeps DPDP obligations
-- small. Please don't record verification calls.

-- ---------------------------------------------------------------------------
-- Extend staff_permissions with the 'verification' section
-- ---------------------------------------------------------------------------
alter table public.staff_permissions drop constraint if exists staff_permissions_section_check;
alter table public.staff_permissions add constraint staff_permissions_section_check
  check (section in (
    'users', 'assessment', 'certificates', 'feedback',
    'mentors', 'institution-partners', 'demo-requests', 'blog', 'ads', 'wellness',
    'verification'
  ));

create or replace function public.my_staff_sections()
returns text[]
language sql
security definer
set search_path = public
stable
as $$
  select case
    when public.is_admin() then array[
      'users', 'assessment', 'certificates', 'feedback',
      'mentors', 'institution-partners', 'demo-requests', 'blog', 'ads', 'wellness',
      'verification'
    ]
    else coalesce(
      (select array_agg(sp.section) from public.staff_permissions sp
        join auth.users u on u.id = sp.user_id
       where sp.user_id = auth.uid() and lower(u.email) like '%@myskills.org.in'),
      array[]::text[]
    )
  end;
$$;

-- ---------------------------------------------------------------------------
-- Requests: one open request per student at a time
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.verification_status as enum ('requested', 'scheduled', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.verification_requests (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  status          public.verification_status not null default 'requested',
  preferred_times text check (length(preferred_times) <= 500),
  phone           text check (length(phone) <= 32),
  -- DPDP: when the student agreed to the stated purpose and process.
  consent_at      timestamptz not null,
  scheduled_at    timestamptz,
  meeting_link    text check (meeting_link is null or meeting_link ~* '^https://'),
  -- Visible to the student (their own row) — so it's written TO them, never
  -- an internal note.
  note_to_student text check (length(note_to_student) <= 1000),
  handled_by      uuid references auth.users (id),
  completed_at    timestamptz
);

create unique index if not exists verification_requests_one_open
  on public.verification_requests (user_id)
  where status in ('requested', 'scheduled');

create index if not exists verification_requests_queue_idx
  on public.verification_requests (status, created_at);

alter table public.verification_requests enable row level security;

drop policy if exists "students request verification" on public.verification_requests;
create policy "students request verification"
  on public.verification_requests for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'requested'
    and scheduled_at is null
    and meeting_link is null
    and note_to_student is null
    and handled_by is null
    and completed_at is null
  );

drop policy if exists "students read own verification requests" on public.verification_requests;
create policy "students read own verification requests"
  on public.verification_requests for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "staff manage verification requests" on public.verification_requests;
create policy "staff manage verification requests"
  on public.verification_requests for all
  to authenticated
  using (public.has_section_access('verification'))
  with check (public.has_section_access('verification'));

-- A student may withdraw their own open request, and nothing else.
create or replace function public.cancel_my_verification_request()
returns void
language sql
security definer
set search_path = public
as $$
  update public.verification_requests
     set status = 'cancelled'
   where user_id = auth.uid() and status in ('requested', 'scheduled');
$$;
grant execute on function public.cancel_my_verification_request() to authenticated;

-- ---------------------------------------------------------------------------
-- Verified items: written only by staff. Students can read their own rows but
-- have no write policy at all — they cannot mark themselves verified.
-- ---------------------------------------------------------------------------
create table if not exists public.verified_items (
  user_id     uuid not null references auth.users (id) on delete cascade,
  item_type   text not null check (item_type in ('identity', 'education', 'experience', 'project')),
  -- The entry's id inside profiles.education/experience/projects, or 'self'
  -- for identity.
  item_id     text not null,
  -- The entry's key fields as they were when checked. The app compares this
  -- with the live entry; any edit lapses the verification until re-checked.
  snapshot    jsonb not null,
  verified_at timestamptz not null default now(),
  verified_by uuid references auth.users (id),
  request_id  uuid references public.verification_requests (id) on delete set null,
  primary key (user_id, item_type, item_id)
);

alter table public.verified_items enable row level security;

drop policy if exists "students read own verified items" on public.verified_items;
create policy "students read own verified items"
  on public.verified_items for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "staff manage verified items" on public.verified_items;
create policy "staff manage verified items"
  on public.verified_items for all
  to authenticated
  using (public.has_section_access('verification'))
  with check (public.has_section_access('verification'));

-- ---------------------------------------------------------------------------
-- Staff RPCs. profiles is own-row-only under RLS, so reviewers read the
-- candidate through these definer functions, gated on the section.
-- ---------------------------------------------------------------------------
create or replace function public.admin_verification_queue()
returns table (
  id uuid, created_at timestamptz, user_id uuid, status public.verification_status,
  preferred_times text, phone text, scheduled_at timestamptz, meeting_link text,
  note_to_student text, completed_at timestamptz, full_name text, email text
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.created_at, r.user_id, r.status, r.preferred_times, r.phone,
         r.scheduled_at, r.meeting_link, r.note_to_student, r.completed_at,
         p.full_name, u.email::text
    from public.verification_requests r
    join auth.users u on u.id = r.user_id
    left join public.profiles p on p.id = r.user_id
   where public.has_section_access('verification')
   order by (r.status in ('requested', 'scheduled')) desc, r.created_at asc;
$$;

create or replace function public.admin_verification_candidate(p_user uuid)
returns table (
  full_name text, email text, date_of_birth date,
  education jsonb, experience jsonb, projects jsonb, verified jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select p.full_name, u.email::text, p.date_of_birth,
         p.education, p.experience, p.projects,
         coalesce((select jsonb_agg(jsonb_build_object(
                     'item_type', v.item_type, 'item_id', v.item_id, 'snapshot', v.snapshot,
                     'verified_at', v.verified_at))
                     from public.verified_items v where v.user_id = p.id), '[]'::jsonb)
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.id = p_user
     and public.has_section_access('verification');
$$;

/** Record the outcome of a call in one transaction: upsert every item the
 *  reviewer ticked (with its snapshot), then close the request. */
create or replace function public.admin_complete_verification(
  p_request uuid,
  p_items jsonb,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_item jsonb;
begin
  if not public.has_section_access('verification') then
    raise exception 'not authorized';
  end if;

  select user_id into v_user from public.verification_requests where id = p_request;
  if v_user is null then
    raise exception 'verification request % not found', p_request;
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    insert into public.verified_items (user_id, item_type, item_id, snapshot, verified_by, request_id)
    values (v_user, v_item->>'item_type', v_item->>'item_id', v_item->'snapshot', auth.uid(), p_request)
    on conflict (user_id, item_type, item_id) do update
      set snapshot    = excluded.snapshot,
          verified_at = now(),
          verified_by = excluded.verified_by,
          request_id  = excluded.request_id;
  end loop;

  update public.verification_requests
     set status = 'completed', completed_at = now(), handled_by = auth.uid(),
         note_to_student = nullif(btrim(coalesce(p_note, '')), '')
   where id = p_request;
end;
$$;

grant execute on function public.admin_verification_queue() to authenticated;
grant execute on function public.admin_verification_candidate(uuid) to authenticated;
grant execute on function public.admin_complete_verification(uuid, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Email
-- ---------------------------------------------------------------------------

/** Same as notify_email, to any address — used to send the student their call
 *  details. Revoked from clients below, like notify_email. */
create or replace function public.notify_email_address(p_to text, p_subject text, p_html text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if v_key is null or btrim(v_key) = '' or p_to is null then
    raise warning 'notify_email_address: skipped "%"', p_subject;
    return;
  end if;

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object(
      'from', public.notify_email_from(),
      'to', jsonb_build_array(p_to),
      'subject', p_subject,
      'html', p_html
    )
  );
exception when others then
  raise warning 'notify_email_address failed for "%": %', p_subject, sqlerrm;
end;
$$;
revoke execute on function public.notify_email_address(text, text, text) from public, anon, authenticated;

create or replace function public.notify_verification_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_email text;
begin
  select p.full_name into v_name from public.profiles p where p.id = new.user_id;
  select u.email into v_email from auth.users u where u.id = new.user_id;

  if tg_op = 'INSERT' then
    perform public.notify_email(
      format('[MySkills · Verification] %s requested profile verification', coalesce(v_name, 'A learner')),
      public.notify_layout(
        'New verification request',
        public.notify_row('Name', v_name)
        || public.notify_row('Email', v_email)
        || public.notify_row('Phone', new.phone)
        || public.notify_row('Preferred times', new.preferred_times),
        'Open the verification queue',
        'https://myskills.org.in/admin/verification'
      )
    );
  elsif new.status = 'scheduled' and new.scheduled_at is not null
        and (old.status is distinct from 'scheduled' or old.scheduled_at is distinct from new.scheduled_at
             or old.meeting_link is distinct from new.meeting_link) then
    perform public.notify_email_address(
      v_email,
      'Your MySkills verification call is booked',
      public.notify_layout(
        'Your verification call is booked',
        public.notify_row('When', to_char(new.scheduled_at at time zone 'Asia/Kolkata', 'Dy DD Mon YYYY, HH12:MI AM') || ' IST')
        || public.notify_row('Please have ready', 'A government photo ID, plus proof for each qualification and role on your profile (certificates, marksheets, offer or experience letters).')
        || public.notify_row('Privacy', 'You''ll show these on camera. We don''t record the call or keep copies of your documents.'),
        'Join the call',
        coalesce(new.meeting_link, 'https://myskills.org.in/profile')
      )
    );
  end if;
  return null;
end;
$$;

drop trigger if exists verification_requests_notify on public.verification_requests;
create trigger verification_requests_notify
  after insert or update on public.verification_requests
  for each row execute function public.notify_verification_request();

-- ---------------------------------------------------------------------------
-- Grant a teammate the Verification section:
--   insert into public.staff_permissions (user_id, section)
--   select id, 'verification' from auth.users where email = 'someone@myskills.org.in'
--   on conflict (user_id, section) do nothing;
-- ---------------------------------------------------------------------------
