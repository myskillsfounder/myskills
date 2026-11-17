-- ---------------------------------------------------------------------------
-- Apply to an internship role with a CV (Paul, 18 Nov 2026).
--
-- The internship cards on Home (Performance Marketing Intern, SEO & Content Intern,
-- Marketing Analytics Intern, Marketing Automation & AI Intern) are kinds of role,
-- not postings by a company. A student applies to one with a CV and a short note;
-- MySkills holds the application and shares it with a partner company when that
-- kind of internship opens. (Roles a company posts keep their own application,
-- docs/supabase-internships-portal.sql.)
--
--   1. cvs                       a PRIVATE storage bucket: PDF or Word, 5 MB.
--                                A student reads and writes only their own folder
--                                (<their id>/...); the team reads all of them.
--   2. internship_interest       one application per student per kind of role.
--   3. admin_internship_interest() / admin_set_interest_status(): the team's list.
--
-- Run in the Supabase SQL editor BEFORE deploying the page that uses it (until it
-- is run, Apply tells the student it is not ready yet). Safe to run again.
-- Depends on: docs/supabase-staff-permissions.sql (has_section_access).
-- ---------------------------------------------------------------------------

-- 1. The private bucket for CVs
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cvs', 'cvs', false, 5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cvs: own folder, insert" on storage.objects;
create policy "cvs: own folder, insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "cvs: own folder or the team, read" on storage.objects;
create policy "cvs: own folder or the team, read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'cvs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.has_section_access('partner-leads'))
  );

drop policy if exists "cvs: own folder, replace" on storage.objects;
create policy "cvs: own folder, replace" on storage.objects
  for update to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "cvs: own folder, delete" on storage.objects;
create policy "cvs: own folder, delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

-- 2. The applications
create table if not exists public.internship_interest (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references auth.users (id) on delete cascade,
  track_slug  text not null check (length(track_slug) between 1 and 80),
  track_title text not null check (length(track_title) between 1 and 120),
  note        text check (note is null or length(note) <= 600),
  cv_path     text not null,
  cv_name     text not null,
  status      text not null default 'new' check (status in ('new', 'contacted', 'shared', 'closed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (student_id, track_slug)
);
create index if not exists internship_interest_created_idx on public.internship_interest (created_at desc);
alter table public.internship_interest enable row level security;

-- A student sees, makes, changes and withdraws only their own. The CV must be in
-- their own folder of the bucket.
drop policy if exists "interest: own, read" on public.internship_interest;
create policy "interest: own, read" on public.internship_interest
  for select to authenticated using (student_id = auth.uid());

drop policy if exists "interest: own, insert" on public.internship_interest;
create policy "interest: own, insert" on public.internship_interest
  for insert to authenticated
  with check (student_id = auth.uid() and cv_path like auth.uid()::text || '/%' and status = 'new');

drop policy if exists "interest: own, update" on public.internship_interest;
create policy "interest: own, update" on public.internship_interest
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid() and cv_path like auth.uid()::text || '/%');

-- A student can change what they wrote, never where the team has got to with it.
revoke update on public.internship_interest from authenticated;
grant update (note, cv_path, cv_name, updated_at) on public.internship_interest to authenticated;

drop policy if exists "interest: own, delete" on public.internship_interest;
create policy "interest: own, delete" on public.internship_interest
  for delete to authenticated using (student_id = auth.uid());

-- 3. The team's list
create or replace function public.admin_internship_interest()
returns table (
  id uuid, student_id uuid, student_name text, student_email text, student_phone text,
  track_slug text, track_title text, note text, cv_path text, cv_name text, status text, created_at timestamptz
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
  select i.id, i.student_id, p.full_name, u.email::text, p.phone,
         i.track_slug, i.track_title, i.note, i.cv_path, i.cv_name, i.status, i.created_at
    from public.internship_interest i
    left join public.profiles p on p.id = i.student_id
    left join auth.users u on u.id = i.student_id
   order by i.created_at desc;
end;
$$;
revoke execute on function public.admin_internship_interest() from public, anon;
grant execute on function public.admin_internship_interest() to authenticated;

create or replace function public.admin_set_interest_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_section_access('partner-leads') then
    raise exception 'Not authorised.';
  end if;
  if p_status not in ('new', 'contacted', 'shared', 'closed') then
    raise exception 'Unknown status.';
  end if;
  update public.internship_interest set status = p_status, updated_at = now() where id = p_id;
end;
$$;
revoke execute on function public.admin_set_interest_status(uuid, text) from public, anon;
grant execute on function public.admin_set_interest_status(uuid, text) to authenticated;

notify pgrst, 'reload schema';
