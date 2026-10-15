-- Practice scores that mean what they say.
--
-- WHAT WAS WRONG
--   In the Decision Labs answer key, 87 of the 100 right answers were the
--   second option ("B"). Always picking B scored 88% overall, and 100% on five
--   of the eight tracks, and those scores feed the Career Readiness Score that
--   companies now see. The Foundation assessment leaned the same way, less
--   strongly. A track could also be retaken straight away, with the same
--   questions in the same order, right after the review showed the answers.
--
-- WHAT THIS DOES
--   1. Moves each Practice answer to an evenly spread position (A-D). The
--      option texts move in the app in the same release, so the two match.
--      Always picking one letter now scores about a quarter.
--   2. Grades only the new version of Practice (the app sends p_version = 2),
--      so a browser still on the old page can't be graded against the new
--      positions: it is asked to refresh instead.
--   3. A track can be taken once a day: a new attempt opens 24 hours after the
--      last one. The score is still the best of the last three attempts.
--      (The app also shuffles the questions and the options on every attempt.)
--   4. Spreads the Foundation assessment's answers the same way, in the
--      database, where its questions live. A question whose options include
--      "All of the above" or "None of the above" is left as it is.
--
--   Scores already earned are not changed: past attempts store only their
--   percentage, not the answers, so they can't be regraded.
--
-- ORDER: DEPLOY FIRST, then run this straight away. Between the two, a student
-- submitting Practice is told to try again in a moment; nobody is graded
-- wrongly. Safe to re-run.
-- Depends on: docs/supabase-practice-server-grading.sql,
-- docs/supabase-server-side-grading.sql.

-- ---------------------------------------------------------------------------
-- 1. Practice: the new answer positions
-- ---------------------------------------------------------------------------
do $$
declare
  v_bad int;
begin
  create temp table _moves (question_id text primary key, old_index int, new_index int) on commit drop;
  insert into _moves values
    ('ANA-S001', 1, 0),
    ('ANA-S002', 1, 2),
    ('ANA-S003', 1, 3),
    ('ANA-S004', 1, 3),
    ('ANA-S005', 1, 1),
    ('ANA-S006', 1, 2),
    ('ANA-S007', 1, 1),
    ('ANA-S008', 1, 3),
    ('ANA-S009', 1, 0),
    ('ANA-S010', 1, 1),
    ('CM-S001', 1, 1),
    ('CM-S002', 1, 0),
    ('CM-S003', 1, 0),
    ('CM-S004', 1, 3),
    ('CM-S005', 1, 1),
    ('CM-S006', 1, 3),
    ('CM-S007', 1, 2),
    ('CM-S008', 1, 2),
    ('CM-S009', 1, 2),
    ('CM-S010', 1, 3),
    ('GA-S001', 1, 1),
    ('GA-S002', 2, 0),
    ('GA-S003', 1, 3),
    ('GA-S004', 0, 0),
    ('GA-S005', 1, 2),
    ('GA-S006', 0, 0),
    ('GA-S007', 1, 2),
    ('GA-S008', 1, 0),
    ('GA-S009', 1, 2),
    ('GA-S010', 1, 1),
    ('GA-S011', 1, 2),
    ('GA-S012', 0, 3),
    ('GA-S013', 1, 3),
    ('GA-S014', 0, 1),
    ('GA-S015', 1, 3),
    ('MAI-S001', 1, 1),
    ('MAI-S002', 1, 2),
    ('MAI-S003', 1, 0),
    ('MAI-S004', 1, 0),
    ('MAI-S005', 1, 0),
    ('MAI-S006', 1, 2),
    ('MAI-S007', 1, 3),
    ('MAI-S008', 1, 0),
    ('MAI-S009', 1, 3),
    ('MAI-S010', 1, 1),
    ('MAI-S011', 1, 2),
    ('MAI-S012', 1, 3),
    ('MAI-S013', 1, 1),
    ('MAI-S014', 1, 1),
    ('MAI-S015', 1, 2),
    ('META-S001', 2, 2),
    ('META-S002', 1, 1),
    ('META-S003', 1, 3),
    ('META-S004', 1, 2),
    ('META-S005', 1, 3),
    ('META-S006', 0, 3),
    ('META-S007', 1, 1),
    ('META-S008', 0, 0),
    ('META-S009', 1, 2),
    ('META-S010', 1, 0),
    ('META-S011', 0, 0),
    ('META-S012', 0, 0),
    ('META-S013', 1, 3),
    ('META-S014', 0, 2),
    ('META-S015', 1, 1),
    ('MF-S001', 2, 0),
    ('MF-S002', 1, 0),
    ('MF-S003', 2, 2),
    ('MF-S004', 1, 1),
    ('MF-S005', 1, 3),
    ('MF-S006', 1, 1),
    ('MF-S007', 1, 0),
    ('MF-S008', 1, 2),
    ('MF-S009', 1, 3),
    ('MF-S010', 1, 3),
    ('MR-S001', 1, 1),
    ('MR-S002', 1, 0),
    ('MR-S003', 1, 2),
    ('MR-S004', 1, 1),
    ('MR-S005', 1, 2),
    ('MR-S006', 1, 0),
    ('MR-S007', 1, 3),
    ('MR-S008', 1, 3),
    ('MR-S009', 1, 2),
    ('MR-S010', 1, 0),
    ('SEO-S001', 1, 1),
    ('SEO-S002', 1, 2),
    ('SEO-S003', 1, 2),
    ('SEO-S004', 1, 1),
    ('SEO-S005', 1, 0),
    ('SEO-S006', 1, 0),
    ('SEO-S007', 1, 1),
    ('SEO-S008', 1, 0),
    ('SEO-S009', 1, 2),
    ('SEO-S010', 1, 2),
    ('SEO-S011', 1, 3),
    ('SEO-S012', 1, 1),
    ('SEO-S013', 1, 3),
    ('SEO-S014', 1, 3),
    ('SEO-S015', 1, 0);

  -- Every key row must be at its old position or (re-run) its new one. Anything
  -- else means the live key isn't the one the app's options were moved from:
  -- change nothing rather than mismatch them.
  select count(*) into v_bad
    from _moves m
    left join public.decision_lab_answer_key k on k.question_id = m.question_id
   where k.correct_index is null or k.correct_index not in (m.old_index, m.new_index);
  if v_bad > 0 then
    raise exception 'The live Practice answer key differs from the expected one in % questions; nothing was changed.', v_bad;
  end if;

  update public.decision_lab_answer_key k
     set correct_index = m.new_index
    from _moves m
   where k.question_id = m.question_id and k.correct_index = m.old_index and m.old_index <> m.new_index;
end $$;

-- ---------------------------------------------------------------------------
-- 2 and 3. Grading: the new version only, and once a day per track
-- ---------------------------------------------------------------------------
drop function if exists public.submit_practice_attempt(text, jsonb);

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
    select k.question_id, k.weight, k.correct_index, k.why_correct, k.why_others_wrong, k.learning_outcome
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
    end if;

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
  values (uid, p_track, v_correct, v_total, v_earned, v_max, v_percent, true);

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

-- ---------------------------------------------------------------------------
-- 4. The Foundation assessment: answers spread across A-D
-- Each question's right option moves to a position that cycles A, D, C, B in
-- question order; the other options keep their order. Questions and key are
-- changed together, so they always match. Re-running moves nothing new.
-- ---------------------------------------------------------------------------
do $$
declare
  q record;
  v_target int;
  v_others text[];
begin
  for q in
    select x.id, x.options, k.correct_index,
           row_number() over (order by x.sort_order, x.id) as rn
      from public.initial_assessment_questions x
      join public.initial_assessment_answer_key k on k.question_id = x.id
     where cardinality(x.options) = 4
       and k.correct_index between 0 and 3
       and not exists (select 1 from unnest(x.options) o where o ilike '%of the above%')
  loop
    v_target := ((q.rn * 3) + 1) % 4;
    continue when v_target = q.correct_index;
    -- The other three, in their order, without the right one.
    select array_agg(o order by i) into v_others
      from unnest(q.options) with ordinality as t(o, i)
     where i <> q.correct_index + 1;
    update public.initial_assessment_questions
       set options = v_others[1:v_target] || q.options[q.correct_index + 1] || v_others[v_target + 1:3]
     where id = q.id;
    update public.initial_assessment_answer_key
       set correct_index = v_target
     where question_id = q.id;
  end loop;
end $$;

-- Where the right answers now sit: Practice, then Foundation (0 = A ... 3 = D).
select 'practice' as assessment, correct_index as position, count(*) as answers
  from public.decision_lab_answer_key group by 2
union all
select 'foundation', correct_index, count(*)
  from public.initial_assessment_answer_key group by 2
 order by 1, 2;
