-- Study abroad: "Notify me" for destinations that aren't open yet (Paul,
-- 4 Nov 2026: Study abroad should feel global, with countries coming soon).
-- A student taps Notify me on a country; the team sees how many students want
-- each one (Admin → Study abroad), which says which partner to sign next.
--
-- Run after: supabase-study-abroad-v2.sql (has_section_access). Safe to run again.

create table if not exists public.study_abroad_interest (
  student_id    uuid not null references auth.users (id) on delete cascade,
  country_code  text not null check (country_code ~ '^[a-z]{2}$'),
  created_at    timestamptz not null default now(),
  primary key (student_id, country_code)
);
alter table public.study_abroad_interest enable row level security;
-- No policies: read and written only through the functions below.

-- Notify me, or not any more. Returns whether the student is now on the list.
create or replace function public.study_abroad_toggle_interest(p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_code text := lower(btrim(coalesce(p_code, '')));
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  if v_code !~ '^[a-z]{2}$' then
    raise exception 'That isn’t a country code.';
  end if;
  delete from public.study_abroad_interest where student_id = auth.uid() and country_code = v_code;
  if found then
    return false;
  end if;
  insert into public.study_abroad_interest (student_id, country_code) values (auth.uid(), v_code);
  return true;
end $$;

-- The countries this student asked to hear about.
create or replace function public.my_study_abroad_interest() returns text[]
language sql security definer set search_path = public stable as $$
  select coalesce(array_agg(country_code order by country_code), '{}')
    from public.study_abroad_interest where student_id = auth.uid();
$$;

-- For the team: how many students want each country, most first.
create or replace function public.admin_study_abroad_interest() returns jsonb
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.has_section_access('leads') then
    raise exception 'Not authorised.';
  end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object('country_code', country_code, 'students', n) order by n desc, country_code), '[]'::jsonb)
      from (select country_code, count(*) as n from public.study_abroad_interest group by country_code) x
  );
end $$;

revoke execute on function public.study_abroad_toggle_interest(text) from public, anon;
revoke execute on function public.my_study_abroad_interest() from public, anon;
revoke execute on function public.admin_study_abroad_interest() from public, anon;
grant execute on function public.study_abroad_toggle_interest(text) to authenticated;
grant execute on function public.my_study_abroad_interest() to authenticated;
grant execute on function public.admin_study_abroad_interest() to authenticated;
