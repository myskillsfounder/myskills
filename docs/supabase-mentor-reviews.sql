-- Mentor review — stage 2 of completing a programme (practice → mentor
-- review → internship through MySkills; see src/lib/programmes.ts).
--
-- A student who has finished practice asks for a review; a reviewer on the
-- MySkills team reads their results and either signs the programme's practice
-- off or sends it back with notes on what to work on.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on: public.is_admin(), public.has_section_access(),
-- public.staff_permissions (docs/supabase-staff-permissions.sql, extended by
-- docs/supabase-profile-verification.sql), and the notify_* helpers
-- (docs/supabase-email-notifications.sql + notify_email_address from
-- docs/supabase-profile-verification.sql).
--
-- Reviewers are staff with the 'mentor-reviews' section (admins always). Staff
-- grants are limited to @myskills.org.in accounts, so a volunteer mentor who
-- reviews needs a team address.

-- ---------------------------------------------------------------------------
-- Extend staff_permissions with the 'mentor-reviews' section
-- ---------------------------------------------------------------------------
alter table public.staff_permissions drop constraint if exists staff_permissions_section_check;
alter table public.staff_permissions add constraint staff_permissions_section_check
  check (section in (
    'users', 'assessment', 'certificates', 'feedback',
    'mentors', 'institution-partners', 'demo-requests', 'blog', 'ads', 'wellness',
    'verification', 'mentor-reviews'
  ));

create or replace function public.my_staff_sections()
returns text[]
language sql
security definer
set search_path = public
stable
as $$
  select case
    when public.is_admin() then array[
      'users', 'assessment', 'certificates', 'feedback',
      'mentors', 'institution-partners', 'demo-requests', 'blog', 'ads', 'wellness',
      'verification', 'mentor-reviews'
    ]
    else coalesce(
      (select array_agg(sp.section) from public.staff_permissions sp
        join auth.users u on u.id = sp.user_id
       where sp.user_id = auth.uid() and lower(u.email) like '%@myskills.org.in'),
      array[]::text[]
    )
  end;
$$;

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.mentor_review_status as enum ('requested', 'approved', 'changes_requested', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.mentor_reviews (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  programme     text not null check (programme in ('digital-marketing', 'career-readiness')),
  status        public.mentor_review_status not null default 'requested',
  student_note  text check (length(student_note) <= 1000),
  -- Written TO the student (they can read their own row), never an internal note.
  reviewer_note text check (length(reviewer_note) <= 2000),
  reviewed_by   uuid references auth.users (id),
  reviewed_at   timestamptz
);

-- One open request per programme, and a programme is signed off once.
create unique index if not exists mentor_reviews_one_open
  on public.mentor_reviews (user_id, programme) where status = 'requested';
create unique index if not exists mentor_reviews_one_approved
  on public.mentor_reviews (user_id, programme) where status = 'approved';
create index if not exists mentor_reviews_queue_idx
  on public.mentor_reviews (status, created_at);

alter table public.mentor_reviews enable row level security;

-- Students only read. Every write goes through the functions below, so the
-- eligibility check can't be skipped by writing to the table directly.
drop policy if exists "students read own mentor reviews" on public.mentor_reviews;
create policy "students read own mentor reviews"
  on public.mentor_reviews for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "staff read mentor reviews" on public.mentor_reviews;
create policy "staff read mentor reviews"
  on public.mentor_reviews for select
  to authenticated
  using (public.has_section_access('mentor-reviews'));

-- ---------------------------------------------------------------------------
-- Student: request / withdraw
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
begin
  if v_uid is null then
    raise exception 'You are not signed in.';
  end if;

  if p_programme = 'career-readiness' then
    raise exception 'The Career Readiness Programme hasn''t opened yet.';
  elsif p_programme is distinct from 'digital-marketing' then
    raise exception 'Unknown programme.';
  end if;

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

create or replace function public.cancel_my_mentor_review(p_programme text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.mentor_reviews
     set status = 'cancelled'
   where user_id = auth.uid() and programme = p_programme and status = 'requested';
$$;

-- ---------------------------------------------------------------------------
-- Staff: queue and decision
-- ---------------------------------------------------------------------------
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
  tracks        jsonb
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
         ), '[]'::jsonb)
    from public.mentor_reviews r
    left join public.profiles p on p.id = r.user_id
    left join auth.users u on u.id = r.user_id
   where r.status <> 'cancelled'
   order by (r.status = 'requested') desc, r.created_at asc;
end;
$$;

create or replace function public.admin_decide_mentor_review(p_id uuid, p_decision text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_section_access('mentor-reviews') then
    raise exception 'Not authorised.';
  end if;
  if p_decision not in ('approved', 'changes_requested') then
    raise exception 'Decision must be approved or changes_requested.';
  end if;
  if p_decision = 'changes_requested' and coalesce(btrim(p_note), '') = '' then
    raise exception 'Tell the student what to work on.';
  end if;

  update public.mentor_reviews
     set status = p_decision::public.mentor_review_status,
         reviewer_note = nullif(btrim(p_note), ''),
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where id = p_id and status = 'requested';

  if not found then
    raise exception 'This review isn''t waiting for a decision any more.';
  end if;
end;
$$;

revoke execute on function public.request_mentor_review(text, text) from public, anon;
revoke execute on function public.cancel_my_mentor_review(text) from public, anon;
revoke execute on function public.admin_mentor_review_queue() from public, anon;
revoke execute on function public.admin_decide_mentor_review(uuid, text, text) from public, anon;
grant execute on function public.request_mentor_review(text, text) to authenticated;
grant execute on function public.cancel_my_mentor_review(text) to authenticated;
grant execute on function public.admin_mentor_review_queue() to authenticated;
grant execute on function public.admin_decide_mentor_review(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Email: the team on a new request, the student on a decision
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
      format('[MySkills · Mentor review] %s asked for a review', coalesce(v_name, 'A learner')),
      public.notify_layout(
        'New mentor review request',
        public.notify_row('Name', v_name)
        || public.notify_row('Email', v_email)
        || public.notify_row('Programme', v_prog)
        || public.notify_row('Note', new.student_note),
        'Open the review queue',
        'https://myskills.org.in/admin/mentor-reviews'
      )
    );
  elsif old.status = 'requested' and new.status in ('approved', 'changes_requested') then
    perform public.notify_email_address(
      v_email,
      case new.status when 'approved' then 'A mentor signed off your ' || v_prog
                      else 'Feedback from your mentor review' end,
      public.notify_layout(
        case new.status when 'approved' then 'Your practice is signed off'
                        else 'Your mentor has some notes' end,
        public.notify_row('Programme', v_prog)
        || public.notify_row('Mentor''s note', new.reviewer_note)
        || public.notify_row('Next step', case new.status
             when 'approved' then 'An internship through MySkills — the last stage of the programme.'
             else 'Work on the notes above, then ask for another review from Practice.' end),
        'Open Practice',
        'https://myskills.org.in/practice'
      )
    );
  end if;
  return null;
end;
$$;
revoke execute on function public.notify_mentor_review() from public, anon, authenticated;

drop trigger if exists mentor_reviews_notify on public.mentor_reviews;
create trigger mentor_reviews_notify
  after insert or update on public.mentor_reviews
  for each row execute function public.notify_mentor_review();

-- ---------------------------------------------------------------------------
-- Grant a teammate the Mentor reviews section:
--   insert into public.staff_permissions (user_id, section)
--   select id, 'mentor-reviews' from auth.users where email = 'someone@myskills.org.in'
--   on conflict (user_id, section) do nothing;
-- ---------------------------------------------------------------------------
