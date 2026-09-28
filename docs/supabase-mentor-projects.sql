-- Projects recorded by mentors.
--
-- A student's profile no longer takes projects the student types in. A
-- mentor records a project for a student they're mentoring — work the mentor
-- saw them do on the programme — so every project on a profile has a person
-- who vouches for it. (Internships will come the same way, through the app,
-- once partner internships open.)
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on: public.mentor_matches (docs/supabase-mentor-matches.sql),
-- public.mentors, public.has_section_access(), the notify_* email helpers.
-- Projects students typed into profiles.projects before this are left in place;
-- the profile just stops showing them.

create table if not exists public.mentor_projects (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  student_id  uuid not null references public.profiles (id) on delete cascade,
  programme   text not null check (programme in ('digital-marketing', 'career-readiness')),
  mentor_id   uuid references public.mentors (id) on delete set null,
  recorded_by uuid not null references auth.users (id),
  title       text not null check (char_length(btrim(title)) between 2 and 160),
  description text check (length(description) <= 2000),
  link        text check (link is null or link ~* '^https?://'),
  year        text check (length(year) <= 10)
);

create index if not exists mentor_projects_student_idx on public.mentor_projects (student_id);

alter table public.mentor_projects enable row level security;

-- Read only: adding and removing go through the functions below.
drop policy if exists "students read own projects" on public.mentor_projects;
create policy "students read own projects"
  on public.mentor_projects for select to authenticated
  using (student_id = auth.uid());

drop policy if exists "mentors read projects they recorded" on public.mentor_projects;
create policy "mentors read projects they recorded"
  on public.mentor_projects for select to authenticated
  using (recorded_by = auth.uid());

drop policy if exists "staff read mentor projects" on public.mentor_projects;
create policy "staff read mentor projects"
  on public.mentor_projects for select to authenticated
  using (public.has_section_access('mentor-reviews'));

-- ---------------------------------------------------------------------------
-- Mentor: record, list, remove
-- ---------------------------------------------------------------------------
create or replace function public.add_mentee_project(
  p_match uuid, p_title text, p_description text default null, p_link text default null, p_year text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.mentor_matches%rowtype;
begin
  select * into v_match from public.mentor_matches
   where id = p_match and mentor_user = auth.uid() and status = 'active';
  if not found then
    raise exception 'You can only add projects for a student you''re mentoring.';
  end if;
  if coalesce(char_length(btrim(p_title)), 0) < 2 then
    raise exception 'Give the project a title.';
  end if;
  if nullif(btrim(p_link), '') is not null and btrim(p_link) !~* '^https?://' then
    raise exception 'The link has to start with http:// or https://.';
  end if;

  insert into public.mentor_projects (student_id, programme, mentor_id, recorded_by, title, description, link, year)
  values (v_match.student_id, v_match.programme, v_match.mentor_id, auth.uid(), btrim(p_title),
          nullif(btrim(p_description), ''), nullif(btrim(p_link), ''), nullif(btrim(p_year), ''));
end;
$$;

create or replace function public.mentee_projects(p_match uuid)
returns table (id uuid, created_at timestamptz, title text, description text, link text, year text)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
declare
  v_student uuid;
begin
  select mm.student_id into v_student from public.mentor_matches mm
   where mm.id = p_match and mm.mentor_user = auth.uid() and mm.status = 'active';
  if v_student is null then
    raise exception 'You can only see the projects of a student you''re mentoring.';
  end if;
  return query
  select p.id, p.created_at, p.title, p.description, p.link, p.year
    from public.mentor_projects p
   where p.student_id = v_student
   order by p.created_at desc;
end;
$$;

-- The mentor who recorded it (or the team) can remove a project.
create or replace function public.remove_mentee_project(p_project uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.mentor_projects
   where id = p_project
     and (recorded_by = auth.uid() or public.has_section_access('mentor-reviews'));
  if not found then
    raise exception 'You can''t remove that project.';
  end if;
end;
$$;

revoke execute on function public.add_mentee_project(uuid, text, text, text, text) from public, anon;
revoke execute on function public.mentee_projects(uuid) from public, anon;
revoke execute on function public.remove_mentee_project(uuid) from public, anon;
grant execute on function public.add_mentee_project(uuid, text, text, text, text) to authenticated;
grant execute on function public.mentee_projects(uuid) to authenticated;
grant execute on function public.remove_mentee_project(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Email the student when a mentor adds a project to their profile
-- ---------------------------------------------------------------------------
create or replace function public.notify_mentor_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_mentor text;
begin
  select u.email into v_email from auth.users u where u.id = new.student_id;
  select m.full_name into v_mentor from public.mentors m where m.id = new.mentor_id;
  perform public.notify_email_address(
    v_email,
    coalesce(v_mentor, 'Your mentor') || ' added a project to your profile',
    public.notify_layout(
      'A verified project on your profile',
      public.notify_row('Project', new.title)
      || public.notify_row('Added by', v_mentor),
      'See it on your profile',
      'https://myskills.org.in/profile'
    )
  );
  return null;
end;
$$;
revoke execute on function public.notify_mentor_project() from public, anon, authenticated;

drop trigger if exists mentor_projects_notify on public.mentor_projects;
create trigger mentor_projects_notify
  after insert on public.mentor_projects
  for each row execute function public.notify_mentor_project();
