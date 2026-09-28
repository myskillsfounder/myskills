-- Skill badges, awarded by mentors.
--
-- A mentor can award a badge for a skill to a student they're mentoring on
-- that programme, once the student has earned it in practice:
--   Digital Marketing  — one badge per skill track, once the student's score on
--                        that track (best of the last 3 attempts) is 60%+
--   Career Readiness   — one badge per module, once all 4 of its items are written
-- The badge carries the mentor's name and the date, and shows on the student's
-- profile. It's proof twice over: the student did the work, and a person who
-- knows them vouched for it.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on: public.mentor_matches (docs/supabase-mentor-matches.sql),
-- public.mentors, public.practice_best_scores, public.career_readiness_items()
-- and career_readiness_responses (docs/supabase-career-readiness-programme.sql),
-- public.has_section_access(), the notify_* email helpers.

create table if not exists public.skill_badges (
  id          uuid primary key default gen_random_uuid(),
  awarded_at  timestamptz not null default now(),
  student_id  uuid not null references public.profiles (id) on delete cascade,
  programme   text not null check (programme in ('digital-marketing', 'career-readiness')),
  skill       text not null,
  mentor_id   uuid references public.mentors (id) on delete set null,
  awarded_by  uuid not null references auth.users (id),
  note        text check (length(note) <= 500),
  unique (student_id, skill)
);

create index if not exists skill_badges_student_idx on public.skill_badges (student_id);

alter table public.skill_badges enable row level security;

-- Read only: awarding and removing go through the functions below.
drop policy if exists "students read own badges" on public.skill_badges;
create policy "students read own badges"
  on public.skill_badges for select to authenticated
  using (student_id = auth.uid());

drop policy if exists "mentors read badges they awarded" on public.skill_badges;
create policy "mentors read badges they awarded"
  on public.skill_badges for select to authenticated
  using (awarded_by = auth.uid());

drop policy if exists "staff read badges" on public.skill_badges;
create policy "staff read badges"
  on public.skill_badges for select to authenticated
  using (public.has_section_access('mentor-reviews'));

-- ---------------------------------------------------------------------------
-- The skills of each programme, and whether a student has earned one
-- ---------------------------------------------------------------------------
create or replace function public.programme_skills(p_programme text)
returns setof text
language sql
immutable
as $$
  select unnest(case p_programme
    when 'digital-marketing' then array['marketing-fundamentals', 'market-research', 'meta-ads', 'google-ads',
                                        'seo-aeo', 'analytics', 'content-marketing', 'marketing-automation-ai']
    when 'career-readiness'  then array['goal-setting', 'communication', 'leadership', 'agile', 'growth-mindset']
    else array[]::text[]
  end);
$$;

-- What the student has done on that skill: the track score, or items written.
create or replace function public.skill_progress(p_student uuid, p_programme text, p_skill text)
returns table (earned boolean, result text)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_pct int;
  v_items int;
begin
  if p_programme = 'digital-marketing' then
    select b.percent into v_pct from public.practice_best_scores b
     where b.profile_id = p_student and b.track_slug = p_skill;
    return query select coalesce(v_pct, 0) >= 60,
                        case when v_pct is null then 'Not practised yet' else v_pct || '%' end;
  else
    select count(*) into v_items from public.career_readiness_responses r
     where r.profile_id = p_student and r.module = p_skill;
    return query select v_items >= 4, v_items || ' of 4 written';
  end if;
end;
$$;
revoke execute on function public.skill_progress(uuid, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Mentor: see a student's skills, award, remove
-- ---------------------------------------------------------------------------
create or replace function public.mentee_skills(p_match uuid)
returns table (skill text, earned boolean, result text, awarded boolean, badge_id uuid)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
declare
  v_match public.mentor_matches%rowtype;
begin
  select * into v_match from public.mentor_matches
   where id = p_match and mentor_user = auth.uid() and status = 'active';
  if not found then
    raise exception 'You can only see the skills of a student you''re mentoring.';
  end if;

  return query
  select s.skill, sp.earned, sp.result, b.id is not null, b.id
    from public.programme_skills(v_match.programme) as s(skill)
    cross join lateral public.skill_progress(v_match.student_id, v_match.programme, s.skill) sp
    left join public.skill_badges b on b.student_id = v_match.student_id and b.skill = s.skill;
end;
$$;

create or replace function public.award_skill_badge(p_match uuid, p_skill text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.mentor_matches%rowtype;
  v_earned boolean;
begin
  select * into v_match from public.mentor_matches
   where id = p_match and mentor_user = auth.uid() and status = 'active';
  if not found then
    raise exception 'You can only award badges to a student you''re mentoring.';
  end if;
  if not exists (select 1 from public.programme_skills(v_match.programme) s where s = p_skill) then
    raise exception 'That skill isn''t part of this programme.';
  end if;

  select sp.earned into v_earned from public.skill_progress(v_match.student_id, v_match.programme, p_skill) sp;
  if not coalesce(v_earned, false) then
    raise exception 'The student hasn''t earned this skill in practice yet.';
  end if;

  insert into public.skill_badges (student_id, programme, skill, mentor_id, awarded_by, note)
  values (v_match.student_id, v_match.programme, p_skill, v_match.mentor_id, auth.uid(), nullif(btrim(p_note), ''))
  on conflict (student_id, skill) do nothing;
  if not found then
    raise exception 'That badge is already awarded.';
  end if;
end;
$$;

-- The mentor who awarded it (or the team) can take a badge back.
create or replace function public.remove_skill_badge(p_badge uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.skill_badges
   where id = p_badge
     and (awarded_by = auth.uid() or public.has_section_access('mentor-reviews'));
  if not found then
    raise exception 'You can''t remove that badge.';
  end if;
end;
$$;

revoke execute on function public.mentee_skills(uuid) from public, anon;
revoke execute on function public.award_skill_badge(uuid, text, text) from public, anon;
revoke execute on function public.remove_skill_badge(uuid) from public, anon;
grant execute on function public.mentee_skills(uuid) to authenticated;
grant execute on function public.award_skill_badge(uuid, text, text) to authenticated;
grant execute on function public.remove_skill_badge(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Email the student when they get a badge
-- ---------------------------------------------------------------------------
create or replace function public.notify_skill_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_mentor text;
begin
  select u.email into v_email from auth.users u where u.id = new.student_id;
  select m.full_name into v_mentor from public.mentors m where m.id = new.mentor_id;
  perform public.notify_email_address(
    v_email,
    coalesce(v_mentor, 'Your mentor') || ' awarded you a skill badge',
    public.notify_layout(
      'You earned a skill badge',
      public.notify_row('Skill', initcap(replace(new.skill, '-', ' ')))
      || public.notify_row('Awarded by', v_mentor)
      || public.notify_row('Their note', new.note),
      'See it on your profile',
      'https://myskills.org.in/profile'
    )
  );
  return null;
end;
$$;
revoke execute on function public.notify_skill_badge() from public, anon, authenticated;

drop trigger if exists skill_badges_notify on public.skill_badges;
create trigger skill_badges_notify
  after insert on public.skill_badges
  for each row execute function public.notify_skill_badge();
