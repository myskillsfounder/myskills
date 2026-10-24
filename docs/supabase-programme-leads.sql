-- Programme leads: the phone's front door asks what a visitor wants to learn.
--
-- Run once against Supabase Cloud (SQL editor), BEFORE deploying the matching
-- frontend: the new form inserts a `programme`, which fails until this column
-- exists. Safe to re-run. Follows docs/supabase-career-readiness-leads.sql and
-- docs/supabase-career-readiness-leads-email.sql.
--
-- Digital Marketing and Global Leadership are open, so the phone sends those
-- visitors to an aptitude test. Entrepreneurship and Data Analytics aren't open
-- yet, so it takes their name and phone instead. Same table as the old Global
-- Leadership waitlist (same RLS: anyone may submit, only the leads section
-- reads), with a column saying which programme. Old rows are all Global
-- Leadership, which the default fills in.

alter table public.career_readiness_leads
  add column if not exists programme text not null default 'global-leadership';

alter table public.career_readiness_leads
  drop constraint if exists career_readiness_leads_programme_check;
alter table public.career_readiness_leads
  add constraint career_readiness_leads_programme_check
  check (programme in ('global-leadership', 'entrepreneurship', 'data-analytics'));

create index if not exists career_readiness_leads_programme_idx
  on public.career_readiness_leads (programme, created_at desc);

-- The email names the programme the lead asked about.
create or replace function public.notify_new_career_readiness_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_title text := case new.programme
    when 'entrepreneurship' then 'Entrepreneurship'
    when 'data-analytics' then 'Data Analytics'
    else 'Global Leadership Programme'
  end;
begin
  select count(*) into v_total
    from public.career_readiness_leads where programme = new.programme;

  perform public.notify_email(
    format('[MySkills · Lead] %s — %s (%s total)', new.full_name, v_title, v_total),
    public.notify_layout(
      'New lead: ' || v_title,
      public.notify_row('Programme', v_title)
      || public.notify_row('Name', new.full_name)
      || public.notify_row('Phone', new.phone)
      || public.notify_row('Email', new.email)
      || public.notify_row('City', new.city)
      || public.notify_row('Total leads for it', v_total::text),
      'Open the leads',
      'https://myskills.org.in/admin/cr-leads'
    )
  );
  return null;
end;
$$;

-- Check:
--   select programme, count(*) from public.career_readiness_leads group by 1;
