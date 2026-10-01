-- Capstone project for both programmes — graded by a mentor — and internship
-- sign-offs. This is the data behind Career Readiness Score method v6.
--
-- A student who has finished a programme's practice submits a project (a title,
-- a summary and links). A reviewer scores it on a four-part rubric, 0-5 each,
-- 20 in all. That total is the project's points. 8 or more passes, which
-- also releases the programme's held activity points (see
-- docs/supabase-career-readiness-score.sql). Below 8 the project goes back with
-- feedback; the student may resubmit twice (three submissions in all).
--
-- Replaces the old sign-off decision: a mentor can no longer approve without
-- grading, so a signature on its own is worth nothing.
--
-- Run ORDER for v6: this file first, then docs/supabase-career-readiness-score.sql,
-- then deploy. (This file doesn't change anything the live frontend reads
-- except the review rows themselves.) Safe to re-run.
-- Depends on: docs/supabase-mentor-reviews.sql and the files that extend it
-- (docs/supabase-career-readiness-programme.sql, -assessment.sql).

-- ---------------------------------------------------------------------------
-- The project and its grade live on the review row
-- ---------------------------------------------------------------------------
alter table public.mentor_reviews
  add column if not exists project_title   text check (length(project_title) <= 120),
  add column if not exists project_summary text check (length(project_summary) <= 2000),
  add column if not exists project_links   text check (length(project_links) <= 1000),
  -- {"relevance": 0-5, "quality": 0-5, "application": 0-5, "presentation": 0-5}
  add column if not exists rubric          jsonb,
  -- The rubric total, 0-20. Null until graded.
  add column if not exists project_points  int check (project_points between 0 and 20),
  -- Which submission this is for the programme: 1, 2 or 3.
  add column if not exists attempt         int not null default 1;

-- ---------------------------------------------------------------------------
-- Student: submit the project (this is now how a review is requested)
-- ---------------------------------------------------------------------------
create or replace function public.submit_programme_project(
  p_programme text,
  p_title     text,
  p_summary   text,
  p_links     text default null,
  p_note      text default null
)
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
  v_used int;
begin
  if v_uid is null then
    raise exception 'You are not signed in.';
  end if;
  if length(btrim(coalesce(p_title, ''))) < 3 then
    raise exception 'Give your project a title.';
  end if;
  if length(btrim(coalesce(p_summary, ''))) < 60 then
    raise exception 'Describe your project in at least a couple of sentences, so your mentor can grade it.';
  end if;

  if p_programme = 'career-readiness' then
    select count(*) into v_needed from public.career_readiness_items();
    select count(*) into v_done
      from public.career_readiness_items() c
      join public.career_readiness_responses r
        on r.module = c.module and r.item = c.item and r.profile_id = v_uid;
    if v_done < v_needed then
      raise exception 'Finish all five modules before submitting your project (% of % tasks done).', v_done, v_needed;
    end if;
  elsif p_programme = 'digital-marketing' then
    if not exists (select 1 from public.initial_assessment_results where profile_id = v_uid) then
      raise exception 'Take the Digital Marketing Initial Assessment first.';
    end if;
    select count(distinct track_slug) into v_tracks
      from public.practice_attempts
     where profile_id = v_uid
       and track_slug in ('marketing-fundamentals', 'market-research', 'meta-ads', 'google-ads',
                          'seo-aeo', 'analytics', 'content-marketing', 'marketing-automation-ai');
    if v_tracks < 8 then
      raise exception 'Practise all 8 skill tracks before submitting your project (% of 8 so far).', v_tracks;
    end if;
  else
    raise exception 'Unknown programme.';
  end if;

  if exists (select 1 from public.mentor_reviews
              where user_id = v_uid and programme = p_programme and status = 'approved') then
    raise exception 'Your project has already passed.';
  end if;
  if exists (select 1 from public.mentor_reviews
              where user_id = v_uid and programme = p_programme and status = 'requested') then
    raise exception 'Your project is already with a mentor.';
  end if;

  -- Three submissions in all: the first, and two resubmissions. Withdrawing a
  -- project before it is graded doesn't use one up.
  select count(*) into v_used from public.mentor_reviews
   where user_id = v_uid and programme = p_programme and status in ('approved', 'changes_requested');
  if v_used >= 3 then
    raise exception 'You have used all three submissions for this programme.';
  end if;

  insert into public.mentor_reviews
    (user_id, programme, student_note, project_title, project_summary, project_links, attempt)
  values
    (v_uid, p_programme, nullif(btrim(p_note), ''), btrim(p_title), btrim(p_summary),
     nullif(btrim(p_links), ''), v_used + 1);
end;
$$;

revoke execute on function public.submit_programme_project(text, text, text, text, text) from public, anon;
grant execute on function public.submit_programme_project(text, text, text, text, text) to authenticated;

-- The old request, still callable from a browser that hasn't been refreshed:
-- tell the student to reload instead of filing a review with no project.
create or replace function public.request_mentor_review(p_programme text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Submit your project with the request — refresh the page to see the new form.';
end;
$$;
revoke execute on function public.request_mentor_review(text, text) from public, anon;
grant execute on function public.request_mentor_review(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Staff: the queue (now with the project and its grade) and grading
-- A function's return columns can't change in place, so it is dropped first.
-- ---------------------------------------------------------------------------
drop function if exists public.admin_mentor_review_queue();

create or replace function public.admin_mentor_review_queue()
returns table (
  id            uuid,
  created_at    timestamptz,
  user_id       uuid,
  programme     text,
  status        public.mentor_review_status,
  student_note  text,
  reviewer_note text,
  reviewed_at   timestamptz,
  full_name     text,
  email         text,
  assessment_percent int,
  tracks        jsonb,
  career_readiness jsonb,
  project_title   text,
  project_summary text,
  project_links   text,
  rubric          jsonb,
  project_points  int,
  attempt         int
)
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
  select r.id, r.created_at, r.user_id, r.programme, r.status, r.student_note, r.reviewer_note, r.reviewed_at,
         p.full_name, u.email::text,
         (select a.percent from public.initial_assessment_results a
           where a.profile_id = r.user_id order by a.completed_at desc limit 1),
         coalesce((
           select jsonb_agg(jsonb_build_object('track', b.track_slug, 'percent', b.best, 'attempts', b.n)
                            order by b.track_slug)
             from (select pa.track_slug, max(pa.percent) as best, count(*) as n
                     from public.practice_attempts pa
                    where pa.profile_id = r.user_id
                    group by pa.track_slug) b
         ), '[]'::jsonb),
         (select jsonb_build_object('scores', c.scores, 'reflection', c.reflection, 'completed_at', c.completed_at)
            from public.career_readiness_assessment_results c
           where c.profile_id = r.user_id),
         r.project_title, r.project_summary, r.project_links, r.rubric, r.project_points, r.attempt
    from public.mentor_reviews r
    left join public.profiles p on p.id = r.user_id
    left join auth.users u on u.id = r.user_id
   where r.status <> 'cancelled'
   order by (r.status = 'requested') desc, r.created_at asc;
end;
$$;
revoke execute on function public.admin_mentor_review_queue() from public, anon;
grant execute on function public.admin_mentor_review_queue() to authenticated;

-- Grade a project. The decision follows from the total, so it can't be signed
-- off without a grade: 8 or more of 20 passes, below that is sent back.
create or replace function public.admin_grade_mentor_review(
  p_id           uuid,
  p_relevance    int,
  p_quality      int,
  p_application  int,
  p_presentation int,
  p_note         text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_status public.mentor_review_status;
begin
  if not public.has_section_access('mentor-reviews') then
    raise exception 'Not authorised.';
  end if;
  if p_relevance not between 0 and 5 or p_quality not between 0 and 5
     or p_application not between 0 and 5 or p_presentation not between 0 and 5 then
    raise exception 'Each rubric score is 0 to 5.';
  end if;
  v_total := p_relevance + p_quality + p_application + p_presentation;
  v_status := case when v_total >= 8 then 'approved' else 'changes_requested' end;
  if v_status = 'changes_requested' and coalesce(btrim(p_note), '') = '' then
    raise exception 'This is below the pass mark — tell the student what to improve.';
  end if;

  update public.mentor_reviews
     set status = v_status,
         rubric = jsonb_build_object('relevance', p_relevance, 'quality', p_quality,
                                     'application', p_application, 'presentation', p_presentation),
         project_points = v_total,
         reviewer_note = nullif(btrim(p_note), ''),
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where id = p_id and status = 'requested';

  if not found then
    raise exception 'This project isn''t waiting for a grade any more.';
  end if;
end;
$$;
revoke execute on function public.admin_grade_mentor_review(uuid, int, int, int, int, text) from public, anon;
grant execute on function public.admin_grade_mentor_review(uuid, int, int, int, int, text) to authenticated;

-- The old one-click sign-off no longer exists.
create or replace function public.admin_decide_mentor_review(p_id uuid, p_decision text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Grade the project instead — refresh the page to see the rubric.';
end;
$$;
revoke execute on function public.admin_decide_mentor_review(uuid, text, text) from public, anon;
grant execute on function public.admin_decide_mentor_review(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Email: the copy now speaks about the project and its grade
-- ---------------------------------------------------------------------------
create or replace function public.notify_mentor_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_email text;
  v_prog text;
begin
  select p.full_name into v_name from public.profiles p where p.id = new.user_id;
  select u.email into v_email from auth.users u where u.id = new.user_id;
  v_prog := case new.programme when 'digital-marketing' then 'Digital Marketing Programme'
                               else 'Career Readiness Programme' end;

  if tg_op = 'INSERT' then
    perform public.notify_email(
      format('[MySkills · Project] %s submitted a project', coalesce(v_name, 'A learner')),
      public.notify_layout(
        'New project to grade',
        public.notify_row('Name', v_name)
        || public.notify_row('Email', v_email)
        || public.notify_row('Programme', v_prog)
        || public.notify_row('Project', new.project_title)
        || public.notify_row('Submission', new.attempt::text || ' of 3')
        || public.notify_row('Note', new.student_note),
        'Open the queue',
        'https://myskills.org.in/admin/mentor-reviews'
      )
    );
  elsif old.status = 'requested' and new.status in ('approved', 'changes_requested') then
    perform public.notify_email_address(
      v_email,
      case new.status when 'approved' then 'Your ' || v_prog || ' project passed'
                      else 'Feedback on your ' || v_prog || ' project' end,
      public.notify_layout(
        case new.status when 'approved' then 'Your project passed'
                        else 'Your mentor has feedback on your project' end,
        public.notify_row('Programme', v_prog)
        || public.notify_row('Project', new.project_title)
        || public.notify_row('Grade', new.project_points::text || ' out of 20')
        || public.notify_row('Mentor''s note', new.reviewer_note)
        || public.notify_row('Next step', case new.status
             when 'approved' then 'Your earned points are released into your Career Readiness Score.'
             else 'Improve the project using the notes above, then submit it again from Practice.' end),
        'Open Practice',
        'https://myskills.org.in/practice'
      )
    );
  end if;
  return null;
end;
$$;
revoke execute on function public.notify_mentor_review() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Internship sign-offs
--
-- The host organisation confirms the work, and an admin records it here. A
-- student's FIRST signed-off internship earns the 20 internship points in the
-- score; every later one earns a badge and no points. Nothing is shown to
-- students yet: internships through MySkills open later.
-- ---------------------------------------------------------------------------
create table if not exists public.internship_signoffs (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  student_id      uuid not null references auth.users (id) on delete cascade,
  organisation    text not null check (length(organisation) between 2 and 160),
  supervisor_name text not null check (length(supervisor_name) between 2 and 120),
  role_title      text check (length(role_title) <= 120),
  started_on      date,
  ended_on        date,
  signed_off_on   date not null default current_date,
  recorded_by     uuid references auth.users (id)
);

create index if not exists internship_signoffs_student_idx on public.internship_signoffs (student_id, signed_off_on);

alter table public.internship_signoffs enable row level security;

drop policy if exists "students read own internship signoffs" on public.internship_signoffs;
create policy "students read own internship signoffs"
  on public.internship_signoffs for select
  to authenticated
  using (student_id = auth.uid());

drop policy if exists "admins read internship signoffs" on public.internship_signoffs;
create policy "admins read internship signoffs"
  on public.internship_signoffs for select
  to authenticated
  using (public.is_admin());

create or replace function public.admin_record_internship_signoff(
  p_student      uuid,
  p_organisation text,
  p_supervisor   text,
  p_role         text default null,
  p_started      date default null,
  p_ended        date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Callable only by signed-in users; the SQL editor (no JWT) is the owner.
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Not authorised.';
  end if;
  insert into public.internship_signoffs (student_id, organisation, supervisor_name, role_title, started_on, ended_on, recorded_by)
  values (p_student, btrim(p_organisation), btrim(p_supervisor), nullif(btrim(p_role), ''), p_started, p_ended, auth.uid());
end;
$$;
revoke execute on function public.admin_record_internship_signoff(uuid, text, text, text, date, date) from public, anon;
grant execute on function public.admin_record_internship_signoff(uuid, text, text, text, date, date) to authenticated;

-- Record one by hand until there is an Admin screen:
--   select public.admin_record_internship_signoff(
--     (select id from auth.users where email = 'student@example.com'),
--     'Acme Digital', 'Priya Nair', 'Marketing intern', '2026-11-01', '2027-01-31');
