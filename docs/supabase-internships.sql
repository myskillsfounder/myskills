-- Internships through MySkills: roles, applications, offers and sign-off.
--
-- THE FLOW
--   1. A verified company (an account with the 'internships' section of the
--      Community portal) writes a role. It waits for the MySkills team.
--   2. The team approves it (Admin > Internship roles) and it goes live to
--      students, or sends it back with a note.
--   3. A student who has taken an aptitude assessment applies, with a short
--      note. APPLYING IS THE STUDENT'S CONSENT: the company sees their name,
--      headline, Global Readiness Score, certificates and note. Their email and
--      phone are shown only once the company shortlists or makes an offer.
--   4. The company shortlists, offers, or says no. The student accepts or
--      declines an offer. Accepting starts the internship and puts the student
--      on the company's "Interning now" list (community_engagements), where
--      the student can stop sharing at any time.
--   5. When it ends, the company marks it complete with the supervisor's name.
--      The team confirms that, and only then is it written to
--      internship_signoffs, which is what the Global Readiness Score reads: the
--      student's FIRST signed-off internship is worth 20 points.
--
-- Nothing here changes how the score is worked out.
--
-- Run once in the Supabase SQL editor, then deploy. Safe to re-run.
-- Depends on: docs/supabase-community-portal.sql, -overview.sql,
-- docs/supabase-community-consent.sql (responded_at),
-- docs/supabase-programme-projects.sql (internship_signoffs),
-- docs/supabase-admin-team.sql (has_section_access), and the email functions
-- (notify_email, notify_email_address, notify_layout, notify_row).

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
create table if not exists public.internship_roles (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- The company account that posted it.
  provider_id    uuid not null references auth.users (id) on delete cascade,
  title          text not null check (length(btrim(title)) between 4 and 120),
  description    text not null check (length(btrim(description)) between 40 and 3000),
  skills         text[] not null default '{}' check (cardinality(skills) <= 8),
  mode           text not null default 'remote' check (mode in ('remote', 'onsite', 'hybrid')),
  location       text check (length(location) <= 80),
  duration_weeks int not null check (duration_weeks between 1 and 52),
  -- Free text ("Rs 5,000 a month"); empty means unpaid.
  stipend        text check (length(stipend) <= 80),
  openings       int not null default 1 check (openings between 1 and 50),
  apply_by       date,
  -- pending: waiting for the team. live: students can see it and apply.
  -- rejected: sent back with a note. closed: no longer taking applications.
  status         text not null default 'pending' check (status in ('pending', 'live', 'rejected', 'closed')),
  review_note    text check (length(review_note) <= 500),
  reviewed_by    uuid references auth.users (id),
  reviewed_at    timestamptz
);

create index if not exists internship_roles_status_idx on public.internship_roles (status, created_at desc);
create index if not exists internship_roles_provider_idx on public.internship_roles (provider_id);

-- Every read and write goes through the functions below.
alter table public.internship_roles enable row level security;

-- ---------------------------------------------------------------------------
-- Applications (one per student per role), carried through to sign-off
-- ---------------------------------------------------------------------------
create table if not exists public.internship_applications (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  role_id         uuid not null references public.internship_roles (id) on delete cascade,
  student_id      uuid not null references auth.users (id) on delete cascade,
  note            text check (length(note) <= 1000),
  -- applied -> shortlisted -> offered -> accepted (interning)
  --   -> signoff_pending (company says it is finished) -> completed (team confirmed)
  -- rejected: the company said no. withdrawn: the student pulled out or declined.
  status          text not null default 'applied' check (status in (
                    'applied', 'shortlisted', 'offered', 'accepted', 'signoff_pending', 'completed', 'rejected', 'withdrawn')),
  started_on      date,
  ended_on        date,
  supervisor_name text check (length(supervisor_name) <= 120),
  -- The team's note when a sign-off is sent back to the company.
  signoff_note    text check (length(signoff_note) <= 500),
  signoff_id      uuid references public.internship_signoffs (id) on delete set null,
  unique (role_id, student_id)
);

create index if not exists internship_applications_student_idx on public.internship_applications (student_id);
create index if not exists internship_applications_status_idx on public.internship_applications (status);

alter table public.internship_applications enable row level security;

drop policy if exists "students read own internship applications" on public.internship_applications;
create policy "students read own internship applications"
  on public.internship_applications for select
  to authenticated
  using (student_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Email, without ever failing the action that caused it.
-- p_to null sends to the MySkills team.
-- ---------------------------------------------------------------------------
create or replace function public.internship_notify(
  p_to text, p_subject text, p_heading text, p_rows text, p_cta text, p_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_to is null then
    perform public.notify_email(p_subject, public.notify_layout(p_heading, p_rows, p_cta, p_url));
  else
    perform public.notify_email_address(p_to, p_subject, public.notify_layout(p_heading, p_rows, p_cta, p_url));
  end if;
exception when others then
  null;
end;
$$;
revoke execute on function public.internship_notify(text, text, text, text, text, text) from public, anon, authenticated;

-- The company the signed-in account posts for, or an error.
create or replace function public.my_internship_company()
returns text
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_org text;
  v_all boolean;
begin
  select coalesce(nullif(btrim(a.organisation), ''), 'A partner company'), coalesce(a.sees_all, false)
    into v_org, v_all
    from public.community_access a
   where a.user_id = auth.uid() and a.resource = 'internships';
  if not found or v_all then
    raise exception 'Only a verified internship company can do this.';
  end if;
  return v_org;
end;
$$;
revoke execute on function public.my_internship_company() from public, anon;
grant execute on function public.my_internship_company() to authenticated;

-- ---------------------------------------------------------------------------
-- The company: its roles
-- ---------------------------------------------------------------------------
create or replace function public.my_internship_roles()
returns table (
  id uuid, created_at timestamptz, title text, description text, skills text[], mode text, location text,
  duration_weeks int, stipend text, openings int, apply_by date, status text, review_note text,
  applicants int, waiting int, interning int
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  perform public.my_internship_company();
  return query
  select r.id, r.created_at, r.title, r.description, r.skills, r.mode, r.location,
         r.duration_weeks, r.stipend, r.openings, r.apply_by, r.status, r.review_note,
         (select count(*)::int from public.internship_applications a where a.role_id = r.id and a.status <> 'withdrawn'),
         (select count(*)::int from public.internship_applications a where a.role_id = r.id and a.status = 'applied'),
         (select count(*)::int from public.internship_applications a
           where a.role_id = r.id and a.status in ('accepted', 'signoff_pending'))
    from public.internship_roles r
   where r.provider_id = auth.uid()
   order by (r.status = 'closed'), r.created_at desc;
end;
$$;
revoke execute on function public.my_internship_roles() from public, anon;
grant execute on function public.my_internship_roles() to authenticated;

-- Post a role, or change one. Either way it waits for the team: what students
-- see is always something the team has read.
create or replace function public.save_internship_role(
  p_id             uuid,
  p_title          text,
  p_description    text,
  p_skills         text[],
  p_mode           text,
  p_location       text,
  p_duration_weeks int,
  p_stipend        text,
  p_openings       int,
  p_apply_by       date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org text := public.my_internship_company();
  v_id uuid := p_id;
  v_title text := btrim(coalesce(p_title, ''));
  v_desc text := btrim(coalesce(p_description, ''));
  v_mode text := coalesce(nullif(btrim(p_mode), ''), 'remote');
  v_location text := nullif(btrim(coalesce(p_location, '')), '');
  v_skills text[];
begin
  if length(v_title) < 4 or length(v_title) > 120 then
    raise exception 'Give the role a title, like "SEO & Content Intern".';
  end if;
  if length(v_desc) < 40 then
    raise exception 'Describe what the intern will do, in a few sentences.';
  end if;
  if length(v_desc) > 3000 then
    raise exception 'The description is too long. Keep it under 3,000 characters.';
  end if;
  if v_mode not in ('remote', 'onsite', 'hybrid') then
    raise exception 'Choose remote, on-site or hybrid.';
  end if;
  if v_mode <> 'remote' and v_location is null then
    raise exception 'Say which city the intern works from.';
  end if;
  if p_duration_weeks is null or p_duration_weeks < 1 or p_duration_weeks > 52 then
    raise exception 'Say how many weeks the internship lasts (1 to 52).';
  end if;
  if coalesce(p_openings, 1) < 1 or coalesce(p_openings, 1) > 50 then
    raise exception 'Openings must be between 1 and 50.';
  end if;
  if p_apply_by is not null and p_apply_by < current_date then
    raise exception 'The last date to apply can''t be in the past.';
  end if;
  select coalesce(array_agg(s), '{}') into v_skills
    from (select distinct btrim(x) as s from unnest(coalesce(p_skills, '{}'::text[])) x
           where btrim(x) <> '' limit 8) t;

  if v_id is null then
    if (select count(*) from public.internship_roles r
         where r.provider_id = auth.uid() and r.status in ('pending', 'live')) >= 20 then
      raise exception 'You have 20 roles open. Close one before posting another.';
    end if;
    insert into public.internship_roles
      (provider_id, title, description, skills, mode, location, duration_weeks, stipend, openings, apply_by)
    values
      (auth.uid(), v_title, v_desc, v_skills, v_mode, v_location, p_duration_weeks,
       nullif(btrim(coalesce(p_stipend, '')), ''), coalesce(p_openings, 1), p_apply_by)
    returning id into v_id;
  else
    update public.internship_roles
       set title = v_title, description = v_desc, skills = v_skills, mode = v_mode, location = v_location,
           duration_weeks = p_duration_weeks, stipend = nullif(btrim(coalesce(p_stipend, '')), ''),
           openings = coalesce(p_openings, 1), apply_by = p_apply_by,
           status = 'pending', review_note = null, reviewed_by = null, reviewed_at = null, updated_at = now()
     where id = v_id and provider_id = auth.uid() and status <> 'closed';
    if not found then
      raise exception 'That role can''t be changed.';
    end if;
  end if;

  perform public.internship_notify(
    null,
    format('Internship role to approve: %s', v_title),
    'An internship role is waiting for approval',
    public.notify_row('Company', v_org) || public.notify_row('Role', v_title),
    'Review it', 'https://myskills.org.in/admin/internships');
  return v_id;
end;
$$;
revoke execute on function public.save_internship_role(uuid, text, text, text[], text, text, int, text, int, date) from public, anon;
grant execute on function public.save_internship_role(uuid, text, text, text[], text, text, int, text, int, date) to authenticated;

-- Stop taking applications. Students who already applied are not affected.
create or replace function public.close_internship_role(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.internship_roles
     set status = 'closed', updated_at = now()
   where id = p_id and provider_id = auth.uid() and status <> 'closed';
  if not found then
    raise exception 'That role is already closed.';
  end if;
end;
$$;
revoke execute on function public.close_internship_role(uuid) from public, anon;
grant execute on function public.close_internship_role(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- The company: who applied
-- Contact details only once shortlisted or further. Someone who withdrew is
-- no longer the company's to see.
-- ---------------------------------------------------------------------------
create or replace function public.internship_applicants(p_role uuid)
returns table (
  id uuid, status text, applied_on date, note text,
  student_id uuid, student_name text, headline text, location text,
  score int, certificates text[],
  email text, phone text,
  started_on date, ended_on date, supervisor_name text, signoff_note text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not exists (select 1 from public.internship_roles r where r.id = p_role and r.provider_id = auth.uid()) then
    raise exception 'That isn''t one of your roles.';
  end if;
  return query
  select a.id, a.status, a.created_at::date, a.note,
         a.student_id, p.full_name, p.headline, p.location,
         (select s.score::int from public.career_readiness_scores s where s.user_id = a.student_id),
         coalesce((select array_agg(c.title order by c.issued_at desc)
                     from public.certificates c where c.profile_id = a.student_id), '{}'::text[]),
         case when a.status in ('shortlisted', 'offered', 'accepted', 'signoff_pending', 'completed') then u.email::text end,
         case when a.status in ('shortlisted', 'offered', 'accepted', 'signoff_pending', 'completed') then p.phone end,
         a.started_on, a.ended_on, a.supervisor_name, a.signoff_note
    from public.internship_applications a
    left join public.profiles p on p.id = a.student_id
    left join auth.users u on u.id = a.student_id
   where a.role_id = p_role and a.status <> 'withdrawn'
   order by case a.status when 'signoff_pending' then 0 when 'accepted' then 1 when 'offered' then 2
                          when 'shortlisted' then 3 when 'applied' then 4 when 'completed' then 5 else 6 end,
            a.created_at desc;
end;
$$;
revoke execute on function public.internship_applicants(uuid) from public, anon;
grant execute on function public.internship_applicants(uuid) to authenticated;

-- Shortlist, offer, or say no.
create or replace function public.decide_internship_application(p_application uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org text := public.my_internship_company();
  a public.internship_applications;
  v_title text;
  v_email text;
  v_new text;
begin
  select x.* into a from public.internship_applications x
    join public.internship_roles r on r.id = x.role_id
   where x.id = p_application and r.provider_id = auth.uid()
     for update of x;
  if a.id is null then
    raise exception 'That application isn''t for one of your roles.';
  end if;
  select r.title into v_title from public.internship_roles r where r.id = a.role_id;

  if p_action = 'shortlist' and a.status = 'applied' then
    v_new := 'shortlisted';
  elsif p_action = 'offer' and a.status in ('applied', 'shortlisted') then
    v_new := 'offered';
  elsif p_action = 'reject' and a.status in ('applied', 'shortlisted', 'offered') then
    v_new := 'rejected';
  else
    raise exception 'That can''t be done at this stage of the application.';
  end if;

  update public.internship_applications set status = v_new, updated_at = now() where id = a.id;

  select u.email::text into v_email from auth.users u where u.id = a.student_id;
  if v_new = 'shortlisted' then
    perform public.internship_notify(v_email, format('%s shortlisted you', v_org), 'You''ve been shortlisted',
      public.notify_row('Role', v_title) || public.notify_row('Company', v_org)
      || public.notify_row('What happens now', 'They can see your email and phone, and may contact you.'),
      'See your application', 'https://myskills.org.in/community?category=internships');
  elsif v_new = 'offered' then
    perform public.internship_notify(v_email, format('%s has offered you an internship', v_org), 'You have an internship offer',
      public.notify_row('Role', v_title) || public.notify_row('Company', v_org)
      || public.notify_row('Next step', 'Accept or decline the offer in MySkills.'),
      'Answer the offer', 'https://myskills.org.in/community?category=internships');
  else
    perform public.internship_notify(v_email, 'An update on your internship application', 'This one didn''t go through',
      public.notify_row('Role', v_title) || public.notify_row('Company', v_org)
      || public.notify_row('What now', 'Other roles are open, and your score keeps counting.'),
      'See open roles', 'https://myskills.org.in/community?category=internships');
  end if;
end;
$$;
revoke execute on function public.decide_internship_application(uuid, text) from public, anon;
grant execute on function public.decide_internship_application(uuid, text) to authenticated;

-- The internship is over: the company says so, with who supervised it. The
-- team confirms before anything reaches the student's score.
create or replace function public.request_internship_signoff(
  p_application uuid, p_supervisor text, p_ended_on date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org text := public.my_internship_company();
  a public.internship_applications;
  v_title text;
  v_supervisor text := btrim(coalesce(p_supervisor, ''));
  v_ended date := coalesce(p_ended_on, current_date);
begin
  select x.* into a from public.internship_applications x
    join public.internship_roles r on r.id = x.role_id
   where x.id = p_application and r.provider_id = auth.uid()
     for update of x;
  if a.id is null or a.status <> 'accepted' then
    raise exception 'Only an intern who is with you now can be signed off.';
  end if;
  if length(v_supervisor) < 2 or length(v_supervisor) > 120 then
    raise exception 'Give the name of the person who supervised the intern.';
  end if;
  if v_ended > current_date then
    raise exception 'An internship can be signed off once it has ended.';
  end if;
  if a.started_on is not null and v_ended < a.started_on then
    raise exception 'The end date is before the internship started.';
  end if;
  select r.title into v_title from public.internship_roles r where r.id = a.role_id;

  update public.internship_applications
     set status = 'signoff_pending', supervisor_name = v_supervisor, ended_on = v_ended,
         signoff_note = null, updated_at = now()
   where id = a.id;

  perform public.internship_notify(null, format('Internship to confirm: %s', v_org), 'A company has signed off an intern',
    public.notify_row('Company', v_org) || public.notify_row('Role', v_title) || public.notify_row('Supervisor', v_supervisor),
    'Confirm it', 'https://myskills.org.in/admin/internships');
end;
$$;
revoke execute on function public.request_internship_signoff(uuid, text, date) from public, anon;
grant execute on function public.request_internship_signoff(uuid, text, date) to authenticated;

-- ---------------------------------------------------------------------------
-- The student: open roles, applying, and answering an offer
-- ---------------------------------------------------------------------------
create or replace function public.open_internship_roles()
returns table (
  id uuid, posted_on date, organisation text, title text, description text, skills text[], mode text,
  location text, duration_weeks int, stipend text, openings int, apply_by date,
  my_application uuid, my_status text
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, coalesce(r.reviewed_at, r.created_at)::date,
         coalesce(nullif(btrim(c.organisation), ''), 'A partner company'),
         r.title, r.description, r.skills, r.mode, r.location, r.duration_weeks, r.stipend, r.openings, r.apply_by,
         a.id, a.status
    from public.internship_roles r
    -- Only companies that still have their place in the portal.
    join public.community_access c on c.user_id = r.provider_id and c.resource = 'internships'
    left join public.internship_applications a on a.role_id = r.id and a.student_id = auth.uid()
   where r.status = 'live' and (r.apply_by is null or r.apply_by >= current_date)
   order by coalesce(r.reviewed_at, r.created_at) desc;
$$;
revoke execute on function public.open_internship_roles() from public, anon;
grant execute on function public.open_internship_roles() to authenticated;

create or replace function public.apply_for_internship(p_role uuid, p_note text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.internship_roles;
  v_id uuid;
  v_name text;
  v_company_email text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to apply.';
  end if;
  select * into r from public.internship_roles where id = p_role;
  if r.id is null or r.status <> 'live' or (r.apply_by is not null and r.apply_by < current_date) then
    raise exception 'This role is no longer taking applications.';
  end if;
  if r.provider_id = auth.uid() then
    raise exception 'This is your own role.';
  end if;
  if length(coalesce(p_note, '')) > 1000 then
    raise exception 'Keep your note under 1,000 characters.';
  end if;
  -- The same door as Practice: one aptitude assessment (or, for an older
  -- account, the Foundation assessment).
  if not (exists (select 1 from public.dm_aptitude_results x where x.profile_id = auth.uid())
       or exists (select 1 from public.career_readiness_assessment_results x where x.profile_id = auth.uid())
       or exists (select 1 from public.initial_assessment_results x where x.profile_id = auth.uid())) then
    raise exception 'Take an aptitude assessment first. It takes about five minutes.';
  end if;
  if exists (select 1 from public.internship_applications a where a.role_id = p_role and a.student_id = auth.uid()) then
    raise exception 'You have already applied for this role.';
  end if;

  insert into public.internship_applications (role_id, student_id, note)
  values (p_role, auth.uid(), nullif(btrim(coalesce(p_note, '')), ''))
  returning id into v_id;

  select p.full_name into v_name from public.profiles p where p.id = auth.uid();
  select u.email::text into v_company_email from auth.users u where u.id = r.provider_id;
  perform public.internship_notify(v_company_email, format('New application: %s', r.title), 'A student has applied',
    public.notify_row('Role', r.title) || public.notify_row('Student', coalesce(v_name, 'A MySkills student')),
    'See the application', 'https://myskills.org.in/community-portal/internships');
  return v_id;
end;
$$;
revoke execute on function public.apply_for_internship(uuid, text) from public, anon;
grant execute on function public.apply_for_internship(uuid, text) to authenticated;

create or replace function public.my_internship_applications()
returns table (
  id uuid, role_id uuid, title text, organisation text, status text, applied_on date,
  started_on date, ended_on date, mode text, location text, duration_weeks int, stipend text
)
language sql
security definer
set search_path = public
stable
as $$
  select a.id, r.id, r.title,
         coalesce(nullif(btrim(c.organisation), ''), 'A partner company'),
         a.status, a.created_at::date, a.started_on, a.ended_on, r.mode, r.location, r.duration_weeks, r.stipend
    from public.internship_applications a
    join public.internship_roles r on r.id = a.role_id
    left join public.community_access c on c.user_id = r.provider_id and c.resource = 'internships'
   where a.student_id = auth.uid() and a.status <> 'withdrawn'
   order by case a.status when 'offered' then 0 when 'accepted' then 1 when 'signoff_pending' then 1
                          when 'shortlisted' then 2 when 'applied' then 3 when 'completed' then 4 else 5 end,
            a.created_at desc;
$$;
revoke execute on function public.my_internship_applications() from public, anon;
grant execute on function public.my_internship_applications() to authenticated;

-- Pull out before anything has started.
create or replace function public.withdraw_internship_application(p_application uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.internship_applications
     set status = 'withdrawn', updated_at = now()
   where id = p_application and student_id = auth.uid() and status in ('applied', 'shortlisted', 'offered');
  if not found then
    raise exception 'That application can''t be withdrawn now.';
  end if;
end;
$$;
revoke execute on function public.withdraw_internship_application(uuid) from public, anon;
grant execute on function public.withdraw_internship_application(uuid) to authenticated;

-- Accept or decline an offer. Accepting starts the internship.
create or replace function public.respond_internship_offer(p_application uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.internship_applications;
  r public.internship_roles;
  v_name text;
  v_company_email text;
begin
  select * into a from public.internship_applications
   where id = p_application and student_id = auth.uid() for update;
  if a.id is null or a.status <> 'offered' then
    raise exception 'There is no offer waiting on that application.';
  end if;
  select * into r from public.internship_roles where id = a.role_id;
  select p.full_name into v_name from public.profiles p where p.id = auth.uid();
  select u.email::text into v_company_email from auth.users u where u.id = r.provider_id;

  if not coalesce(p_accept, false) then
    update public.internship_applications set status = 'withdrawn', updated_at = now() where id = a.id;
    perform public.internship_notify(v_company_email, format('Offer declined: %s', r.title), 'A student declined your offer',
      public.notify_row('Role', r.title) || public.notify_row('Student', coalesce(v_name, 'A MySkills student')),
      'Open your roles', 'https://myskills.org.in/community-portal/internships');
    return;
  end if;

  update public.internship_applications
     set status = 'accepted', started_on = current_date, updated_at = now()
   where id = a.id;
  -- On the company's "Interning now" list. The student applied and accepted,
  -- so this is theirs by their own doing; they can stop sharing at any time.
  if not exists (select 1 from public.community_engagements e
                  where e.resource = 'internships' and e.student_id = auth.uid()
                    and e.provider_id = r.provider_id and e.status = 'active') then
    insert into public.community_engagements (resource, student_id, provider_id, status, created_by, responded_at)
    values ('internships', auth.uid(), r.provider_id, 'active', auth.uid(), now());
  end if;

  perform public.internship_notify(v_company_email, format('Offer accepted: %s', r.title), 'Your intern has accepted',
    public.notify_row('Role', r.title) || public.notify_row('Student', coalesce(v_name, 'A MySkills student'))
    || public.notify_row('When it ends', 'Mark the internship complete in the portal so it counts for them.'),
    'Open your roles', 'https://myskills.org.in/community-portal/internships');
end;
$$;
revoke execute on function public.respond_internship_offer(uuid, boolean) from public, anon;
grant execute on function public.respond_internship_offer(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- The team: approve roles, confirm sign-offs
-- ---------------------------------------------------------------------------
create or replace function public.admin_internship_roles()
returns table (
  id uuid, created_at timestamptz, organisation text, company_email text, title text, description text,
  skills text[], mode text, location text, duration_weeks int, stipend text, openings int, apply_by date,
  status text, review_note text, applicants int, interning int
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('partner-leads') then
    raise exception 'Not authorised.';
  end if;
  return query
  select r.id, r.created_at, coalesce(nullif(btrim(c.organisation), ''), 'A partner company'), u.email::text,
         r.title, r.description, r.skills, r.mode, r.location, r.duration_weeks, r.stipend, r.openings, r.apply_by,
         r.status, r.review_note,
         (select count(*)::int from public.internship_applications a where a.role_id = r.id and a.status <> 'withdrawn'),
         (select count(*)::int from public.internship_applications a
           where a.role_id = r.id and a.status in ('accepted', 'signoff_pending'))
    from public.internship_roles r
    left join public.community_access c on c.user_id = r.provider_id and c.resource = 'internships'
    left join auth.users u on u.id = r.provider_id
   order by (r.status = 'pending') desc, r.created_at desc;
end;
$$;
revoke execute on function public.admin_internship_roles() from public, anon;
grant execute on function public.admin_internship_roles() to authenticated;

-- p_decision: 'live' (approve), 'rejected' (send back, with a note), 'closed' (take down).
create or replace function public.admin_review_internship_role(p_id uuid, p_decision text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.internship_roles;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_email text;
begin
  if not public.has_section_access('partner-leads') then
    raise exception 'Not authorised.';
  end if;
  if p_decision not in ('live', 'rejected', 'closed') then
    raise exception 'Unknown decision.';
  end if;
  select * into r from public.internship_roles where id = p_id for update;
  if r.id is null then
    raise exception 'That role no longer exists.';
  end if;
  if p_decision = 'rejected' and v_note is null then
    raise exception 'Say what needs changing, so the company can fix it.';
  end if;

  update public.internship_roles
     set status = p_decision, review_note = v_note, reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
   where id = p_id;

  select u.email::text into v_email from auth.users u where u.id = r.provider_id;
  if p_decision = 'live' then
    perform public.internship_notify(v_email, format('Your role is live: %s', r.title), 'Your internship role is live',
      public.notify_row('Role', r.title) || public.notify_row('What happens now', 'Students can see it and apply. You''ll get an email for each application.'),
      'Open your roles', 'https://myskills.org.in/community-portal/internships');
  elsif p_decision = 'rejected' then
    perform public.internship_notify(v_email, format('About your role: %s', r.title), 'Your role needs a change before it goes live',
      public.notify_row('Role', r.title) || public.notify_row('From the team', v_note),
      'Edit the role', 'https://myskills.org.in/community-portal/internships');
  end if;
end;
$$;
revoke execute on function public.admin_review_internship_role(uuid, text, text) from public, anon;
grant execute on function public.admin_review_internship_role(uuid, text, text) to authenticated;

create or replace function public.admin_internship_signoffs()
returns table (
  id uuid, status text, organisation text, title text, student_id uuid, student_name text, student_email text,
  supervisor_name text, started_on date, ended_on date, requested_at timestamptz,
  -- True when this would be the student's first signed-off internship: the one worth points.
  first_internship boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('partner-leads') then
    raise exception 'Not authorised.';
  end if;
  return query
  select a.id, a.status, coalesce(nullif(btrim(c.organisation), ''), 'A partner company'), r.title,
         a.student_id, p.full_name, u.email::text, a.supervisor_name, a.started_on, a.ended_on, a.updated_at,
         not exists (select 1 from public.internship_signoffs s
                      where s.student_id = a.student_id and s.id is distinct from a.signoff_id)
    from public.internship_applications a
    join public.internship_roles r on r.id = a.role_id
    left join public.community_access c on c.user_id = r.provider_id and c.resource = 'internships'
    left join public.profiles p on p.id = a.student_id
    left join auth.users u on u.id = a.student_id
   where a.status in ('signoff_pending', 'completed')
   order by (a.status = 'signoff_pending') desc, a.updated_at desc;
end;
$$;
revoke execute on function public.admin_internship_signoffs() from public, anon;
grant execute on function public.admin_internship_signoffs() to authenticated;

-- Confirm a company's sign-off (it then counts for the student), or send it
-- back to the company with a note.
create or replace function public.admin_confirm_internship_signoff(
  p_application uuid, p_confirm boolean, p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.internship_applications;
  r public.internship_roles;
  v_org text;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_signoff uuid;
  v_first boolean;
  v_student_email text;
  v_company_email text;
begin
  if not public.has_section_access('partner-leads') then
    raise exception 'Not authorised.';
  end if;
  select * into a from public.internship_applications where id = p_application for update;
  if a.id is null or a.status <> 'signoff_pending' then
    raise exception 'That sign-off is no longer waiting.';
  end if;
  select * into r from public.internship_roles where id = a.role_id;
  select coalesce(nullif(btrim(c.organisation), ''), 'A partner company') into v_org
    from public.community_access c where c.user_id = r.provider_id and c.resource = 'internships';
  v_org := coalesce(v_org, 'A partner company');
  select u.email::text into v_company_email from auth.users u where u.id = r.provider_id;

  if not coalesce(p_confirm, false) then
    if v_note is null then
      raise exception 'Say why, so the company knows what to correct.';
    end if;
    update public.internship_applications
       set status = 'accepted', signoff_note = v_note, updated_at = now()
     where id = a.id;
    perform public.internship_notify(v_company_email, format('About your sign-off: %s', r.title), 'We couldn''t confirm this sign-off yet',
      public.notify_row('Role', r.title) || public.notify_row('From the team', v_note),
      'Open your roles', 'https://myskills.org.in/community-portal/internships');
    return;
  end if;

  v_first := not exists (select 1 from public.internship_signoffs s where s.student_id = a.student_id);
  insert into public.internship_signoffs
    (student_id, organisation, supervisor_name, role_title, started_on, ended_on, recorded_by)
  values
    (a.student_id, v_org, a.supervisor_name, r.title, a.started_on, a.ended_on, auth.uid())
  returning id into v_signoff;

  update public.internship_applications
     set status = 'completed', signoff_id = v_signoff, signoff_note = null, updated_at = now()
   where id = a.id;
  -- The internship is over: the company's view of the student closes with it.
  update public.community_engagements
     set status = 'ended', ended_on = coalesce(a.ended_on, current_date)
   where resource = 'internships' and student_id = a.student_id
     and provider_id = r.provider_id and status = 'active';

  select u.email::text into v_student_email from auth.users u where u.id = a.student_id;
  perform public.internship_notify(v_student_email, 'Your internship is confirmed', 'Your internship is on your record',
    public.notify_row('Role', r.title) || public.notify_row('Company', v_org)
    || public.notify_row('Your score', case when v_first
         then 'Your first signed-off internship adds 20 points to your Global Readiness Score.'
         else 'It is added to your record. The score counts your first internship.' end),
    'Open your LaunchPad', 'https://myskills.org.in/dashboard');
end;
$$;
revoke execute on function public.admin_confirm_internship_signoff(uuid, boolean, text) from public, anon;
grant execute on function public.admin_confirm_internship_signoff(uuid, boolean, text) to authenticated;
