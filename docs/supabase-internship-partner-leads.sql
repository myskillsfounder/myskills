-- Internship partner leads — companies interested in offering internships
-- through MySkills (Community > Internships, /become-an-internship-partner).
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on public.is_admin() (docs/supabase-mentor-onboarding.sql) and the
-- notify_* helpers (docs/supabase-email-notifications.sql).
--
-- Internships aren't live for students yet, so unlike mentor_applications and
-- institution_partner_applications there's no approve/reject workflow or
-- public listing here — just an interest queue Paul works through by hand
-- once there's enough of a pipeline to build the real thing on. Add the
-- approval + listing machinery later if/when that's needed; this table's
-- shape doesn't have to predict it.

create table if not exists public.internship_partner_leads (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Set when the visitor happens to be signed in; never required.
  user_id    uuid references auth.users (id) on delete set null,

  company       text not null check (length(trim(company)) between 2 and 160),
  contact_name  text not null check (length(trim(contact_name)) between 2 and 80),
  role          text check (length(role) <= 80),
  email         text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone         text check (length(phone) <= 32),
  city          text check (length(city) <= 80),
  roles_offered text check (length(roles_offered) <= 2000),

  contacted    boolean not null default false,
  contacted_at timestamptz,
  contacted_by uuid references auth.users (id)
);

create index if not exists internship_partner_leads_created_idx
  on public.internship_partner_leads (created_at desc);

alter table public.internship_partner_leads enable row level security;

-- Anyone may submit, signed in or not — an interested company is an outside
-- party, same as a mentor or institution applicant. WITH CHECK pins the
-- follow-up fields so a crafted request can't self-mark as contacted.
drop policy if exists "anyone can submit interest" on public.internship_partner_leads;
create policy "anyone can submit interest"
  on public.internship_partner_leads for insert
  to anon, authenticated
  with check (contacted = false and contacted_at is null and contacted_by is null);

-- Only admins read leads — private contact info, not a public listing.
drop policy if exists "admins read leads" on public.internship_partner_leads;
create policy "admins read leads"
  on public.internship_partner_leads for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins update leads" on public.internship_partner_leads;
create policy "admins update leads"
  on public.internship_partner_leads for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Email notification — same shape as the other lead/application triggers.
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_internship_partner_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
begin
  select count(*) into v_total from public.internship_partner_leads;

  perform public.notify_email(
    format('[MySkills · Lead] %s wants to offer internships (%s total)', new.company, v_total),
    public.notify_layout(
      'New internship partner lead',
      public.notify_row('Company', new.company)
      || public.notify_row('Contact', new.contact_name)
      || public.notify_row('Role', new.role)
      || public.notify_row('Email', new.email)
      || public.notify_row('Phone', new.phone)
      || public.notify_row('City', new.city)
      || public.notify_row('Roles they’d offer', new.roles_offered)
      || public.notify_row('Total leads', v_total::text),
      'Open MySkills',
      'https://myskills.org.in/community'
    )
  );
  return null;
end;
$$;

drop trigger if exists internship_partner_leads_notify on public.internship_partner_leads;
create trigger internship_partner_leads_notify
  after insert on public.internship_partner_leads
  for each row execute function public.notify_new_internship_partner_lead();

-- ---------------------------------------------------------------------------
-- See leads (admin, via SQL editor — no admin UI page for this yet)
-- ---------------------------------------------------------------------------
--   select created_at, company, contact_name, email, phone, city, roles_offered, contacted
--     from public.internship_partner_leads
--    order by created_at desc;
