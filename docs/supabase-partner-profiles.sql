-- A profile for every partner in the Community portal.
--
-- Mentors already have one (their listing). Counsellors, career guides,
-- companies and institutions had nothing of their own: the team knew them only
-- by an email and, for an organisation, a name typed at sign-up.
--
-- This gives each of them a profile they fill in themselves in the portal:
-- who they are (or the organisation and its contact person), what they do, a
-- few lines about them, where they are, a link, a photo or logo, and a phone
-- number. It is for the MySkills team, who use it to introduce a student to
-- the right person; students do not browse these partners, so nothing here is
-- published.
--
--   my_partner_profile()          the signed-in partner's own profile
--   save_my_partner_profile(...)  save it (partners only)
--   admin_partner_profiles()      every partner's profile, for the team
--
-- Run once, after docs/supabase-community-portal-overview.sql and
-- docs/supabase-portal-signup.sql. Safe to re-run.
-- Until it is run, the portal says the profile isn't set up yet.

create table if not exists public.partner_profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text check (length(display_name) <= 120),
  contact_name text check (length(contact_name) <= 80),
  title        text check (length(title) <= 120),
  about        text check (length(about) <= 1200),
  city         text check (length(city) <= 80),
  website      text check (length(website) <= 300),
  phone        text check (length(phone) <= 32),
  photo_url    text check (length(photo_url) <= 600),
  updated_at   timestamptz not null default now()
);

-- No policies: read and written only through the functions below.
alter table public.partner_profiles enable row level security;

-- Is this account a partner (given a section of its own, not just the team's overview)?
create or replace function public.is_partner(p_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.community_access a where a.user_id = p_user and not a.sees_all);
$$;
revoke execute on function public.is_partner(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- The partner: read my profile
-- With nothing saved yet it starts from what is already known: the name on the
-- account, the organisation and phone given when they asked for access.
-- ---------------------------------------------------------------------------
create or replace function public.my_partner_profile()
returns table (
  display_name text,
  contact_name text,
  title        text,
  about        text,
  city         text,
  website      text,
  phone        text,
  photo_url    text,
  email        text,
  saved        boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;
  return query
  select coalesce(pp.display_name,
                  (select a.organisation from public.community_access a
                    where a.user_id = v_uid and a.organisation is not null limit 1),
                  pr.full_name),
         coalesce(pp.contact_name,
                  case when exists (select 1 from public.community_access a
                                     where a.user_id = v_uid and a.organisation is not null)
                       then pr.full_name end),
         pp.title,
         pp.about,
         pp.city,
         pp.website,
         coalesce(pp.phone, (select r.phone from public.portal_requests r where r.user_id = v_uid)),
         pp.photo_url,
         u.email::text,
         pp.user_id is not null
    from auth.users u
    left join public.profiles pr on pr.id = u.id
    left join public.partner_profiles pp on pp.user_id = u.id
   where u.id = v_uid;
end;
$$;
revoke execute on function public.my_partner_profile() from public, anon;
grant execute on function public.my_partner_profile() to authenticated;

-- ---------------------------------------------------------------------------
-- The partner: save my profile
-- ---------------------------------------------------------------------------
create or replace function public.save_my_partner_profile(
  p_display_name text,
  p_contact_name text,
  p_title        text,
  p_about        text,
  p_city         text,
  p_website      text,
  p_phone        text,
  p_photo        text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_name    text := btrim(coalesce(p_display_name, ''));
  v_contact text := nullif(btrim(coalesce(p_contact_name, '')), '');
  v_title   text := nullif(btrim(coalesce(p_title, '')), '');
  v_about   text := nullif(btrim(coalesce(p_about, '')), '');
  v_city    text := nullif(btrim(coalesce(p_city, '')), '');
  v_website text := nullif(btrim(coalesce(p_website, '')), '');
  v_phone   text := nullif(btrim(coalesce(p_phone, '')), '');
  v_photo   text := nullif(btrim(coalesce(p_photo, '')), '');
begin
  if v_uid is null then
    raise exception 'You are not signed in.';
  end if;
  if not public.is_partner(v_uid) then
    raise exception 'This account isn''t a verified partner yet.';
  end if;

  if length(v_name) not between 2 and 120 then
    raise exception 'The name should be 2 to 120 characters.';
  end if;
  if length(v_contact) > 80 then
    raise exception 'Keep the contact person''s name under 80 characters.';
  end if;
  if length(v_title) > 120 then
    raise exception 'Keep the title under 120 characters.';
  end if;
  if length(v_about) > 1200 then
    raise exception 'Keep the description under 1200 characters.';
  end if;
  if length(v_city) > 80 then
    raise exception 'Keep the city under 80 characters.';
  end if;
  if v_website is not null and v_website !~* '^https?://[^[:space:]]+\.[^[:space:]]+$' then
    raise exception 'The link should start with https:// and be a full address.';
  end if;
  if v_phone is not null and v_phone !~ '^[0-9+() -]{7,20}$' then
    raise exception 'Enter a phone number with digits, spaces, + or - only.';
  end if;
  -- Photos come from this account's own folder in the profile-media bucket.
  if v_photo is not null and v_photo not like '%/storage/v1/object/public/profile-media/' || v_uid::text || '/%' then
    raise exception 'That image wasn''t uploaded from your account.';
  end if;

  insert into public.partner_profiles (user_id, display_name, contact_name, title, about, city, website, phone, photo_url, updated_at)
  values (v_uid, v_name, v_contact, v_title, v_about, v_city, v_website, v_phone, v_photo, now())
  on conflict (user_id) do update
    set display_name = excluded.display_name, contact_name = excluded.contact_name, title = excluded.title,
        about = excluded.about, city = excluded.city, website = excluded.website, phone = excluded.phone,
        photo_url = excluded.photo_url, updated_at = now();
end;
$$;
revoke execute on function public.save_my_partner_profile(text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.save_my_partner_profile(text, text, text, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- The team: every partner's profile
-- For whoever verifies partners, and whoever assigns students' support
-- requests to a counsellor or guide.
-- ---------------------------------------------------------------------------
create or replace function public.admin_partner_profiles()
returns table (
  user_id      uuid,
  display_name text,
  contact_name text,
  title        text,
  about        text,
  city         text,
  website      text,
  phone        text,
  photo_url    text,
  updated_at   timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not (public.has_section_access('portal-access') or public.has_section_access('wellness')) then
    raise exception 'Not authorised.';
  end if;
  return query
  select pp.user_id, pp.display_name, pp.contact_name, pp.title, pp.about, pp.city, pp.website, pp.phone,
         pp.photo_url, pp.updated_at
    from public.partner_profiles pp;
end;
$$;
revoke execute on function public.admin_partner_profiles() from public, anon;
grant execute on function public.admin_partner_profiles() to authenticated;
