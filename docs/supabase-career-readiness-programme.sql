-- Career Readiness Programme — the five personal-development modules go live.
--
-- Each module is Learn -> Practise -> Reflect: three practice tasks and one
-- reflection, so 4 written responses per module and 20 across the programme.
-- A learner's responses are saved here; a module is done when all four of its
-- items are in. The frontend's content (src/lib/careerReadinessContent.ts)
-- and the catalogue below must use the same module and item keys.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on: public.profiles, public.has_section_access(),
-- docs/supabase-mentor-reviews.sql (this replaces request_mentor_review so the
-- Career Readiness review can be asked for once all 20 items are done).
--
-- Nothing here is graded by a machine: the responses are read by a mentor in
-- the mentor-review stage. The length minimums below only stop a one-word
-- "done" from counting as an answer.

-- ---------------------------------------------------------------------------
-- The catalogue: which items make a module, and so the programme
-- ---------------------------------------------------------------------------
create or replace function public.career_readiness_items()
returns table (module text, item text)
language sql
immutable
as $$
  select m, i
    from unnest(array['goal-setting', 'communication', 'leadership', 'agile', 'growth-mindset']) as m,
         unnest(array['t1', 't2', 't3', 'reflect']) as i;
$$;

-- ---------------------------------------------------------------------------
-- Responses: one row per learner per item, edited in place
-- ---------------------------------------------------------------------------
create table if not exists public.career_readiness_responses (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  module     text not null check (module in ('goal-setting', 'communication', 'leadership', 'agile', 'growth-mindset')),
  item       text not null check (item in ('t1', 't2', 't3', 'reflect')),
  response   text not null check (char_length(response) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, module, item)
);

create index if not exists career_readiness_responses_profile_idx
  on public.career_readiness_responses (profile_id);

alter table public.career_readiness_responses enable row level security;

-- Learners read their own. Every write goes through save_career_readiness_response
-- so the minimum length can't be skipped by writing to the table directly.
drop policy if exists "learners read own responses" on public.career_readiness_responses;
create policy "learners read own responses"
  on public.career_readiness_responses for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists "staff read responses" on public.career_readiness_responses;
create policy "staff read responses"
  on public.career_readiness_responses for select
  to authenticated
  using (public.has_section_access('mentor-reviews'));

-- ---------------------------------------------------------------------------
-- Save (or edit) one response
-- ---------------------------------------------------------------------------
create or replace function public.save_career_readiness_response(
  p_module text, p_item text, p_response text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_text text := btrim(coalesce(p_response, ''));
  v_min int;
begin
  if v_uid is null then
    raise exception 'You are not signed in.';
  end if;
  if not exists (select 1 from public.career_readiness_items() c
                  where c.module = p_module and c.item = p_item) then
    raise exception 'Unknown module or task.';
  end if;

  v_min := case when p_item = 'reflect' then 60 else 40 end;
  if char_length(v_text) < v_min then
    raise exception 'Write a little more — at least % characters.', v_min;
  end if;
  if char_length(v_text) > 4000 then
    raise exception 'That is too long — keep it under 4000 characters.';
  end if;

  insert into public.career_readiness_responses (profile_id, module, item, response)
  values (v_uid, p_module, p_item, v_text)
  on conflict (profile_id, module, item)
  do update set response = excluded.response, updated_at = now();
end;
$$;

revoke execute on function public.save_career_readiness_response(text, text, text) from public, anon;
grant execute on function public.save_career_readiness_response(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Mentor review: open the Career Readiness one once all 20 items are in
-- (same function as docs/supabase-mentor-reviews.sql, with that branch filled in)
-- ---------------------------------------------------------------------------
create or replace function public.request_mentor_review(p_programme text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_tracks int;
  v_done int;
  v_needed int;
begin
  if v_uid is null then
    raise exception 'You are not signed in.';
  end if;

  if p_programme = 'career-readiness' then
    select count(*) into v_needed from public.career_readiness_items();
    select count(*) into v_done
      from public.career_readiness_items() c
      join public.career_readiness_responses r
        on r.module = c.module and r.item = c.item and r.profile_id = v_uid;
    if v_done < v_needed then
      raise exception 'Finish all five modules before asking for a review (% of % tasks done).', v_done, v_needed;
    end if;
  elsif p_programme = 'digital-marketing' then
    -- Practice has to be finished: the assessment, and all 8 skill tracks.
    if not exists (select 1 from public.initial_assessment_results where profile_id = v_uid) then
      raise exception 'Take the Digital Marketing Initial Assessment first.';
    end if;
    select count(distinct track_slug) into v_tracks
      from public.practice_attempts
     where profile_id = v_uid
       and track_slug in ('marketing-fundamentals', 'market-research', 'meta-ads', 'google-ads',
                          'seo-aeo', 'analytics', 'content-marketing', 'marketing-automation-ai');
    if v_tracks < 8 then
      raise exception 'Practise all 8 skill tracks before asking for a review (% of 8 so far).', v_tracks;
    end if;
  else
    raise exception 'Unknown programme.';
  end if;

  if exists (select 1 from public.mentor_reviews
              where user_id = v_uid and programme = p_programme and status = 'approved') then
    raise exception 'A mentor has already signed this programme off.';
  end if;
  if exists (select 1 from public.mentor_reviews
              where user_id = v_uid and programme = p_programme and status = 'requested') then
    return; -- already waiting; asking twice is harmless
  end if;

  insert into public.mentor_reviews (user_id, programme, student_note)
  values (v_uid, p_programme, nullif(btrim(p_note), ''));
end;
$$;

revoke execute on function public.request_mentor_review(text, text) from public, anon;
grant execute on function public.request_mentor_review(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Staff: read one learner's responses while reviewing them
-- ---------------------------------------------------------------------------
create or replace function public.admin_career_readiness_responses(p_user uuid)
returns table (module text, item text, response text, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('mentor-reviews') then
    raise exception 'Not authorised.';
  end if;
  return query
  select r.module, r.item, r.response, r.updated_at
    from public.career_readiness_responses r
   where r.profile_id = p_user
   order by r.module, r.item;
end;
$$;

revoke execute on function public.admin_career_readiness_responses(uuid) from public, anon;
grant execute on function public.admin_career_readiness_responses(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Check it (as a signed-in learner, in the app) — or as admin:
--   select p.full_name, r.module, r.item, r.updated_at
--     from public.career_readiness_responses r
--     join public.profiles p on p.id = r.profile_id
--    order by r.updated_at desc;
-- ---------------------------------------------------------------------------
