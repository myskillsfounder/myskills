-- Study abroad: programmes to study in another country, by country, and
-- students' applications to them.
--
-- Paul (21 Oct 2026): "a study abroad tab, where I will be able to add new
-- programmes by country and students can apply to it". The first one is
-- Study Nursing in Italy, added here as a DRAFT: its details were researched
-- on 21 Oct 2026 from university calls and Italian consulate pages, and must
-- be checked (and updated each year) before it is opened to students.
--
-- Students see programmes the team has opened, apply with a few details, and
-- follow their application; they can withdraw. The team (Admissions: the
-- 'leads' section, as Global Leadership leads) adds and edits programmes and
-- moves each application along.
--
-- Run once, BEFORE the deploy (the new pages call these functions; they say
-- "coming soon" until it is in). Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Programmes and applications
-- ---------------------------------------------------------------------------
create table if not exists public.study_abroad_programmes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 60),
  title       text not null check (length(btrim(title)) between 3 and 100),
  country     text not null check (length(btrim(country)) between 2 and 60),
  -- The subject, e.g. Nursing; and the level, e.g. Bachelor's degree.
  field       text check (length(field) <= 80),
  level       text check (length(level) <= 80),
  summary     text check (length(summary) <= 600),
  -- The full page, in simple Markdown (headings, lists, bold, links).
  details     text check (length(details) <= 30000),
  duration    text check (length(duration) <= 80),
  language    text check (length(language) <= 120),
  intake      text check (length(intake) <= 120),
  fees        text check (length(fees) <= 200),
  apply_by    date,
  -- draft: only the team sees it; open: students can apply; closed: shown,
  -- no new applications.
  status      text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  created_by  uuid references auth.users (id) on delete set null,
  updated_by  uuid references auth.users (id) on delete set null
);
alter table public.study_abroad_programmes enable row level security;

create table if not exists public.study_abroad_applications (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  programme_id  uuid not null references public.study_abroad_programmes (id) on delete cascade,
  student_id    uuid not null references auth.users (id) on delete cascade,
  status        text not null default 'applied' check (status in (
                  'applied', 'in_review', 'shortlisted', 'offered', 'enrolled', 'not_selected', 'withdrawn')),
  phone         text check (length(phone) <= 30),
  education     text check (length(education) <= 300),
  english_level text check (length(english_level) <= 120),
  intake        text check (length(intake) <= 120),
  note          text check (length(note) <= 2000),
  -- For the team only.
  team_note     text check (length(team_note) <= 2000),
  reviewed_by   uuid references auth.users (id) on delete set null,
  reviewed_at   timestamptz,
  unique (programme_id, student_id)
);
create index if not exists study_abroad_applications_programme on public.study_abroad_applications (programme_id, created_at desc);
alter table public.study_abroad_applications enable row level security;
-- No policies on either: everything goes through the functions below.

-- ---------------------------------------------------------------------------
-- 2. Students
-- ---------------------------------------------------------------------------
-- Open and closed programmes, with my application on each.
create or replace function public.study_abroad_programmes()
returns jsonb
language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', p.id, 'slug', p.slug, 'title', p.title, 'country', p.country, 'field', p.field, 'level', p.level,
           'summary', p.summary, 'duration', p.duration, 'language', p.language, 'intake', p.intake, 'fees', p.fees,
           'apply_by', p.apply_by, 'status', p.status,
           'my_status', a.status) order by p.country, p.title), '[]'::jsonb)
    from public.study_abroad_programmes p
    left join public.study_abroad_applications a on a.programme_id = p.id and a.student_id = auth.uid()
   where p.status in ('open', 'closed')
$$;

-- One programme in full, with my application. The team can also open a draft
-- (to preview it).
create or replace function public.study_abroad_programme(p_slug text)
returns jsonb
language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
           'id', p.id, 'slug', p.slug, 'title', p.title, 'country', p.country, 'field', p.field, 'level', p.level,
           'summary', p.summary, 'details', p.details, 'duration', p.duration, 'language', p.language,
           'intake', p.intake, 'fees', p.fees, 'apply_by', p.apply_by, 'status', p.status,
           'my_application', (select jsonb_build_object('id', a.id, 'status', a.status, 'created_at', a.created_at,
                                                        'phone', a.phone, 'education', a.education,
                                                        'english_level', a.english_level, 'intake', a.intake, 'note', a.note)
                                from public.study_abroad_applications a
                               where a.programme_id = p.id and a.student_id = auth.uid()))
    from public.study_abroad_programmes p
   where p.slug = p_slug and (p.status in ('open', 'closed') or public.has_section_access('leads'))
$$;

-- Apply (or apply again after withdrawing).
create or replace function public.apply_study_abroad(
  p_programme uuid, p_phone text, p_education text, p_english text, p_intake text, p_note text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  p public.study_abroad_programmes;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to apply.';
  end if;
  select * into p from public.study_abroad_programmes where id = p_programme;
  if p.id is null or p.status <> 'open' then
    raise exception 'This programme isn’t taking applications right now.';
  end if;
  if p.apply_by is not null and p.apply_by < current_date then
    raise exception 'Applications for this programme closed on %.', to_char(p.apply_by, 'DD Mon YYYY');
  end if;
  if length(btrim(coalesce(p_phone, ''))) < 7 or length(btrim(coalesce(p_education, ''))) < 3 then
    raise exception 'Add a phone number and your current education.';
  end if;
  insert into public.study_abroad_applications (programme_id, student_id, phone, education, english_level, intake, note)
  values (p.id, auth.uid(), btrim(left(p_phone, 30)), btrim(left(p_education, 300)),
          nullif(btrim(left(p_english, 120)), ''), nullif(btrim(left(p_intake, 120)), ''), nullif(btrim(left(p_note, 2000)), ''))
  on conflict (programme_id, student_id) do update
     set status = 'applied', phone = excluded.phone, education = excluded.education,
         english_level = excluded.english_level, intake = excluded.intake, note = excluded.note,
         updated_at = now(), reviewed_by = null, reviewed_at = null
   where public.study_abroad_applications.status = 'withdrawn'
  returning id into v_id;
  if v_id is null then
    raise exception 'You have already applied to this programme.';
  end if;
  return v_id;
end $$;

create or replace function public.withdraw_study_abroad(p_programme uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.study_abroad_applications
     set status = 'withdrawn', updated_at = now()
   where programme_id = p_programme and student_id = auth.uid()
     and status in ('applied', 'in_review', 'shortlisted', 'offered');
end $$;

revoke execute on function public.study_abroad_programmes() from public, anon;
revoke execute on function public.study_abroad_programme(text) from public, anon;
revoke execute on function public.apply_study_abroad(uuid, text, text, text, text, text) from public, anon;
revoke execute on function public.withdraw_study_abroad(uuid) from public, anon;
grant execute on function public.study_abroad_programmes() to authenticated;
grant execute on function public.study_abroad_programme(text) to authenticated;
grant execute on function public.apply_study_abroad(uuid, text, text, text, text, text) to authenticated;
grant execute on function public.withdraw_study_abroad(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. The team (Admissions: the 'leads' section)
-- ---------------------------------------------------------------------------
create or replace function public.admin_study_abroad()
returns jsonb
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.has_section_access('leads') then
    raise exception 'Not authorised.';
  end if;
  return jsonb_build_object(
    'programmes', coalesce((
      select jsonb_agg(to_jsonb(p) - 'created_by' - 'updated_by' || jsonb_build_object(
               'applications', (select count(*) from public.study_abroad_applications a where a.programme_id = p.id and a.status <> 'withdrawn'),
               'new', (select count(*) from public.study_abroad_applications a where a.programme_id = p.id and a.status = 'applied'))
             order by p.status = 'closed', p.country, p.title)
        from public.study_abroad_programmes p), '[]'::jsonb),
    'applications', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', a.id, 'created_at', a.created_at, 'updated_at', a.updated_at, 'status', a.status,
               'programme_id', a.programme_id, 'programme', p.title, 'country', p.country,
               'student_id', a.student_id,
               'name', coalesce(nullif(btrim(pr.full_name), ''), split_part(u.email::text, '@', 1)),
               'email', u.email, 'phone', a.phone, 'education', a.education, 'english_level', a.english_level,
               'intake', a.intake, 'note', a.note, 'team_note', a.team_note, 'reviewed_at', a.reviewed_at)
             order by a.status = 'applied' desc, a.created_at desc)
        from public.study_abroad_applications a
        join public.study_abroad_programmes p on p.id = a.programme_id
        join auth.users u on u.id = a.student_id
        left join public.profiles pr on pr.id = a.student_id), '[]'::jsonb));
end $$;

-- Add a programme (no id) or change one. Returns its id.
create or replace function public.admin_save_study_abroad_programme(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_slug text := lower(btrim(coalesce(p ->> 'slug', '')));
begin
  if not public.has_section_access('leads') then
    raise exception 'Not authorised.';
  end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_slug) not between 3 and 60 then
    raise exception 'Use 3 to 60 lowercase letters, numbers and dashes for the web address, like nursing-italy.';
  end if;
  if length(btrim(coalesce(p ->> 'title', ''))) < 3 or length(btrim(coalesce(p ->> 'country', ''))) < 2 then
    raise exception 'Every programme needs a name and a country.';
  end if;
  if coalesce(p ->> 'status', 'draft') not in ('draft', 'open', 'closed') then
    raise exception 'Unknown status.';
  end if;
  if exists (select 1 from public.study_abroad_programmes where slug = v_slug and id is distinct from v_id) then
    raise exception 'Another programme already uses that web address.';
  end if;
  if v_id is null then
    insert into public.study_abroad_programmes (slug, title, country, created_by) values (v_slug, btrim(p ->> 'title'), btrim(p ->> 'country'), auth.uid())
    returning id into v_id;
  end if;
  update public.study_abroad_programmes
     set slug = v_slug, title = btrim(p ->> 'title'), country = btrim(p ->> 'country'),
         field = nullif(btrim(p ->> 'field'), ''), level = nullif(btrim(p ->> 'level'), ''),
         summary = nullif(btrim(p ->> 'summary'), ''), details = nullif(btrim(p ->> 'details'), ''),
         duration = nullif(btrim(p ->> 'duration'), ''), language = nullif(btrim(p ->> 'language'), ''),
         intake = nullif(btrim(p ->> 'intake'), ''), fees = nullif(btrim(p ->> 'fees'), ''),
         apply_by = nullif(p ->> 'apply_by', '')::date, status = coalesce(p ->> 'status', 'draft'),
         updated_at = now(), updated_by = auth.uid()
   where id = v_id;
  return v_id;
end $$;

create or replace function public.admin_set_study_abroad_application(p_id uuid, p_status text, p_note text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_section_access('leads') then
    raise exception 'Not authorised.';
  end if;
  if p_status not in ('applied', 'in_review', 'shortlisted', 'offered', 'enrolled', 'not_selected') then
    raise exception 'Unknown status.';
  end if;
  update public.study_abroad_applications
     set status = p_status, team_note = nullif(btrim(left(p_note, 2000)), ''),
         reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
   where id = p_id;
end $$;

revoke execute on function public.admin_study_abroad() from public, anon;
revoke execute on function public.admin_save_study_abroad_programme(jsonb) from public, anon;
revoke execute on function public.admin_set_study_abroad_application(uuid, text, text) from public, anon;
grant execute on function public.admin_study_abroad() to authenticated;
grant execute on function public.admin_save_study_abroad_programme(jsonb) to authenticated;
grant execute on function public.admin_set_study_abroad_application(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. The first programme, as a draft to check before opening
-- ---------------------------------------------------------------------------
insert into public.study_abroad_programmes (slug, title, country, field, level, summary, details, duration, language, intake, fees, apply_by, status)
values (
  'nursing-italy',
  'Study Nursing in Italy',
  'Italy',
  'Nursing',
  'Bachelor’s degree (Laurea in Infermieristica, class L/SNT1)',
  'A three-year Bachelor’s in Nursing at an Italian university, taught in English at a few universities, with low fees at public universities. MySkills helps you choose a university, prepare your documents and the admission test, and apply on time.',
  $md$## Who it’s for
Students in India who have finished Class 12 with Science (Biology), or will finish it before the course starts, and want to work as a registered nurse.

## The degree
- A **Bachelor’s in Nursing** (Laurea in Infermieristica, class L/SNT1): 3 years, 180 ECTS credits, with clinical placements in hospitals.
- A few universities teach it **in English** (for example the University of Palermo, and UniCamillus in Rome, a private university). Most teach in Italian.
- Places are **limited** (numero programmato): each university sets seats for non-EU students living abroad, and you take an **admission test**.

## What you need
- Your Class 12 marksheet and certificate (and Class 10), **attested and apostilled**, with a Declaration of Value or CIMEA statement if the university asks for one.
- **English at B2** for English-taught courses (IELTS or an equivalent the university accepts), or **Italian** for Italian-taught ones.
- A valid passport.

## Steps and timeline (academic year 2026/27)
1. **Choose universities** and read each one’s admission call (bando): seats, the test, and its own deadline.
2. **Apply to the university** and register for its admission test.
3. **Pre-enrol on Universitaly** (universitaly.it). The general deadline is 30 September 2026, but limited-access courses such as Nursing often set an earlier one.
4. **Study visa (type D)**: once your pre-enrolment is validated, apply through the Italian consulate (VFS Global in India). Apply by 30 November 2026.
5. **Enrol** in Italy and get your residence permit (permesso di soggiorno) within 8 days of arriving.

## Costs
- Public universities charge yearly fees based on family income (often low for international students, with regional scholarships such as DSU). Private universities cost much more.
- Living costs depend on the city.

## How MySkills helps
A mentor helps you shortlist universities, check your documents, prepare for the admission test and your English, and keep to every deadline.

*Details checked on 21 October 2026 from university calls and Italian consulate pages. Rules, seats and dates change every year: always confirm with the university and the consulate.*$md$,
  '3 years',
  'English (a few universities) or Italian',
  'September or October each year',
  'Public universities: income-based, usually low; private: higher',
  null,
  'draft'
)
on conflict (slug) do nothing;
