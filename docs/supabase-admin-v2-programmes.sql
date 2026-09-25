-- Admin v2, part 2: a page set per programme — aptitude results, practice,
-- Foundation results, Career Readiness modules and answers.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on: docs/supabase-admin-v2.sql and the tables it reads
-- (dm_aptitude_results, career_readiness_assessment_results, practice_attempts
-- with server_graded, initial_assessment_results/_category_scores,
-- certificates, career_readiness_responses).
--
-- Read-only. Access:
--   aptitude results, practice            -> 'users' section
--   Foundation results                    -> 'users' or 'assessment'
--   modules & answers                     -> 'users' or 'mentor-reviews'
-- The two lead lists (internship partners, Career Readiness leads) need no
-- function: their tables already let admins read and mark them contacted.

-- ---------------------------------------------------------------------------
-- Aptitude results (both programmes: 'digital-marketing' or 'career-readiness')
-- ---------------------------------------------------------------------------
create or replace function public.admin_aptitude_results(p_programme text)
returns table (user_id uuid, full_name text, email text, completed_at timestamptz, scores jsonb, reflection text)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not public.has_section_access('users') then
    raise exception 'Not authorised.';
  end if;

  if p_programme = 'digital-marketing' then
    return query
    select a.profile_id, p.full_name, u.email::text, a.completed_at, a.scores, a.reflection
      from public.dm_aptitude_results a
      join public.profiles p on p.id = a.profile_id
      join auth.users u on u.id = a.profile_id
     order by a.completed_at desc;
  elsif p_programme = 'career-readiness' then
    return query
    select a.profile_id, p.full_name, u.email::text, a.completed_at, a.scores, a.reflection
      from public.career_readiness_assessment_results a
      join public.profiles p on p.id = a.profile_id
      join auth.users u on u.id = a.profile_id
     order by a.completed_at desc;
  else
    raise exception 'Unknown programme.';
  end if;
end;
$$;

revoke execute on function public.admin_aptitude_results(text) from public, anon;
grant execute on function public.admin_aptitude_results(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Practice: one row per track, then the students on one track
-- ---------------------------------------------------------------------------
create or replace function public.admin_practice_tracks()
returns table (track_slug text, students int, avg_best numeric, attempts int, server_graded int, legacy int)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not public.has_section_access('users') then
    raise exception 'Not authorised.';
  end if;

  return query
  select b.track_slug,
         count(*)::int,
         round(avg(b.percent), 1),
         (select count(*)::int from public.practice_attempts pa where pa.track_slug = b.track_slug),
         (select count(*)::int from public.practice_attempts pa where pa.track_slug = b.track_slug and pa.server_graded),
         (select count(*)::int from public.practice_attempts pa where pa.track_slug = b.track_slug and not pa.server_graded)
    from public.practice_best_scores b
   group by b.track_slug;
end;
$$;

revoke execute on function public.admin_practice_tracks() from public, anon;
grant execute on function public.admin_practice_tracks() to authenticated;

create or replace function public.admin_practice_track_students(p_track text)
returns table (user_id uuid, full_name text, email text, best int, attempts int, last_attempt_at timestamptz, server_graded int)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not public.has_section_access('users') then
    raise exception 'Not authorised.';
  end if;

  return query
  select b.profile_id, p.full_name, u.email::text, b.percent::int, b.attempts::int, b.last_attempt_at,
         (select count(*)::int from public.practice_attempts pa
           where pa.profile_id = b.profile_id and pa.track_slug = p_track and pa.server_graded)
    from public.practice_best_scores b
    join public.profiles p on p.id = b.profile_id
    join auth.users u on u.id = b.profile_id
   where b.track_slug = p_track
   order by b.percent desc, b.last_attempt_at desc;
end;
$$;

revoke execute on function public.admin_practice_track_students(text) from public, anon;
grant execute on function public.admin_practice_track_students(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Foundation results, and how each category went on average
-- ---------------------------------------------------------------------------
create or replace function public.admin_foundation_results()
returns table (user_id uuid, full_name text, email text, percent int, correct int, total int,
               completed_at timestamptz, certificate_code text, certificate_kind text)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not (public.has_section_access('users') or public.has_section_access('assessment')) then
    raise exception 'Not authorised.';
  end if;

  return query
  select r.profile_id, p.full_name, u.email::text, r.percent, r.correct, r.total, r.completed_at,
         c.code, c.kind
    from public.initial_assessment_results r
    join public.profiles p on p.id = r.profile_id
    join auth.users u on u.id = r.profile_id
    left join lateral (
      select cc.code, cc.kind from public.certificates cc
       where cc.profile_id = r.profile_id order by cc.issued_at desc limit 1
    ) c on true
   order by r.completed_at desc;
end;
$$;

revoke execute on function public.admin_foundation_results() from public, anon;
grant execute on function public.admin_foundation_results() to authenticated;

create or replace function public.admin_foundation_categories()
returns table (category text, students int, avg_percent numeric)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not (public.has_section_access('users') or public.has_section_access('assessment')) then
    raise exception 'Not authorised.';
  end if;

  return query
  select s.category, count(*)::int, round(avg(s.percent), 1)
    from public.initial_assessment_category_scores s
   group by s.category
   order by 3 asc;
end;
$$;

revoke execute on function public.admin_foundation_categories() from public, anon;
grant execute on function public.admin_foundation_categories() to authenticated;

-- ---------------------------------------------------------------------------
-- Career Readiness modules: who started and finished each, then the answers
-- ---------------------------------------------------------------------------
create or replace function public.admin_cr_modules()
returns table (module text, started int, finished int)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not (public.has_section_access('users') or public.has_section_access('mentor-reviews')) then
    raise exception 'Not authorised.';
  end if;

  return query
  select m.module, count(*)::int, count(*) filter (where m.n >= 4)::int
    from (select r.module, r.profile_id, count(*) as n
            from public.career_readiness_responses r
           group by r.module, r.profile_id) m
   group by m.module;
end;
$$;

revoke execute on function public.admin_cr_modules() from public, anon;
grant execute on function public.admin_cr_modules() to authenticated;

create or replace function public.admin_cr_module_answers(p_module text)
returns table (user_id uuid, full_name text, email text, item text, response text, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
stable
as $$
#variable_conflict use_column
begin
  if not (public.has_section_access('users') or public.has_section_access('mentor-reviews')) then
    raise exception 'Not authorised.';
  end if;

  return query
  select r.profile_id, p.full_name, u.email::text, r.item, r.response, r.updated_at
    from public.career_readiness_responses r
    join public.profiles p on p.id = r.profile_id
    join auth.users u on u.id = r.profile_id
   where r.module = p_module
   order by p.full_name nulls last, r.profile_id, r.item;
end;
$$;

revoke execute on function public.admin_cr_module_answers(text) from public, anon;
grant execute on function public.admin_cr_module_answers(text) to authenticated;
