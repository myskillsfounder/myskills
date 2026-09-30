-- Mentor portal: a mentor completes their own profile and controls whether
-- they're taking students.
--
-- Before this, a mentor's listing was whatever the application form captured
-- (phone and LinkedIn were optional, there was no photo) and only an admin
-- could change it. Now:
--   * a linked mentor edits their public listing (headline, bio, location,
--     expertise, LinkedIn, photo) and their private phone from /mentor-portal (its own sign-in, separate from
--     the student app);
--   * students are only offered mentors with a finished profile (a bio,
--     expertise, LinkedIn and a phone number) who are taking new students;
--   * a mentor can pause new requests.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on: docs/supabase-mentor-onboarding.sql (mentors, applications),
-- docs/supabase-mentor-matches.sql (mentor_matches, request_mentor),
-- docs/supabase-staff-permissions.sql (has_section_access), and the notify_*
-- email helpers. Run docs/supabase-mentor-link.sql first if you haven't.

-- ---------------------------------------------------------------------------
-- Columns and the private contact table
-- ---------------------------------------------------------------------------
alter table public.mentors add column if not exists accepting boolean not null default true;
-- Kept up to date by the functions below, so the public listing can filter on
-- it without being able to read the private phone number. Mentors who are
-- already linked and already have a LinkedIn keep taking students rather than
-- vanishing from the list the moment this runs; anyone else becomes ready when
-- they finish their profile in the portal. Only on the first run, so a re-run
-- never flips someone back to ready.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'mentors' and column_name = 'ready'
  ) then
    alter table public.mentors add column ready boolean not null default false;
    update public.mentors set ready = true where profile_id is not null and linkedin_url is not null;
  end if;
end $$;

-- RLS can only filter rows, not columns, and public.mentors is world-readable
-- — so the phone number lives in its own table.
create table if not exists public.mentor_private (
  mentor_id  uuid primary key references public.mentors (id) on delete cascade,
  phone      text check (length(phone) <= 32),
  updated_at timestamptz not null default now()
);

alter table public.mentor_private enable row level security;

drop policy if exists "mentor reads own contact" on public.mentor_private;
create policy "mentor reads own contact"
  on public.mentor_private for select to authenticated
  using (exists (select 1 from public.mentors m where m.id = mentor_id and m.profile_id = auth.uid()));

drop policy if exists "staff read mentor contacts" on public.mentor_private;
create policy "staff read mentor contacts"
  on public.mentor_private for select to authenticated
  using (public.has_section_access('mentors'));

-- Keep whatever phone number the application already collected.
insert into public.mentor_private (mentor_id, phone)
select m.id, nullif(btrim(a.phone), '')
  from public.mentors m
  join public.mentor_applications a on a.id = m.application_id
 where nullif(btrim(a.phone), '') is not null
on conflict (mentor_id) do nothing;

-- ---------------------------------------------------------------------------
-- What's still missing from a mentor's profile
-- ---------------------------------------------------------------------------
create or replace function public.mentor_missing(p_mentor uuid)
returns text[]
language sql
security definer
set search_path = public
stable
as $$
  select array_remove(array[
    case when length(btrim(coalesce(m.bio, ''))) < 20         then 'bio' end,
    case when coalesce(array_length(m.expertise, 1), 0) = 0   then 'expertise' end,
    case when nullif(btrim(coalesce(m.linkedin_url, '')), '') is null then 'linkedin' end,
    case when nullif(btrim(coalesce(pr.phone, '')), '') is null       then 'phone' end
  ], null)
    from public.mentors m
    left join public.mentor_private pr on pr.mentor_id = m.id
   where m.id = p_mentor;
$$;
revoke execute on function public.mentor_missing(uuid) from public, anon, authenticated;

create or replace function public.refresh_mentor_ready(p_mentor uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.mentors
     set ready = coalesce(array_length(public.mentor_missing(p_mentor), 1), 0) = 0
   where id = p_mentor;
$$;
revoke execute on function public.refresh_mentor_ready(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- The mentor's own profile: read and save
-- ---------------------------------------------------------------------------
create or replace function public.my_mentor_profile()
returns table (
  id            uuid,
  full_name     text,
  headline      text,
  bio           text,
  location      text,
  expertise     text[],
  linkedin_url  text,
  avatar_url    text,
  phone         text,
  email         text,
  accepting     boolean,
  ready         boolean,
  missing       text[]
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  return query
  select m.id, m.full_name, m.headline, m.bio, m.location, m.expertise, m.linkedin_url, m.avatar_url,
         pr.phone, u.email::text, m.accepting, m.ready, public.mentor_missing(m.id)
    from public.mentors m
    join auth.users u on u.id = m.profile_id
    left join public.mentor_private pr on pr.mentor_id = m.id
   where m.profile_id = auth.uid();
end;
$$;

create or replace function public.update_my_mentor_profile(
  p_headline  text,
  p_bio       text,
  p_location  text,
  p_expertise text[],
  p_linkedin  text,
  p_phone     text,
  p_avatar    text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id        uuid;
  v_headline  text := btrim(coalesce(p_headline, ''));
  v_bio       text := btrim(coalesce(p_bio, ''));
  v_location  text := nullif(btrim(coalesce(p_location, '')), '');
  v_linkedin  text := nullif(btrim(coalesce(p_linkedin, '')), '');
  v_phone     text := nullif(btrim(coalesce(p_phone, '')), '');
  v_avatar    text := nullif(btrim(coalesce(p_avatar, '')), '');
  v_expertise text[];
begin
  select m.id into v_id from public.mentors m where m.profile_id = auth.uid();
  if v_id is null then
    raise exception 'You''re not set up as a mentor yet.';
  end if;

  if length(v_headline) not between 2 and 120 then
    raise exception 'Your title should be 2 to 120 characters.';
  end if;
  if length(v_bio) not between 20 and 1200 then
    raise exception 'Your bio should be 20 to 1200 characters.';
  end if;
  if length(v_location) > 80 then
    raise exception 'Keep your location under 80 characters.';
  end if;
  if v_linkedin is not null and v_linkedin !~* '^https://([a-z]+\.)?linkedin\.com/' then
    raise exception 'Your LinkedIn link should look like https://www.linkedin.com/in/your-name';
  end if;
  if v_phone is not null and v_phone !~ '^[0-9+() -]{7,20}$' then
    raise exception 'Enter a phone number with digits, spaces, + or - only.';
  end if;
  -- Photos come from this mentor's own folder in the profile-media bucket.
  if v_avatar is not null and v_avatar not like '%/storage/v1/object/public/profile-media/' || auth.uid()::text || '/%' then
    raise exception 'That photo wasn''t uploaded from your account.';
  end if;

  -- Trimmed, de-duplicated, in the order they were typed, at most 10.
  select coalesce(array_agg(s.e order by s.first_pos), '{}') into v_expertise
    from (
      select btrim(t.x) as e, min(t.ord) as first_pos
        from unnest(coalesce(p_expertise, '{}')) with ordinality as t(x, ord)
       where btrim(t.x) <> ''
       group by btrim(t.x)
    ) s;
  v_expertise := v_expertise[1:10];
  if exists (select 1 from unnest(v_expertise) as e where length(e) > 40) then
    raise exception 'Each area of expertise should be under 40 characters.';
  end if;

  update public.mentors
     set headline = v_headline, bio = v_bio, location = v_location, expertise = v_expertise,
         linkedin_url = v_linkedin, avatar_url = v_avatar
   where id = v_id;

  insert into public.mentor_private (mentor_id, phone, updated_at) values (v_id, v_phone, now())
  on conflict (mentor_id) do update set phone = excluded.phone, updated_at = now();

  perform public.refresh_mentor_ready(v_id);
end;
$$;

-- Pause or resume new requests. Existing students are unaffected. Completing
-- the profile is what makes a mentor visible; this only pauses them.
create or replace function public.set_my_mentor_accepting(p_on boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ready boolean;
begin
  select m.ready into v_ready from public.mentors m where m.profile_id = auth.uid();
  if not found then
    raise exception 'You''re not set up as a mentor yet.';
  end if;
  if p_on and not v_ready then
    raise exception 'Finish your profile before you start taking students.';
  end if;
  update public.mentors set accepting = p_on where profile_id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
-- Students can only ask mentors who are ready and taking students
-- ---------------------------------------------------------------------------
create or replace function public.request_mentor(p_programme text, p_mentor_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_mentor_user uuid;
  v_ready boolean;
  v_accepting boolean;
begin
  if v_uid is null then
    raise exception 'You are not signed in.';
  end if;
  if p_programme = 'digital-marketing' then
    if not exists (select 1 from public.dm_aptitude_results where profile_id = v_uid) then
      raise exception 'Take the Digital Marketing aptitude assessment first — your mentor starts from that report.';
    end if;
  elsif p_programme = 'career-readiness' then
    if not exists (select 1 from public.career_readiness_assessment_results where profile_id = v_uid) then
      raise exception 'Take the personal aptitude assessment first — your mentor starts from that report.';
    end if;
  else
    raise exception 'Unknown programme.';
  end if;

  select m.profile_id, m.ready, m.accepting into v_mentor_user, v_ready, v_accepting
    from public.mentors m where m.id = p_mentor_id;
  if v_mentor_user is null then
    raise exception 'That mentor isn''t taking students through MySkills yet.';
  end if;
  if not v_ready then
    raise exception 'That mentor is still finishing their profile.';
  end if;
  if not v_accepting then
    raise exception 'That mentor isn''t taking new students right now.';
  end if;
  if v_mentor_user = v_uid then
    raise exception 'You can''t be your own mentor.';
  end if;
  if exists (select 1 from public.mentor_matches
              where student_id = v_uid and programme = p_programme and status in ('requested', 'active')) then
    raise exception 'You already have a mentor, or a request waiting, for this programme.';
  end if;

  insert into public.mentor_matches (programme, student_id, mentor_id, mentor_user, student_note)
  values (p_programme, v_uid, p_mentor_id, v_mentor_user, nullif(btrim(p_note), ''));
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin: the mentor list now says who still has a profile to finish
-- ---------------------------------------------------------------------------
drop function if exists public.admin_listed_mentors();
create or replace function public.admin_listed_mentors()
returns table (
  id            uuid,
  full_name     text,
  headline      text,
  expertise     text[],
  created_at    timestamptz,
  linked        boolean,
  account_email text,
  account_name  text,
  ready         boolean,
  accepting     boolean,
  missing       text[]
)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not public.has_section_access('mentors') then
    raise exception 'not authorized';
  end if;

  return query
  select m.id, m.full_name, m.headline, m.expertise, m.created_at,
         m.profile_id is not null,
         u.email::text,
         p.full_name,
         m.ready, m.accepting,
         public.mentor_missing(m.id)
    from public.mentors m
    left join auth.users u on u.id = m.profile_id
    left join public.profiles p on p.id = m.profile_id
   order by m.sort_order, m.created_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Linking now tells the mentor, and points them at the portal
-- ---------------------------------------------------------------------------
create or replace function public.link_mentor_account(p_mentor uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current uuid;
  v_user    uuid;
  v_other   text;
  v_name    text;
  v_email   text;
begin
  if not public.has_section_access('mentors') then
    raise exception 'not authorized';
  end if;

  select m.profile_id, m.full_name into v_current, v_name from public.mentors m where m.id = p_mentor;
  if not found then
    raise exception 'That mentor no longer exists.';
  end if;

  select u.id, u.email into v_user, v_email from auth.users u where lower(u.email) = lower(btrim(p_email));
  if v_user is null then
    raise exception 'There is no MySkills account with that email. Ask them to sign up first, then try again.';
  end if;
  if not exists (select 1 from public.profiles pr where pr.id = v_user) then
    raise exception 'That account hasn''t finished signing up yet. Ask them to complete onboarding, then try again.';
  end if;

  select m.full_name into v_other from public.mentors m where m.profile_id = v_user and m.id <> p_mentor;
  if found then
    raise exception 'That account is already linked to %.', v_other;
  end if;

  if v_current is not null and v_current <> v_user and exists (
    select 1 from public.mentor_matches mm
     where mm.mentor_id = p_mentor and mm.status in ('requested', 'active')
  ) then
    raise exception 'This mentor has open students. Ask them to end or finish those before changing the account.';
  end if;

  update public.mentors set profile_id = v_user where id = p_mentor;

  -- Only when the link is new or has moved — not on a re-save.
  if v_current is distinct from v_user then
    perform public.refresh_mentor_ready(p_mentor);
    perform public.notify_email_address(
      v_email,
      'You''re set up as a MySkills mentor',
      public.notify_layout(
        'You''re set up as a MySkills mentor',
        public.notify_row('Hi', v_name)
        || public.notify_row('Next step',
             'Finish your profile — your bio, LinkedIn, phone and a photo. Once it''s complete, students can start asking you to mentor them.'),
        'Open the mentor portal',
        'https://myskills.org.in/mentor-portal'
      )
    );
  end if;
end;
$$;

revoke execute on function public.my_mentor_profile() from public, anon;
revoke execute on function public.update_my_mentor_profile(text, text, text, text[], text, text, text) from public, anon;
revoke execute on function public.set_my_mentor_accepting(boolean) from public, anon;
revoke execute on function public.request_mentor(text, uuid, text) from public, anon;
revoke execute on function public.admin_listed_mentors() from public, anon;
revoke execute on function public.link_mentor_account(uuid, text) from public, anon;
grant execute on function public.my_mentor_profile() to authenticated;
grant execute on function public.update_my_mentor_profile(text, text, text, text[], text, text, text) to authenticated;
grant execute on function public.set_my_mentor_accepting(boolean) to authenticated;
grant execute on function public.request_mentor(text, uuid, text) to authenticated;
grant execute on function public.admin_listed_mentors() to authenticated;
grant execute on function public.link_mentor_account(uuid, text) to authenticated;
