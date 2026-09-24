-- Live chat: ask for an email instead of a city when queueing.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Follows docs/supabase-support-sessions-contact.sql, which added
-- contact_name / phone / city. The last question BotIntake asks in the
-- no-mentor-online branch is now the learner's email — the thing the team
-- can't follow up without — so it gets its own column.
--
-- support_sessions.city is left in place, unused: dropping a column that
-- may already hold rows from the previous release buys nothing.

alter table public.support_sessions add column if not exists email text
  check (email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

-- Same "someone is waiting" email as before, with an Email row. notify_row()
-- drops blank values, so a mentor-online session (no contact details) and an
-- older session that only has a city both still render correctly.
create or replace function public.notify_new_support_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  select p.full_name into v_name from public.profiles p where p.id = new.user_id;

  perform public.notify_email(
    format('[MySkills · Live chat] %s — someone is waiting now',
           coalesce(nullif(btrim(new.topic), ''), 'Support request')),
    public.notify_layout(
      'Someone is waiting in live chat',
      public.notify_row('Student', coalesce(nullif(btrim(new.contact_name), ''), v_name, 'A learner'))
      || public.notify_row('Topic', new.topic)
      || public.notify_row('Details', new.details)
      || public.notify_row('Email', new.email)
      || public.notify_row('Phone', new.phone)
      || public.notify_row('City', new.city),
      'Open the mentor queue',
      'https://myskills.org.in/mentor'
    )
  );
  return null;
end;
$$;
