-- Seeds INTERVAL as the first entry in the public institution_partners
-- listing (docs/supabase-institution-partner-onboarding.sql), so it shows up
-- as a regular partner card on /community/institutions alongside the
-- separate, hardcoded promo card with the admission-lead form.
--
-- INTERVAL never went through the new application flow (it's the founding
-- partner, added directly), so there's no institution_partner_applications
-- row to link via application_id -- that column is nullable for exactly
-- this case.
--
-- Fill in / correct the values below before running — years_in_education,
-- google_profile_url, google_rating and website_url are all placeholders.
-- Run this once against Supabase Cloud (SQL editor).

-- No unique constraint on legal_name to key an ON CONFLICT off of, so this
-- guards idempotency with a plain existence check instead (same pattern as
-- the mentor seed in docs/supabase-mentor-onboarding.sql) — safe to re-run.
insert into public.institution_partners
  (legal_name, courses_offered, years_in_education, city, google_profile_url, google_rating, website_url, sort_order)
select
  'INTERVAL',                          -- TODO: their actual registered legal name, if different
  array['Digital Marketing'],          -- TODO: their real course list
  5,                                    -- TODO: actual years in education/training
  null,                                 -- TODO: city, e.g. 'Bengaluru'
  null,                                 -- TODO: Google Business profile URL
  null,                                 -- TODO: Google rating, e.g. 4.5
  null,                                 -- TODO: website URL
  0                                     -- sort first
where not exists (select 1 from public.institution_partners where legal_name = 'INTERVAL');

-- Verify:
--   select * from public.institution_partners where legal_name = 'INTERVAL';
