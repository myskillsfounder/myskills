-- Live chat: a queued request with contact details is a lead — email it as one.
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run.
-- Replaces notify_new_support_session() from
-- docs/supabase-support-sessions-email.sql; the trigger that calls it
-- (support_sessions_notify, docs/supabase-email-notifications.sql) is unchanged.
--
-- When no mentor is online, BotIntake (src/components/support/BotIntake.tsx)
-- asks the learner for a name, a phone number (optional) and an email before
-- it queues the request. That's someone asking for a mentor and leaving a way
-- to reach them — a lead — but the email it produced read like a chat alert
-- ("someone is waiting now"). Now:
--   * a request with contact details sends a LEAD email: who, how to reach
--     them, what they need, and a button that replies to them;
--   * a request made while a mentor is online (no contact details, an instant
--     connect) keeps the original "someone is waiting" chat alert.
-- Both go to the team address (notify_email_to()).

create or replace function public.notify_new_support_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name    text;
  v_account text;
  v_who     text;
  v_topic   text := coalesce(nullif(btrim(new.topic), ''), 'Mentor support');
  v_lead    boolean;
  v_cta_url text;
begin
  select p.full_name into v_name from public.profiles p where p.id = new.user_id;
  select u.email::text into v_account from auth.users u where u.id = new.user_id;

  v_who := coalesce(nullif(btrim(new.contact_name), ''), nullif(btrim(v_name), ''), 'A learner');
  v_lead := nullif(btrim(new.contact_name), '') is not null or nullif(btrim(new.email), '') is not null;

  if v_lead then
    -- The reply button is a mailto: built from what a stranger typed, and
    -- notify_layout puts the URL into the HTML as-is — so only a plainly
    -- well-formed address is used; anything else falls back to the queue.
    v_cta_url := case
      when new.email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        then 'mailto:' || new.email
      else 'https://myskills.org.in/mentor'
    end;

    perform public.notify_email(
      format('[MySkills · Lead] %s is looking for a mentor — %s', v_who, v_topic),
      public.notify_layout(
        'Someone is looking for a mentor',
        public.notify_row('Name', v_who)
        || public.notify_row('Email', new.email)
        || public.notify_row('Phone', new.phone)
        || public.notify_row('Needs help with', v_topic)
        || public.notify_row('Details', new.details)
        -- Only when it differs from the address they gave: their sign-in email.
        || public.notify_row('Account email', case when lower(v_account) is distinct from lower(new.email) then v_account end)
        || public.notify_row('Status', 'Waiting in the live-chat queue — no mentor was online'),
        case when v_cta_url like 'mailto:%' then 'Reply to ' || v_who else 'Open the mentor queue' end,
        v_cta_url
      )
    );
  else
    -- A mentor was online: an instant connect, no contact details collected.
    perform public.notify_email(
      format('[MySkills · Live chat] %s — someone is waiting now', v_topic),
      public.notify_layout(
        'Someone is waiting in live chat',
        public.notify_row('Student', v_who)
        || public.notify_row('Topic', new.topic)
        || public.notify_row('Details', new.details),
        'Open the mentor queue',
        'https://myskills.org.in/mentor'
      )
    );
  end if;

  return null;
end;
$$;

revoke execute on function public.notify_new_support_session() from public, anon, authenticated;
