-- New names, in the emails and Inbox labels the database writes:
--   the programme   -> the Global Leadership Programme
--                      (was the Career Readiness, then Life Readiness, Programme)
--   the score       -> the Global Readiness Score (was the Career Readiness Score)
--   the test        -> the Leadership Aptitude Test (was the Life aptitude test)
--
-- Every live function that has an old name is changed in place, keeping it
-- otherwise exactly as it is. Stored data is not touched: programme keys such
-- as 'career-readiness', and the career_readiness_* tables and functions,
-- keep their names, so nothing that reads them changes.
--
-- Run once; either order with the deploy. Safe to re-run. The first result
-- lists any function still on an old name (should be none), the second the
-- functions that now use the new ones.

do $$
declare
  f record;
  d text;
  n text;
begin
  for f in
    select p.oid
      from pg_proc p
      join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public'
       and p.prokind = 'f'
       and (p.prosrc like '%Life Readiness%' or p.prosrc like '%Career Readiness%' or p.prosrc ilike '%life aptitude%')
  loop
    d := pg_get_functiondef(f.oid);
    n := replace(d, 'Career Readiness Score', 'Global Readiness Score');
    n := replace(n, 'Career Readiness score', 'Global Readiness Score');
    n := replace(n, 'Life Readiness', 'Global Leadership');
    n := replace(n, 'Career Readiness', 'Global Leadership');
    n := replace(n, 'Life aptitude test', 'Leadership Aptitude Test');
    n := replace(n, 'life aptitude test', 'Leadership Aptitude Test');
    if n <> d then
      execute n;
    end if;
  end loop;
end $$;

-- Still on an old name (should be empty).
select p.proname as still_old
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
 where ns.nspname = 'public'
   and (p.prosrc like '%Life Readiness%' or p.prosrc like '%Career Readiness%' or p.prosrc ilike '%life aptitude%');

-- Now using the new names.
select p.proname as renamed
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
 where ns.nspname = 'public'
   and (p.prosrc like '%Global Leadership%' or p.prosrc like '%Global Readiness Score%' or p.prosrc like '%Leadership Aptitude Test%')
 order by 1;
