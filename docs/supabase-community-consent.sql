-- Community portal: a student is shown to a company or institution only after
-- the student says yes.
--
-- BEFORE THIS: a company or institution typed a student's email and the student
-- was on their list at once, with their email, phone, progress and
-- certificates. The student was never asked, and the reply ("No MySkills
-- account uses that email") told the partner who has an account.
--
-- AFTER THIS:
--   * Adding a student sends a REQUEST. The partner sees only the email they
--     typed and "waiting", whether or not an account uses it.
--   * The student sees the request in MySkills (and by email, if they have an
--     account) and accepts or declines. Only on accept do they join the
--     partner's list and can their record be opened.
--   * The student can stop sharing at any time. A partner can open a student's
--     record only while the student is sharing with them, not after either side
--     has ended it.
--   * A partner can withdraw a request that hasn't been answered. A student who
--     declined can't be asked again by the same partner.
--
-- Counsellors and career guides are unchanged: a student reaches them by
-- sending their own request, which the team assigns.
--
-- STUDENTS ALREADY ADDED: any student a company or institution added before
-- this (without being asked) goes back to "waiting" and is asked now. A copy of
-- the table as it was is kept in backups.community_engagements_before_consent.
-- The last statement shows how many that was.
--
-- Run once in the Supabase SQL editor, then deploy. Safe to re-run.
-- Depends on: docs/supabase-community-portal.sql, -overview.sql and -record.sql.

-- ---------------------------------------------------------------------------
-- A request has an email and no student until it is accepted
-- ---------------------------------------------------------------------------
alter table public.community_engagements alter column student_id drop not null;
alter table public.community_engagements
  add column if not exists invited_email text check (length(invited_email) <= 320);
alter table public.community_engagements add column if not exists responded_at timestamptz;

-- Replace the status rule (whatever it was named), and say what each state needs.
do $$
declare
  c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.community_engagements'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.community_engagements drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.community_engagements
  add constraint community_engagements_status_check
  check (status in ('invited', 'declined', 'active', 'ended'));
alter table public.community_engagements
  add constraint community_engagements_student_when_live
  check (status in ('invited', 'declined') or student_id is not null);
alter table public.community_engagements
  add constraint community_engagements_email_when_asked
  check (status not in ('invited', 'declined') or invited_email is not null);

-- One request per student per partner; a declined one keeps its place, so the
-- same partner can't ask again.
create unique index if not exists community_engagements_one_request
  on public.community_engagements (resource, provider_id, invited_email)
  where status in ('invited', 'declined');
create index if not exists community_engagements_invited_idx
  on public.community_engagements (invited_email) where status = 'invited';

-- ---------------------------------------------------------------------------
-- Students added before they were asked: ask them now
-- ---------------------------------------------------------------------------
create schema if not exists backups;
create table if not exists backups.community_engagements_before_consent as
  select * from public.community_engagements;

update public.community_engagements e
   set status = 'invited', invited_email = lower(u.email), student_id = null
  from auth.users u
 where u.id = e.student_id
   and e.resource in ('internships', 'institutions')
   and e.status = 'active'
   and e.created_by = e.provider_id
   -- Not one the student has since accepted (so this is safe to run again).
   and e.responded_at is null;

-- ---------------------------------------------------------------------------
-- The partner: ask a student
-- ---------------------------------------------------------------------------
create or replace function public.add_community_student(p_resource text, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_me text;
  v_org text;
  v_student uuid;
begin
  if p_resource not in ('internships', 'institutions') then
    raise exception 'Students for this resource are assigned by the MySkills team.';
  end if;
  select a.organisation into v_org from public.community_access a
   where a.user_id = auth.uid() and a.resource = p_resource;
  if not found then
    raise exception 'You don''t have access to this part of the Community portal.';
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter the student''s email address.';
  end if;
  select lower(u.email) into v_me from auth.users u where u.id = auth.uid();
  if v_email = v_me then
    raise exception 'That is your own account.';
  end if;

  -- Someone who already accepted: the partner knows them, so saying so tells nothing new.
  if exists (select 1 from public.community_engagements e
              join auth.users u on u.id = e.student_id
             where e.provider_id = auth.uid() and e.resource = p_resource
               and e.status = 'active' and lower(u.email) = v_email) then
    raise exception 'That student is already on your list.';
  end if;
  if exists (select 1 from public.community_engagements e
             where e.provider_id = auth.uid() and e.resource = p_resource
               and e.status = 'declined' and e.invited_email = v_email) then
    raise exception 'This student chose not to share their MySkills record with you.';
  end if;
  -- Already asked: nothing more to do.
  if exists (select 1 from public.community_engagements e
             where e.provider_id = auth.uid() and e.resource = p_resource
               and e.status = 'invited' and e.invited_email = v_email) then
    return;
  end if;
  if (select count(*) from public.community_engagements e
       where e.provider_id = auth.uid() and e.resource = p_resource and e.status = 'invited') >= 50 then
    raise exception 'You have 50 requests waiting for an answer. Withdraw some before asking more students.';
  end if;

  -- The same row whether or not an account uses this email: the partner learns
  -- nothing until the student answers.
  insert into public.community_engagements (resource, student_id, provider_id, status, invited_email, created_by)
  values (p_resource, null, auth.uid(), 'invited', v_email, auth.uid());

  -- Tell the student, if there is one. A failure to send mustn't undo the request.
  select u.id into v_student from auth.users u
   where lower(u.email) = v_email and u.email_confirmed_at is not null;
  if v_student is not null then
    begin
      perform public.notify_email_address(
        v_email,
        format('%s would like to see your MySkills progress', coalesce(v_org, 'A MySkills partner')),
        public.notify_layout(
          'Is this you?',
          public.notify_row('From', coalesce(v_org, 'A MySkills partner'))
          || public.notify_row('They say', case p_resource when 'internships' then 'You are interning with them.'
                                                           else 'You are studying with them.' end)
          || public.notify_row('If you accept', 'They can see your name, contact details, Career Readiness Score and certificates, until you stop sharing.')
          || public.notify_row('If you don''t know them', 'Decline, or ignore this. Nothing is shared unless you accept.'),
          'Review the request',
          'https://myskills.org.in/community'
        )
      );
    exception when others then
      null;
    end;
  end if;
end;
$$;
revoke execute on function public.add_community_student(text, text) from public, anon;
grant execute on function public.add_community_student(text, text) to authenticated;

-- The partner: take back a request that hasn't been answered. (A declined one
-- stays, or declining would only invite another request.)
create or replace function public.cancel_community_invite(p_engagement uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.community_engagements
   where id = p_engagement and provider_id = auth.uid() and status = 'invited';
  if not found then
    raise exception 'That request is no longer waiting.';
  end if;
end;
$$;
revoke execute on function public.cancel_community_invite(uuid) from public, anon;
grant execute on function public.cancel_community_invite(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- The partner's list: students with them, and the requests still waiting.
-- A request shows the email that was typed and nothing about the person.
-- ---------------------------------------------------------------------------
create or replace function public.my_community_students(p_resource text)
returns table (
  id            uuid,
  status        text,
  started_on    date,
  ended_on      date,
  student_id    uuid,
  student_name  text,
  student_email text,
  sessions      int,
  last_session  date,
  provider_name text,
  mine          boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_all boolean;
begin
  select a.sees_all into v_all from public.community_access a
   where a.user_id = auth.uid() and a.resource = p_resource;
  if v_all is null then
    raise exception 'You don''t have access to this part of the Community portal.';
  end if;

  return query
  select e.id, e.status, e.started_on, e.ended_on, e.student_id,
         p.full_name, coalesce(u.email::text, e.invited_email),
         (select count(*)::int from public.community_sessions s where s.engagement_id = e.id),
         (select max(s.held_on) from public.community_sessions s where s.engagement_id = e.id),
         coalesce(pa.organisation, pp.full_name, pu.email::text),
         e.provider_id = auth.uid()
    from public.community_engagements e
    left join public.profiles p on p.id = e.student_id
    left join auth.users u on u.id = e.student_id
    left join public.profiles pp on pp.id = e.provider_id
    left join auth.users pu on pu.id = e.provider_id
    left join public.community_access pa on pa.user_id = e.provider_id and pa.resource = e.resource
   where e.resource = p_resource
     -- An overview is of students, not of requests other partners have sent.
     and (e.provider_id = auth.uid() or (v_all and e.status in ('active', 'ended')))
   order by (e.status = 'active') desc, (e.status = 'invited') desc, e.started_on desc, e.created_at desc;
end;
$$;
revoke execute on function public.my_community_students(text) from public, anon;
grant execute on function public.my_community_students(text) to authenticated;

-- ---------------------------------------------------------------------------
-- The student: who is asking, and who I am sharing with
-- ---------------------------------------------------------------------------
create or replace function public.my_community_connections()
returns table (id uuid, resource text, organisation text, status text, since date)
language sql
security definer
set search_path = public
stable
as $$
  select e.id, e.resource,
         coalesce(a.organisation, case e.resource when 'internships' then 'A partner company' else 'A partner institution' end),
         e.status,
         case e.status when 'active' then e.started_on else e.created_at::date end
    from public.community_engagements e
    -- Only partners who still have their place in the portal.
    join public.community_access a on a.user_id = e.provider_id and a.resource = e.resource
   where e.resource in ('internships', 'institutions')
     and (
       (e.status = 'active' and e.student_id = auth.uid())
       -- A request finds its student by the email it was sent to, and only once
       -- that email is confirmed as theirs.
       or (e.status = 'invited' and e.invited_email = (
             select lower(u.email) from auth.users u
              where u.id = auth.uid() and u.email_confirmed_at is not null))
     )
   order by (e.status = 'invited') desc, e.created_at desc;
$$;
revoke execute on function public.my_community_connections() from public, anon;
grant execute on function public.my_community_connections() to authenticated;

create or replace function public.respond_community_invite(p_engagement uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.community_engagements;
  v_me text;
begin
  select lower(u.email) into v_me from auth.users u
   where u.id = auth.uid() and u.email_confirmed_at is not null;
  select * into e from public.community_engagements where id = p_engagement for update;
  if e.id is null or e.status <> 'invited' or v_me is null or e.invited_email is distinct from v_me then
    raise exception 'That request is no longer waiting for you.';
  end if;

  if not coalesce(p_accept, false) then
    update public.community_engagements
       set status = 'declined', responded_at = now()
     where id = e.id;
    return;
  end if;

  -- Already sharing with them some other way: the request has nothing to add.
  if exists (select 1 from public.community_engagements x
              where x.resource = e.resource and x.provider_id = e.provider_id
                and x.student_id = auth.uid() and x.status = 'active') then
    delete from public.community_engagements where id = e.id;
    return;
  end if;
  update public.community_engagements
     set status = 'active', student_id = auth.uid(), responded_at = now()
   where id = e.id;
end;
$$;
revoke execute on function public.respond_community_invite(uuid, boolean) from public, anon;
grant execute on function public.respond_community_invite(uuid, boolean) to authenticated;

-- The student: stop sharing with a company or institution.
create or replace function public.stop_community_sharing(p_engagement uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.community_engagements
     set status = 'ended', ended_on = current_date
   where id = p_engagement and student_id = auth.uid() and status = 'active'
     and resource in ('internships', 'institutions');
  if not found then
    raise exception 'You aren''t sharing with them.';
  end if;
end;
$$;
revoke execute on function public.stop_community_sharing(uuid) from public, anon;
grant execute on function public.stop_community_sharing(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- A student's record: a company or institution, only while the student shares.
-- (The function as it was in docs/supabase-community-portal-record.sql, with
-- that one rule added.)
-- ---------------------------------------------------------------------------
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
    -- A company or institution sees a student only while the student is sharing
    -- with it: after they accept, and until either side ends it.
    continue when rec.resource in ('internships', 'institutions') and rec.status <> 'active' and not rec.overview;
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

-- ---------------------------------------------------------------------------
-- Admin usage: a request that hasn't been accepted isn't a student using
-- anything. (As in docs/supabase-community-portal.sql, with that one filter.)
-- ---------------------------------------------------------------------------
create or replace function public.admin_community_usage()
returns table (
  student_id        uuid,
  full_name         text,
  email             text,
  mentors           text,
  mentor_sessions   int,
  wellness_active   boolean,
  wellness_sessions int,
  guidance_active   boolean,
  guidance_sessions int,
  internship        text,
  institution       text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('portal-access') then
    raise exception 'Not authorised.';
  end if;

  return query
  with students as (
    select mm.student_id as id from public.mentor_matches mm where mm.status = 'active'
    union
    select e.student_id from public.community_engagements e where e.status in ('active', 'ended')
  )
  select s.id, p.full_name, u.email::text,
         (select string_agg(distinct m.full_name, ', ')
            from public.mentor_matches mm join public.mentors m on m.id = mm.mentor_id
           where mm.student_id = s.id and mm.status = 'active'),
         (select count(*)::int from public.live_session_attendance l
           where l.student_id = s.id and l.host_kind = 'mentor'),
         exists (select 1 from public.community_engagements e
                  where e.student_id = s.id and e.resource = 'wellness' and e.status = 'active'),
         (select count(*)::int from public.community_sessions cs
            join public.community_engagements e on e.id = cs.engagement_id
           where e.student_id = s.id and e.resource = 'wellness'),
         exists (select 1 from public.community_engagements e
                  where e.student_id = s.id and e.resource = 'guidance' and e.status = 'active'),
         (select count(*)::int from public.community_sessions cs
            join public.community_engagements e on e.id = cs.engagement_id
           where e.student_id = s.id and e.resource = 'guidance'),
         (select string_agg(distinct coalesce(a.organisation, 'A partner company'), ', ')
            from public.community_engagements e
            left join public.community_access a on a.user_id = e.provider_id and a.resource = e.resource
           where e.student_id = s.id and e.resource = 'internships' and e.status = 'active'),
         (select string_agg(distinct coalesce(a.organisation, 'A partner institution'), ', ')
            from public.community_engagements e
            left join public.community_access a on a.user_id = e.provider_id and a.resource = e.resource
           where e.student_id = s.id and e.resource = 'institutions' and e.status = 'active')
    from students s
    left join public.profiles p on p.id = s.id
    left join auth.users u on u.id = s.id
   order by p.full_name nulls last;
end;
$$;
revoke execute on function public.admin_community_usage() from public, anon;
grant execute on function public.admin_community_usage() to authenticated;

-- How many students had been added without being asked (they are asked now).
select count(*) as students_added_without_being_asked
  from backups.community_engagements_before_consent b
 where b.resource in ('internships', 'institutions') and b.status = 'active' and b.created_by = b.provider_id;
