-- Who did what, in the admin panel: an activity log, and new feedback in the
-- Inbox.
--
-- 1. THE ACTIVITY LOG (admin_activity). Every change the team makes to the
--    things that matter is written down as it happens, with who made it and
--    when: approving or sending back a role, confirming an internship,
--    verifying or turning down a partner, giving or removing portal access,
--    grading a project, confirming a live session, verification, mentors,
--    institutions, wellness requests (status only), blog posts, ads, the
--    Foundation questions, and the team itself (super admins, members, roles).
--
--    It is written by triggers on those tables, so it catches a change
--    however it was made, through any page. A change by a student or a
--    partner is not logged (only the team's); a change made in the Supabase SQL
--    editor is logged for the team tables and portal access, as "Supabase".
--
--    What is kept: the action, which record, a short name for it (a role's
--    title, a company's name), the student or partner it concerns, which
--    fields changed, and the before and after of a status. NEVER the contents
--    of what anyone wrote: a wellness request's message, a project, a note.
--
--    Super admins read it at Admin > Team > Activity log.
--
-- 2. NEW FEEDBACK. feedback.reviewed_at marks what the team has read; unread
--    feedback is in the Inbox for whoever has the Feedback section.
--
-- Run once; either order with the deploy (the log starts filling when this is
-- run; the page appears with the deploy). Safe to re-run. Nothing here changes
-- what students or partners see.
-- Depends on: docs/supabase-team-and-roles.sql and the tables it watches
-- (any that don't exist yet are skipped).

-- ---------------------------------------------------------------------------
-- 1. The log
-- ---------------------------------------------------------------------------
create table if not exists public.admin_activity (
  id            bigint generated always as identity primary key,
  at            timestamptz not null default now(),
  -- Null: made in the Supabase SQL editor (no signed-in user).
  actor_id      uuid references auth.users (id) on delete set null,
  actor_email   text,
  table_name    text not null,
  op            text not null check (op in ('INSERT', 'UPDATE', 'DELETE')),
  record_id     text,
  -- A short name for the record: a role's title, a company, a mentor.
  label         text,
  -- The student or partner the record is about, when it has one.
  subject_id    uuid,
  subject_label text,
  -- { "changed": [...field names], "status": {"from": .., "to": ..}, ... }
  detail        jsonb not null default '{}'::jsonb
);
create index if not exists admin_activity_at_idx on public.admin_activity (at desc);
create index if not exists admin_activity_actor_idx on public.admin_activity (actor_id, at desc);
-- Read only through admin_activity_log() below; nothing writes but the trigger.
alter table public.admin_activity enable row level security;

-- Is this account on the team (a super admin, or given any section)?
create or replace function public.is_staff(p_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select p_user is not null and (
    exists (select 1 from public.admins a where a.user_id = p_user)
    or exists (select 1 from public.staff_permissions sp where sp.user_id = p_user)
  );
$$;
revoke execute on function public.is_staff(uuid) from public, anon, authenticated;

-- The trigger. Arguments: the column that names the record (or ''), the column
-- holding the user it is about (or ''), and 'always' to also log changes made
-- with no signed-in user (the SQL editor).
create or replace function public.log_admin_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_new jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  v_old jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_label_col text := nullif(tg_argv[0], '');
  v_subject_col text := nullif(tg_argv[1], '');
  v_always boolean := coalesce(tg_argv[2], '') = 'always';
  v_changed text[];
  v_detail jsonb := '{}'::jsonb;
  v_subject uuid;
  v_key text;
begin
  -- Only the team's changes; and from the SQL editor only where asked.
  if v_actor is null then
    if not v_always then
      return null;
    end if;
  elsif not public.is_staff(v_actor) then
    return null;
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(k order by k), '{}') into v_changed
      from jsonb_object_keys(v_new) k
     where k not in ('updated_at')
       and v_new -> k is distinct from v_old -> k;
    if cardinality(v_changed) = 0 then
      return null;
    end if;
    v_detail := jsonb_build_object('changed', to_jsonb(v_changed));
    -- The before and after of a state, never of anything written.
    foreach v_key in array array['status', 'contacted', 'sees_all', 'accepting', 'listed', 'is_published', 'published', 'active', 'role_id', 'sections'] loop
      if v_key = any (v_changed) then
        v_detail := v_detail || jsonb_build_object(v_key, jsonb_build_object('from', v_old -> v_key, 'to', v_new -> v_key));
      end if;
    end loop;
  else
    foreach v_key in array array['status', 'resource', 'sees_all', 'programme', 'item_type', 'section', 'sections'] loop
      if v_row ? v_key then
        v_detail := v_detail || jsonb_build_object(v_key, v_row -> v_key);
      end if;
    end loop;
  end if;
  -- Which programme or section, for every op, where the row has one.
  if tg_op = 'UPDATE' then
    foreach v_key in array array['resource', 'programme'] loop
      if v_row ? v_key then
        v_detail := v_detail || jsonb_build_object(v_key, v_row -> v_key);
      end if;
    end loop;
  end if;

  if v_subject_col is not null and v_row ? v_subject_col then
    begin
      v_subject := (v_row ->> v_subject_col)::uuid;
    exception when others then
      v_subject := null;
    end;
  end if;

  insert into public.admin_activity
    (actor_id, actor_email, table_name, op, record_id, label, subject_id, subject_label, detail)
  values (
    v_actor,
    (select u.email::text from auth.users u where u.id = v_actor),
    tg_table_name,
    tg_op,
    coalesce(v_row ->> 'id', v_row ->> 'user_id', v_row ->> 'email'),
    left(case when v_label_col is not null then v_row ->> v_label_col end, 160),
    v_subject,
    (select coalesce(nullif(btrim(p.full_name), ''), u.email::text)
       from auth.users u left join public.profiles p on p.id = u.id
      where u.id = v_subject),
    v_detail
  );
  return null;
exception when others then
  -- The log must never stop the change it records.
  return null;
end;
$$;
revoke execute on function public.log_admin_activity() from public, anon, authenticated;

-- Attach it: table, label column, subject column, 'always' or ''.
do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('internship_roles',            'title',        'provider_id', ''),
      ('internship_applications',     '',             'student_id',  ''),
      ('portal_requests',             'organisation', 'user_id',     ''),
      ('community_access',            'organisation', 'user_id',     'always'),
      ('admins',                      '',             'user_id',     'always'),
      ('staff_members',               'email',        '',            'always'),
      ('staff_roles',                 'name',         '',            'always'),
      ('mentor_reviews',              'programme',    'user_id',     ''),
      ('live_session_attendance',     'title',        'student_id',  ''),
      ('verification_requests',       '',             'user_id',     ''),
      ('verified_items',              'item_type',    'user_id',     ''),
      ('mentors',                     'full_name',    'profile_id',  ''),
      ('institution_partners',        'legal_name',   '',            ''),
      ('wellness_requests',           '',             '',            ''),
      ('internship_partner_leads',    'company',      '',            ''),
      ('career_readiness_leads',      'full_name',    '',            ''),
      ('blog_posts',                  'title',        '',            ''),
      ('ads',                         'title',        '',            ''),
      ('initial_assessment_questions','id',           '',            '')
    ) as v(tbl, label_col, subject_col, always)
  loop
    if to_regclass('public.' || t.tbl) is not null then
      execute format('drop trigger if exists log_admin_activity on public.%I', t.tbl);
      execute format(
        'create trigger log_admin_activity after insert or update or delete on public.%I
           for each row execute function public.log_admin_activity(%L, %L, %L)',
        t.tbl, t.label_col, t.subject_col, t.always);
    end if;
  end loop;
end $$;

-- Super admins read it: newest first, a page at a time, by person or area.
create or replace function public.admin_activity_log(
  p_before timestamptz default null,
  p_limit int default 50,
  p_actor uuid default null,
  p_tables text[] default null
)
returns table (
  id bigint, at timestamptz, actor_id uuid, actor_email text, actor_name text,
  table_name text, op text, record_id text, label text, subject_id uuid, subject_label text, detail jsonb
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Only a super admin can see the activity log.';
  end if;
  return query
  select a.id, a.at, a.actor_id, a.actor_email,
         coalesce(nullif(btrim(p.full_name), ''), split_part(a.actor_email, '@', 1)),
         a.table_name, a.op, a.record_id, a.label, a.subject_id, a.subject_label, a.detail
    from public.admin_activity a
    left join public.profiles p on p.id = a.actor_id
   where (p_before is null or a.at < p_before)
     and (p_actor is null or a.actor_id = p_actor)
     and (p_tables is null or a.table_name = any (p_tables))
   order by a.at desc
   limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;
revoke execute on function public.admin_activity_log(timestamptz, int, uuid, text[]) from public, anon;
grant execute on function public.admin_activity_log(timestamptz, int, uuid, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. New feedback
-- ---------------------------------------------------------------------------
-- The first time only: everything already there counts as read, so the Inbox
-- starts from now rather than with every comment ever left.
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'feedback' and column_name = 'reviewed_at') then
    alter table public.feedback add column reviewed_at timestamptz;
    update public.feedback set reviewed_at = now();
  end if;
end $$;
alter table public.feedback add column if not exists reviewed_by uuid references auth.users (id) on delete set null;

-- Unread feedback, in the Inbox's shape.
create or replace function public.admin_inbox_feedback()
returns table (kind text, ref uuid, title text, detail text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select 'feedback', f.id,
         coalesce(nullif(btrim(p.full_name), ''), 'A student'),
         case when f.rating is not null then f.rating || '/10' end,
         f.created_at
    from public.feedback f
    left join public.profiles p on p.id = f.profile_id
   where f.reviewed_at is null and public.has_section_access('feedback')
   order by f.created_at;
$$;
revoke execute on function public.admin_inbox_feedback() from public, anon;
grant execute on function public.admin_inbox_feedback() to authenticated;

-- Mark feedback read (null: all of it).
create or replace function public.admin_mark_feedback_read(p_ids uuid[] default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_section_access('feedback') then
    raise exception 'Not authorised.';
  end if;
  update public.feedback
     set reviewed_at = now(), reviewed_by = auth.uid()
   where reviewed_at is null and (p_ids is null or id = any (p_ids));
end;
$$;
revoke execute on function public.admin_mark_feedback_read(uuid[]) from public, anon;
grant execute on function public.admin_mark_feedback_read(uuid[]) to authenticated;

-- Check: which tables are being watched.
select event_object_table as watched
  from information_schema.triggers
 where trigger_name = 'log_admin_activity'
 group by 1 order by 1;
