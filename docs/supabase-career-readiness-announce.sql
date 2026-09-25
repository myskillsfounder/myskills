-- One-time email to everyone who asked to hear when the Career Readiness
-- Programme opens: "it's open — start your first module".
--
-- Run once against Supabase Cloud (SQL editor). Safe to re-run: the sender
-- remembers who it has already emailed, so nobody gets it twice.
-- Depends on: docs/supabase-email-notifications.sql (notify_* helpers and the
-- Resend key in the vault), docs/supabase-career-readiness-leads*.sql and
-- docs/supabase-programme-interest.sql (the two waitlists).
--
-- WHO GETS IT
--   Everyone on either waitlist with an email address: signed-in learners who
--   pressed "Register your interest" (programme_interest) and visitors who
--   left name/phone/email on the waitlist form (career_readiness_leads —
--   older rows with only a phone and city have no email and are skipped, so
--   call those). Each address once, whichever list(s) it is on.
--
-- HOW TO RUN IT (in this order)
--   1. Run this whole file once. It only creates things; nothing is sent.
--   2. Who would get it, and how many:
--        select * from public.career_readiness_announce_recipients();
--   3. Send yourself the email to read it as a student would (sends ONE mail,
--      to the team address, and records nobody):
--        select public.announce_career_readiness_live();
--   4. Send it for real (up to 100 addresses per call, in one request to Resend):
--        select public.announce_career_readiness_live(false);
--      More than 100 waiting? Run it again until it reports 0 left.
--   5. Check Resend accepted it:
--        select status_code, content from net._http_response order by created desc limit 3;
--      Anything other than 200 means nothing was sent for that batch — undo
--      the record so it can be retried:
--        delete from public.career_readiness_announcements
--         where sent_at > now() - interval '15 minutes';

create table if not exists public.career_readiness_announcements (
  email   text primary key,
  sent_at timestamptz not null default now()
);

-- Only the sender below touches it; nobody reads it through the API.
alter table public.career_readiness_announcements enable row level security;

-- Who is still to be told: both waitlists, one row per address, minus anyone
-- already emailed.
create or replace function public.career_readiness_announce_recipients()
returns table (email text, full_name text)
language sql
security definer
set search_path = public
stable
as $$
  select distinct on (lower(w.email)) lower(w.email) as email, w.full_name
    from (
      select pi.email, pi.full_name from public.programme_interest pi
      union all
      select l.email, l.full_name from public.career_readiness_leads l where l.email is not null
    ) w
   where w.email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     and not exists (
       select 1 from public.career_readiness_announcements a where a.email = lower(w.email)
     )
   order by lower(w.email);
$$;

create or replace function public.announce_career_readiness_live(
  p_test  boolean default true,
  p_limit int     default 100
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key     text;
  v_subject constant text := 'The Career Readiness Programme is open — start your first module';
  v_sent    int;
  v_left    int;
  v_body    jsonb;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if v_key is null or btrim(v_key) = '' then
    return 'No resend_api_key in the vault — nothing sent. See docs/supabase-email-notifications.sql, step 1.';
  end if;

  -- One email per person, addressed only to them (never a shared To list).
  -- The greeting uses the first name they gave us; the copy names no price,
  -- date or outcome.
  select coalesce(jsonb_agg(jsonb_build_object(
           'from', public.notify_email_from(),
           'to', jsonb_build_array(r.email),
           'subject', v_subject,
           'html',
             '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f7f5f2;padding:24px">'
             || '<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e2da;border-radius:16px;padding:28px">'
             || '<h1 style="margin:0 0 16px;font-size:21px;color:#1c1917">It''s open — the Career Readiness Programme</h1>'
             || '<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1c1917">Hi '
             || public.notify_esc(coalesce(nullif(split_part(btrim(r.full_name), ' ', 1), ''), 'there')) || ',</p>'
             || '<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1c1917">You asked us to tell you when the '
             || 'Career Readiness Programme opened. It has.</p>'
             || '<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1c1917">There are five short modules — goal setting, '
             || 'communication, leadership, agile ways of working and a growth mindset. In each one you learn the idea, practise it '
             || 'in writing, then reflect. Together it is about four hours, at your own pace.</p>'
             || '<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1c1917">When you have finished all five, you can ask a '
             || 'mentor to read your work and give you honest feedback.</p>'
             || '<a href="https://myskills.org.in/career-readiness" style="display:inline-block;margin-top:8px;background:#5b4bd6;'
             || 'color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:10px">Start the first module</a>'
             || '<p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#8a8175">You are getting this once because you asked to be '
             || 'told when the programme opened. — The MySkills team</p>'
             || '</div></div>'
         )), '[]'::jsonb)
    into v_body
    from (
      select * from (
        select t.email, t.full_name
          from public.career_readiness_announce_recipients() t
         limit greatest(p_limit, 1)
      ) picked
      where not p_test
      union all
      select public.notify_email_to(), 'there'
       where p_test
    ) r;

  v_sent := jsonb_array_length(v_body);
  if v_sent = 0 then
    return 'Nobody left to email.';
  end if;

  -- One request for the whole batch: Resend's batch endpoint takes up to 100
  -- messages, and a single call can't trip the per-second rate limit.
  perform net.http_post(
    url := 'https://api.resend.com/emails/batch',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := v_body
  );

  if p_test then
    return 'Test queued: 1 email to ' || public.notify_email_to() || '. Nothing was recorded.';
  end if;

  insert into public.career_readiness_announcements (email)
  select (e ->> 'to')::jsonb ->> 0 from jsonb_array_elements(v_body) e
  on conflict (email) do nothing;

  select count(*) into v_left from public.career_readiness_announce_recipients();
  return format('Queued %s email(s). %s still waiting — check Resend accepted the batch (step 5 in the file header), then run again if any are left.',
                v_sent, v_left);
end;
$$;

-- Plain functions are otherwise callable through the API — this one sends mail
-- from your Resend account, so only the SQL editor (postgres) may run it.
revoke execute on function public.career_readiness_announce_recipients() from public, anon, authenticated;
revoke execute on function public.announce_career_readiness_live(boolean, int) from public, anon, authenticated;
