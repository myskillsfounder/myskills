-- Per-section admin permissions: replaces the binary is_admin()-only gate on
-- every /admin section (and the bundled has_partnerships_access() gate on
-- Mentors/Institution Partners/Demo Requests) with a single generalized
-- table so different team members can be granted different sections, while
-- is_admin() stays the "super admin sees everything" bypass throughout.
--
-- Run this once against Supabase Cloud (SQL editor). It is idempotent
-- enough to re-run.
--
-- Depends on public.is_admin() from docs/supabase-mentor-onboarding.sql, and
-- on every table/function this file rewrites already existing (see the
-- table below — same set of migrations this whole project has already
-- applied this session).

-- ---------------------------------------------------------------------------
-- Staff permissions table
-- ---------------------------------------------------------------------------
-- One row per (user, section) grant. Only service_role/SQL editor can write
-- this (no client INSERT/UPDATE/DELETE policy) — same reasoning as
-- public.admins and public.partnership_managers: a self-writable flag would
-- let anyone grant themselves access.
create table if not exists public.staff_permissions (
  user_id    uuid not null references auth.users (id) on delete cascade,
  section    text not null check (section in (
    'users', 'assessment', 'certificates', 'feedback',
    'mentors', 'institution-partners', 'demo-requests', 'blog', 'ads'
  )),
  created_at timestamptz not null default now(),
  primary key (user_id, section)
);

alter table public.staff_permissions enable row level security;

drop policy if exists "admins can see staff permissions" on public.staff_permissions;
create policy "admins can see staff permissions"
  on public.staff_permissions for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Workmail restriction — same two-layer approach as
-- docs/supabase-partnerships-workmail-restriction.sql: a trigger rejects a
-- non-work-email grant outright, and every access-check function below
-- re-verifies the domain at read time too, so a row that somehow got in
-- some other way still can't grant access unless the email still matches.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_staff_permission_workmail()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_email text;
begin
  select u.email into target_email from auth.users u where u.id = new.user_id;
  if target_email is null or lower(target_email) not like '%@myskills.org.in' then
    raise exception 'staff_permissions requires a @myskills.org.in email (got %)',
      coalesce(target_email, '<none>');
  end if;
  return new;
end;
$$;

drop trigger if exists staff_permissions_workmail_check on public.staff_permissions;
create trigger staff_permissions_workmail_check
  before insert or update on public.staff_permissions
  for each row execute function public.enforce_staff_permission_workmail();

-- ---------------------------------------------------------------------------
-- Access-check functions
-- ---------------------------------------------------------------------------
create or replace function public.has_section_access(p_section text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin() or exists (
    select 1
    from public.staff_permissions sp
    join auth.users u on u.id = sp.user_id
    where sp.user_id = auth.uid()
      and sp.section = p_section
      and lower(u.email) like '%@myskills.org.in'
  );
$$;

create or replace function public.has_any_staff_access()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_admin() or exists (
    select 1
    from public.staff_permissions sp
    join auth.users u on u.id = sp.user_id
    where sp.user_id = auth.uid()
      and lower(u.email) like '%@myskills.org.in'
  );
$$;

-- Admins get every slug (they can do everything); everyone else gets only
-- what they were actually granted. One round trip for the frontend instead
-- of calling has_section_access() nine times per /admin page load.
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
      'mentors', 'institution-partners', 'demo-requests', 'blog', 'ads'
    ]
    else coalesce(
      (select array_agg(sp.section) from public.staff_permissions sp
        join auth.users u on u.id = sp.user_id
       where sp.user_id = auth.uid() and lower(u.email) like '%@myskills.org.in'),
      array[]::text[]
    )
  end;
$$;

grant execute on function public.has_section_access(text) to authenticated;
grant execute on function public.has_any_staff_access() to authenticated;
grant execute on function public.my_staff_sections() to authenticated;

-- ---------------------------------------------------------------------------
-- Migrate existing partnership_managers grants — each row becomes 3 section
-- grants. Keeps every already-granted account (including admin1@myskills.org.in,
-- already live-tested) working with no extra action. partnership_managers,
-- is_partnership_manager() and has_partnerships_access() are left in place,
-- unused, rather than dropped — safer than an irreversible DROP if this
-- migration's policy rewrites below ever need a second look.
-- ---------------------------------------------------------------------------
insert into public.staff_permissions (user_id, section, created_at)
select pm.user_id, s.section, pm.created_at
from public.partnership_managers pm
cross join (values ('mentors'), ('institution-partners'), ('demo-requests')) as s(section)
on conflict (user_id, section) do nothing;

-- ---------------------------------------------------------------------------
-- Rewrite every existing is_admin() / has_partnerships_access()-gated policy
-- and RPC to use has_section_access('<section>') instead. Same policy/RPC
-- names as their source files, so these are safe re-runs.
-- ---------------------------------------------------------------------------

-- Feedback — docs/supabase-admin.sql
drop policy if exists "admins read all" on public.feedback;
create policy "admins read all"
  on public.feedback for select
  to authenticated
  using (public.has_section_access('feedback'));

-- Certificates — docs/supabase-admin.sql
drop policy if exists "admins read all" on public.certificates;
create policy "admins read all"
  on public.certificates for select
  to authenticated
  using (public.has_section_access('certificates'));

-- Blog — docs/supabase-admin.sql
drop policy if exists "admins manage blog posts" on public.blog_posts;
create policy "admins manage blog posts"
  on public.blog_posts for all
  to authenticated
  using (public.has_section_access('blog'))
  with check (public.has_section_access('blog'));

drop policy if exists "admins read all" on public.blog_posts;
create policy "admins read all"
  on public.blog_posts for select
  to authenticated
  using (public.has_section_access('blog'));

-- Ads — docs/supabase-admin.sql
drop policy if exists "admins manage ads" on public.ads;
create policy "admins manage ads"
  on public.ads for all
  to authenticated
  using (public.has_section_access('ads'))
  with check (public.has_section_access('ads'));

drop policy if exists "admins read all" on public.ads;
create policy "admins read all"
  on public.ads for select
  to authenticated
  using (public.has_section_access('ads'));

-- Users — docs/supabase-admin.sql, docs/supabase-fix-mentor-self-escalation.sql
create or replace function public.admin_users(search text default null, max_rows int default 200)
returns table (
  id uuid,
  email text,
  full_name text,
  headline text,
  is_mentor boolean,
  created_at timestamptz,
  last_login timestamptz,
  assessment_percent int
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    u.email::text,
    p.full_name,
    p.headline,
    p.is_mentor,
    u.created_at,
    (select max(le.at) from public.login_events le where le.profile_id = p.id),
    (select r.percent from public.initial_assessment_results r where r.profile_id = p.id)
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.has_section_access('users')
    and (
      search is null or search = ''
      or p.full_name ilike '%' || search || '%'
      or u.email ilike '%' || search || '%'
    )
  order by u.created_at desc
  limit least(coalesce(max_rows, 200), 1000);
$$;

create or replace function public.admin_set_mentor_flag(target_id uuid, flag boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_section_access('users') then
    raise exception 'not authorized';
  end if;

  update public.profiles set is_mentor = flag, updated_at = now() where id = target_id;
end;
$$;

create or replace function public.enforce_is_mentor_admin_only()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.has_section_access('users') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_mentor := false;
  else
    new.is_mentor := old.is_mentor;
  end if;

  return new;
end;
$$;

-- Assessment — docs/supabase-admin-assessment-questions.sql, docs/supabase-practice-question-sets.sql
drop policy if exists "admins manage assessment questions" on public.initial_assessment_questions;
create policy "admins manage assessment questions"
  on public.initial_assessment_questions for all
  to authenticated
  using (public.has_section_access('assessment'))
  with check (public.has_section_access('assessment'));

drop policy if exists "admins manage assessment answer key" on public.initial_assessment_answer_key;
create policy "admins manage assessment answer key"
  on public.initial_assessment_answer_key for all
  to authenticated
  using (public.has_section_access('assessment'))
  with check (public.has_section_access('assessment'));

drop policy if exists "admins manage practice question sets" on public.practice_question_sets;
create policy "admins manage practice question sets"
  on public.practice_question_sets for all
  to authenticated
  using (public.has_section_access('assessment'))
  with check (public.has_section_access('assessment'));

drop policy if exists "admins manage practice set questions" on public.practice_set_questions;
create policy "admins manage practice set questions"
  on public.practice_set_questions for all
  to authenticated
  using (public.has_section_access('assessment'))
  with check (public.has_section_access('assessment'));

-- Mentors — docs/supabase-mentor-onboarding.sql, overridden by supabase-partnerships-portal.sql
drop policy if exists "admins read applications" on public.mentor_applications;
create policy "admins read applications"
  on public.mentor_applications for select
  to authenticated
  using (public.has_section_access('mentors'));

drop policy if exists "admins manage mentors" on public.mentors;
create policy "admins manage mentors"
  on public.mentors for all
  to authenticated
  using (public.has_section_access('mentors'))
  with check (public.has_section_access('mentors'));

create or replace function public.approve_mentor_application(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.mentor_applications;
begin
  if not public.has_section_access('mentors') then
    raise exception 'not authorized';
  end if;

  select * into app from public.mentor_applications where id = app_id;
  if not found then
    raise exception 'application % not found', app_id;
  end if;

  update public.mentor_applications
     set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(), review_note = null
   where id = app_id;

  insert into public.mentors (application_id, full_name, headline, bio, location, expertise, linkedin_url)
  values (app.id, app.full_name, app.headline, app.bio, app.location, app.expertise, app.linkedin_url)
  on conflict (application_id) do update
    set full_name    = excluded.full_name,
        headline     = excluded.headline,
        bio          = excluded.bio,
        location     = excluded.location,
        expertise    = excluded.expertise,
        linkedin_url = excluded.linkedin_url;
end;
$$;

create or replace function public.reject_mentor_application(app_id uuid, note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_section_access('mentors') then
    raise exception 'not authorized';
  end if;

  update public.mentor_applications
     set status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(), review_note = note
   where id = app_id;

  if not found then
    raise exception 'application % not found', app_id;
  end if;

  delete from public.mentors where application_id = app_id;
end;
$$;

-- Institution partners — docs/supabase-institution-partner-onboarding.sql,
-- docs/supabase-institution-partner-courses.sql, overridden by
-- supabase-partnerships-portal.sql
drop policy if exists "admins read applications" on public.institution_partner_applications;
create policy "admins read applications"
  on public.institution_partner_applications for select
  to authenticated
  using (public.has_section_access('institution-partners'));

drop policy if exists "admins manage institution partners" on public.institution_partners;
create policy "admins manage institution partners"
  on public.institution_partners for all
  to authenticated
  using (public.has_section_access('institution-partners'))
  with check (public.has_section_access('institution-partners'));

drop policy if exists "admins manage institution partner courses" on public.institution_partner_courses;
create policy "admins manage institution partner courses"
  on public.institution_partner_courses for all
  to authenticated
  using (public.has_section_access('institution-partners'))
  with check (public.has_section_access('institution-partners'));

create or replace function public.approve_institution_partner_application(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.institution_partner_applications;
begin
  if not public.has_section_access('institution-partners') then
    raise exception 'not authorized';
  end if;

  select * into app from public.institution_partner_applications where id = app_id;
  if not found then
    raise exception 'application % not found', app_id;
  end if;

  update public.institution_partner_applications
     set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(), review_note = null
   where id = app_id;

  insert into public.institution_partners (
    application_id, legal_name, courses_offered, years_in_education, city,
    google_profile_url, google_rating, website_url
  )
  values (
    app.id, app.legal_name, app.courses_offered, app.years_in_education, app.city,
    app.google_profile_url, app.google_rating, app.website_url
  )
  on conflict (application_id) do update
    set legal_name          = excluded.legal_name,
        courses_offered     = excluded.courses_offered,
        years_in_education  = excluded.years_in_education,
        city                = excluded.city,
        google_profile_url  = excluded.google_profile_url,
        google_rating       = excluded.google_rating,
        website_url         = excluded.website_url;
end;
$$;

create or replace function public.reject_institution_partner_application(app_id uuid, note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_section_access('institution-partners') then
    raise exception 'not authorized';
  end if;

  update public.institution_partner_applications
     set status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(), review_note = note
   where id = app_id;

  if not found then
    raise exception 'application % not found', app_id;
  end if;

  delete from public.institution_partners where application_id = app_id;
end;
$$;

-- Demo requests — docs/supabase-institution-demo-requests.sql, overridden by
-- supabase-partnerships-portal.sql
drop policy if exists "admins manage demo requests" on public.institution_demo_requests;
create policy "admins manage demo requests"
  on public.institution_demo_requests for all
  to authenticated
  using (public.has_section_access('demo-requests'))
  with check (public.has_section_access('demo-requests'));

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--   select u.email, array_agg(sp.section order by sp.section) as sections
--     from public.staff_permissions sp
--     join auth.users u on u.id = sp.user_id
--    group by u.email;
--   -- expect admin1@myskills.org.in -> {demo-requests,institution-partners,mentors}
--
--   -- Grant someone a single section (e.g. Blog only):
--   -- insert into public.staff_permissions (user_id, section)
--   -- select id, 'blog' from auth.users where email = 'someone@myskills.org.in'
--   -- on conflict (user_id, section) do nothing;
