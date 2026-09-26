-- Admin panel v2: the overview, the student list and one page per student,
-- built around the two programmes and the Career Readiness Score.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on everything the score depends on
-- (docs/supabase-career-readiness-score.sql and what it lists), plus
-- docs/supabase-admin.sql, docs/supabase-dm-aptitude-assessment.sql,
-- docs/supabase-career-readiness-assessment.sql, and the partner/lead tables.
--
-- Every function here recomputes the Career Readiness Score with
-- compute_career_readiness_score(), so the admin always sees today's number,
-- not whatever was stored the last time the student opened their dashboard.
-- At a few thousand students that's still quick; beyond that, switch the list
-- to career_readiness_scores and refresh it on a schedule.
--
-- Access: the overview is admins only (as before). The student list and the
-- student page need the 'users' section.

-- ---------------------------------------------------------------------------
-- Overview
-- ---------------------------------------------------------------------------
create or replace function public.admin_overview_v2()
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_out json;
begin
  if not public.is_admin() then
    return null;
  end if;

  with scores as (
    select public.compute_career_readiness_score(p.id) as d from public.profiles p
  ),
  s as (
    select (d ->> 'score')::int as score,
           (d ->> 'verified_points')::numeric as verified,
           (d ->> 'self_reported_points')::numeric as self_reported
      from scores where d is not null
  ),
  dm_tracks as (
    select profile_id, count(distinct track_slug) as n from public.practice_attempts group by profile_id
  ),
  cr_modules as (
    select profile_id, count(*) as n from public.career_readiness_responses group by profile_id
  )
  select json_build_object(
    'needs_action', json_build_object(
      'mentor_reviews',       (select count(*) from public.mentor_reviews where status = 'requested'),
      'verification',         (select count(*) from public.verification_requests where status in ('requested', 'scheduled')),
      'mentor_applications',  (select count(*) from public.mentor_applications where status = 'pending'),
      'institution_applications', (select count(*) from public.institution_partner_applications where status = 'pending'),
      'demo_requests',        (select count(*) from public.institution_demo_requests where status = 'pending'),
      'wellness',             (select count(*) from public.wellness_requests where status = 'pending'),
      'internship_leads',     (select count(*) from public.internship_partner_leads where not contacted),
      'career_readiness_leads', (select count(*) from public.career_readiness_leads where not contacted)
    ),
    -- Bands match BANDS in src/lib/readinessScore.ts (method v5): 64 / 44 / 20.
    'score', json_build_object(
      'students',        (select count(*) from s),
      'average',         (select round(avg(score), 1) from s),
      'standout',        (select count(*) from s where score >= 64),
      'strong',          (select count(*) from s where score >= 44 and score < 64),
      'building',        (select count(*) from s where score >= 20 and score < 44),
      'getting_started', (select count(*) from s where score < 20),
      'verified_share',  (select case when sum(verified + self_reported) > 0
                                      then round(100 * sum(verified) / sum(verified + self_reported))
                                      else 0 end from s)
    ),
    'digital_marketing', json_build_object(
      'aptitude',     (select count(*) from public.dm_aptitude_results),
      'practising',   (select count(*) from dm_tracks),
      'all_tracks',   (select count(*) from dm_tracks where n >= 8),
      'foundation',   (select count(*) from public.initial_assessment_results),
      'review_asked', (select count(distinct user_id) from public.mentor_reviews
                        where programme = 'digital-marketing' and status <> 'cancelled'),
      'signed_off',   (select count(distinct user_id) from public.mentor_reviews
                        where programme = 'digital-marketing' and status = 'approved')
    ),
    'career_readiness', json_build_object(
      'aptitude',     (select count(*) from public.career_readiness_assessment_results),
      'started',      (select count(*) from cr_modules),
      'all_modules',  (select count(*) from cr_modules where n >= 20),
      'review_asked', (select count(distinct user_id) from public.mentor_reviews
                        where programme = 'career-readiness' and status <> 'cancelled'),
      'signed_off',   (select count(distinct user_id) from public.mentor_reviews
                        where programme = 'career-readiness' and status = 'approved')
    ),
    'activity', json_build_object(
      'total_users',      (select count(*) from public.profiles),
      'new_this_week',    (select count(*) from auth.users where created_at >= now() - interval '7 days'),
      'active_today',     (select count(distinct profile_id) from public.login_events where at >= date_trunc('day', now())),
      'active_this_week', (select count(distinct profile_id) from public.login_events where at >= now() - interval '7 days'),
      'practice_this_week', (select count(*) from public.practice_attempts where attempted_at >= now() - interval '7 days'),
      'live_sessions_this_month', (select count(*) from public.live_session_attendance where held_on >= current_date - 30),
      'certificates',     (select count(*) from public.certificates),
      'avg_rating',       (select round(avg(rating)::numeric, 1) from public.feedback where rating is not null)
    )
  ) into v_out;

  return v_out;
end;
$$;

revoke execute on function public.admin_overview_v2() from public, anon;
grant execute on function public.admin_overview_v2() to authenticated;

-- ---------------------------------------------------------------------------
-- Student list
-- ---------------------------------------------------------------------------
create or replace function public.admin_students(p_search text default null, p_max_rows int default 200)
returns table (
  id               uuid,
  email            text,
  full_name        text,
  is_mentor        boolean,
  created_at       timestamptz,
  last_login       timestamptz,
  score            int,
  verified_points  numeric,
  identity_verified boolean,
  dm_tracks        int,
  dm_foundation    int,
  dm_signed_off    boolean,
  cr_modules       int,
  cr_signed_off    boolean
)
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
  with picked as (
    select p.id, u.email::text as email, p.full_name, p.is_mentor, u.created_at
      from public.profiles p
      join auth.users u on u.id = p.id
     where p_search is null or btrim(p_search) = ''
        or p.full_name ilike '%' || btrim(p_search) || '%'
        or u.email ilike '%' || btrim(p_search) || '%'
     order by u.created_at desc
     limit least(coalesce(p_max_rows, 200), 1000)
  ),
  scored as (
    select k.*, public.compute_career_readiness_score(k.id) as d from picked k
  )
  select k.id, k.email, k.full_name, k.is_mentor, k.created_at,
         (select max(le.at) from public.login_events le where le.profile_id = k.id),
         coalesce((k.d ->> 'score')::int, 0),
         coalesce((k.d ->> 'verified_points')::numeric, 0),
         coalesce((k.d ->> 'identity_verified')::boolean, false),
         (select count(distinct pa.track_slug)::int from public.practice_attempts pa where pa.profile_id = k.id),
         (select r.percent from public.initial_assessment_results r where r.profile_id = k.id),
         coalesce((k.d -> 'professional' ->> 'mentor_approved')::boolean, false),
         coalesce((k.d -> 'personal' ->> 'modules_done')::int, 0),
         coalesce((k.d -> 'personal' ->> 'mentor_approved')::boolean, false)
    from scored k
   order by k.created_at desc;
end;
$$;

revoke execute on function public.admin_students(text, int) from public, anon;
grant execute on function public.admin_students(text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- One student, everything
-- ---------------------------------------------------------------------------
create or replace function public.admin_student_detail(p_user uuid)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_out json;
begin
  if not public.has_section_access('users') then
    raise exception 'Not authorised.';
  end if;

  select json_build_object(
    'profile', json_build_object(
      'id', p.id, 'full_name', p.full_name, 'email', u.email, 'phone', p.phone,
      'headline', p.headline, 'location', p.location, 'career_stage', p.career_stage,
      'is_mentor', p.is_mentor, 'created_at', u.created_at,
      'last_login', (select max(le.at) from public.login_events le where le.profile_id = p.id)
    ),
    'score', public.compute_career_readiness_score(p.id),
    'digital_marketing', json_build_object(
      'aptitude', (select json_build_object('scores', a.scores, 'reflection', a.reflection, 'completed_at', a.completed_at)
                     from public.dm_aptitude_results a where a.profile_id = p.id),
      'foundation', (select json_build_object('percent', r.percent, 'correct', r.correct, 'total', r.total,
                                              'completed_at', r.completed_at)
                       from public.initial_assessment_results r where r.profile_id = p.id),
      'certificate', (select json_build_object('code', c.code, 'kind', c.kind, 'issued_at', c.issued_at)
                        from public.certificates c where c.profile_id = p.id order by c.issued_at desc limit 1),
      'tracks', coalesce((select json_agg(json_build_object(
                             'track', b.track_slug, 'best', b.percent, 'attempts', b.attempts,
                             'last', b.last_attempt_at) order by b.track_slug)
                            from public.practice_best_scores b where b.profile_id = p.id), '[]'::json)
    ),
    'career_readiness', json_build_object(
      'aptitude', (select json_build_object('scores', a.scores, 'reflection', a.reflection, 'completed_at', a.completed_at)
                     from public.career_readiness_assessment_results a where a.profile_id = p.id),
      'modules', coalesce((select json_object_agg(m.module, m.n)
                             from (select module, count(*) as n from public.career_readiness_responses
                                    where profile_id = p.id group by module) m), '{}'::json)
    ),
    'live_sessions', coalesce((select json_agg(json_build_object(
                                  'programme', l.programme, 'title', l.title, 'host_name', l.host_name,
                                  'host_kind', l.host_kind, 'held_on', l.held_on) order by l.held_on desc)
                                 from public.live_session_attendance l where l.student_id = p.id), '[]'::json),
    'mentor_reviews', coalesce((select json_agg(json_build_object(
                                   'programme', mr.programme, 'status', mr.status, 'created_at', mr.created_at,
                                   'reviewed_at', mr.reviewed_at, 'reviewer_note', mr.reviewer_note)
                                   order by mr.created_at desc)
                                  from public.mentor_reviews mr where mr.user_id = p.id and mr.status <> 'cancelled'),
                               '[]'::json),
    'verification', json_build_object(
      'request', (select json_build_object('status', v.status, 'created_at', v.created_at, 'scheduled_at', v.scheduled_at)
                    from public.verification_requests v where v.user_id = p.id order by v.created_at desc limit 1),
      'items', (select count(*) from public.verified_items vi where vi.user_id = p.id)
    )
  )
  into v_out
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = p_user;

  return v_out;
end;
$$;

revoke execute on function public.admin_student_detail(uuid) from public, anon;
grant execute on function public.admin_student_detail(uuid) to authenticated;
