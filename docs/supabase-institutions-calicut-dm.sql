-- Digital marketing academies in Calicut, listed with Apply Now (Paul, 18 Nov
-- 2026: "add these academies too in digital marketing. All of these are based
-- in Calicut"). A student's Apply Now is an institution lead for the MySkills
-- team (docs/supabase-institution-leads.sql); the academy doesn't see it.
--
-- These academies have not applied to MySkills or been checked by the team,
-- so they are listed WITHOUT the "Verified partner" badge: `verified` is false.
-- A partner approved through the partner application keeps it (the default).
-- When the team has checked one, set verified = true for it.
--
-- Name, years in business and Google rating as Google Maps showed them on
-- 18 Nov 2026 (ratings change; update them now and then). No phone numbers,
-- websites or Google links: leads come to the team.
--
-- Run once, BEFORE deploying the site version that reads `verified` (the site
-- also works without it: every listing then shows as verified, as before).
-- Safe to run again: an academy already listed by name is not added twice.

alter table public.institution_partners
  add column if not exists verified boolean not null default true;

insert into public.institution_partners (legal_name, courses_offered, years_in_education, city, google_rating, verified, sort_order)
select v.legal_name, array['Digital Marketing'], v.years, 'Calicut', v.rating, false, 100
  from (values
    ('CDA Academy Calicut',                  7,  4.8),
    ('Sizcom Digital Marketing Institute',   7,  4.9),
    ('One Code Digital Academy',             0,  5.0),
    ('Dotin Digital Academy Calicut',        0,  5.0),
    ('Zoople Technologies',                  0,  4.9),
    ('OneTeam Digital Marketing Institute',  3,  4.9),
    ('Areva Digital',                        15, 4.9)
  ) as v(legal_name, years, rating)
 where not exists (
   select 1 from public.institution_partners p where lower(p.legal_name) = lower(v.legal_name)
 );

-- Check: the seven, unverified, after the verified partners.
select legal_name, city, years_in_education, google_rating, verified
  from public.institution_partners
 order by sort_order, created_at;
