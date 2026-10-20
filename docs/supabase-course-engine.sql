-- Course engine, step 1: programmes as data, not code.
--
-- A programme (Data Analytics first) is stored as versions. Each version is
-- one document (content jsonb) with the same shape for every programme:
--
--   overview   summary, audience, outcomes[], level, hours
--   skills     [{ id, name, description }]
--   aptitude   { items: [{ id, skill, statement, reverse }] }   Never..Always, 1-4
--   modules    [{ id, title, skill, level, outcome, minutes,
--                 learn: [{ title, body }],
--                 tasks: [{ id, title, prompt, hint }],
--                 reflection: { prompt, hint },
--                 quiz: [question] }]
--   final      { minutes, pass_percent, questions: [question] }
--   project    { brief, deliverables[], rubric: [{ id, name, description }] }
--   question = { id, scenario, question, options[], correct_index, explanation,
--                difficulty, topic, weight }
--
-- One draft at a time is edited, checked (programme_content_problems lists
-- exactly what is missing), then published as the next version. Students
-- will keep the version they started on (step 2), so publishing never
-- changes anyone's past results. The Course Architect will write drafts in
-- this same shape.
--
-- Who: a new staff section, 'programmes' (full admins have it). Students and
-- visitors only ever read a published version through list_programmes() and
-- get_programme(), which never include answers or which aptitude statements
-- are reverse-scored.
--
-- NOT YET: student pages, progress and scoring (steps 2-4). New programmes
-- will earn a completion badge and certificate, no Global Readiness points,
-- until the scoring for several programmes is decided.
--
-- Run once, BEFORE the deploy (the new admin pages call these functions, and
-- the menu shows the new section). Safe to re-run. Depends on:
-- docs/supabase-staff-permissions.sql, -team-and-roles.sql, -admin-tidy.sql,
-- -activity-log.sql (optional: the log trigger is added when it exists).

-- ---------------------------------------------------------------------------
-- 1. The 'programmes' staff section
-- ---------------------------------------------------------------------------
alter table public.staff_permissions drop constraint if exists staff_permissions_section_check;
alter table public.staff_permissions add constraint staff_permissions_section_check
  check (section in (
    'users', 'assessment', 'certificates', 'feedback',
    'mentors', 'institution-partners', 'demo-requests', 'blog', 'ads', 'wellness',
    'verification', 'mentor-reviews',
    'overview', 'portal-access', 'partner-leads', 'leads', 'programmes'
  ));

create or replace function public.staff_sections_all()
returns text[]
language sql
immutable
as $$
  select array[
    'overview', 'users', 'verification', 'mentor-reviews', 'certificates', 'assessment', 'programmes',
    'partner-leads', 'portal-access', 'mentors', 'wellness', 'institution-partners',
    'demo-requests', 'leads', 'blog', 'ads', 'feedback'
  ]::text[];
$$;

-- The functions that still list the sections themselves: 'programmes' added,
-- each otherwise exactly as it is live (the same way 'leads' was added).
do $$
declare
  f record;
  d text;
  n text;
begin
  for f in
    select p.oid from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public' and p.proname in ('my_staff_sections', 'admin_set_staff_access')
  loop
    d := pg_get_functiondef(f.oid);
    if d not like '%''leads'', ''programmes''%' then
      n := replace(d, '''partner-leads'', ''leads''', '''partner-leads'', ''leads'', ''programmes''');
      if n <> d then
        execute n;
      end if;
    end if;
  end loop;
end $$;

-- Whoever can edit the Foundation questions can work on programmes too.
insert into public.staff_permissions (user_id, section)
select sp.user_id, 'programmes' from public.staff_permissions sp where sp.section = 'assessment'
on conflict (user_id, section) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Programmes and their versions
-- ---------------------------------------------------------------------------
create table if not exists public.programmes (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 40),
  title           text not null check (length(btrim(title)) between 3 and 80),
  kind            text not null default 'professional' check (kind in ('professional', 'personal')),
  -- draft: never published; published: in the catalogue; archived: hidden.
  status          text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  current_version int,
  created_by      uuid references auth.users (id) on delete set null
);
alter table public.programmes enable row level security;

create table if not exists public.programme_versions (
  programme_id uuid not null references public.programmes (id) on delete cascade,
  version      int not null check (version >= 1),
  -- draft: being edited (one at a time); published: what students get now;
  -- superseded: an earlier published version, kept for students on it.
  status       text not null default 'draft' check (status in ('draft', 'published', 'superseded')),
  content      jsonb not null check (jsonb_typeof(content) = 'object' and octet_length(content::text) < 2000000),
  note         text check (length(note) <= 500),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  published_by uuid references auth.users (id) on delete set null,
  primary key (programme_id, version)
);
create unique index if not exists programme_versions_one_draft on public.programme_versions (programme_id) where status = 'draft';
create unique index if not exists programme_versions_one_live on public.programme_versions (programme_id) where status = 'published';
alter table public.programme_versions enable row level security;
-- No policies on either table: everything goes through the functions below.

-- The two programmes that are still code keep their names.
create or replace function public.programme_reserved_slug(p_slug text) returns boolean
language sql immutable as $$
  select p_slug in ('digital-marketing', 'career-readiness', 'global-leadership', 'personal-development', 'programmes')
$$;

-- A new programme starts from this: the four project criteria are the ones
-- every MySkills project is graded on.
create or replace function public.programme_blank_content() returns jsonb
language sql immutable as $$
  select jsonb_build_object(
    'overview', jsonb_build_object('summary', '', 'audience', '', 'outcomes', '[]'::jsonb, 'level', 'beginner', 'hours', 0),
    'skills', '[]'::jsonb,
    'aptitude', jsonb_build_object('items', '[]'::jsonb),
    'modules', '[]'::jsonb,
    'final', jsonb_build_object('minutes', 30, 'pass_percent', 60, 'questions', '[]'::jsonb),
    'project', jsonb_build_object(
      'brief', '', 'deliverables', '[]'::jsonb,
      'rubric', jsonb_build_array(
        jsonb_build_object('id', 'relevance', 'name', 'Relevance', 'description', 'Answers the brief, for a real audience'),
        jsonb_build_object('id', 'quality', 'name', 'Quality', 'description', 'Accurate, complete and well made'),
        jsonb_build_object('id', 'applying', 'name', 'Applying skills', 'description', 'Uses what the programme taught'),
        jsonb_build_object('id', 'presentation', 'name', 'Presentation', 'description', 'Clear, organised and easy to follow'))))
$$;

-- ---------------------------------------------------------------------------
-- 3. What a version still needs before it can be published
-- ---------------------------------------------------------------------------
create or replace function public.programme_question_problems(p_q jsonb, p_where text) returns text[]
language plpgsql immutable as $$
declare
  v text[] := '{}';
  v_n int;
  v_k int;
begin
  if coalesce(btrim(p_q ->> 'id'), '') = '' then v := v || (p_where || ': a question has no id'); end if;
  if coalesce(btrim(p_q ->> 'question'), '') = '' then v := v || (p_where || ': a question has no text'); end if;
  if jsonb_typeof(p_q -> 'options') <> 'array' then
    v := v || (p_where || ': a question has no options');
    return v;
  end if;
  v_n := jsonb_array_length(p_q -> 'options');
  if v_n < 2 or v_n > 6 then v := v || (p_where || ': a question needs 2 to 6 options'); end if;
  if exists (select 1 from jsonb_array_elements_text(p_q -> 'options') o where btrim(o) = '') then
    v := v || (p_where || ': an option is empty');
  end if;
  begin
    v_k := (p_q ->> 'correct_index')::int;
  exception when others then
    v_k := null;
  end;
  if v_k is null or v_k < 0 or v_k >= v_n then v := v || (p_where || ': a question has no correct answer marked'); end if;
  if coalesce(btrim(p_q ->> 'explanation'), '') = '' then v := v || (p_where || ': a question has no explanation'); end if;
  return v;
end $$;

create or replace function public.programme_content_problems(p jsonb) returns text[]
language plpgsql immutable as $$
declare
  v text[] := '{}';
  v_skills text[];
  m jsonb;
  q jsonb;
  s text;
  v_where text;
  v_ids text[] := '{}';
begin
  if coalesce(btrim(p #>> '{overview,summary}'), '') = '' then v := v || 'Overview: write a summary'::text; end if;
  if coalesce(jsonb_array_length(p #> '{overview,outcomes}'), 0) = 0 then v := v || 'Overview: add at least one outcome'::text; end if;

  select coalesce(array_agg(x ->> 'id'), '{}') into v_skills from jsonb_array_elements(coalesce(p -> 'skills', '[]')) x;
  if cardinality(v_skills) = 0 then v := v || 'Skills: add at least one skill'::text; end if;
  if exists (select 1 from jsonb_array_elements(coalesce(p -> 'skills', '[]')) x where coalesce(btrim(x ->> 'id'), '') = '' or coalesce(btrim(x ->> 'name'), '') = '') then
    v := v || 'Skills: every skill needs a name'::text;
  end if;
  if cardinality(v_skills) <> (select count(distinct x) from unnest(v_skills) x) then v := v || 'Skills: two skills share an id'::text; end if;

  -- Aptitude: at least two statements per skill, so one odd answer can't decide it.
  foreach s in array v_skills loop
    if (select count(*) from jsonb_array_elements(coalesce(p #> '{aptitude,items}', '[]')) i
         where i ->> 'skill' = s and coalesce(btrim(i ->> 'statement'), '') <> '') < 2 then
      v := v || ('Aptitude: skill "' || s || '" needs at least 2 statements');
    end if;
  end loop;
  if exists (select 1 from jsonb_array_elements(coalesce(p #> '{aptitude,items}', '[]')) i where not (i ->> 'skill' = any (v_skills))) then
    v := v || 'Aptitude: a statement belongs to a skill that does not exist'::text;
  end if;

  if coalesce(jsonb_array_length(p -> 'modules'), 0) = 0 then v := v || 'Modules: add at least one module'::text; end if;
  for m in select x from jsonb_array_elements(coalesce(p -> 'modules', '[]')) x loop
    v_where := 'Module "' || coalesce(nullif(btrim(m ->> 'title'), ''), m ->> 'id', '?') || '"';
    if coalesce(btrim(m ->> 'id'), '') = '' or coalesce(btrim(m ->> 'title'), '') = '' then v := v || (v_where || ': needs an id and a title'); end if;
    if not (coalesce(m ->> 'skill', '') = any (v_skills)) then v := v || (v_where || ': pick the skill it trains'); end if;
    if coalesce(jsonb_array_length(m -> 'learn'), 0) = 0 then v := v || (v_where || ': add at least one Learn card'); end if;
    if coalesce(jsonb_array_length(m -> 'tasks'), 0) = 0 then v := v || (v_where || ': add at least one Practise task'); end if;
    if coalesce(btrim(m #>> '{reflection,prompt}'), '') = '' then v := v || (v_where || ': write the Reflect prompt'); end if;
    if coalesce(jsonb_array_length(m -> 'quiz'), 0) < 3 then v := v || (v_where || ': the quiz needs at least 3 questions'); end if;
    for q in select x from jsonb_array_elements(coalesce(m -> 'quiz', '[]')) x loop
      v := v || public.programme_question_problems(q, v_where || ' quiz');
      v_ids := v_ids || coalesce(q ->> 'id', '');
    end loop;
    v_ids := v_ids || coalesce(m ->> 'id', '');
  end loop;

  if coalesce(jsonb_array_length(p #> '{final,questions}'), 0) < 5 then v := v || 'Final assessment: add at least 5 questions'::text; end if;
  for q in select x from jsonb_array_elements(coalesce(p #> '{final,questions}', '[]')) x loop
    v := v || public.programme_question_problems(q, 'Final assessment');
    v_ids := v_ids || coalesce(q ->> 'id', '');
  end loop;
  -- Question and module ids are how answers are kept: they must be unique.
  if cardinality(v_ids) <> (select count(distinct x) from unnest(v_ids) x) then
    v := v || 'Two modules or questions share an id'::text;
  end if;

  if coalesce(btrim(p #>> '{project,brief}'), '') = '' then v := v || 'Project: write the brief'::text; end if;
  if coalesce(jsonb_array_length(p #> '{project,rubric}'), 0) = 0 then v := v || 'Project: the rubric needs at least one criterion'::text; end if;

  -- One line per problem (no repeats), in the order found: the editor's tab order.
  return (select coalesce(array_agg(x order by n), '{}')
            from (select x, min(n) as n from unnest(v) with ordinality as t(x, n) group by x) s);
end $$;

-- What students and visitors may see: no answers, no explanations, and not
-- which aptitude statements are scored in reverse.
create or replace function public.programme_public_content(p jsonb) returns jsonb
language sql immutable as $$
  select p
    || jsonb_build_object('aptitude', jsonb_build_object('items', coalesce((
         select jsonb_agg(i - 'reverse' order by n) from jsonb_array_elements(coalesce(p #> '{aptitude,items}', '[]')) with ordinality as t(i, n)), '[]'::jsonb)))
    || jsonb_build_object('modules', coalesce((
         select jsonb_agg(
                  m || jsonb_build_object('quiz', coalesce((
                    select jsonb_agg(q - 'correct_index' - 'explanation' order by qn)
                      from jsonb_array_elements(coalesce(m -> 'quiz', '[]')) with ordinality as u(q, qn)), '[]'::jsonb))
                  order by n)
           from jsonb_array_elements(coalesce(p -> 'modules', '[]')) with ordinality as t(m, n)), '[]'::jsonb))
    || jsonb_build_object('final', coalesce(p -> 'final', '{}'::jsonb) || jsonb_build_object('questions', coalesce((
         select jsonb_agg(q - 'correct_index' - 'explanation' order by n)
           from jsonb_array_elements(coalesce(p #> '{final,questions}', '[]')) with ordinality as t(q, n)), '[]'::jsonb)))
$$;

-- ---------------------------------------------------------------------------
-- 4. The team: list, open, create, save, publish, archive
-- ---------------------------------------------------------------------------
create or replace function public.admin_programmes()
returns table (id uuid, slug text, title text, kind text, status text, current_version int,
               draft_version int, updated_at timestamptz, published_at timestamptz,
               modules int, questions int, problems int)
language plpgsql security definer set search_path = public stable as $$
#variable_conflict use_column
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  return query
  select p.id, p.slug, p.title, p.kind, p.status, p.current_version, d.version,
         greatest(p.updated_at, d.updated_at), l.published_at,
         coalesce(jsonb_array_length(coalesce(d.content, l.content) -> 'modules'), 0),
         coalesce((select sum(coalesce(jsonb_array_length(m -> 'quiz'), 0))::int
                     from jsonb_array_elements(coalesce(coalesce(d.content, l.content) -> 'modules', '[]')) m), 0)
           + coalesce(jsonb_array_length(coalesce(d.content, l.content) #> '{final,questions}'), 0),
         cardinality(public.programme_content_problems(coalesce(d.content, l.content)))
    from public.programmes p
    left join public.programme_versions d on d.programme_id = p.id and d.status = 'draft'
    left join public.programme_versions l on l.programme_id = p.id and l.status = 'published'
   order by p.status = 'archived', p.title;
end $$;

-- One programme for the editor: the draft if there is one, else the live version.
create or replace function public.admin_programme(p_slug text)
returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare
  p public.programmes;
  v public.programme_versions;
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  select * into p from public.programmes where slug = p_slug;
  if p.id is null then
    return null;
  end if;
  select * into v from public.programme_versions
   where programme_id = p.id and status in ('draft', 'published')
   order by status = 'draft' desc limit 1;
  return jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'title', p.title, 'kind', p.kind, 'status', p.status,
    'current_version', p.current_version,
    'editing_version', v.version, 'editing_status', v.status,
    'content', v.content, 'updated_at', v.updated_at,
    'problems', to_jsonb(public.programme_content_problems(v.content)),
    'versions', (select coalesce(jsonb_agg(jsonb_build_object(
                   'version', x.version, 'status', x.status, 'note', x.note,
                   'published_at', x.published_at, 'updated_at', x.updated_at) order by x.version desc), '[]'::jsonb)
                   from public.programme_versions x where x.programme_id = p.id));
end $$;

create or replace function public.admin_create_programme(p_slug text, p_title text, p_kind text default 'professional')
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_slug text := lower(btrim(p_slug));
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_slug) not between 3 and 40 then
    raise exception 'Use 3 to 40 lowercase letters, numbers and dashes for the web address, like data-analytics.';
  end if;
  if public.programme_reserved_slug(v_slug) then
    raise exception 'That web address is already used by an existing programme.';
  end if;
  if exists (select 1 from public.programmes where slug = v_slug) then
    raise exception 'A programme with that web address already exists.';
  end if;
  insert into public.programmes (slug, title, kind, created_by)
  values (v_slug, btrim(p_title), coalesce(p_kind, 'professional'), auth.uid())
  returning id into v_id;
  insert into public.programme_versions (programme_id, version, status, content, updated_by)
  values (v_id, 1, 'draft', public.programme_blank_content(), auth.uid());
  return v_id;
end $$;

create or replace function public.admin_update_programme(p_id uuid, p_title text, p_kind text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  update public.programmes set title = btrim(p_title), kind = p_kind, updated_at = now() where id = p_id;
end $$;

-- Save the draft (making one from the live version if there is none). Returns
-- what is still missing, for the editor's checklist.
create or replace function public.admin_save_programme_draft(p_id uuid, p_content jsonb)
returns text[]
language plpgsql security definer set search_path = public as $$
declare
  v_next int;
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  if p_content is null or jsonb_typeof(p_content) <> 'object' then
    raise exception 'Nothing to save.';
  end if;
  if not exists (select 1 from public.programmes where id = p_id) then
    raise exception 'That programme no longer exists.';
  end if;
  update public.programme_versions
     set content = p_content, updated_at = now(), updated_by = auth.uid()
   where programme_id = p_id and status = 'draft';
  if not found then
    select coalesce(max(version), 0) + 1 into v_next from public.programme_versions where programme_id = p_id;
    insert into public.programme_versions (programme_id, version, status, content, updated_by)
    values (p_id, v_next, 'draft', p_content, auth.uid());
  end if;
  update public.programmes set updated_at = now() where id = p_id;
  return public.programme_content_problems(p_content);
end $$;

-- Publish the draft as the live version. Refused while anything is missing.
create or replace function public.admin_publish_programme(p_id uuid, p_note text default null)
returns int
language plpgsql security definer set search_path = public as $$
declare
  d public.programme_versions;
  v_problems text[];
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  select * into d from public.programme_versions where programme_id = p_id and status = 'draft';
  if d.programme_id is null then
    raise exception 'There is no draft to publish.';
  end if;
  v_problems := public.programme_content_problems(d.content);
  if cardinality(v_problems) > 0 then
    raise exception 'Not ready to publish: %', array_to_string(v_problems[1:3], '; ')
      || case when cardinality(v_problems) > 3 then ' (and ' || (cardinality(v_problems) - 3) || ' more)' else '' end;
  end if;
  update public.programme_versions set status = 'superseded' where programme_id = p_id and status = 'published';
  update public.programme_versions
     set status = 'published', published_at = now(), published_by = auth.uid(), note = nullif(btrim(p_note), '')
   where programme_id = p_id and version = d.version;
  update public.programmes set status = 'published', current_version = d.version, updated_at = now() where id = p_id;
  return d.version;
end $$;

-- Throw the draft away (only when there is a live version to fall back on).
create or replace function public.admin_discard_programme_draft(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  if not exists (select 1 from public.programme_versions where programme_id = p_id and status = 'published') then
    raise exception 'This programme has never been published, so its draft is all there is.';
  end if;
  delete from public.programme_versions where programme_id = p_id and status = 'draft';
end $$;

-- Hide a programme from the catalogue, or bring it back.
create or replace function public.admin_archive_programme(p_id uuid, p_archived boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  update public.programmes
     set status = case when p_archived then 'archived'
                       when current_version is not null then 'published' else 'draft' end,
         updated_at = now()
   where id = p_id;
end $$;

revoke execute on function public.admin_programmes() from public, anon;
revoke execute on function public.admin_programme(text) from public, anon;
revoke execute on function public.admin_create_programme(text, text, text) from public, anon;
revoke execute on function public.admin_update_programme(uuid, text, text) from public, anon;
revoke execute on function public.admin_save_programme_draft(uuid, jsonb) from public, anon;
revoke execute on function public.admin_publish_programme(uuid, text) from public, anon;
revoke execute on function public.admin_discard_programme_draft(uuid) from public, anon;
revoke execute on function public.admin_archive_programme(uuid, boolean) from public, anon;
grant execute on function public.admin_programmes() to authenticated;
grant execute on function public.admin_programme(text) to authenticated;
grant execute on function public.admin_create_programme(text, text, text) to authenticated;
grant execute on function public.admin_update_programme(uuid, text, text) to authenticated;
grant execute on function public.admin_save_programme_draft(uuid, jsonb) to authenticated;
grant execute on function public.admin_publish_programme(uuid, text) to authenticated;
grant execute on function public.admin_discard_programme_draft(uuid) to authenticated;
grant execute on function public.admin_archive_programme(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Students and visitors: the published catalogue (used from step 2)
-- ---------------------------------------------------------------------------
create or replace function public.list_programmes()
returns table (slug text, title text, kind text, version int, summary text, audience text,
               level text, hours numeric, skills jsonb, modules int)
language sql security definer set search_path = public stable as $$
  select p.slug, p.title, p.kind, v.version, v.content #>> '{overview,summary}', v.content #>> '{overview,audience}',
         v.content #>> '{overview,level}', nullif(v.content #>> '{overview,hours}', '')::numeric,
         coalesce((select jsonb_agg(s ->> 'name') from jsonb_array_elements(coalesce(v.content -> 'skills', '[]')) s), '[]'::jsonb),
         coalesce(jsonb_array_length(v.content -> 'modules'), 0)
    from public.programmes p
    join public.programme_versions v on v.programme_id = p.id and v.status = 'published'
   where p.status = 'published'
   order by p.title;
$$;

create or replace function public.get_programme(p_slug text)
returns jsonb
language sql security definer set search_path = public stable as $$
  select jsonb_build_object('slug', p.slug, 'title', p.title, 'kind', p.kind, 'version', v.version,
                            'content', public.programme_public_content(v.content))
    from public.programmes p
    join public.programme_versions v on v.programme_id = p.id and v.status = 'published'
   where p.slug = p_slug and p.status = 'published';
$$;
grant execute on function public.list_programmes() to anon, authenticated;
grant execute on function public.get_programme(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Activity log: creating, publishing and archiving (not every draft save)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.log_admin_activity()') is not null then
    drop trigger if exists log_admin_activity on public.programmes;
    create trigger log_admin_activity after insert or update or delete on public.programmes
      for each row execute function public.log_admin_activity('title', '', '');
  end if;
end $$;

notify pgrst, 'reload schema';
