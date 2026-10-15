-- The Career Readiness Programme is now the Life Readiness Programme.
--
-- The database writes the programme's name into the emails it sends (a
-- mentor request, a project to grade, a new lead) and into the team's Inbox.
-- This changes "Career Readiness" to "Life Readiness" in every function that
-- has it, in place, keeping each function otherwise exactly as it is live.
--
-- The Career Readiness SCORE keeps its name: any "Career Readiness Score" (or
-- "score") is left alone. Stored data is not touched: programme keys such as
-- 'career-readiness' stay what they are, so nothing that reads them changes.
--
-- Run once; either order with the deploy. Safe to re-run (a second run finds
-- nothing to change). The last statement lists the functions that now say
-- "Life Readiness", and the second-to-last any still saying the old name
-- (there should be none).

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
       and p.prosrc ~ 'Career Readiness(?!\s+[Ss]core)'
  loop
    d := pg_get_functiondef(f.oid);
    n := regexp_replace(d, 'Career Readiness(?!\s+[Ss]core)', 'Life Readiness', 'g');
    if n <> d then
      execute n;
    end if;
  end loop;
end $$;

-- Still on the old name (should be empty).
select p.proname as still_old
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
 where ns.nspname = 'public' and p.prosrc ~ 'Career Readiness(?!\s+[Ss]core)';

-- Now saying "Life Readiness".
select p.proname as renamed
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
 where ns.nspname = 'public' and p.prosrc like '%Life Readiness%'
 order by 1;
