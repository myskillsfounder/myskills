-- Community portal: one student's record, for the people working with them.
--
-- A provider opens a student from their list and sees who the student is, who
-- they are working with, how far they have got on MySkills, and the dates of
-- their sessions. What is shown depends on the relationship, never on the
-- provider's say-so:
--
--   level 'full'     a mentor or career guide (or an overview account for those
--                    resources): contact, progress, certificates, assessments.
--   level 'progress' a company or institution the student is with: contact,
--                    progress and certificates. No assessment answers.
--   level 'contact'  a counsellor: the student's name and contact, and the dates
--                    of their own sessions. No progress, certificates or
--                    assessments, and nothing about what was discussed.
--
-- Someone with several relationships to the same student gets the highest
-- level among them. An account that doesn't work with the student gets an
-- error, not an empty record.
--
-- Run once, after docs/supabase-community-portal-overview.sql. Safe to re-run.
-- Until it is run, the portal still works; a student's record page just says
-- the record isn't available yet.

create or replace function public.community_student_record(p_student uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_uid uuid := auth.uid();
  v_rels jsonb := '[]'::jsonb;
  v_sessions jsonb := '[]'::jsonb;
  v_level text := null;
  v_rank int := 0;
  v_cur int;
  v_student jsonb;
  v_progress jsonb := null;
  v_certs jsonb := '[]'::jsonb;
  v_apt jsonb := null;
  rec record;
begin
  if v_uid is null then
    raise exception 'You are not signed in.';
  end if;

  -- Mentors: a mentor's own students, or all of them for the Mentors overview.
  for rec in
    select mm.id, mm.status::text as status, mm.programme, mm.mentor_user, m.full_name as provider,
           coalesce(mm.decided_at, mm.created_at)::date as started_on, mm.ended_at::date as ended_on,
           mm.mentor_user = v_uid as mine,
           exists (select 1 from public.community_access a
                    where a.user_id = v_uid and a.resource = 'mentors' and a.sees_all) as overview
      from public.mentor_matches mm
      join public.mentors m on m.id = mm.mentor_id
     where mm.student_id = p_student and mm.status in ('requested', 'active', 'ended')
  loop
    continue when not (rec.mine or rec.overview);
    v_rels := v_rels || jsonb_build_array(jsonb_build_object(
      'resource', 'mentors', 'provider', rec.provider, 'status', rec.status, 'programme', rec.programme,
      'started_on', rec.started_on, 'ended_on', rec.ended_on, 'mine', rec.mine,
      'sessions', (select count(*) from public.live_session_attendance l
                    where l.student_id = p_student and l.programme = rec.programme and l.recorded_by = rec.mentor_user),
      'last_session', (select max(l.held_on) from public.live_session_attendance l
                        where l.student_id = p_student and l.programme = rec.programme and l.recorded_by = rec.mentor_user)));
    v_sessions := v_sessions || coalesce((
      select jsonb_agg(jsonb_build_object('date', l.held_on, 'resource', 'mentors', 'provider', rec.provider, 'title', l.title)
                       order by l.held_on desc)
        from public.live_session_attendance l
       where l.student_id = p_student and l.programme = rec.programme and l.recorded_by = rec.mentor_user), '[]'::jsonb);
    v_cur := 3;
    if v_cur > v_rank then v_rank := v_cur; end if;
  end loop;

  -- Counsellors, career guides, companies and institutions.
  for rec in
    select e.id, e.resource, e.status, e.started_on, e.ended_on, e.provider_id,
           coalesce(a.organisation, pp.full_name, pu.email::text) as provider,
           e.provider_id = v_uid as mine,
           coalesce((select ca.sees_all from public.community_access ca
                      where ca.user_id = v_uid and ca.resource = e.resource), false) as overview
      from public.community_engagements e
      left join public.community_access a on a.user_id = e.provider_id and a.resource = e.resource
      left join public.profiles pp on pp.id = e.provider_id
      left join auth.users pu on pu.id = e.provider_id
     where e.student_id = p_student
  loop
    continue when not (rec.mine or rec.overview);
    v_rels := v_rels || jsonb_build_array(jsonb_build_object(
      'resource', rec.resource, 'provider', rec.provider, 'status', rec.status, 'programme', null,
      'started_on', rec.started_on, 'ended_on', rec.ended_on, 'mine', rec.mine,
      'sessions', (select count(*) from public.community_sessions s where s.engagement_id = rec.id),
      'last_session', (select max(s.held_on) from public.community_sessions s where s.engagement_id = rec.id)));
    v_sessions := v_sessions || coalesce((
      select jsonb_agg(jsonb_build_object('date', s.held_on, 'resource', rec.resource, 'provider', rec.provider, 'title', null)
                       order by s.held_on desc)
        from public.community_sessions s where s.engagement_id = rec.id), '[]'::jsonb);
    v_cur := case rec.resource when 'guidance' then 3 when 'wellness' then 1 else 2 end;
    if v_cur > v_rank then v_rank := v_cur; end if;
  end loop;

  if jsonb_array_length(v_rels) = 0 then
    raise exception 'You don''t work with this student.';
  end if;
  v_level := case v_rank when 3 then 'full' when 2 then 'progress' else 'contact' end;

  select jsonb_build_object(
           'id', p.id, 'full_name', p.full_name, 'email', u.email, 'phone', p.phone,
           'location', p.location, 'headline', p.headline, 'avatar_url', p.avatar_url,
           'career_stage', p.career_stage, 'joined_on', u.created_at::date)
    into v_student
    from public.profiles p join auth.users u on u.id = p.id
   where p.id = p_student;

  if v_level in ('full', 'progress') then
    select s.detail || jsonb_build_object('score', s.score, 'computed_at', s.computed_at)
      into v_progress from public.career_readiness_scores s where s.user_id = p_student;
    select coalesce(jsonb_agg(jsonb_build_object('title', c.title, 'kind', c.kind, 'percent', c.percent, 'issued_at', c.issued_at)
                              order by c.issued_at desc), '[]'::jsonb)
      into v_certs from public.certificates c where c.profile_id = p_student;
  end if;

  if v_level = 'full' then
    v_apt := jsonb_build_object(
      'digital_marketing', exists (select 1 from public.dm_aptitude_results a where a.profile_id = p_student),
      'career_readiness', exists (select 1 from public.career_readiness_assessment_results a where a.profile_id = p_student),
      'foundation_percent', (select r.percent from public.initial_assessment_results r where r.profile_id = p_student));
  end if;

  return jsonb_build_object(
    'level', v_level,
    'student', v_student,
    'relationships', v_rels,
    'progress', v_progress,
    'certificates', v_certs,
    'assessments', v_apt,
    -- Newest first, capped: a record is a summary, not an archive.
    'sessions', (select coalesce(jsonb_agg(x order by (x ->> 'date') desc), '[]'::jsonb)
                   from (select x from jsonb_array_elements(v_sessions) x
                          order by (x ->> 'date') desc limit 60) t)
  );
end;
$$;
revoke execute on function public.community_student_record(uuid) from public, anon;
grant execute on function public.community_student_record(uuid) to authenticated;
