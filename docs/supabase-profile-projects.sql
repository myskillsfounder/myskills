-- Profile projects — the Projects section on /profile, scored by the Career
-- Readiness Score (src/lib/readinessScore.ts).
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
--
-- Same shape as experience/education: a jsonb array on the profile row, so
-- the existing "own row only" RLS on public.profiles already covers it.
-- The app reads this column in a separate, error-tolerant query, so the site
-- keeps working if it's deployed before this runs — only saving projects
-- fails until then.

alter table public.profiles
  add column if not exists projects jsonb not null default '[]'::jsonb;
