-- ---------------------------------------------------------------------------
-- Practice: a four-question round inside a topic (Paul, 18 Nov 2026).
--
-- The Decision Lab asks every question of a track (10-15). A topic page now offers
-- a short round of FOUR, graded on the server like the full lab, so the answers
-- are never in the browser. The server, not the student, picks which four:
--   * one question from each difficulty first, then more to make four,
--   * the same four all day for one student and track (so a refresh doesn't
--     change them), different the next day.
-- A round is an ordinary attempt: it counts against the once-a-day rule, it is
-- kept in practice_attempts and practice_answers, and a learner event is made.
-- A track's score is still the best of the last three attempts.
--
-- Needs docs/supabase-learner-events.sql (the difficulty column and the answer
-- tables) to have been run. Safe to run again. RUN THIS BEFORE DEPLOYING the page
-- that uses it; until it is run, the topic page offers the full Decision Lab.
-- ---------------------------------------------------------------------------

-- The four questions for one student, track and day.
create or replace function public.practice_round_pick(p_uid uuid, p_track text, p_day date)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(t.question_id order by t.rk, t.h), '{}'::text[])
    from (
      select question_id,
             row_number() over (partition by coalesce(difficulty, '') order by md5(p_uid::text || p_day::text || question_id)) as rk,
             md5(p_uid::text || p_day::text || question_id) as h
        from public.decision_lab_answer_key
       where track_slug = p_track
       order by 2, 3
       limit 4
    ) t
$$;
revoke execute on function public.practice_round_pick(uuid, text, date) from public, anon, authenticated;

-- What the page asks for: today's four question ids.
create or replace function public.practice_round_ids(p_track text)
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'You are not signed in.';
  end if;
  return public.practice_round_pick(uid, p_track, (now() at time zone 'Asia/Kolkata')::date);
end;
$$;
revoke execute on function public.practice_round_ids(text) from public, anon;
grant execute on function public.practice_round_ids(text) to authenticated;

-- Grade a round. p_ids are the four the page was given; they must be the server's
-- pick for today (or yesterday, if the round was started just before midnight).
create or replace function public.submit_practice_round(p_track text, p_ids text[], p_answers jsonb, p_version int)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_pick text[];
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
    raise exception 'Practice has been updated. Refresh the page, then try again.';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' or p_ids is null then
    raise exception 'Send your answers as an object of question id to option.';
  end if;

  -- The questions must be the ones the server picked, not ones the student chose.
  v_pick := public.practice_round_pick(uid, p_track, v_today);
  if not (v_pick @> p_ids and p_ids @> v_pick) then
    v_pick := public.practice_round_pick(uid, p_track, v_today - 1);
    if not (v_pick @> p_ids and p_ids @> v_pick) then
      raise exception 'These questions are out of date. Refresh the page, then try again.';
    end if;
  end if;

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
     where k.track_slug = p_track and k.question_id = any (v_pick)
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

  insert into public.practice_answers (attempt_id, profile_id, track_slug, question_id, selected, correct, weight)
  select v_attempt, uid, p_track, a.question_id, a.selected, a.correct, a.weight
    from jsonb_to_recordset(v_answers) as a (question_id text, selected int, correct boolean, weight int);

  perform public.record_learner_event(
    uid, 'practice', 'practice_attempts', v_attempt::text,
    'Practice round · ' || public.learner_label(p_track) || ' · ' || v_percent || '%'
      || case when jsonb_array_length(v_missed) > 0 then
           ' · missed: ' || (select string_agg(distinct m ->> 'competency', ', ') from jsonb_array_elements(v_missed) m)
         else '' end,
    jsonb_build_object('track', p_track, 'percent', v_percent, 'correct', v_correct, 'total', v_total,
                       'round', true, 'missed', v_missed));

  return json_build_object(
    'grade', json_build_object(
      'correct', v_correct, 'total', v_total,
      'earnedWeight', v_earned, 'maxWeight', v_max, 'percent', v_percent
    ),
    'review', v_review
  );
end;
$$;
revoke execute on function public.submit_practice_round(text, text[], jsonb, int) from public, anon;
grant execute on function public.submit_practice_round(text, text[], jsonb, int) to authenticated;

-- Make the API notice the new functions straight away. Without this, the page can
-- say "Could not find the function ... in the schema cache" for a minute or two.
notify pgrst, 'reload schema';

-- Check: today's four for you on one track (run while signed in through the app, not here).
--   select public.practice_round_ids('meta-ads');
