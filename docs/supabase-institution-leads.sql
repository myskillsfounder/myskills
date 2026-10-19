-- Institution leads: a student's interest in an institution, worked by the
-- MySkills team from first call to enrolment.
--
-- THE STUDENT: "I'm interested" on an institution sends a lead: which
-- institution and course, their contact (from their account), when suits them
-- and a note. One open enquiry per student per institution. They see a simple
-- status for it (sent, contacted, visit scheduled, enrolled, closed); never
-- the team's notes, owner or reasons.
--
-- THE TEAM (Admin > Leads > Institution leads, the 'demo-requests' section):
-- each lead has a stage, an owner, a follow-up date and a notes history.
--   new        just in, nobody has called
--   contacted  the team has spoken to the student
--   visit      a visit or counselling session is booked
--   enrolled   the student joined the institution
--   lost       closed without enrolling, with the reason
-- New leads, and follow-ups due today or earlier, are in the Inbox. Every
-- change is in the activity log. Leads stay with the team: the institution
-- does not see them in the app (Paul's decision).
--
-- Everything that came in through the old "Get pricing" form
-- (institution_demo_requests) is copied in, once, with its status mapped. The
-- old table is left as it is.
--
-- Run once; BEFORE the deploy (the new form and page call these functions;
-- run after, "I'm interested" would fail until it is run). Safe to re-run.
-- Depends on: docs/supabase-institution-partner-onboarding.sql,
-- -institution-partner-courses.sql, -institution-demo-requests.sql,
-- -staff-permissions.sql (has_section_access), -email-notifications.sql,
-- -activity-log.sql (optional: the log trigger is added when it exists).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.institution_leads (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  student_id       uuid references auth.users (id) on delete set null,
  institution_id   uuid references public.institution_partners (id) on delete set null,
  -- The institution's name when the lead came in, kept if it is ever removed.
  institution_name text not null check (length(btrim(institution_name)) between 1 and 160),
  course           text check (length(course) <= 160),
  full_name        text not null check (length(btrim(full_name)) between 1 and 120),
  email            text not null check (length(email) <= 320),
  phone            text check (length(phone) <= 32),
  city             text check (length(city) <= 80),
  preferred_time   text check (length(preferred_time) <= 80),
  message          text check (length(message) <= 2000),
  stage            text not null default 'new' check (stage in ('new', 'contacted', 'visit', 'enrolled', 'lost')),
  stage_changed_at timestamptz not null default now(),
  lost_reason      text check (length(lost_reason) <= 300),
  owner_id         uuid references auth.users (id) on delete set null,
  follow_up_on     date,
  source           text not null default 'community' check (length(source) <= 40),
  -- The old "Get pricing" request this was copied from.
  legacy_id        uuid unique
);
create index if not exists institution_leads_stage_idx on public.institution_leads (stage, created_at desc);
create index if not exists institution_leads_student_idx on public.institution_leads (student_id);
-- One open enquiry per student per institution.
create unique index if not exists institution_leads_one_open
  on public.institution_leads (student_id, institution_id)
  where stage in ('new', 'contacted', 'visit') and student_id is not null and institution_id is not null;
-- Read and written only through the functions below.
alter table public.institution_leads enable row level security;

create table if not exists public.institution_lead_notes (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id    uuid not null references public.institution_leads (id) on delete cascade,
  author_id  uuid references auth.users (id) on delete set null,
  body       text not null check (length(btrim(body)) between 1 and 2000)
);
create index if not exists institution_lead_notes_lead_idx on public.institution_lead_notes (lead_id, created_at);
alter table public.institution_lead_notes enable row level security;

-- ---------------------------------------------------------------------------
-- The student
-- ---------------------------------------------------------------------------
create or replace function public.enquire_institution(
  p_institution uuid, p_course text, p_phone text, p_city text, p_preferred text, p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inst public.institution_partners;
  v_name text;
  v_email text;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to enquire.';
  end if;
  select * into v_inst from public.institution_partners where id = p_institution;
  if v_inst.id is null then
    raise exception 'That institution is no longer listed.';
  end if;
  if exists (select 1 from public.institution_leads l
              where l.student_id = auth.uid() and l.institution_id = p_institution
                and l.stage in ('new', 'contacted', 'visit')) then
    raise exception 'You already have an enquiry open with %. The MySkills team will be in touch.', v_inst.legal_name;
  end if;
  if length(coalesce(p_message, '')) > 2000 then
    raise exception 'Keep your note under 2,000 characters.';
  end if;

  select coalesce(nullif(btrim(p.full_name), ''), split_part(u.email, '@', 1)), u.email::text
    into v_name, v_email
    from auth.users u left join public.profiles p on p.id = u.id
   where u.id = auth.uid();

  insert into public.institution_leads
    (student_id, institution_id, institution_name, course, full_name, email, phone, city, preferred_time, message)
  values
    (auth.uid(), p_institution, v_inst.legal_name, nullif(btrim(coalesce(p_course, '')), ''), v_name, v_email,
     nullif(btrim(coalesce(p_phone, '')), ''), nullif(btrim(coalesce(p_city, '')), ''),
     nullif(btrim(coalesce(p_preferred, '')), ''), nullif(btrim(coalesce(p_message, '')), ''))
  returning id into v_id;

  begin
    perform public.notify_email(
      format('New institution lead: %s', v_inst.legal_name),
      public.notify_layout('A student is interested in an institution',
        public.notify_row('Student', v_name) || public.notify_row('Institution', v_inst.legal_name)
        || public.notify_row('Course', coalesce(nullif(btrim(coalesce(p_course, '')), ''), 'Not said')),
        'Open the lead', 'https://myskills.org.in/admin/institution-leads'));
  exception when others then
    null;
  end;
  return v_id;
end;
$$;
revoke execute on function public.enquire_institution(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.enquire_institution(uuid, text, text, text, text, text) to authenticated;

-- The student's own enquiries: status only, never the team's notes or reasons.
create or replace function public.my_institution_enquiries()
returns table (id uuid, created_at timestamptz, institution_id uuid, institution_name text, course text,
               stage text, stage_changed_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select l.id, l.created_at, l.institution_id, l.institution_name, l.course, l.stage, l.stage_changed_at
    from public.institution_leads l
   where l.student_id = auth.uid()
   order by l.created_at desc;
$$;
revoke execute on function public.my_institution_enquiries() from public, anon;
grant execute on function public.my_institution_enquiries() to authenticated;

-- ---------------------------------------------------------------------------
-- The team
-- ---------------------------------------------------------------------------
create or replace function public.admin_institution_leads()
returns table (
  id uuid, created_at timestamptz, updated_at timestamptz, student_id uuid, institution_id uuid,
  institution_name text, course text, full_name text, email text, phone text, city text,
  preferred_time text, message text, stage text, stage_changed_at timestamptz, lost_reason text,
  owner_id uuid, owner_name text, follow_up_on date, source text, notes int, last_note_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('demo-requests') then
    raise exception 'Not authorised.';
  end if;
  return query
  select l.id, l.created_at, l.updated_at, l.student_id, l.institution_id, l.institution_name, l.course,
         l.full_name, l.email, l.phone, l.city, l.preferred_time, l.message, l.stage, l.stage_changed_at,
         l.lost_reason, l.owner_id,
         coalesce(nullif(btrim(op.full_name), ''), split_part(ou.email, '@', 1)),
         l.follow_up_on, l.source,
         (select count(*)::int from public.institution_lead_notes n where n.lead_id = l.id),
         (select max(n.created_at) from public.institution_lead_notes n where n.lead_id = l.id)
    from public.institution_leads l
    left join auth.users ou on ou.id = l.owner_id
    left join public.profiles op on op.id = l.owner_id
   order by l.created_at desc;
end;
$$;
revoke execute on function public.admin_institution_leads() from public, anon;
grant execute on function public.admin_institution_leads() to authenticated;

-- Set a lead's stage, owner, follow-up and (for a lost lead) the reason, as one.
create or replace function public.admin_update_institution_lead(
  p_id uuid, p_stage text, p_owner uuid, p_follow_up date, p_lost_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  l public.institution_leads;
begin
  if not public.has_section_access('demo-requests') then
    raise exception 'Not authorised.';
  end if;
  if p_stage not in ('new', 'contacted', 'visit', 'enrolled', 'lost') then
    raise exception 'Unknown stage.';
  end if;
  if p_stage = 'lost' and length(btrim(coalesce(p_lost_reason, ''))) < 2 then
    raise exception 'Say why the lead was closed.';
  end if;
  if p_owner is not null and not (
       exists (select 1 from public.admins a where a.user_id = p_owner)
       or exists (select 1 from public.staff_permissions sp where sp.user_id = p_owner and sp.section = 'demo-requests')) then
    raise exception 'That person can''t work institution leads.';
  end if;
  select * into l from public.institution_leads where id = p_id for update;
  if l.id is null then
    raise exception 'That lead no longer exists.';
  end if;
  update public.institution_leads
     set stage = p_stage,
         stage_changed_at = case when p_stage is distinct from l.stage then now() else l.stage_changed_at end,
         owner_id = p_owner,
         follow_up_on = case when p_stage in ('enrolled', 'lost') then null else p_follow_up end,
         lost_reason = case when p_stage = 'lost' then btrim(p_lost_reason) else null end,
         updated_at = now()
   where id = p_id;
end;
$$;
revoke execute on function public.admin_update_institution_lead(uuid, text, uuid, date, text) from public, anon;
grant execute on function public.admin_update_institution_lead(uuid, text, uuid, date, text) to authenticated;

create or replace function public.admin_institution_lead_notes(p_id uuid)
returns table (id uuid, created_at timestamptz, author_name text, body text)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('demo-requests') then
    raise exception 'Not authorised.';
  end if;
  return query
  select n.id, n.created_at, coalesce(nullif(btrim(p.full_name), ''), split_part(u.email, '@', 1), 'Someone'), n.body
    from public.institution_lead_notes n
    left join auth.users u on u.id = n.author_id
    left join public.profiles p on p.id = n.author_id
   where n.lead_id = p_id
   order by n.created_at desc;
end;
$$;
revoke execute on function public.admin_institution_lead_notes(uuid) from public, anon;
grant execute on function public.admin_institution_lead_notes(uuid) to authenticated;

create or replace function public.admin_add_institution_lead_note(p_id uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_section_access('demo-requests') then
    raise exception 'Not authorised.';
  end if;
  if length(btrim(coalesce(p_body, ''))) < 1 then
    raise exception 'Write the note first.';
  end if;
  insert into public.institution_lead_notes (lead_id, author_id, body) values (p_id, auth.uid(), btrim(p_body));
  update public.institution_leads set updated_at = now() where id = p_id;
end;
$$;
revoke execute on function public.admin_add_institution_lead_note(uuid, text) from public, anon;
grant execute on function public.admin_add_institution_lead_note(uuid, text) to authenticated;

-- Who a lead can be given to: super admins and everyone with the section.
create or replace function public.admin_institution_lead_owners()
returns table (user_id uuid, name text)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('demo-requests') then
    raise exception 'Not authorised.';
  end if;
  return query
  select distinct u.id, coalesce(nullif(btrim(p.full_name), ''), u.email::text)
    from auth.users u
    left join public.profiles p on p.id = u.id
   where exists (select 1 from public.admins a where a.user_id = u.id)
      or exists (select 1 from public.staff_permissions sp where sp.user_id = u.id and sp.section = 'demo-requests')
   order by 2;
end;
$$;
revoke execute on function public.admin_institution_lead_owners() from public, anon;
grant execute on function public.admin_institution_lead_owners() to authenticated;

-- For the Inbox: new leads, and follow-ups due today or earlier.
create or replace function public.admin_inbox_institution_leads()
returns table (kind text, ref uuid, title text, detail text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select 'institution-lead', l.id, l.full_name, l.institution_name, l.created_at
    from public.institution_leads l
   where l.stage = 'new' and public.has_section_access('demo-requests')
  union all
  select 'lead-follow-up', l.id, l.full_name, l.institution_name, l.follow_up_on::timestamptz
    from public.institution_leads l
   where l.stage in ('contacted', 'visit') and l.follow_up_on <= current_date
     and public.has_section_access('demo-requests');
$$;
revoke execute on function public.admin_inbox_institution_leads() from public, anon;
grant execute on function public.admin_inbox_institution_leads() to authenticated;

-- ---------------------------------------------------------------------------
-- Carry over the old "Get pricing" requests, once
-- ---------------------------------------------------------------------------
insert into public.institution_leads
  (created_at, updated_at, student_id, institution_id, institution_name, full_name, email, phone, city, message,
   stage, stage_changed_at, source, legacy_id)
select d.created_at, coalesce(d.contacted_at, d.created_at), d.requested_by,
       (select ip.id from public.institution_partners ip where lower(btrim(ip.legal_name)) = lower(btrim(d.partner)) limit 1),
       d.partner, d.full_name, d.email, d.phone, d.city,
       nullif(concat_ws(' · ', d.message,
                        case when d.role is not null then 'Role: ' || d.role end,
                        case when d.institution is not null then 'Organisation: ' || d.institution end,
                        case when d.student_count is not null then d.student_count || ' students' end), ''),
       case d.status::text when 'pending' then 'new' when 'contacted' then 'contacted'
                           when 'scheduled' then 'visit' else 'lost' end,
       coalesce(d.contacted_at, d.created_at),
       'get-pricing', d.id
  from public.institution_demo_requests d
on conflict (legacy_id) do nothing;
-- A copied "closed" request needs its reason.
update public.institution_leads set lost_reason = 'Closed in the old Demo requests list'
 where legacy_id is not null and stage = 'lost' and lost_reason is null;

-- ---------------------------------------------------------------------------
-- The activity log (when docs/supabase-activity-log.sql is in)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.log_admin_activity()') is not null then
    drop trigger if exists log_admin_activity on public.institution_leads;
    create trigger log_admin_activity after insert or update or delete on public.institution_leads
      for each row execute function public.log_admin_activity('institution_name', 'student_id', '');
    drop trigger if exists log_admin_activity on public.institution_lead_notes;
    create trigger log_admin_activity after insert or delete on public.institution_lead_notes
      for each row execute function public.log_admin_activity('', '', '');
  end if;
end $$;

-- Check: how many leads, by stage.
select stage, count(*) from public.institution_leads group by stage order by 1;
