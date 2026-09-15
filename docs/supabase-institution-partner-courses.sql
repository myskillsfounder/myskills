-- Per-course detail (name + duration) for a listed institution partner —
-- institution_partners.courses_offered is just a flat text[] of names (fine
-- for the initial vetting an application collects), but a real listing needs
-- more than a name per course. This is additive: courses_offered is left
-- alone (still used by the application → approval flow), this is populated
-- separately by an admin curating a specific listing's detail, same as
-- institution_partners itself is today (direct SQL, no admin UI yet).
--
-- Depends on public.is_admin() from docs/supabase-mentor-onboarding.sql, and
-- on public.institution_partners existing already
-- (docs/supabase-institution-partner-onboarding.sql).
-- Run this once against Supabase Cloud (SQL editor).

create table if not exists public.institution_partner_courses (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institution_partners (id) on delete cascade,
  name           text not null check (length(trim(name)) between 1 and 120),
  duration       text check (length(duration) <= 40),
  sort_order     int not null default 0
);

create index if not exists institution_partner_courses_institution_idx
  on public.institution_partner_courses (institution_id, sort_order);

alter table public.institution_partner_courses enable row level security;

-- Public read, same as the institution_partners listing itself.
drop policy if exists "institution partner courses are public" on public.institution_partner_courses;
create policy "institution partner courses are public"
  on public.institution_partner_courses for select
  to anon, authenticated
  using (true);

drop policy if exists "admins manage institution partner courses" on public.institution_partner_courses;
create policy "admins manage institution partner courses"
  on public.institution_partner_courses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Fix INTERVAL's listing: correct name, and its first course with duration.
-- ---------------------------------------------------------------------------
update public.institution_partners
   set legal_name = 'SkillX by Interval'
 where legal_name = 'INTERVAL';

insert into public.institution_partner_courses (institution_id, name, duration, sort_order)
select id, 'Digital Marketing', '3 months', 0
  from public.institution_partners
 where legal_name = 'SkillX by Interval'
   and not exists (
     select 1 from public.institution_partner_courses c
      where c.institution_id = institution_partners.id and c.name = 'Digital Marketing'
   );

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--   select p.legal_name, c.name, c.duration
--     from public.institution_partners p
--     join public.institution_partner_courses c on c.institution_id = p.id;
