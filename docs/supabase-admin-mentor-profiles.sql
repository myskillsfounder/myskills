-- Admin: set up and edit a mentor's profile from the back end.
--
-- A mentor can be listed before they have a MySkills account (or without ever
-- having one): the team writes the profile — name, title, bio, skills, LinkedIn,
-- photo, private phone — and links an account later, if and when the mentor
-- signs up. Until then the listing shows on the Community page but students
-- can't send them requests (that needs a linked account, as before).
--
-- Both functions need the staff 'mentors' section (a full admin has it).
-- The checks match the ones a mentor meets when editing their own profile
-- (update_my_mentor_profile in docs/supabase-mentor-portal.sql), so a listing
-- written here is valid there too. The one difference is the photo: staff can't
-- upload into a mentor's own folder, so the photo is a link to a hosted image
-- (the Admin screen uploads it under the staff member's folder and passes that
-- link, or you can paste any https image link).
--
-- A listing counts as ready (offered to students) only once it has a bio,
-- skills, a LinkedIn link and a phone number, same as for self-service.
--
-- Run once. Safe to re-run. Order against the deploy doesn't matter: until
-- it is run the Edit and Add buttons report that it isn't set up yet.

-- ---------------------------------------------------------------------------
-- Everything on one mentor, for the edit form (including the private phone).
-- ---------------------------------------------------------------------------
create or replace function public.admin_mentor_details(p_mentor uuid)
returns table (
  id           uuid,
  full_name    text,
  headline     text,
  bio          text,
  location     text,
  expertise    text[],
  linkedin_url text,
  avatar_url   text,
  phone        text,
  linked       boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('mentors') then
    raise exception 'Not authorised.';
  end if;
  return query
  select m.id, m.full_name, m.headline, m.bio, m.location, m.expertise, m.linkedin_url, m.avatar_url,
         pr.phone, m.profile_id is not null
    from public.mentors m
    left join public.mentor_private pr on pr.mentor_id = m.id
   where m.id = p_mentor;
end;
$$;
revoke execute on function public.admin_mentor_details(uuid) from public, anon;
grant execute on function public.admin_mentor_details(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Create a listing (p_mentor null) or update one. Returns the mentor's id.
-- ---------------------------------------------------------------------------
create or replace function public.admin_save_mentor(
  p_mentor    uuid,
  p_full_name text,
  p_headline  text,
  p_bio       text,
  p_location  text,
  p_expertise text[],
  p_linkedin  text,
  p_phone     text,
  p_avatar    text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id        uuid := p_mentor;
  v_name      text := btrim(coalesce(p_full_name, ''));
  v_headline  text := btrim(coalesce(p_headline, ''));
  v_bio       text := btrim(coalesce(p_bio, ''));
  v_location  text := nullif(btrim(coalesce(p_location, '')), '');
  v_linkedin  text := nullif(btrim(coalesce(p_linkedin, '')), '');
  v_phone     text := nullif(btrim(coalesce(p_phone, '')), '');
  v_avatar    text := nullif(btrim(coalesce(p_avatar, '')), '');
  v_expertise text[];
begin
  if not public.has_section_access('mentors') then
    raise exception 'Not authorised.';
  end if;

  if length(v_name) not between 2 and 80 then
    raise exception 'The name should be 2 to 80 characters.';
  end if;
  if length(v_headline) not between 2 and 120 then
    raise exception 'The title should be 2 to 120 characters.';
  end if;
  if length(v_bio) not between 20 and 1200 then
    raise exception 'The bio should be 20 to 1200 characters.';
  end if;
  if length(v_location) > 80 then
    raise exception 'Keep the location under 80 characters.';
  end if;
  if v_linkedin is not null and v_linkedin !~* '^https://([a-z]+\.)?linkedin\.com/' then
    raise exception 'The LinkedIn link should look like https://www.linkedin.com/in/their-name';
  end if;
  if v_phone is not null and v_phone !~ '^[0-9+() -]{7,20}$' then
    raise exception 'Enter a phone number with digits, spaces, + or - only.';
  end if;
  if v_avatar is not null and v_avatar !~* '^https://' then
    raise exception 'The photo should be a link starting with https://';
  end if;

  -- Trimmed, de-duplicated, in the order typed, at most 10.
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

  if v_id is null then
    insert into public.mentors (full_name, headline, bio, location, expertise, linkedin_url, avatar_url, sort_order)
    values (v_name, v_headline, v_bio, v_location, v_expertise, v_linkedin, v_avatar,
            coalesce((select max(sort_order) from public.mentors), 0) + 1)
    returning mentors.id into v_id;
  else
    update public.mentors m
       set full_name = v_name, headline = v_headline, bio = v_bio, location = v_location,
           expertise = v_expertise, linkedin_url = v_linkedin, avatar_url = v_avatar
     where m.id = v_id;
    if not found then
      raise exception 'That mentor no longer exists.';
    end if;
  end if;

  insert into public.mentor_private (mentor_id, phone, updated_at) values (v_id, v_phone, now())
  on conflict (mentor_id) do update set phone = excluded.phone, updated_at = now();

  perform public.refresh_mentor_ready(v_id);
  return v_id;
end;
$$;
revoke execute on function public.admin_save_mentor(uuid, text, text, text, text, text[], text, text, text) from public, anon;
grant execute on function public.admin_save_mentor(uuid, text, text, text, text, text[], text, text, text) to authenticated;
