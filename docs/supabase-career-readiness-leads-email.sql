-- Career Readiness waitlist: collect an email instead of a city.
--
-- Run once against Supabase Cloud (SQL editor), BEFORE deploying the matching
-- frontend. Safe to re-run. Follows docs/supabase-career-readiness-leads.sql.
--
-- /career-readiness-waitlist now asks for name, phone and email. city was
-- NOT NULL there, so it has to become optional or every new insert fails; the
-- column and any rows already holding a city are left alone. email is
-- nullable at the database level because earlier rows have none — the form
-- itself requires it.

alter table public.career_readiness_leads alter column city drop not null;

alter table public.career_readiness_leads add column if not exists email text
  check (email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

-- Same notification as before, plus an Email row. notify_row() drops a blank
-- value, so an older lead (city, no email) still renders correctly.
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
      || public.notify_row('Email', new.email)
      || public.notify_row('City', new.city)
      || public.notify_row('Total leads', v_total::text),
      'Open MySkills',
      'https://myskills.org.in/career-readiness'
    )
  );
  return null;
end;
$$;

-- The trigger (career_readiness_leads_notify) already points at this
-- function by name, so create-or-replace above is all it needs.

-- See leads:
--   select created_at, full_name, phone, email, city, contacted
--     from public.career_readiness_leads
--    order by created_at desc;
