-- Email notifications for inbound community activity.
--
-- Sends Paul an email the moment someone submits a wellness request, applies
-- to mentor, applies to partner, asks for a demo, starts a live support chat,
-- or leaves feedback — so nothing sits unseen in /admin waiting to be noticed.
--
-- Run this once against Supabase Cloud (SQL editor), THEN set the API key
-- (step 1 below). Safe to re-run: every object is create-or-replace / drop-if-
-- exists.
--
-- HOW IT WORKS
--   pg_net fires an async HTTP POST to Resend's API from an AFTER INSERT
--   trigger. Async matters: the student's insert returns immediately and never
--   waits on an email, and every path here is wrapped so a broken email config
--   can NEVER roll back the row that triggered it. A student in distress
--   submitting a wellness request must always succeed, even if Resend is down.
--
-- ---------------------------------------------------------------------------
-- STEP 1 — store the Resend API key (run separately, with your real key)
-- ---------------------------------------------------------------------------
--   select vault.create_secret('re_YOUR_KEY_HERE', 'resend_api_key',
--                              'Resend API key for notification emails');
--
--   -- Already set once and rotating it later? Use this instead:
--   -- select vault.update_secret(
--   --   (select id from vault.secrets where name = 'resend_api_key'),
--   --   're_YOUR_NEW_KEY');
--
-- STEP 2 — send yourself a test:  select public.notify_email_test();
-- STEP 3 — check delivery:        select status_code, content
--                                   from net._http_response
--                                  order by created desc limit 5;
-- ---------------------------------------------------------------------------

create extension if not exists pg_net;

-- ---------------------------------------------------------------------------
-- Where mail comes from and goes to. Two one-line functions rather than
-- constants buried in the sender, so changing either is a single obvious edit.
--
-- FROM: myskills.org.in is verified in Resend (DNS at GoDaddy), so mail goes
-- out from our own domain and can reach any recipient. If that verification is
-- ever lost, Resend's shared 'onboarding@resend.dev' still works as a fallback,
-- but only delivers to the email that owns the Resend account.
-- ---------------------------------------------------------------------------
create or replace function public.notify_email_to()
returns text language sql immutable as $$
  select 'myskillsfounder@gmail.com'::text
$$;

create or replace function public.notify_email_from()
returns text language sql immutable as $$
  select 'MySkills <noreply@myskills.org.in>'::text
$$;

-- ---------------------------------------------------------------------------
-- Formatting helpers
-- ---------------------------------------------------------------------------

/** HTML-escape anything a stranger typed — names and messages go straight into
 *  the email body, and an unescaped '<' silently swallows the rest of it. */
create or replace function public.notify_esc(p text)
returns text language sql immutable as $$
  select replace(replace(replace(coalesce(p, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
$$;

/** One label/value line. Returns '' for blank values, so optional fields
 *  (phone, message) drop out of the email instead of showing as empty rows. */
create or replace function public.notify_row(p_label text, p_value text)
returns text language sql immutable as $$
  select case
    when p_value is null or btrim(p_value) = '' then ''
    else '<tr>'
      || '<td style="padding:6px 16px 6px 0;color:#6b6257;font-size:13px;vertical-align:top;white-space:nowrap">'
      || public.notify_esc(p_label)
      || '</td><td style="padding:6px 0;color:#1c1917;font-size:14px;vertical-align:top">'
      || public.notify_esc(p_value)
      || '</td></tr>'
  end
$$;

/** Shared shell so all five notifications look like one system. Inline styles
 *  only — every mail client strips <style> blocks. */
create or replace function public.notify_layout(
  p_heading   text,
  p_rows      text,
  p_cta_label text,
  p_cta_url   text
)
returns text language sql immutable as $$
  select '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;'
      || 'background:#f7f5f2;padding:24px">'
      || '<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e2da;'
      || 'border-radius:16px;padding:28px">'
      || '<h1 style="margin:0 0 4px;font-size:19px;color:#1c1917">' || public.notify_esc(p_heading) || '</h1>'
      || '<p style="margin:0 0 20px;font-size:13px;color:#8a8175">MySkills notification</p>'
      || '<table cellpadding="0" cellspacing="0" border="0">' || p_rows || '</table>'
      || '<a href="' || p_cta_url || '" style="display:inline-block;margin-top:24px;background:#5b4bd6;'
      || 'color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;'
      || 'border-radius:10px">' || public.notify_esc(p_cta_label) || '</a>'
      || '</div></div>'
$$;

-- ---------------------------------------------------------------------------
-- The sender
-- ---------------------------------------------------------------------------
create or replace function public.notify_email(p_subject text, p_html text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets
   where name = 'resend_api_key'
   limit 1;

  if v_key is null or btrim(v_key) = '' then
    raise warning 'notify_email: no resend_api_key in vault, skipping "%"', p_subject;
    return;
  end if;

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'from', public.notify_email_from(),
      'to', jsonb_build_array(public.notify_email_to()),
      'subject', p_subject,
      'html', p_html
    )
  );
exception when others then
  -- Deliberately swallowed. This runs inside the triggering transaction, so
  -- anything raised here would roll back the application/request the student
  -- just submitted. A missed email is recoverable; a lost request is not.
  raise warning 'notify_email failed for "%": %', p_subject, sqlerrm;
end;
$$;

/** Verify the whole pipeline without submitting a fake application. */
create or replace function public.notify_email_test()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_email(
    '[MySkills] Test notification',
    public.notify_layout(
      'Notifications are wired up',
      public.notify_row('Status', 'If you are reading this, the pipeline works end to end.')
      || public.notify_row('Sent at', to_char(now(), 'DD Mon YYYY, HH24:MI')),
      'Open admin',
      'https://myskills.org.in/admin'
    )
  );
  return 'Queued. Check ' || public.notify_email_to() || ' in a few seconds, then: '
      || 'select status_code, content from net._http_response order by created desc limit 5;';
end;
$$;

-- These are plain (non-trigger) functions, so PostgREST would otherwise expose
-- them as callable RPC endpoints — letting anyone with the anon key send mail
-- from your Resend account straight into your inbox. Triggers are unaffected:
-- they run as the definer (postgres), which owns these.
revoke execute on function public.notify_email(text, text) from public, anon, authenticated;
revoke execute on function public.notify_email_test() from public, anon, authenticated;
revoke execute on function public.notify_email_to() from public, anon, authenticated;
revoke execute on function public.notify_email_from() from public, anon, authenticated;
revoke execute on function public.notify_esc(text) from public, anon, authenticated;
revoke execute on function public.notify_row(text, text) from public, anon, authenticated;
revoke execute on function public.notify_layout(text, text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Wellness requests — docs/supabase-wellness-requests.sql
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_wellness_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text := case when new.type = 'psychologist' then 'Counselling' else 'Career guidance' end;
begin
  perform public.notify_email(
    format('[MySkills · Wellness] %s request from %s', v_kind, new.full_name),
    public.notify_layout(
      format('New %s request', lower(v_kind)),
      public.notify_row('Name', new.full_name)
      || public.notify_row('Email', new.email)
      || public.notify_row('Phone', new.phone)
      || public.notify_row('Message', new.message),
      'Open in admin',
      'https://myskills.org.in/admin/wellness'
    )
  );
  return null;
end;
$$;

drop trigger if exists wellness_requests_notify on public.wellness_requests;
create trigger wellness_requests_notify
  after insert on public.wellness_requests
  for each row execute function public.notify_new_wellness_request();

-- ---------------------------------------------------------------------------
-- Mentor applications — docs/supabase-mentor-onboarding.sql
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_mentor_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_email(
    format('[MySkills · Mentor] Application from %s', new.full_name),
    public.notify_layout(
      'New mentor application',
      public.notify_row('Name', new.full_name)
      || public.notify_row('Headline', new.headline)
      || public.notify_row('Location', new.location)
      || public.notify_row('Expertise', array_to_string(new.expertise, ', '))
      || public.notify_row('Email', new.email)
      || public.notify_row('Phone', new.phone)
      || public.notify_row('LinkedIn', new.linkedin_url)
      || public.notify_row('Motivation', new.motivation),
      'Review application',
      'https://myskills.org.in/admin/mentors'
    )
  );
  return null;
end;
$$;

drop trigger if exists mentor_applications_notify on public.mentor_applications;
create trigger mentor_applications_notify
  after insert on public.mentor_applications
  for each row execute function public.notify_new_mentor_application();

-- ---------------------------------------------------------------------------
-- Institution partner applications — docs/supabase-institution-partner-onboarding.sql
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_institution_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_email(
    format('[MySkills · Institutions] Application from %s', new.legal_name),
    public.notify_layout(
      'New partner institution application',
      public.notify_row('Institution', new.legal_name)
      || public.notify_row('City', new.city)
      || public.notify_row('Years in education', new.years_in_education::text)
      || public.notify_row('Courses', array_to_string(new.courses_offered, ', '))
      || public.notify_row('Contact', new.contact_name)
      || public.notify_row('Role', new.contact_role)
      || public.notify_row('Email', new.email)
      || public.notify_row('Phone', new.phone)
      || public.notify_row('Website', new.website_url)
      || public.notify_row('Notes', new.additional_info),
      'Review application',
      'https://myskills.org.in/admin/institution-partners'
    )
  );
  return null;
end;
$$;

drop trigger if exists institution_applications_notify on public.institution_partner_applications;
create trigger institution_applications_notify
  after insert on public.institution_partner_applications
  for each row execute function public.notify_new_institution_application();

-- ---------------------------------------------------------------------------
-- Demo requests — docs/supabase-institution-demo-requests.sql
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_demo_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_email(
    format('[MySkills · Demo] Request from %s', new.full_name),
    public.notify_layout(
      'New demo request',
      public.notify_row('Name', new.full_name)
      || public.notify_row('Partner', new.partner)
      || public.notify_row('Role', new.role)
      || public.notify_row('Institution', new.institution)
      || public.notify_row('City', new.city)
      || public.notify_row('Students', new.student_count::text)
      || public.notify_row('Email', new.email)
      || public.notify_row('Phone', new.phone)
      || public.notify_row('Message', new.message),
      'Open in admin',
      'https://myskills.org.in/admin/demo-requests'
    )
  );
  return null;
end;
$$;

drop trigger if exists demo_requests_notify on public.institution_demo_requests;
create trigger demo_requests_notify
  after insert on public.institution_demo_requests
  for each row execute function public.notify_new_demo_request();

-- ---------------------------------------------------------------------------
-- Live support chat — docs/supabase-support-chat.sql
--
-- The only one of these where someone is waiting on screen right now, so it
-- says so plainly. Fires only for 'waiting' inserts: a session that goes
-- straight to another status isn't a queue entry anybody needs to rush to.
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
      public.notify_row('Student', coalesce(v_name, 'A learner'))
      || public.notify_row('Topic', new.topic)
      || public.notify_row('Details', new.details),
      'Open the mentor queue',
      'https://myskills.org.in/mentor'
    )
  );
  return null;
end;
$$;

drop trigger if exists support_sessions_notify on public.support_sessions;
create trigger support_sessions_notify
  after insert on public.support_sessions
  for each row when (new.status = 'waiting')
  execute function public.notify_new_support_session();

-- ---------------------------------------------------------------------------
-- Feedback — the in-app "Rate & review" form (src/lib/feedback.ts)
--
-- Rating is 1–10 and leads the subject line, so a low score stands out in the
-- inbox without opening anything.
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_feedback()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name  text;
  v_email text;
begin
  select p.full_name into v_name from public.profiles p where p.id = new.profile_id;
  select u.email into v_email from auth.users u where u.id = new.profile_id;

  perform public.notify_email(
    format('[MySkills · Feedback] %s from %s',
           coalesce(new.rating::text || '/10', 'No rating'),
           coalesce(nullif(btrim(v_name), ''), 'a learner')),
    public.notify_layout(
      'New feedback',
      public.notify_row('From', coalesce(v_name, 'A learner'))
      || public.notify_row('Email', v_email)
      || public.notify_row('Rating', new.rating::text || ' / 10')
      || public.notify_row('Review', new.review)
      || public.notify_row('Suggestion', new.suggestion),
      'Open feedback',
      'https://myskills.org.in/admin/feedback'
    )
  );
  return null;
end;
$$;

drop trigger if exists feedback_notify on public.feedback;
create trigger feedback_notify
  after insert on public.feedback
  for each row execute function public.notify_new_feedback();
