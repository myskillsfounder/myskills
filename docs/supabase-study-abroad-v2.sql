-- Study abroad, v2: the new design, and the nursing programme rewritten for
-- our partner, Our Lady of Good Counsel University (UNIZKM), Albania.
--
-- New on each programme, for the cards Paul asked for (22 Oct 2026):
--   university    the partner, shown on the card ("Our Lady of Good Counsel…")
--   country_code  two letters (al, it, ge…) for the country's flag
--   tags          short chips: "Italian medium", "Joint degree with Tor Vergata"
--   badge         an optional ribbon: "Most popular", "New"
--   highlight     one line at the foot of the card: "Low fees", "Scholarships"
--   featured      shown large at the top of Study abroad
--   theme         the card's colour: violet, orange, teal, pink, blue or amber
--
-- The nursing programme becomes "Nursing in Albania": studied at UNIZKM in
-- Tirana, taught in Italian, with a joint degree from the University of Rome
-- Tor Vergata. It stays a DRAFT: fees, entry rules, dates and the current
-- joint-degree status must come from the university before it is opened.
--
-- Run once, BEFORE the deploy (the new pages read the new fields). Safe to
-- re-run. Depends on docs/supabase-study-abroad.sql.

alter table public.study_abroad_programmes
  add column if not exists university   text check (length(university) <= 150),
  add column if not exists country_code text check (country_code ~ '^[a-z]{2}$'),
  add column if not exists tags         text[] not null default '{}',
  add column if not exists badge        text check (length(badge) <= 30),
  add column if not exists highlight    text check (length(highlight) <= 60),
  add column if not exists featured     boolean not null default false,
  add column if not exists theme        text not null default 'violet'
    check (theme in ('violet', 'orange', 'teal', 'pink', 'blue', 'amber'));

-- Open and closed programmes, with my application on each (now with the
-- card fields).
create or replace function public.study_abroad_programmes()
returns jsonb
language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', p.id, 'slug', p.slug, 'title', p.title, 'country', p.country, 'country_code', p.country_code,
           'university', p.university, 'field', p.field, 'level', p.level, 'summary', p.summary,
           'duration', p.duration, 'language', p.language, 'intake', p.intake, 'fees', p.fees,
           'apply_by', p.apply_by, 'status', p.status, 'tags', p.tags, 'badge', p.badge,
           'highlight', p.highlight, 'featured', p.featured, 'theme', p.theme,
           'my_status', a.status) order by p.featured desc, p.country, p.title), '[]'::jsonb)
    from public.study_abroad_programmes p
    left join public.study_abroad_applications a on a.programme_id = p.id and a.student_id = auth.uid()
   where p.status in ('open', 'closed')
$$;

create or replace function public.study_abroad_programme(p_slug text)
returns jsonb
language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
           'id', p.id, 'slug', p.slug, 'title', p.title, 'country', p.country, 'country_code', p.country_code,
           'university', p.university, 'field', p.field, 'level', p.level, 'summary', p.summary,
           'details', p.details, 'duration', p.duration, 'language', p.language, 'intake', p.intake,
           'fees', p.fees, 'apply_by', p.apply_by, 'status', p.status, 'tags', p.tags, 'badge', p.badge,
           'highlight', p.highlight, 'featured', p.featured, 'theme', p.theme,
           'my_application', (select jsonb_build_object('id', a.id, 'status', a.status, 'created_at', a.created_at,
                                                        'phone', a.phone, 'education', a.education,
                                                        'english_level', a.english_level, 'intake', a.intake, 'note', a.note)
                                from public.study_abroad_applications a
                               where a.programme_id = p.id and a.student_id = auth.uid()))
    from public.study_abroad_programmes p
   where p.slug = p_slug and (p.status in ('open', 'closed') or public.has_section_access('leads'))
$$;

-- Add or change a programme, now with the card fields.
create or replace function public.admin_save_study_abroad_programme(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_slug text := lower(btrim(coalesce(p ->> 'slug', '')));
  v_code text := nullif(lower(btrim(coalesce(p ->> 'country_code', ''))), '');
begin
  if not public.has_section_access('leads') then
    raise exception 'Not authorised.';
  end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_slug) not between 3 and 60 then
    raise exception 'Use 3 to 60 lowercase letters, numbers and dashes for the web address, like nursing-albania.';
  end if;
  if length(btrim(coalesce(p ->> 'title', ''))) < 3 or length(btrim(coalesce(p ->> 'country', ''))) < 2 then
    raise exception 'Every programme needs a name and a country.';
  end if;
  if v_code is not null and v_code !~ '^[a-z]{2}$' then
    raise exception 'The country code is two letters, like al for Albania or it for Italy.';
  end if;
  if coalesce(p ->> 'status', 'draft') not in ('draft', 'open', 'closed') then
    raise exception 'Unknown status.';
  end if;
  if coalesce(p ->> 'theme', 'violet') not in ('violet', 'orange', 'teal', 'pink', 'blue', 'amber') then
    raise exception 'Unknown colour.';
  end if;
  if exists (select 1 from public.study_abroad_programmes where slug = v_slug and id is distinct from v_id) then
    raise exception 'Another programme already uses that web address.';
  end if;
  if v_id is null then
    insert into public.study_abroad_programmes (slug, title, country, created_by)
    values (v_slug, btrim(p ->> 'title'), btrim(p ->> 'country'), auth.uid())
    returning id into v_id;
  end if;
  update public.study_abroad_programmes
     set slug = v_slug, title = btrim(p ->> 'title'), country = btrim(p ->> 'country'), country_code = v_code,
         university = nullif(btrim(p ->> 'university'), ''),
         field = nullif(btrim(p ->> 'field'), ''), level = nullif(btrim(p ->> 'level'), ''),
         summary = nullif(btrim(p ->> 'summary'), ''), details = nullif(btrim(p ->> 'details'), ''),
         duration = nullif(btrim(p ->> 'duration'), ''), language = nullif(btrim(p ->> 'language'), ''),
         intake = nullif(btrim(p ->> 'intake'), ''), fees = nullif(btrim(p ->> 'fees'), ''),
         apply_by = nullif(p ->> 'apply_by', '')::date, status = coalesce(p ->> 'status', 'draft'),
         tags = coalesce((select array_agg(btrim(t)) from jsonb_array_elements_text(coalesce(p -> 'tags', '[]'::jsonb)) t
                           where btrim(t) <> ''), '{}'),
         badge = nullif(btrim(p ->> 'badge'), ''), highlight = nullif(btrim(p ->> 'highlight'), ''),
         featured = coalesce((p ->> 'featured')::boolean, false), theme = coalesce(p ->> 'theme', 'violet'),
         updated_at = now(), updated_by = auth.uid()
   where id = v_id;
  return v_id;
end $$;
revoke execute on function public.admin_save_study_abroad_programme(jsonb) from public, anon;
grant execute on function public.admin_save_study_abroad_programme(jsonb) to authenticated;

-- The nursing programme, rewritten for UNIZKM. Only while it is still the
-- untouched draft from v1, so edits made in the admin are never overwritten.
update public.study_abroad_programmes
   set slug = 'nursing-albania',
       title = 'Nursing in Albania',
       country = 'Albania',
       country_code = 'al',
       university = 'Our Lady of Good Counsel University (UNIZKM), Tirana',
       field = 'Nursing',
       level = 'Bachelor’s degree in Nursing (joint degree with the University of Rome Tor Vergata)',
       summary = 'Study nursing in Tirana at Our Lady of Good Counsel University, taught in Italian, and graduate with a joint degree from the University of Rome Tor Vergata, recognised in Albania and Italy. MySkills guides you from application to arrival.',
       duration = '3 years (to confirm with the university)',
       language = 'Italian',
       intake = 'To confirm with the university',
       fees = 'To confirm with the university',
       tags = array['Italian medium', 'Joint degree with Tor Vergata (Rome)', 'Recognised in Italy and Albania'],
       badge = 'New',
       highlight = 'Italian degree, studied in Tirana',
       featured = true,
       theme = 'orange',
       details = $md$## Who it’s for
Students in India who have finished Class 12 with Science (Biology), or will finish it before the course starts, want to work as a registered nurse, and are ready to study in **Italian**.

## The university
**Our Lady of Good Counsel University** (Università Cattolica “Nostra Signora del Buon Consiglio”, UNIZKM) is a private Catholic university in **Tirana and Elbasan, Albania**. Its courses are taught in Italian. Its nursing school has trained nurses since 1994.

## The degree
- A **Bachelor’s in Nursing** with clinical training in hospitals.
- Graduates receive a **joint degree with the University of Rome Tor Vergata**, recognised in Albania and Italy, which opens the way to working as a nurse in Italy and the EU after the usual registration steps.

## What you need
- Your Class 12 marksheet and certificate (and Class 10).
- **Italian**: courses are taught in Italian, so you will need to learn it. The level required, and whether the university offers a preparatory year, are to be confirmed.
- A valid passport.
- *To confirm with the university: entry requirements and any admission test, the documents it needs (and whether they must be apostilled), the yearly fees, intake dates and the application deadline.*

## Steps
1. **Apply here.** The MySkills team calls you within a few working days.
2. **Check your eligibility** with a mentor, and start learning Italian.
3. **Apply to UNIZKM** with your documents, and take any admission test.
4. **Visa and residence permit** for Albania, once you have your admission letter.
5. **Arrive in Tirana** and enrol.

## How MySkills helps
A mentor helps you check your eligibility, prepare your documents and your Italian, apply on time, and plan your move.

*Prepared 22 October 2026 from public sources about UNIZKM and its joint degree with Tor Vergata. Fees, entry rules, dates and the joint-degree terms are being confirmed with the university: always check the latest with the MySkills team.*$md$,
       updated_at = now()
 where slug = 'nursing-italy' and status = 'draft' and updated_by is null;
