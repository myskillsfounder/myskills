-- Career Readiness Programme — hero lead capture (name, phone, city).
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on public.is_admin() (docs/supabase-mentor-onboarding.sql) and the
-- notify_* helpers (docs/supabase-email-notifications.sql).
--
-- Distinct from programme_interest (docs/supabase-programme-interest.sql):
-- that one is the signed-in "waitlist" a learner joins from the closing CTA,
-- tied to their account by user_id, captured by email. This is the hero's
-- above-the-fold form — no account needed, name + phone + city, so the team
-- can just call. Two tables, not two more columns on one, because their RLS
-- shape is opposite: interest requires auth, leads must not.

create table if not exists public.career_readiness_leads (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Set when the visitor happens to be signed in; never required. No FK
  -- action needed beyond set null — losing the link to a deleted account
  -- doesn't invalidate the lead itself.
  user_id    uuid references auth.users (id) on delete set null,

  full_name  text not null check (length(trim(full_name)) between 2 and 80),
  phone      text not null check (length(trim(phone)) between 6 and 20),
  city       text not null check (length(trim(city)) between 2 and 80),

  contacted    boolean not null default false,
  contacted_at timestamptz,
  contacted_by uuid references auth.users (id)
);

create index if not exists career_readiness_leads_created_idx
  on public.career_readiness_leads (created_at desc);

alter table public.career_readiness_leads enable row level security;

-- Anyone may submit, signed in or not — the whole point is to capture a lead
-- before asking for an account. The WITH CHECK pins the follow-up fields so a
-- crafted request can't self-mark as already contacted on the way in.
drop policy if exists "anyone can submit a lead" on public.career_readiness_leads;
create policy "anyone can submit a lead"
  on public.career_readiness_leads for insert
  to anon, authenticated
  with check (contacted = false and contacted_at is null and contacted_by is null);

-- Only admins read leads — this is private contact info (phone, city), not a
-- public listing.
drop policy if exists "admins read leads" on public.career_readiness_leads;
create policy "admins read leads"
  on public.career_readiness_leads for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins update leads" on public.career_readiness_leads;
create policy "admins update leads"
  on public.career_readiness_leads for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Email notification — same shape as notify_new_programme_interest(), so a
-- new lead shows up the same way a new waitlist join or mentor application
-- does.
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_career_readiness_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
begin
  select count(*) into v_total from public.career_readiness_leads;

  perform public.notify_email(
    format('[MySkills · Lead] %s — Career Readiness Programme (%s total)', new.full_name, v_total),
    public.notify_layout(
      'New Career Readiness lead',
      public.notify_row('Name', new.full_name)
      || public.notify_row('Phone', new.phone)
      || public.notify_row('City', new.city)
      || public.notify_row('Total leads', v_total::text),
      'Open MySkills',
      'https://myskills.org.in/career-readiness'
    )
  );
  return null;
end;
$$;

drop trigger if exists career_readiness_leads_notify on public.career_readiness_leads;
create trigger career_readiness_leads_notify
  after insert on public.career_readiness_leads
  for each row execute function public.notify_new_career_readiness_lead();

-- ---------------------------------------------------------------------------
-- See leads (admin, via SQL editor — no admin UI page for this yet)
-- ---------------------------------------------------------------------------
--   select created_at, full_name, phone, city, contacted
--     from public.career_readiness_leads
--    order by created_at desc;
