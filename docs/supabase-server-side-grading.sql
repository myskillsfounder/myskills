-- HIGH-SEVERITY FIX: initial assessment scores and certificates were graded
-- client-side and written directly by the browser — RLS only ever checked
-- *who* was writing (auth.uid() = profile_id), never *what*. The correct
-- answers also shipped in the client bundle (AssessmentQuestion.correct),
-- so anyone could read them straight out of devtools without even needing
-- to fake an API call. Together: a "Gold, 100%" certificate was one insert
-- away for anyone who never answered a question — and nothing stopped a
-- second submission from silently overwriting the first with a better score
-- (initial_assessment_results.profile_id is a primary key, so a repeat
-- upsert updates in place rather than being rejected).
--
-- Scope: this migration covers the ONE-TIME initial assessment + the
-- certificate it issues, since that's the specific thing being pitched to
-- institutions as "verifiable." Decision Labs / practice_attempts (8 skill
-- tracks, ~100KB of scenario content) is a separate, larger migration and
-- is intentionally NOT included here — it's lower-stakes (repeatable
-- practice, doesn't gate a certificate) and deserves its own pass rather
-- than being rushed alongside this one.
--
-- Depends on public.is_admin() from docs/supabase-mentor-onboarding.sql.
-- Run this once against Supabase Cloud (SQL editor).

-- ---------------------------------------------------------------------------
-- 1. Question bank — public content, no answer key
-- ---------------------------------------------------------------------------
-- Deliberately NO explanation column here — see below. Every column on this
-- table is safe to read before the quiz is answered; explanation text often
-- restates the correct answer ("Marketing exists to create and communicate
-- customer value" for a question about marketing's purpose), so it belongs
-- with the answer key, not the public question bank.
create table if not exists public.initial_assessment_questions (
  id         text primary key,
  category   text not null,
  question   text not null,
  options    text[] not null,
  sort_order int not null default 0
);

alter table public.initial_assessment_questions enable row level security;

drop policy if exists "questions are public" on public.initial_assessment_questions;
create policy "questions are public"
  on public.initial_assessment_questions for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 2. Answer key — NO client-facing policy at all (RLS enabled, zero grants).
--    Only a security-definer function (which runs as the table owner and so
--    bypasses RLS) can ever read this. Same principle as public.admins.
--    Holds explanation too, for the same reason.
-- ---------------------------------------------------------------------------
create table if not exists public.initial_assessment_answer_key (
  question_id   text primary key references public.initial_assessment_questions (id) on delete cascade,
  correct_index int not null,
  explanation   text not null
);

alter table public.initial_assessment_answer_key enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Seed the 35 questions from src/lib/initialAssessment.ts (regenerate
--    from content/source-assessment-bank/MySkills_45Plus5_Assessment_Bank.xlsx
--    if the source ever changes — keep this file and the .ts file in sync).
-- ---------------------------------------------------------------------------
with seed(id, category, question, options, sort_order) as (
  values
    ('MF001', 'Marketing Fundamentals', 'What is the primary purpose of marketing?', array['Selling products', 'Generating profit', 'Creating customer value and demand', 'Advertising products'], 0),
    ('MF002', 'Marketing Fundamentals', 'Which stage comes first in the marketing funnel?', array['Consideration', 'Awareness', 'Conversion', 'Retention'], 1),
    ('MF003', 'Marketing Fundamentals', 'STP stands for?', array['Sales Targeting Positioning', 'Segmentation Targeting Positioning', 'Segmentation Tracking Promotion', 'Strategy Targeting Pricing'], 2),
    ('MF004', 'Marketing Fundamentals', 'A buyer persona is?', array['Customer database', 'Ideal customer profile', 'Competitor profile', 'Sales report'], 3),
    ('MF005', 'Marketing Fundamentals', 'Which metric measures loyalty?', array['CTR', 'CPC', 'Retention Rate', 'CPM'], 4),
    ('MR001', 'Market Research', 'Keyword research helps identify?', array['Competitors', 'Search demand', 'Pricing', 'Revenue'], 5),
    ('MR002', 'Market Research', 'Primary research includes?', array['Industry reports', 'Customer surveys', 'Blogs', 'Competitor websites'], 6),
    ('MR003', 'Market Research', 'Keyword Planner is used for?', array['Analytics', 'Keyword Research', 'Design', 'Automation'], 7),
    ('MR004', 'Market Research', 'Competitor analysis helps understand?', array['Market Positioning', 'Weather', 'Taxes', 'Coding'], 8),
    ('MR005', 'Market Research', 'Search volume refers to?', array['Pages', 'Keyword searches', 'Websites', 'Ads'], 9),
    ('META001', 'Meta Ads', 'Best Meta objective for lead generation?', array['Awareness', 'Traffic', 'Leads', 'Engagement'], 10),
    ('META002', 'Meta Ads', 'CTR stands for?', array['Cost to Reach', 'Click Through Rate', 'Campaign Tracking Rate', 'Conversion Tracking Ratio'], 11),
    ('META003', 'Meta Ads', 'Lookalike audiences are based on?', array['Random users', 'Customer data', 'Competitors', 'Employees'], 12),
    ('META004', 'Meta Ads', 'Retargeting focuses on?', array['New users', 'Engaged users', 'Competitors', 'Employees'], 13),
    ('META005', 'Meta Ads', 'What impacts CPM?', array['Competition', 'Weather', 'Logo', 'Office'], 14),
    ('GADS001', 'Google Ads', 'Which campaign captures active intent?', array['Display', 'Search', 'Video', 'Discovery'], 15),
    ('GADS002', 'Google Ads', 'Quality Score depends on?', array['CTR', 'Landing Page', 'Ad Relevance', 'All of the above'], 16),
    ('GADS003', 'Google Ads', 'Negative keywords help?', array['Increase spend', 'Prevent irrelevant clicks', 'Increase impressions', 'Reduce conversions'], 17),
    ('GADS004', 'Google Ads', 'CPC stands for?', array['Cost Per Click', 'Cost Per Campaign', 'Campaign Cost', 'Conversion Per Click'], 18),
    ('GADS005', 'Google Ads', 'Exact Match means?', array['Broad relevance', 'Close variations', 'All searches', 'Competitor terms'], 19),
    ('SEO001', 'SEO', 'Which tag defines page title?', array['H1', 'Title Tag', 'Alt Tag', 'Meta Keyword'], 20),
    ('SEO002', 'SEO', 'Backlinks are?', array['Internal links', 'External links to your site', 'Broken links', 'Ads'], 21),
    ('SEO003', 'SEO', 'What affects SEO ranking?', array['Content Quality', 'Office Location', 'Salary', 'Company Name'], 22),
    ('SEO004', 'SEO', 'What is Local SEO?', array['Local rankings', 'Hosting', 'Server setup', 'App development'], 23),
    ('SEO005', 'SEO', 'AEO stands for?', array['Answer Engine Optimization', 'Audience Engagement Optimization', 'Advertising Engine Optimization', 'Automated Experience Optimization'], 24),
    ('ANA001', 'Analytics', 'GA4 stands for?', array['Google Analytics 4', 'Growth Analytics 4', 'Google Ad Framework', 'Global Analytics'], 25),
    ('ANA002', 'Analytics', 'Bounce rate measures?', array['User exits', 'Leaving without interaction', 'Revenue', 'Impressions'], 26),
    ('ANA003', 'Analytics', 'A conversion is?', array['Page view', 'Desired action', 'Impression', 'Click'], 27),
    ('ANA004', 'Analytics', 'Attribution helps identify?', array['Design', 'Channel contribution', 'Team performance', 'Customer age'], 28),
    ('ANA005', 'Analytics', 'Which metric indicates efficiency?', array['CPA', 'Impressions', 'Reach', 'Followers'], 29),
    ('SC001', 'Scenario Based', 'Budget ₹50k. Goal: Leads. Best platform?', array['Meta Lead Campaign', 'Awareness', 'Display', 'Organic Only'], 30),
    ('SC002', 'Scenario Based', 'CTR 5%, Conversion Rate 0.2%. Optimize?', array['Landing Page', 'Audience', 'Budget', 'Frequency'], 31),
    ('SC003', 'Scenario Based', 'Keyword difficulty 90 on new site. Action?', array['Target immediately', 'Ignore SEO', 'Find lower competition keywords', 'Run display ads'], 32),
    ('SC004', 'Scenario Based', 'High impressions, low clicks. Issue?', array['Creative', 'Tracking', 'Budget', 'Landing Page'], 33),
    ('SC005', 'Scenario Based', 'CPA up 40%. First step?', array['Pause everything', 'Analyze funnel', 'Increase budget', 'Change logo'], 34)
)
insert into public.initial_assessment_questions (id, category, question, options, sort_order)
select id, category, question, options, sort_order from seed
on conflict (id) do update set
  category = excluded.category,
  question = excluded.question,
  options = excluded.options,
  sort_order = excluded.sort_order;

with seed(id, correct_index, explanation) as (
  values
    ('MF001', 2, 'Marketing exists to create and communicate customer value.'),
    ('MF002', 1, 'Awareness is the first stage.'),
    ('MF003', 1, 'Core marketing framework.'),
    ('MF004', 1, 'Represents ideal customer.'),
    ('MF005', 2, 'Retention indicates loyalty.'),
    ('MR001', 1, 'Identifies search demand.'),
    ('MR002', 1, 'Collected directly from users.'),
    ('MR003', 1, 'Keyword research tool.'),
    ('MR004', 0, 'Competitive positioning.'),
    ('MR005', 1, 'Search frequency.'),
    ('META001', 2, 'Optimized for lead generation.'),
    ('META002', 1, 'Clicks divided by impressions.'),
    ('META003', 1, 'Built from source audience.'),
    ('META004', 1, 'Warm audiences.'),
    ('META005', 0, 'Auction competition impacts CPM.'),
    ('GADS001', 1, 'Search targets active demand.'),
    ('GADS002', 3, 'All contribute to QS.'),
    ('GADS003', 1, 'Filters bad traffic.'),
    ('GADS004', 0, 'Advertising metric.'),
    ('GADS005', 1, 'Most targeted match type.'),
    ('SEO001', 1, 'Title tag shown in SERPs.'),
    ('SEO002', 1, 'Important ranking factor.'),
    ('SEO003', 0, 'Content quality is critical.'),
    ('SEO004', 0, 'Optimizes local visibility.'),
    ('SEO005', 0, 'Optimizing for answer engines.'),
    ('ANA001', 0, 'Google Analytics platform.'),
    ('ANA002', 1, 'Limited engagement.'),
    ('ANA003', 1, 'Business goal completion.'),
    ('ANA004', 1, 'Tracks conversion sources.'),
    ('ANA005', 0, 'Measures acquisition cost.'),
    ('SC001', 0, 'Lead campaigns optimize for leads.'),
    ('SC002', 0, 'Traffic is good; page converts poorly.'),
    ('SC003', 2, 'Target achievable keywords first.'),
    ('SC004', 0, 'Poor ad attractiveness.'),
    ('SC005', 1, 'Diagnose before acting.')
)
insert into public.initial_assessment_answer_key (question_id, correct_index, explanation)
select id, correct_index, explanation from seed
on conflict (question_id) do update set
  correct_index = excluded.correct_index,
  explanation = excluded.explanation;

-- ---------------------------------------------------------------------------
-- 4. Lock down direct writes — grading writes through the RPC below now,
--    which runs as the table owner and doesn't need a client-facing INSERT
--    policy at all. Reading your own result/certificate is unaffected.
-- ---------------------------------------------------------------------------
drop policy if exists iar_insert_own on public.initial_assessment_results;
drop policy if exists iar_update_own on public.initial_assessment_results;
drop policy if exists iacs_insert_own on public.initial_assessment_category_scores;
drop policy if exists iacs_update_own on public.initial_assessment_category_scores;
drop policy if exists cert_insert_own on public.certificates;

-- ---------------------------------------------------------------------------
-- 5. The grading function — the only remaining way to write any of the
--    three tables above. Rejects a second attempt (closes the "resubmit for
--    a better score" gap alongside the "fabricate an answer key" one).
-- ---------------------------------------------------------------------------
create or replace function public.grade_initial_assessment(answers jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  already_taken boolean;
  rec record;
  total_correct int := 0;
  total_count int := 0;
  cat_scores jsonb := '{}'::jsonb;
  -- Safe to hand back once grading is final and one-time-only: per-question
  -- correct answers for the post-quiz review screen. Revealing these AFTER
  -- the graded, unrepeatable attempt can't be used to game that attempt.
  review jsonb := '{}'::jsonb;
  overall_percent int;
  cert_kind text;
  recipient text;
  cert_code text;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select exists(select 1 from public.initial_assessment_results where profile_id = uid) into already_taken;
  if already_taken then
    raise exception 'assessment already completed';
  end if;

  for rec in
    select q.id, q.category, k.correct_index, k.explanation,
           (answers ->> q.id)::int as selected
    from public.initial_assessment_questions q
    join public.initial_assessment_answer_key k on k.question_id = q.id
  loop
    total_count := total_count + 1;
    cat_scores := jsonb_set(
      cat_scores,
      array[rec.category],
      jsonb_build_object(
        'correct', coalesce((cat_scores -> rec.category ->> 'correct')::int, 0)
                   + (case when rec.selected = rec.correct_index then 1 else 0 end),
        'total',   coalesce((cat_scores -> rec.category ->> 'total')::int, 0) + 1
      ),
      true
    );
    review := review || jsonb_build_object(
      rec.id,
      jsonb_build_object('correctIndex', rec.correct_index, 'explanation', rec.explanation)
    );
    if rec.selected = rec.correct_index then
      total_correct := total_correct + 1;
    end if;
  end loop;

  if total_count = 0 then
    raise exception 'no questions found';
  end if;

  overall_percent := round((total_correct::numeric / total_count) * 100);

  insert into public.initial_assessment_results (profile_id, correct, total, percent, completed_at)
  values (uid, total_correct, total_count, overall_percent, now());

  insert into public.initial_assessment_category_scores (profile_id, category, correct, total, percent)
  select
    uid,
    key,
    (value ->> 'correct')::int,
    (value ->> 'total')::int,
    round(((value ->> 'correct')::numeric / nullif((value ->> 'total')::int, 0)) * 100)
  from jsonb_each(cat_scores);

  -- Certificate — same band thresholds as TIER_THRESHOLDS in
  -- src/lib/certificates.ts (Gold >=80, Silver >=60, Bronze below).
  cert_kind := case
    when overall_percent >= 80 then 'gold'
    when overall_percent >= 60 then 'silver'
    else 'bronze'
  end;

  select coalesce(nullif(trim(p.full_name), ''), split_part(u.email, '@', 1), 'Member')
    into recipient
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = uid;

  cert_code := 'MSK-' || upper(substr(md5(uid::text || now()::text || random()::text), 1, 4))
    || '-' || upper(substr(md5(random()::text), 1, 4))
    || '-' || upper(substr(md5(random()::text), 1, 4));

  insert into public.certificates (profile_id, code, recipient_name, kind, percent, title)
  values (uid, cert_code, coalesce(recipient, 'Member'), cert_kind, overall_percent, 'Digital Marketing')
  on conflict (profile_id) do nothing;

  return json_build_object(
    'correct', total_correct,
    'total', total_count,
    'percent', overall_percent,
    'byCategory', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'category', key,
               'correct', (value ->> 'correct')::int,
               'total', (value ->> 'total')::int
             )), '[]'::jsonb)
      from jsonb_each(cat_scores)
    ),
    -- {question_id: {correctIndex, explanation}} — safe now that grading is
    -- final; the client uses this to render "here's what you missed."
    'review', review
  );
end;
$$;

revoke all on function public.grade_initial_assessment(jsonb) from public, anon;
grant execute on function public.grade_initial_assessment(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--   select count(*) from public.initial_assessment_questions;  -- expect 35
--   select count(*) from public.initial_assessment_answer_key; -- expect 35
--
-- As a signed-in user who hasn't taken it yet:
--   select public.grade_initial_assessment('{"MF001": 2, "MF002": 1}'::jsonb);
--   -- (partial answer sets are fine for a smoke test — unanswered
--   -- questions just count as wrong, same as leaving them blank)
--
-- Confirm the client can no longer write these directly:
--   insert into public.initial_assessment_results (profile_id, correct, total, percent, completed_at)
--   values (auth.uid(), 35, 35, 100, now());
--   -- should fail with a permission/RLS error — no policy grants this anymore
