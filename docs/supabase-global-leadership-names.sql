-- The Life Readiness Programme is now the Global Leadership Programme.
--
-- The database writes the programme's name into the emails it sends (a
-- mentor request, a project to grade, a new lead) and into the team's Inbox.
-- This changes "Life Readiness" to "Global Leadership" in every function that
-- has it, in place, keeping each function otherwise exactly as it is live.
-- (docs/supabase-life-readiness-names.sql made the previous rename; any
-- function still saying "Career Readiness" for the programme is caught too.)
--
-- The Career Readiness SCORE keeps its name. Stored data is not touched:
-- programme keys such as 'career-readiness' stay what they are.
--
-- Run once; either order with the deploy. Safe to re-run. The first result
-- lists any function still on an old name (should be none), the second the
-- functions that now say "Global Leadership".

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
       and (p.prosrc like '%Life Readiness%' or p.prosrc ~ 'Career Readiness(?!\s+[Ss]core)')
  loop
    d := pg_get_functiondef(f.oid);
    n := replace(d, 'Life Readiness', 'Global Leadership');
    n := regexp_replace(n, 'Career Readiness(?!\s+[Ss]core)', 'Global Leadership', 'g');
    if n <> d then
      execute n;
    end if;
  end loop;
end $$;

-- Still on an old name (should be empty).
select p.proname as still_old
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
 where ns.nspname = 'public'
   and (p.prosrc like '%Life Readiness%' or p.prosrc ~ 'Career Readiness(?!\s+[Ss]core)');

-- Now saying "Global Leadership".
select p.proname as renamed
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
 where ns.nspname = 'public' and p.prosrc like '%Global Leadership%'
 order by 1;
