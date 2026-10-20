-- Learner events: everything a student does, in one place, so the app can
-- learn how each student learns (step 1 of the learner profile).
--
-- WHAT THIS ADDS
--   1. Every practice answer is kept (practice_answers), not just the total,
--      with the question's topic (competency) and difficulty, so we know
--      exactly which skills a student keeps getting wrong. The topics come
--      from src/lib/decisionLabs.ts and are copied into the answer key here.
--   2. Every Foundation assessment answer is kept (foundation_answers), with
--      its category.
--   3. learner_events: one row per meaningful thing a student does, filled
--      automatically by triggers and back-filled from what is already there:
--        aptitude      an aptitude result (either programme), with the scores
--        practice      a practice attempt, with the topics missed
--        foundation    the Foundation assessment, with the categories
--        module_answer a Global Leadership task or reflection, with the text
--        project       a project submitted, approved or sent back, with the
--                      grade and the reviewer's note
--        mentor        a mentor match requested, started or ended
--        live_session  a live session attended
--        internship    an internship application moving stage
--        certificate   a certificate issued
--        goal          the goals chosen at sign-up, when they change
--
-- PRIVACY
--   - Wellness and career-guidance requests are never recorded here.
--   - For the two most personal Global Leadership modules (coping with stress,
--     coping with emotions) only the fact that the task was done is kept, not
--     what the student wrote.
--   - Nobody can read these tables directly (RLS on, no policies). Staff with
--     the Students section read one student's events through
--     admin_learner_events(); nothing is shown to partners.
--   - Events never change the Global Readiness Score.
--
-- NOTHING CHANGES FOR STUDENTS: submit_practice_attempt and
-- grade_initial_assessment are re-issued with the same inputs, rules and
-- results as before; they now also keep the answers.
--
-- Run once, BEFORE OR AFTER the deploy (the new admin timeline says "run the
-- SQL" until it is in). Safe to re-run. Depends on:
-- docs/supabase-practice-honest-scores.sql, -server-side-grading.sql,
-- -staff-permissions.sql, -programme-projects.sql, -mentor-matches.sql,
-- -live-sessions.sql, -internships.sql, -life-skills.sql.

-- ---------------------------------------------------------------------------
-- 1. Topics on the practice answer key
-- ---------------------------------------------------------------------------
alter table public.decision_lab_answer_key
  add column if not exists competency text,
  add column if not exists difficulty text,
  add column if not exists title text;

update public.decision_lab_answer_key k
   set competency = v.competency, difficulty = v.difficulty, title = v.title
  from (values
  ('MF-S001', 'Marketing Objectives', 'Beginner', 'Launching an EdTech Startup'),
  ('MF-S002', 'Segmentation', 'Beginner', 'Finding the Right Target Audience'),
  ('MF-S003', 'Customer Journey', 'Intermediate', 'Traffic Without Sales'),
  ('MF-S004', 'Value Proposition', 'Intermediate', 'Building a Value Proposition'),
  ('MF-S005', 'STP', 'Intermediate', 'Choosing a Target Segment'),
  ('MF-S006', 'Marketing Funnel', 'Intermediate', 'Improving the Funnel'),
  ('MF-S007', 'Competitive Positioning', 'Advanced', 'Responding to a Price War'),
  ('MF-S008', 'Budget Allocation', 'Advanced', 'Allocating a Launch Budget'),
  ('MF-S009', 'Retention', 'Advanced', 'Improving Customer Retention'),
  ('MF-S010', 'Marketing Strategy', 'Advanced', 'Creating an Integrated Strategy'),
  ('MR-S001', 'Competitor Analysis', 'Beginner', 'Finding the Best Market Opportunity'),
  ('MR-S002', 'Keyword Research', 'Beginner', 'Understanding Search Demand'),
  ('MR-S003', 'Audience Segmentation', 'Intermediate', 'Choosing the Right Segment'),
  ('MR-S004', 'Consumer Research', 'Intermediate', 'Survey vs Analytics'),
  ('MR-S005', 'Trend Analysis', 'Intermediate', 'Using Google Trends'),
  ('MR-S006', 'Competitor Benchmarking', 'Intermediate', 'Evaluating Competitors'),
  ('MR-S007', 'Market Sizing', 'Advanced', 'Market Sizing'),
  ('MR-S008', 'Persona Development', 'Advanced', 'Validating Personas'),
  ('MR-S009', 'Research Planning', 'Advanced', 'Research Budget'),
  ('MR-S010', 'Strategic Research', 'Advanced', 'Final Recommendation'),
  ('META-S001', 'Campaign Objective', 'Beginner', 'Selecting the Right Campaign Objective'),
  ('META-S002', 'Campaign Structure', 'Beginner', 'Campaign Structure for Multiple Courses'),
  ('META-S003', 'Audience Targeting', 'Beginner', 'Choosing the Best Audience'),
  ('META-S004', 'Budgeting', 'Beginner', 'Budget Allocation'),
  ('META-S005', 'Placements', 'Beginner', 'Placement Strategy'),
  ('META-S006', 'Performance Analysis', 'Intermediate', 'CTR vs CPC'),
  ('META-S007', 'Landing Page Analysis', 'Intermediate', 'Low Conversion Rate'),
  ('META-S008', 'Optimization', 'Intermediate', 'High CPA'),
  ('META-S009', 'Creative Optimization', 'Intermediate', 'Creative Fatigue'),
  ('META-S010', 'Audience Testing', 'Intermediate', 'Lookalike vs Interests'),
  ('META-S011', 'Scaling', 'Advanced', 'Scaling a Winner'),
  ('META-S012', 'Tracking', 'Advanced', 'Pixel Attribution Issue'),
  ('META-S013', 'CAPI', 'Advanced', 'Conversion API'),
  ('META-S014', 'Troubleshooting', 'Advanced', 'Campaign Rescue'),
  ('META-S015', 'Strategic Optimization', 'Expert', 'Performance Review'),
  ('GA-S001', 'Campaign Selection', 'Beginner', 'Selecting the Right Campaign Type'),
  ('GA-S002', 'Keywords', 'Beginner', 'Choosing Match Types'),
  ('GA-S003', 'Optimization', 'Beginner', 'Negative Keywords'),
  ('GA-S004', 'Quality Score', 'Intermediate', 'Quality Score Drop'),
  ('GA-S005', 'Ad Copy', 'Intermediate', 'Low CTR'),
  ('GA-S006', 'Bidding', 'Intermediate', 'High CPC'),
  ('GA-S007', 'Landing Pages', 'Intermediate', 'Landing Page Experience'),
  ('GA-S008', 'Performance Max', 'Intermediate', 'Performance Max Evaluation'),
  ('GA-S009', 'Search Queries', 'Intermediate', 'Search Terms Analysis'),
  ('GA-S010', 'Remarketing', 'Intermediate', 'Remarketing Strategy'),
  ('GA-S011', 'Scaling', 'Advanced', 'Scaling Search Campaigns'),
  ('GA-S012', 'Tracking', 'Advanced', 'Conversion Tracking Failure'),
  ('GA-S013', 'Budget Strategy', 'Advanced', 'Budget Allocation'),
  ('GA-S014', 'Troubleshooting', 'Advanced', 'Campaign Rescue'),
  ('GA-S015', 'Strategic Optimization', 'Expert', 'Quarterly Account Review'),
  ('SEO-S001', 'Technical SEO', 'Beginner', 'Organic Traffic Decline'),
  ('SEO-S002', 'Keyword Research', 'Beginner', 'Keyword Prioritization'),
  ('SEO-S003', 'Content Strategy', 'Beginner', 'Content Gap Analysis'),
  ('SEO-S004', 'Local SEO', 'Intermediate', 'Local SEO Challenge'),
  ('SEO-S005', 'Technical SEO', 'Intermediate', 'Core Web Vitals'),
  ('SEO-S006', 'Link Building', 'Intermediate', 'Backlink Strategy'),
  ('SEO-S007', 'Structured Data', 'Intermediate', 'Schema Markup'),
  ('SEO-S008', 'Content Optimization', 'Advanced', 'Featured Snippet Opportunity'),
  ('SEO-S009', 'Answer Engine Optimization', 'Advanced', 'AI Search & AEO'),
  ('SEO-S010', 'Technical SEO', 'Advanced', 'Site Migration'),
  ('SEO-S011', 'Site Architecture', 'Advanced', 'Internal Linking'),
  ('SEO-S012', 'Algorithm Recovery', 'Advanced', 'Recovering from a Google Update'),
  ('SEO-S013', 'Content Optimization', 'Advanced', 'Content Refresh Strategy'),
  ('SEO-S014', 'Measurement', 'Advanced', 'SEO Reporting'),
  ('SEO-S015', 'SEO Strategy', 'Expert', 'Building a Long-Term SEO Roadmap'),
  ('ANA-S001', 'GA4 Configuration', 'Beginner', 'GA4 Setup Validation'),
  ('ANA-S002', 'Traffic Analysis', 'Beginner', 'Traffic Increased but Leads Didn''t'),
  ('ANA-S003', 'Attribution', 'Intermediate', 'Attribution Conflict'),
  ('ANA-S004', 'Funnel Analysis', 'Intermediate', 'Funnel Drop-off'),
  ('ANA-S005', 'ROI Analysis', 'Intermediate', 'Campaign ROI Comparison'),
  ('ANA-S006', 'Measurement', 'Intermediate', 'Conversion Tracking Failure'),
  ('ANA-S007', 'Reporting', 'Advanced', 'Dashboard for Executives'),
  ('ANA-S008', 'Audience Insights', 'Advanced', 'Audience Behaviour Analysis'),
  ('ANA-S009', 'Channel Performance', 'Advanced', 'Marketing Mix Evaluation'),
  ('ANA-S010', 'Strategic Analytics', 'Expert', 'Executive Performance Review'),
  ('CM-S001', 'Content Strategy', 'Beginner', 'Building a Content Strategy'),
  ('CM-S002', 'Content Planning', 'Beginner', 'Choosing the Right Content Format'),
  ('CM-S003', 'Content Calendar', 'Beginner', 'Editorial Calendar Planning'),
  ('CM-S004', 'Content Optimization', 'Intermediate', 'Low Blog Engagement'),
  ('CM-S005', 'Marketing Funnel', 'Intermediate', 'Content for Different Funnel Stages'),
  ('CM-S006', 'Content Repurposing', 'Intermediate', 'Repurposing High-Performing Content'),
  ('CM-S007', 'Brand Authority', 'Advanced', 'Thought Leadership Strategy'),
  ('CM-S008', 'Social Media Content', 'Advanced', 'Social Content Performance'),
  ('CM-S009', 'Content Analytics', 'Advanced', 'Measuring Content Success'),
  ('CM-S010', 'Campaign Planning', 'Expert', 'Integrated Content Campaign'),
  ('MAI-S001', 'Email Automation', 'Beginner', 'Welcome Email Automation'),
  ('MAI-S002', 'Lead Nurturing', 'Beginner', 'Lead Nurturing Workflow'),
  ('MAI-S003', 'WhatsApp Marketing', 'Beginner', 'WhatsApp Automation'),
  ('MAI-S004', 'Lead Scoring', 'Intermediate', 'Lead Scoring'),
  ('MAI-S005', 'E-commerce Automation', 'Intermediate', 'Cart Abandonment Automation'),
  ('MAI-S006', 'AI Content', 'Intermediate', 'AI Copy Generation'),
  ('MAI-S007', 'AI Analytics', 'Intermediate', 'AI Audience Insights'),
  ('MAI-S008', 'Workflow Design', 'Advanced', 'Marketing Workflow Automation'),
  ('MAI-S009', 'Conversational AI', 'Advanced', 'AI Chatbot Strategy'),
  ('MAI-S010', 'Lifecycle Marketing', 'Advanced', 'Re-engagement Campaign'),
  ('MAI-S011', 'Prompt Engineering', 'Advanced', 'Prompt Engineering for Marketing'),
  ('MAI-S012', 'Automation Optimization', 'Advanced', 'Automation Performance Audit'),
  ('MAI-S013', 'Responsible AI', 'Advanced', 'AI Ethics in Marketing'),
  ('MAI-S014', 'Omnichannel Automation', 'Expert', 'Cross-Channel Automation'),
  ('MAI-S015', 'AI Strategy', 'Expert', 'Building an AI Marketing Roadmap')
  ) as v (question_id, competency, difficulty, title)
 where k.question_id = v.question_id;

-- ---------------------------------------------------------------------------
-- 2. Every answer, kept
-- ---------------------------------------------------------------------------
create table if not exists public.practice_answers (
  attempt_id  uuid not null references public.practice_attempts (id) on delete cascade,
  profile_id  uuid not null references auth.users (id) on delete cascade,
  track_slug  text not null,
  question_id text not null,
  selected    int,
  correct     boolean not null,
  weight      int not null,
  answered_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);
create index if not exists practice_answers_profile_idx on public.practice_answers (profile_id, answered_at desc);
alter table public.practice_answers enable row level security;

create table if not exists public.foundation_answers (
  profile_id  uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  category    text not null,
  selected    int,
  correct     boolean not null,
  answered_at timestamptz not null default now(),
  primary key (profile_id, question_id)
);
alter table public.foundation_answers enable row level security;

-- ---------------------------------------------------------------------------
-- 3. The events
-- ---------------------------------------------------------------------------
create table if not exists public.learner_events (
  id         bigint generated always as identity primary key,
  profile_id uuid not null references auth.users (id) on delete cascade,
  at         timestamptz not null default now(),
  kind       text not null check (kind in (
               'aptitude', 'practice', 'foundation', 'module_answer', 'project', 'mentor',
               'live_session', 'internship', 'certificate', 'goal')),
  source     text not null,
  ref        text not null,
  summary    text not null,
  data       jsonb not null default '{}'::jsonb,
  -- One event per source row and stage: an edited answer updates its event.
  unique (source, ref)
);
create index if not exists learner_events_profile_idx on public.learner_events (profile_id, at desc);
alter table public.learner_events enable row level security;

-- Only the triggers and grading functions below write events.
create or replace function public.record_learner_event(
  p_profile uuid, p_kind text, p_source text, p_ref text, p_summary text, p_data jsonb, p_at timestamptz default now()
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.learner_events (profile_id, kind, source, ref, summary, data, at)
  values (p_profile, p_kind, p_source, p_ref, left(p_summary, 300), coalesce(p_data, '{}'::jsonb), coalesce(p_at, now()))
  on conflict (source, ref) do update
     set summary = excluded.summary, data = excluded.data, at = excluded.at;
$$;
revoke execute on function public.record_learner_event(uuid, text, text, text, text, jsonb, timestamptz) from public, anon, authenticated;

-- "social-media-marketing" -> "Social Media Marketing"
create or replace function public.learner_label(p_slug text) returns text
language sql immutable as $$ select initcap(replace(coalesce(p_slug, ''), '-', ' ')) $$;

-- ---------------------------------------------------------------------------
-- 4. Grading, unchanged for students, now keeping the answers
-- ---------------------------------------------------------------------------
create or replace function public.submit_practice_attempt(p_track text, p_answers jsonb, p_version int)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec record;
  v_total int := 0;
  v_correct int := 0;
  v_earned int := 0;
  v_max int := 0;
  v_percent int;
  v_review jsonb := '{}'::jsonb;
  v_selected int;
  v_last timestamptz;
  v_attempt uuid;
  v_answers jsonb := '[]'::jsonb;
  v_missed jsonb := '[]'::jsonb;
begin
  if uid is null then
    raise exception 'You are not signed in.';
  end if;
  if p_version is distinct from 2 then
    raise exception 'Practice has been updated. Refresh the page, then take the track again.';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Send your answers as an object of question id to option.';
  end if;

  -- Once a day per track: a retake right after the review would be a test of
  -- memory, not of the skill.
  select max(attempted_at) into v_last from public.practice_attempts
   where profile_id = uid and track_slug = p_track;
  if v_last is not null and v_last > now() - interval '24 hours' then
    raise exception 'You can take this track again after %.',
      to_char((v_last + interval '24 hours') at time zone 'Asia/Kolkata', 'FMDD Mon, HH12:MI AM') || ' IST';
  end if;

  for rec in
    select k.question_id, k.weight, k.correct_index, k.why_correct, k.why_others_wrong, k.learning_outcome,
           k.competency, k.difficulty
      from public.decision_lab_answer_key k
     where k.track_slug = p_track
     order by k.question_id
  loop
    v_total := v_total + 1;
    v_max := v_max + rec.weight;

    if not (p_answers ? rec.question_id) then
      raise exception 'Answer every question before submitting.';
    end if;
    begin
      v_selected := (p_answers ->> rec.question_id)::int;
    exception when others then
      raise exception 'Answers must be option numbers.';
    end;

    if v_selected = rec.correct_index then
      v_correct := v_correct + 1;
      v_earned := v_earned + rec.weight;
    else
      v_missed := v_missed || jsonb_build_array(jsonb_build_object(
        'question_id', rec.question_id, 'competency', rec.competency, 'difficulty', rec.difficulty));
    end if;
    v_answers := v_answers || jsonb_build_array(jsonb_build_object(
      'question_id', rec.question_id, 'selected', v_selected,
      'correct', v_selected = rec.correct_index, 'weight', rec.weight));

    v_review := v_review || jsonb_build_object(
      rec.question_id,
      jsonb_build_object(
        'correctIndex', rec.correct_index,
        'whyCorrect', rec.why_correct,
        'whyOthersWrong', rec.why_others_wrong,
        'learningOutcome', rec.learning_outcome
      )
    );
  end loop;

  if v_total = 0 then
    raise exception 'Unknown track.';
  end if;

  v_percent := round((v_earned::numeric / v_max) * 100);

  insert into public.practice_attempts
    (profile_id, track_slug, correct, total, earned_weight, max_weight, percent, server_graded)
  values (uid, p_track, v_correct, v_total, v_earned, v_max, v_percent, true)
  returning id into v_attempt;

  -- New: every answer, and the attempt as a learner event.
  insert into public.practice_answers (attempt_id, profile_id, track_slug, question_id, selected, correct, weight)
  select v_attempt, uid, p_track, a.question_id, a.selected, a.correct, a.weight
    from jsonb_to_recordset(v_answers) as a (question_id text, selected int, correct boolean, weight int);

  perform public.record_learner_event(
    uid, 'practice', 'practice_attempts', v_attempt::text,
    'Practice · ' || public.learner_label(p_track) || ' · ' || v_percent || '%'
      || case when jsonb_array_length(v_missed) > 0 then
           ' · missed: ' || (select string_agg(distinct m ->> 'competency', ', ') from jsonb_array_elements(v_missed) m)
         else '' end,
    jsonb_build_object('track', p_track, 'percent', v_percent, 'correct', v_correct, 'total', v_total, 'missed', v_missed));

  return json_build_object(
    'grade', json_build_object(
      'correct', v_correct, 'total', v_total,
      'earnedWeight', v_earned, 'maxWeight', v_max, 'percent', v_percent
    ),
    'review', v_review
  );
end;
$$;
revoke execute on function public.submit_practice_attempt(text, jsonb, int) from public, anon;
grant execute on function public.submit_practice_attempt(text, jsonb, int) to authenticated;

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
  v_answers jsonb := '[]'::jsonb;
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
    v_answers := v_answers || jsonb_build_array(jsonb_build_object(
      'question_id', rec.id, 'category', rec.category, 'selected', rec.selected,
      'correct', coalesce(rec.selected = rec.correct_index, false)));
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

  -- New: every answer, and the result as a learner event.
  insert into public.foundation_answers (profile_id, question_id, category, selected, correct)
  select uid, a.question_id, a.category, a.selected, a.correct
    from jsonb_to_recordset(v_answers) as a (question_id text, category text, selected int, correct boolean)
  on conflict (profile_id, question_id) do nothing;

  perform public.record_learner_event(
    uid, 'foundation', 'initial_assessment_results', uid::text,
    'Foundation assessment · ' || overall_percent || '%',
    jsonb_build_object('percent', overall_percent, 'correct', total_correct, 'total', total_count,
                       'by_category', cat_scores,
                       'missed', (select coalesce(jsonb_agg(jsonb_build_object('question_id', a ->> 'question_id', 'category', a ->> 'category')), '[]'::jsonb)
                                    from jsonb_array_elements(v_answers) a where not (a ->> 'correct')::boolean)));

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
-- 5. Triggers: each kind of activity becomes an event as it happens
-- ---------------------------------------------------------------------------

-- Aptitude, both programmes. A retake is a new event; the earlier one stays.
create or replace function public.learner_event_aptitude() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_programme text := case when tg_table_name = 'dm_aptitude_results' then 'digital-marketing' else 'global-leadership' end;
begin
  perform public.record_learner_event(
    new.profile_id, 'aptitude', tg_table_name, new.profile_id::text || ':' || new.completed_at::text,
    'Aptitude · ' || public.learner_label(v_programme),
    jsonb_build_object('programme', v_programme, 'scores', new.scores, 'reflection', new.reflection,
                       'version', to_jsonb(new) -> 'version'),
    new.completed_at);
  return new;
end $$;
drop trigger if exists learner_event_aptitude on public.dm_aptitude_results;
create trigger learner_event_aptitude after insert or update on public.dm_aptitude_results
  for each row execute function public.learner_event_aptitude();
drop trigger if exists learner_event_aptitude on public.career_readiness_assessment_results;
create trigger learner_event_aptitude after insert or update on public.career_readiness_assessment_results
  for each row execute function public.learner_event_aptitude();

-- Global Leadership written work. Edits update the same event.
create or replace function public.learner_event_module_answer() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  -- The two most personal modules: record that it was done, not what was written.
  v_private boolean := new.module in ('coping-stress', 'coping-emotions');
begin
  perform public.record_learner_event(
    new.profile_id, 'module_answer', 'career_readiness_responses', new.id::text,
    'Global Leadership · ' || public.learner_label(new.module) || ' · '
      || case when new.item = 'reflect' then 'reflection' else 'task ' || substr(new.item, 2) end,
    jsonb_build_object('module', new.module, 'item', new.item, 'chars', char_length(new.response),
                       'private', v_private,
                       'response', case when v_private then null else new.response end),
    new.updated_at);
  return new;
end $$;
drop trigger if exists learner_event_module_answer on public.career_readiness_responses;
create trigger learner_event_module_answer after insert or update on public.career_readiness_responses
  for each row execute function public.learner_event_module_answer();

-- Projects: submitted, approved, sent back.
create or replace function public.learner_event_project() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  perform public.record_learner_event(
    new.user_id, 'project', 'mentor_reviews', new.id::text || ':' || new.status::text || ':' || coalesce(new.attempt, 1),
    'Project · ' || public.learner_label(new.programme) || ' · '
      || case new.status::text when 'requested' then 'submitted' when 'approved' then 'passed'
           when 'changes_requested' then 'sent back' else new.status::text end
      || case when new.project_points is not null then ' · ' || new.project_points || '/20' else '' end,
    jsonb_build_object('programme', new.programme, 'status', new.status, 'attempt', new.attempt,
                       'title', new.project_title, 'points', new.project_points, 'rubric', new.rubric,
                       'reviewer_note', new.reviewer_note, 'student_note', new.student_note),
    coalesce(new.reviewed_at, new.created_at));
  return new;
end $$;
drop trigger if exists learner_event_project on public.mentor_reviews;
create trigger learner_event_project after insert or update on public.mentor_reviews
  for each row execute function public.learner_event_project();

-- Mentor matches: requested, started, ended.
create or replace function public.learner_event_mentor() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  select m.full_name into v_name from public.mentors m where m.id = new.mentor_id;
  perform public.record_learner_event(
    new.student_id, 'mentor', 'mentor_matches', new.id::text || ':' || new.status::text,
    'Mentor · ' || coalesce(v_name, 'a mentor') || ' · ' || new.status::text,
    jsonb_build_object('programme', new.programme, 'status', new.status, 'mentor', v_name,
                       'student_note', new.student_note, 'mentor_note', new.mentor_note),
    coalesce(new.decided_at, new.created_at));
  return new;
end $$;
drop trigger if exists learner_event_mentor on public.mentor_matches;
create trigger learner_event_mentor after insert or update on public.mentor_matches
  for each row execute function public.learner_event_mentor();

-- Live sessions attended.
create or replace function public.learner_event_live_session() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.record_learner_event(
    new.student_id, 'live_session', 'live_session_attendance', new.id::text,
    'Live session · ' || new.title,
    jsonb_build_object('title', new.title, 'host_kind', new.host_kind, 'host', new.host_name, 'held_on', new.held_on),
    new.held_on::timestamptz);
  return new;
end $$;
drop trigger if exists learner_event_live_session on public.live_session_attendance;
create trigger learner_event_live_session after insert on public.live_session_attendance
  for each row execute function public.learner_event_live_session();

-- Internship applications, each stage.
create or replace function public.learner_event_internship() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_title text;
  v_org text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  select r.title, nullif(btrim(c.organisation), '') into v_title, v_org
    from public.internship_roles r
    left join public.community_access c on c.user_id = r.provider_id and c.resource = 'internships'
   where r.id = new.role_id;
  perform public.record_learner_event(
    new.student_id, 'internship', 'internship_applications', new.id::text || ':' || new.status,
    'Internship · ' || coalesce(v_title, 'a role') || coalesce(' at ' || v_org, '') || ' · ' || replace(new.status, '_', ' '),
    jsonb_build_object('role', v_title, 'organisation', v_org, 'status', new.status,
                       'supervisor', new.supervisor_name, 'signoff_note', new.signoff_note),
    new.updated_at);
  return new;
end $$;
drop trigger if exists learner_event_internship on public.internship_applications;
create trigger learner_event_internship after insert or update on public.internship_applications
  for each row execute function public.learner_event_internship();

-- Certificates issued.
create or replace function public.learner_event_certificate() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.record_learner_event(
    new.profile_id, 'certificate', 'certificates', new.id::text,
    'Certificate · ' || new.title || ' · ' || initcap(new.kind),
    jsonb_build_object('title', new.title, 'kind', new.kind, 'percent', new.percent),
    new.issued_at);
  return new;
end $$;
drop trigger if exists learner_event_certificate on public.certificates;
create trigger learner_event_certificate after insert on public.certificates
  for each row execute function public.learner_event_certificate();

-- Goals chosen at sign-up, when they change.
create or replace function public.learner_event_goals() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.goals is not distinct from old.goals then
    return new;
  end if;
  if new.goals is null or jsonb_typeof(new.goals) <> 'array' or jsonb_array_length(new.goals) = 0 then
    return new;
  end if;
  perform public.record_learner_event(
    new.id, 'goal', 'profiles.goals', new.id::text || ':' || extract(epoch from now())::bigint,
    'Goals · ' || (select string_agg(g, ', ') from jsonb_array_elements_text(new.goals) g),
    jsonb_build_object('goals', new.goals,
                       'previous', case when tg_op = 'UPDATE' then old.goals end));
  return new;
end $$;
drop trigger if exists learner_event_goals on public.profiles;
create trigger learner_event_goals after insert or update of goals on public.profiles
  for each row execute function public.learner_event_goals();

-- ---------------------------------------------------------------------------
-- 6. Back-fill from what is already there (once; re-running adds nothing)
-- ---------------------------------------------------------------------------
insert into public.learner_events (profile_id, kind, source, ref, summary, data, at)
select r.profile_id, 'aptitude', 'dm_aptitude_results', r.profile_id::text || ':' || r.completed_at::text,
       'Aptitude · Digital Marketing',
       jsonb_build_object('programme', 'digital-marketing', 'scores', r.scores, 'reflection', r.reflection), r.completed_at
  from public.dm_aptitude_results r
on conflict (source, ref) do nothing;

insert into public.learner_events (profile_id, kind, source, ref, summary, data, at)
select r.profile_id, 'aptitude', 'career_readiness_assessment_results', r.profile_id::text || ':' || r.completed_at::text,
       'Aptitude · Global Leadership',
       jsonb_build_object('programme', 'global-leadership', 'scores', r.scores, 'reflection', r.reflection, 'version', r.version),
       r.completed_at
  from public.career_readiness_assessment_results r
on conflict (source, ref) do nothing;

-- Earlier practice attempts: the totals only (their answers were never kept).
insert into public.learner_events (profile_id, kind, source, ref, summary, data, at)
select a.profile_id, 'practice', 'practice_attempts', a.id::text,
       'Practice · ' || public.learner_label(a.track_slug) || ' · ' || a.percent || '%',
       jsonb_build_object('track', a.track_slug, 'percent', a.percent, 'correct', a.correct, 'total', a.total,
                          'answers_kept', false),
       a.attempted_at
  from public.practice_attempts a
on conflict (source, ref) do nothing;

insert into public.learner_events (profile_id, kind, source, ref, summary, data, at)
select r.profile_id, 'foundation', 'initial_assessment_results', r.profile_id::text,
       'Foundation assessment · ' || r.percent || '%',
       jsonb_build_object('percent', r.percent, 'correct', r.correct, 'total', r.total,
                          'by_category', (select jsonb_object_agg(c.category, jsonb_build_object('correct', c.correct, 'total', c.total))
                                            from public.initial_assessment_category_scores c where c.profile_id = r.profile_id),
                          'answers_kept', false),
       r.completed_at
  from public.initial_assessment_results r
on conflict (source, ref) do nothing;

insert into public.learner_events (profile_id, kind, source, ref, summary, data, at)
select r.profile_id, 'module_answer', 'career_readiness_responses', r.id::text,
       'Global Leadership · ' || public.learner_label(r.module) || ' · '
         || case when r.item = 'reflect' then 'reflection' else 'task ' || substr(r.item, 2) end,
       jsonb_build_object('module', r.module, 'item', r.item, 'chars', char_length(r.response),
                          'private', r.module in ('coping-stress', 'coping-emotions'),
                          'response', case when r.module in ('coping-stress', 'coping-emotions') then null else r.response end),
       r.updated_at
  from public.career_readiness_responses r
on conflict (source, ref) do nothing;

insert into public.learner_events (profile_id, kind, source, ref, summary, data, at)
select r.user_id, 'project', 'mentor_reviews', r.id::text || ':' || r.status::text || ':' || coalesce(r.attempt, 1),
       'Project · ' || public.learner_label(r.programme) || ' · '
         || case r.status::text when 'requested' then 'submitted' when 'approved' then 'passed'
              when 'changes_requested' then 'sent back' else r.status::text end
         || case when r.project_points is not null then ' · ' || r.project_points || '/20' else '' end,
       jsonb_build_object('programme', r.programme, 'status', r.status, 'attempt', r.attempt, 'title', r.project_title,
                          'points', r.project_points, 'rubric', r.rubric, 'reviewer_note', r.reviewer_note, 'student_note', r.student_note),
       coalesce(r.reviewed_at, r.created_at)
  from public.mentor_reviews r
on conflict (source, ref) do nothing;

insert into public.learner_events (profile_id, kind, source, ref, summary, data, at)
select mm.student_id, 'mentor', 'mentor_matches', mm.id::text || ':' || mm.status::text,
       'Mentor · ' || coalesce(m.full_name, 'a mentor') || ' · ' || mm.status::text,
       jsonb_build_object('programme', mm.programme, 'status', mm.status, 'mentor', m.full_name,
                          'student_note', mm.student_note, 'mentor_note', mm.mentor_note),
       coalesce(mm.decided_at, mm.created_at)
  from public.mentor_matches mm
  left join public.mentors m on m.id = mm.mentor_id
on conflict (source, ref) do nothing;

insert into public.learner_events (profile_id, kind, source, ref, summary, data, at)
select a.student_id, 'live_session', 'live_session_attendance', a.id::text, 'Live session · ' || a.title,
       jsonb_build_object('title', a.title, 'host_kind', a.host_kind, 'host', a.host_name, 'held_on', a.held_on),
       a.held_on::timestamptz
  from public.live_session_attendance a
on conflict (source, ref) do nothing;

insert into public.learner_events (profile_id, kind, source, ref, summary, data, at)
select a.student_id, 'internship', 'internship_applications', a.id::text || ':' || a.status,
       'Internship · ' || coalesce(r.title, 'a role') || coalesce(' at ' || nullif(btrim(c.organisation), ''), '') || ' · ' || replace(a.status, '_', ' '),
       jsonb_build_object('role', r.title, 'organisation', nullif(btrim(c.organisation), ''), 'status', a.status,
                          'supervisor', a.supervisor_name, 'signoff_note', a.signoff_note),
       a.updated_at
  from public.internship_applications a
  left join public.internship_roles r on r.id = a.role_id
  left join public.community_access c on c.user_id = r.provider_id and c.resource = 'internships'
on conflict (source, ref) do nothing;

insert into public.learner_events (profile_id, kind, source, ref, summary, data, at)
select c.profile_id, 'certificate', 'certificates', c.id::text, 'Certificate · ' || c.title || ' · ' || initcap(c.kind),
       jsonb_build_object('title', c.title, 'kind', c.kind, 'percent', c.percent), c.issued_at
  from public.certificates c
on conflict (source, ref) do nothing;

insert into public.learner_events (profile_id, kind, source, ref, summary, data, at)
select p.id, 'goal', 'profiles.goals', p.id::text || ':initial',
       'Goals · ' || (select string_agg(g, ', ') from jsonb_array_elements_text(p.goals) g),
       jsonb_build_object('goals', p.goals), u.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
 where jsonb_typeof(p.goals) = 'array' and jsonb_array_length(p.goals) > 0
on conflict (source, ref) do nothing;

-- ---------------------------------------------------------------------------
-- 7. Reading it: staff with the Students section, one student at a time
-- ---------------------------------------------------------------------------
create or replace function public.admin_learner_events(p_student uuid, p_limit int default 300)
returns table (at timestamptz, kind text, summary text, data jsonb)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('users') then
    raise exception 'Not authorised.';
  end if;
  return query
  select e.at, e.kind, e.summary, e.data
    from public.learner_events e
   where e.profile_id = p_student
   order by e.at desc
   limit least(coalesce(p_limit, 300), 1000);
end;
$$;
revoke execute on function public.admin_learner_events(uuid, int) from public, anon;
grant execute on function public.admin_learner_events(uuid, int) to authenticated;

-- Topics a student keeps missing, across practice and the Foundation.
create or replace function public.admin_learner_topics(p_student uuid)
returns table (source text, track text, topic text, missed int, answered int)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_section_access('users') then
    raise exception 'Not authorised.';
  end if;
  return query
  select 'practice'::text, a.track_slug, coalesce(k.competency, a.question_id),
         (count(*) filter (where not a.correct))::int, count(*)::int
    from public.practice_answers a
    left join public.decision_lab_answer_key k on k.question_id = a.question_id
   where a.profile_id = p_student
   group by a.track_slug, coalesce(k.competency, a.question_id)
  union all
  select 'foundation'::text, null::text, f.category,
         (count(*) filter (where not f.correct))::int, count(*)::int
    from public.foundation_answers f
   where f.profile_id = p_student
   group by f.category
   order by 4 desc, 5 desc;
end;
$$;
revoke execute on function public.admin_learner_topics(uuid) from public, anon;
grant execute on function public.admin_learner_topics(uuid) to authenticated;

notify pgrst, 'reload schema';
