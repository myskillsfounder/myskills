-- Course engine, step 2: students taking a programme.
--
--   enrol_programme             start a published programme; the student stays
--                               on that version even when a newer one is published
--   get_my_programme            the programme as this student sees it (no answers),
--                               with their aptitude result, answers, quizzes and final
--   submit_programme_aptitude   the aptitude test, scored per skill on the server
--   save_programme_response     a Practise task or the Reflect prompt (40 / 60
--                               characters at least, as in Global Leadership)
--   submit_programme_quiz       a module's quiz, graded on the server; once a day
--                               per module, as in Practice
--   submit_programme_final      the final assessment, once every module is done;
--                               a failed final can be retaken after 7 days
--   preview_programme           staff only: the draft, answers included, to try
--                               the student pages before publishing
--
-- A module is done when every Practise task and the reflection are written and
-- its quiz has been passed (60% or more). Every answer is kept, and each step
-- becomes a learner event (two new kinds: programme_quiz, programme_final).
-- No Global Readiness points (badge only until the scoring for several
-- programmes is decided); mentorship, project and certificate are step 3.
--
-- Run once, BEFORE the deploy (the new pages call these functions). Safe to
-- re-run. Depends on docs/supabase-course-engine.sql and
-- docs/supabase-learner-events.sql.

-- ---------------------------------------------------------------------------
-- 1. What students do
-- ---------------------------------------------------------------------------
create table if not exists public.programme_enrolments (
  student_id     uuid not null references auth.users (id) on delete cascade,
  programme_id   uuid not null references public.programmes (id) on delete cascade,
  version        int not null,
  started_at     timestamptz not null default now(),
  final_passed_at timestamptz,
  primary key (student_id, programme_id),
  foreign key (programme_id, version) references public.programme_versions (programme_id, version)
);
alter table public.programme_enrolments enable row level security;

create table if not exists public.programme_aptitude_results (
  student_id      uuid not null references auth.users (id) on delete cascade,
  programme_id    uuid not null references public.programmes (id) on delete cascade,
  version         int not null,
  answers         jsonb not null,
  scores          jsonb not null,
  previous_scores jsonb,
  completed_at    timestamptz not null default now(),
  primary key (student_id, programme_id)
);
alter table public.programme_aptitude_results enable row level security;

create table if not exists public.programme_responses (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references auth.users (id) on delete cascade,
  programme_id uuid not null references public.programmes (id) on delete cascade,
  version      int not null,
  module_id    text not null,
  item         text not null,
  response     text not null check (char_length(response) <= 4000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (student_id, programme_id, module_id, item)
);
alter table public.programme_responses enable row level security;

-- Quiz and final attempts; module_id 'final' is the final assessment.
create table if not exists public.programme_quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references auth.users (id) on delete cascade,
  programme_id uuid not null references public.programmes (id) on delete cascade,
  version      int not null,
  module_id    text not null,
  correct      int not null,
  total        int not null,
  earned       int not null,
  max_weight   int not null,
  percent      int not null,
  attempted_at timestamptz not null default now()
);
create index if not exists programme_quiz_attempts_student_idx
  on public.programme_quiz_attempts (student_id, programme_id, module_id, attempted_at desc);
alter table public.programme_quiz_attempts enable row level security;

create table if not exists public.programme_quiz_answers (
  attempt_id   uuid not null references public.programme_quiz_attempts (id) on delete cascade,
  student_id   uuid not null references auth.users (id) on delete cascade,
  programme_id uuid not null references public.programmes (id) on delete cascade,
  question_id  text not null,
  selected     int,
  correct      boolean not null,
  weight       int not null,
  topic        text,
  difficulty   text,
  answered_at  timestamptz not null default now(),
  primary key (attempt_id, question_id)
);
alter table public.programme_quiz_answers enable row level security;
-- No policies on any of these: everything goes through the functions below.

-- Two new kinds of learner event.
alter table public.learner_events drop constraint if exists learner_events_kind_check;
alter table public.learner_events add constraint learner_events_kind_check check (kind in (
  'aptitude', 'practice', 'foundation', 'module_answer', 'project', 'mentor',
  'live_session', 'internship', 'certificate', 'goal', 'programme_quiz', 'programme_final'));

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------
-- The published programme with this address, and (when signed in) this
-- student's enrolment; raises a plain message when there is none.
create or replace function public.programme_for_student(p_slug text, out programme public.programmes,
                                                         out enrolment public.programme_enrolments)
language plpgsql security definer set search_path = public stable as $$
begin
  select * into programme from public.programmes where slug = p_slug and status = 'published';
  if programme.id is null then
    raise exception 'That programme isn’t available.';
  end if;
  select * into enrolment from public.programme_enrolments
   where student_id = auth.uid() and programme_id = programme.id;
end $$;
revoke execute on function public.programme_for_student(text) from public, anon, authenticated;

create or replace function public.programme_version_content(p_programme uuid, p_version int) returns jsonb
language sql security definer set search_path = public stable as $$
  select content from public.programme_versions where programme_id = p_programme and version = p_version
$$;
revoke execute on function public.programme_version_content(uuid, int) from public, anon, authenticated;

-- A module is done: every task and the reflection written, and the quiz passed.
create or replace function public.programme_module_done(p_student uuid, p_programme uuid, p_module jsonb) returns boolean
language sql security definer set search_path = public stable as $$
  select
    (select count(*) from public.programme_responses r
      where r.student_id = p_student and r.programme_id = p_programme and r.module_id = p_module ->> 'id'
        and (r.item = 'reflect' or r.item in (select t ->> 'id' from jsonb_array_elements(coalesce(p_module -> 'tasks', '[]')) t)))
      >= coalesce(jsonb_array_length(p_module -> 'tasks'), 0) + 1
    and coalesce((select max(a.percent) from public.programme_quiz_attempts a
                   where a.student_id = p_student and a.programme_id = p_programme and a.module_id = p_module ->> 'id'), 0) >= 60
$$;
revoke execute on function public.programme_module_done(uuid, uuid, jsonb) from public, anon, authenticated;

-- Grade answers against a list of questions; returns the grade, the review,
-- every answer and the topics missed.
create or replace function public.programme_grade(p_questions jsonb, p_answers jsonb) returns jsonb
language plpgsql immutable as $$
declare
  q jsonb;
  v_sel int;
  v_ok boolean;
  v_total int := 0;
  v_correct int := 0;
  v_earned int := 0;
  v_max int := 0;
  v_w int;
  v_review jsonb := '{}'::jsonb;
  v_rows jsonb := '[]'::jsonb;
  v_missed jsonb := '[]'::jsonb;
begin
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Send your answers as an object of question id to option.';
  end if;
  for q in select x from jsonb_array_elements(coalesce(p_questions, '[]')) x loop
    v_total := v_total + 1;
    v_w := greatest(coalesce((q ->> 'weight')::int, 1), 1);
    v_max := v_max + v_w;
    if not (p_answers ? (q ->> 'id')) then
      raise exception 'Answer every question before submitting.';
    end if;
    begin
      v_sel := (p_answers ->> (q ->> 'id'))::int;
    exception when others then
      raise exception 'Answers must be option numbers.';
    end;
    v_ok := v_sel = (q ->> 'correct_index')::int;
    if v_ok then
      v_correct := v_correct + 1;
      v_earned := v_earned + v_w;
    else
      v_missed := v_missed || jsonb_build_array(jsonb_build_object(
        'question_id', q ->> 'id', 'topic', q ->> 'topic', 'difficulty', q ->> 'difficulty'));
    end if;
    v_rows := v_rows || jsonb_build_array(jsonb_build_object(
      'question_id', q ->> 'id', 'selected', v_sel, 'correct', v_ok, 'weight', v_w,
      'topic', q ->> 'topic', 'difficulty', q ->> 'difficulty'));
    v_review := v_review || jsonb_build_object(q ->> 'id', jsonb_build_object(
      'correctIndex', (q ->> 'correct_index')::int, 'explanation', q ->> 'explanation'));
  end loop;
  if v_total = 0 then
    raise exception 'There are no questions here yet.';
  end if;
  return jsonb_build_object(
    'grade', jsonb_build_object('correct', v_correct, 'total', v_total, 'earnedWeight', v_earned, 'maxWeight', v_max,
                                'percent', round(v_earned::numeric / v_max * 100)::int),
    'review', v_review, 'rows', v_rows, 'missed', v_missed);
end $$;

-- ---------------------------------------------------------------------------
-- 3. Starting, and reading the programme as a student
-- ---------------------------------------------------------------------------
create or replace function public.enrol_programme(p_slug text) returns int
language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  if auth.uid() is null then
    raise exception 'Sign in to start a programme.';
  end if;
  select * into r from public.programme_for_student(p_slug);
  if (r.enrolment).student_id is not null then
    return (r.enrolment).version;
  end if;
  insert into public.programme_enrolments (student_id, programme_id, version)
  values (auth.uid(), (r.programme).id, (r.programme).current_version);
  return (r.programme).current_version;
end $$;

create or replace function public.get_my_programme(p_slug text) returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare
  r record;
  uid uuid := auth.uid();
  v_version int;
  v_content jsonb;
begin
  select * into r from public.programme_for_student(p_slug);
  v_version := coalesce((r.enrolment).version, (r.programme).current_version);
  v_content := public.programme_version_content((r.programme).id, v_version);
  return jsonb_build_object(
    'slug', (r.programme).slug, 'title', (r.programme).title, 'kind', (r.programme).kind,
    'version', v_version, 'latest_version', (r.programme).current_version,
    'enrolled', (r.enrolment).student_id is not null,
    'started_at', (r.enrolment).started_at,
    'content', public.programme_public_content(v_content),
    'aptitude', (select jsonb_build_object('scores', a.scores, 'completed_at', a.completed_at)
                   from public.programme_aptitude_results a where a.student_id = uid and a.programme_id = (r.programme).id),
    'responses', coalesce((select jsonb_object_agg(x.module_id, x.items) from (
                   select pr.module_id, jsonb_object_agg(pr.item, pr.response) as items
                     from public.programme_responses pr
                    where pr.student_id = uid and pr.programme_id = (r.programme).id
                    group by pr.module_id) x), '{}'::jsonb),
    'quizzes', coalesce((select jsonb_object_agg(x.module_id, jsonb_build_object(
                   'best', x.best, 'attempts', x.n, 'last_at', x.last_at,
                   'next_at', x.last_at + interval '24 hours'))
                   from (select a.module_id, max(a.percent) as best, count(*) as n, max(a.attempted_at) as last_at
                           from public.programme_quiz_attempts a
                          where a.student_id = uid and a.programme_id = (r.programme).id and a.module_id <> 'final'
                          group by a.module_id) x), '{}'::jsonb),
    'final', (select jsonb_build_object('percent', a.percent, 'correct', a.correct, 'total', a.total,
                       'passed', a.percent >= coalesce((v_content #>> '{final,pass_percent}')::int, 60),
                       'completed_at', a.attempted_at, 'next_at', a.attempted_at + interval '7 days')
                from public.programme_quiz_attempts a
               where a.student_id = uid and a.programme_id = (r.programme).id and a.module_id = 'final'
               order by a.attempted_at desc limit 1),
    'final_passed_at', (r.enrolment).final_passed_at);
end $$;

-- ---------------------------------------------------------------------------
-- 4. Doing it
-- ---------------------------------------------------------------------------
create or replace function public.submit_programme_aptitude(p_slug text, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_content jsonb;
  it jsonb;
  v_val int;
  v_scores jsonb := '{}'::jsonb;
  s jsonb;
  v_sum numeric;
  v_n int;
  v_pct int;
begin
  select * into r from public.programme_for_student(p_slug);
  if (r.enrolment).student_id is null then
    raise exception 'Start the programme first.';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Send your answers as an object of statement id to 1-4.';
  end if;
  v_content := public.programme_version_content((r.programme).id, (r.enrolment).version);

  for s in select x from jsonb_array_elements(coalesce(v_content -> 'skills', '[]')) x loop
    v_sum := 0;
    v_n := 0;
    for it in select x from jsonb_array_elements(coalesce(v_content #> '{aptitude,items}', '[]')) x where x ->> 'skill' = s ->> 'id' loop
      begin
        v_val := (p_answers ->> (it ->> 'id'))::int;
      exception when others then
        v_val := null;
      end;
      if v_val is null or v_val < 1 or v_val > 4 then
        raise exception 'Rate every statement before submitting.';
      end if;
      -- A reversed statement: agreeing with it means the skill is weaker.
      if coalesce((it ->> 'reverse')::boolean, false) then
        v_val := 5 - v_val;
      end if;
      v_sum := v_sum + v_val;
      v_n := v_n + 1;
    end loop;
    if v_n > 0 then
      v_pct := round((v_sum / v_n - 1) / 3 * 100);
      v_scores := v_scores || jsonb_build_object(s ->> 'id', jsonb_build_object(
        'percent', v_pct,
        'level', case when v_pct >= 70 then 'strong' when v_pct >= 40 then 'developing' else 'starting' end));
    end if;
  end loop;

  insert into public.programme_aptitude_results (student_id, programme_id, version, answers, scores)
  values (auth.uid(), (r.programme).id, (r.enrolment).version, p_answers, v_scores)
  on conflict (student_id, programme_id) do update
     set previous_scores = public.programme_aptitude_results.scores, answers = excluded.answers,
         scores = excluded.scores, version = excluded.version, completed_at = now();

  perform public.record_learner_event(
    auth.uid(), 'aptitude', 'programme_aptitude_results', auth.uid()::text || ':' || (r.programme).id::text || ':' || now()::text,
    'Aptitude · ' || (r.programme).title,
    jsonb_build_object('programme', (r.programme).slug, 'scores', v_scores));
  return v_scores;
end $$;

create or replace function public.save_programme_response(p_slug text, p_module text, p_item text, p_response text) returns void
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_module jsonb;
  v_min int := case when p_item = 'reflect' then 60 else 40 end;
  v_text text := btrim(coalesce(p_response, ''));
  v_id uuid;
  v_task jsonb;
begin
  select * into r from public.programme_for_student(p_slug);
  if (r.enrolment).student_id is null then
    raise exception 'Start the programme first.';
  end if;
  select m into v_module
    from jsonb_array_elements(public.programme_version_content((r.programme).id, (r.enrolment).version) -> 'modules') m
   where m ->> 'id' = p_module;
  if v_module is null then
    raise exception 'That module isn’t part of this programme.';
  end if;
  select t into v_task from jsonb_array_elements(coalesce(v_module -> 'tasks', '[]')) t where t ->> 'id' = p_item;
  if p_item <> 'reflect' and v_task is null then
    raise exception 'That task isn’t part of this module.';
  end if;
  if char_length(v_text) < v_min then
    raise exception 'Write at least % characters.', v_min;
  end if;
  if char_length(v_text) > 4000 then
    raise exception 'Keep it under 4,000 characters.';
  end if;

  insert into public.programme_responses (student_id, programme_id, version, module_id, item, response)
  values (auth.uid(), (r.programme).id, (r.enrolment).version, p_module, p_item, v_text)
  on conflict (student_id, programme_id, module_id, item) do update
     set response = excluded.response, updated_at = now()
  returning id into v_id;

  perform public.record_learner_event(
    auth.uid(), 'module_answer', 'programme_responses', v_id::text,
    (r.programme).title || ' · ' || coalesce(v_module ->> 'title', p_module) || ' · '
      || case when p_item = 'reflect' then 'reflection' else coalesce(nullif(v_task ->> 'title', ''), 'task') end,
    jsonb_build_object('programme', (r.programme).slug, 'module', p_module, 'item', p_item,
                       'chars', char_length(v_text), 'private', false, 'response', v_text));
end $$;

create or replace function public.submit_programme_quiz(p_slug text, p_module text, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_module jsonb;
  v_last timestamptz;
  g jsonb;
  v_attempt uuid;
begin
  select * into r from public.programme_for_student(p_slug);
  if (r.enrolment).student_id is null then
    raise exception 'Start the programme first.';
  end if;
  select m into v_module
    from jsonb_array_elements(public.programme_version_content((r.programme).id, (r.enrolment).version) -> 'modules') m
   where m ->> 'id' = p_module;
  if v_module is null then
    raise exception 'That module isn’t part of this programme.';
  end if;
  -- Once a day per module: a retake straight after the review would test memory, not the skill.
  select max(attempted_at) into v_last from public.programme_quiz_attempts
   where student_id = auth.uid() and programme_id = (r.programme).id and module_id = p_module;
  if v_last is not null and v_last > now() - interval '24 hours' then
    raise exception 'You can take this quiz again after %.',
      to_char((v_last + interval '24 hours') at time zone 'Asia/Kolkata', 'FMDD Mon, HH12:MI AM') || ' IST';
  end if;

  g := public.programme_grade(v_module -> 'quiz', p_answers);
  insert into public.programme_quiz_attempts (student_id, programme_id, version, module_id, correct, total, earned, max_weight, percent)
  values (auth.uid(), (r.programme).id, (r.enrolment).version, p_module,
          (g #>> '{grade,correct}')::int, (g #>> '{grade,total}')::int, (g #>> '{grade,earnedWeight}')::int,
          (g #>> '{grade,maxWeight}')::int, (g #>> '{grade,percent}')::int)
  returning id into v_attempt;
  insert into public.programme_quiz_answers (attempt_id, student_id, programme_id, question_id, selected, correct, weight, topic, difficulty)
  select v_attempt, auth.uid(), (r.programme).id, a.question_id, a.selected, a.correct, a.weight, a.topic, a.difficulty
    from jsonb_to_recordset(g -> 'rows') as a (question_id text, selected int, correct boolean, weight int, topic text, difficulty text);

  perform public.record_learner_event(
    auth.uid(), 'programme_quiz', 'programme_quiz_attempts', v_attempt::text,
    'Quiz · ' || (r.programme).title || ' · ' || coalesce(v_module ->> 'title', p_module) || ' · ' || (g #>> '{grade,percent}') || '%'
      || case when jsonb_array_length(g -> 'missed') > 0 then
           ' · missed: ' || (select string_agg(distinct coalesce(nullif(m ->> 'topic', ''), m ->> 'question_id'), ', ') from jsonb_array_elements(g -> 'missed') m)
         else '' end,
    jsonb_build_object('programme', (r.programme).slug, 'module', p_module, 'percent', (g #>> '{grade,percent}')::int,
                       'correct', (g #>> '{grade,correct}')::int, 'total', (g #>> '{grade,total}')::int, 'missed', g -> 'missed'));
  return jsonb_build_object('grade', g -> 'grade', 'review', g -> 'review');
end $$;

create or replace function public.submit_programme_final(p_slug text, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_content jsonb;
  v_last record;
  m jsonb;
  g jsonb;
  v_attempt uuid;
  v_pass int;
  v_passed boolean;
begin
  select * into r from public.programme_for_student(p_slug);
  if (r.enrolment).student_id is null then
    raise exception 'Start the programme first.';
  end if;
  v_content := public.programme_version_content((r.programme).id, (r.enrolment).version);
  v_pass := coalesce((v_content #>> '{final,pass_percent}')::int, 60);

  -- Every module first.
  for m in select x from jsonb_array_elements(coalesce(v_content -> 'modules', '[]')) x loop
    if not public.programme_module_done(auth.uid(), (r.programme).id, m) then
      raise exception 'Finish every module first: “%” isn’t done yet.', m ->> 'title';
    end if;
  end loop;
  -- Once passed, it's done; a failed final can be taken again after 7 days.
  select a.attempted_at, a.percent into v_last from public.programme_quiz_attempts a
   where a.student_id = auth.uid() and a.programme_id = (r.programme).id and a.module_id = 'final'
   order by a.attempted_at desc limit 1;
  if v_last.attempted_at is not null then
    if v_last.percent >= v_pass then
      raise exception 'You’ve already passed the final assessment.';
    end if;
    if v_last.attempted_at > now() - interval '7 days' then
      raise exception 'You can take the final assessment again after %.',
        to_char((v_last.attempted_at + interval '7 days') at time zone 'Asia/Kolkata', 'FMDD Mon') ;
    end if;
  end if;

  g := public.programme_grade(v_content #> '{final,questions}', p_answers);
  v_passed := (g #>> '{grade,percent}')::int >= v_pass;
  insert into public.programme_quiz_attempts (student_id, programme_id, version, module_id, correct, total, earned, max_weight, percent)
  values (auth.uid(), (r.programme).id, (r.enrolment).version, 'final',
          (g #>> '{grade,correct}')::int, (g #>> '{grade,total}')::int, (g #>> '{grade,earnedWeight}')::int,
          (g #>> '{grade,maxWeight}')::int, (g #>> '{grade,percent}')::int)
  returning id into v_attempt;
  insert into public.programme_quiz_answers (attempt_id, student_id, programme_id, question_id, selected, correct, weight, topic, difficulty)
  select v_attempt, auth.uid(), (r.programme).id, a.question_id, a.selected, a.correct, a.weight, a.topic, a.difficulty
    from jsonb_to_recordset(g -> 'rows') as a (question_id text, selected int, correct boolean, weight int, topic text, difficulty text);
  if v_passed then
    update public.programme_enrolments set final_passed_at = now()
     where student_id = auth.uid() and programme_id = (r.programme).id;
  end if;

  perform public.record_learner_event(
    auth.uid(), 'programme_final', 'programme_quiz_attempts', v_attempt::text,
    'Final assessment · ' || (r.programme).title || ' · ' || (g #>> '{grade,percent}') || '%' || case when v_passed then ' · passed' else '' end,
    jsonb_build_object('programme', (r.programme).slug, 'percent', (g #>> '{grade,percent}')::int, 'passed', v_passed,
                       'correct', (g #>> '{grade,correct}')::int, 'total', (g #>> '{grade,total}')::int, 'missed', g -> 'missed'));
  return jsonb_build_object('grade', g -> 'grade', 'review', g -> 'review', 'passed', v_passed, 'pass_percent', v_pass);
end $$;

-- Staff: the draft (or the live version), answers included, to try the pages.
create or replace function public.preview_programme(p_slug text) returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare
  p public.programmes;
  v public.programme_versions;
begin
  if not public.has_section_access('programmes') then
    raise exception 'Not authorised.';
  end if;
  select * into p from public.programmes where slug = p_slug;
  if p.id is null then
    raise exception 'That programme doesn’t exist.';
  end if;
  select * into v from public.programme_versions
   where programme_id = p.id and status in ('draft', 'published') order by status = 'draft' desc limit 1;
  return jsonb_build_object('slug', p.slug, 'title', p.title, 'kind', p.kind, 'version', v.version,
                            'status', v.status, 'content', v.content);
end $$;

revoke execute on function public.enrol_programme(text) from public, anon;
revoke execute on function public.get_my_programme(text) from public, anon;
revoke execute on function public.submit_programme_aptitude(text, jsonb) from public, anon;
revoke execute on function public.save_programme_response(text, text, text, text) from public, anon;
revoke execute on function public.submit_programme_quiz(text, text, jsonb) from public, anon;
revoke execute on function public.submit_programme_final(text, jsonb) from public, anon;
revoke execute on function public.preview_programme(text) from public, anon;
revoke execute on function public.programme_grade(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.enrol_programme(text) to authenticated;
grant execute on function public.get_my_programme(text) to authenticated;
grant execute on function public.submit_programme_aptitude(text, jsonb) to authenticated;
grant execute on function public.save_programme_response(text, text, text, text) to authenticated;
grant execute on function public.submit_programme_quiz(text, text, jsonb) to authenticated;
grant execute on function public.submit_programme_final(text, jsonb) to authenticated;
grant execute on function public.preview_programme(text) to authenticated;

notify pgrst, 'reload schema';
