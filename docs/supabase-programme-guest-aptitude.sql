-- A course-engine programme's aptitude test, before signing up.
--
-- Run once against Supabase Cloud (SQL editor), BEFORE deploying the matching
-- frontend: until then a visitor who taps an engine programme (Entrepreneurship)
-- on the front pages sees "The test isn't available right now". Safe to re-run.
--
-- Paul (26 Oct 2026): AI-Powered Entrepreneurship opens on the front pages, and
-- like Digital Marketing and Global Leadership a visitor takes its aptitude
-- test first and signs up to see the result. The aptitude statements carry no
-- answer key (each is "how often is this true for you"), so a visitor may read
-- them: only a PUBLISHED programme's published version, and only the
-- statements and skill names, nothing else of the programme. Scoring still
-- needs an account: submit_programme_aptitude is unchanged, and the browser
-- keeps the answers until the visitor signs up (lib/pendingAptitude.ts).

create or replace function public.programme_guest_aptitude(p_slug text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'slug', p.slug,
    'title', p.title,
    'skills', coalesce((
      select jsonb_agg(jsonb_build_object('id', s ->> 'id', 'name', s ->> 'name'))
        from jsonb_array_elements(coalesce(v.content -> 'skills', '[]')) s), '[]'::jsonb),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', i ->> 'id',
               'skill', i ->> 'skill',
               'statement', i ->> 'statement',
               'reverse', coalesce((i ->> 'reverse')::boolean, false)))
        from jsonb_array_elements(coalesce(v.content #> '{aptitude,items}', '[]')) i), '[]'::jsonb))
    from public.programmes p
    join public.programme_versions v on v.programme_id = p.id and v.status = 'published'
   where p.slug = p_slug and p.status = 'published' and p.source = 'engine'
$$;

revoke all on function public.programme_guest_aptitude(text) from public;
grant execute on function public.programme_guest_aptitude(text) to anon, authenticated;

-- Check (as a visitor would): the statements of the published programme.
--   set role anon;
--   select jsonb_array_length(public.programme_guest_aptitude('ai-powered-entrepreneurship') -> 'items');
--   reset role;
