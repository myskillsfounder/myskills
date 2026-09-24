-- Live chat: capture contact details when no mentor is online.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Depends on public.support_sessions (docs/supabase-schema.sql) and
-- notify_new_support_session() (docs/supabase-email-notifications.sql).
--
-- When a mentor is online, BotIntake (src/components/support/BotIntake.tsx)
-- connects the learner straight away — asking for contact details there
-- would just add friction to a chat that's about to start. When no mentor
-- is online, the request sits in a queue nobody may see soon, so the bot
-- now also asks for a name, phone and city before queueing, the same way
-- the Career Readiness and internship-partner lead forms do. These three
-- columns are nullable and only ever populated on that branch.

alter table public.support_sessions add column if not exists contact_name text
  check (contact_name is null or length(contact_name) <= 80);
alter table public.support_sessions add column if not exists phone text
  check (phone is null or length(phone) <= 32);
alter table public.support_sessions add column if not exists city text
  check (city is null or length(city) <= 80);

-- No RLS change needed: sessions_insert_own (WITH CHECK auth.uid() =
-- user_id) already covers whatever columns an insert sets, and
-- sessions_select already lets a mentor read every column of a 'waiting'
-- session, same trust boundary these three columns sit inside.

-- ---------------------------------------------------------------------------
-- Extend the existing "someone is waiting" email with the new columns.
-- notify_row() already drops a blank/null value instead of showing an empty
-- row, so a mentor-online session (contact_name/phone/city all still null)
-- renders exactly as it did before this migration.
-- ---------------------------------------------------------------------------
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
      || public.notify_row('Phone', new.phone)
      || public.notify_row('City', new.city),
      'Open the mentor queue',
      'https://myskills.org.in/mentor'
    )
  );
  return null;
end;
$$;

-- The trigger already points at this function by name (support_sessions_notify,
-- created in supabase-email-notifications.sql) — create or replace above is
-- enough, no need to touch the trigger itself.
