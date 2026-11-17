-- ---------------------------------------------------------------------------
-- Email the team the moment a student applies to an internship with a CV
-- (Paul, 18 Nov 2026), the same way wellness requests, mentor applications and
-- the others already arrive (docs/supabase-email-notifications.sql).
--
-- The email says who applied, for which kind of internship, how to reach them,
-- their headline, skills and Global Readiness Score, and their note. It does NOT
-- carry the CV: that stays in the private bucket, and "Open in admin" takes the team
-- to Admin > Internships, where Open CV makes a short-lived link.
--
-- Goes to the address in notify_email_to() (one place to change who gets it).
-- Only a NEW application sends an email, not a replaced CV or a withdrawal.
--
-- Run in the Supabase SQL editor, after docs/supabase-email-notifications.sql (the
-- sender and the Resend key in the vault) and docs/supabase-internship-interest.sql
-- (the table). Safe to run again.
--
-- A failure here can never lose the application: the whole body is wrapped, so a
-- broken email only logs a warning.
-- ---------------------------------------------------------------------------

create or replace function public.notify_new_internship_interest()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name    text;
  v_email   text;
  v_phone   text;
  v_head    text;
  v_loc     text;
  v_skills  text;
  v_score   int;
begin
  select p.full_name, p.phone, p.headline, p.location,
         (select string_agg(x, ', ') from jsonb_array_elements_text(to_jsonb(p.skills)) x)
    into v_name, v_phone, v_head, v_loc, v_skills
    from public.profiles p
   where p.id = new.student_id;

  select u.email::text into v_email from auth.users u where u.id = new.student_id;

  select s.score::int into v_score from public.career_readiness_scores s where s.user_id = new.student_id;

  perform public.notify_email(
    format('[MySkills · Internship] %s applied: %s', coalesce(nullif(btrim(v_name), ''), 'A student'), new.track_title),
    public.notify_layout(
      'New internship application',
      public.notify_row('Student', v_name)
      || public.notify_row('Internship', new.track_title)
      || public.notify_row('Email', v_email)
      || public.notify_row('Phone', v_phone)
      || public.notify_row('Headline', v_head)
      || public.notify_row('Location', v_loc)
      || public.notify_row('Skills', v_skills)
      || public.notify_row('Readiness score', v_score::text)
      || public.notify_row('Note', new.note)
      || public.notify_row('CV', new.cv_name),
      'Open in admin',
      'https://myskills.org.in/admin/internships'
    )
  );
  return null;
exception when others then
  raise warning 'notify_new_internship_interest failed: %', sqlerrm;
  return null;
end;
$$;

revoke execute on function public.notify_new_internship_interest() from public, anon, authenticated;

drop trigger if exists internship_interest_notify on public.internship_interest;
create trigger internship_interest_notify
  after insert on public.internship_interest
  for each row execute function public.notify_new_internship_interest();

-- To test: apply to a kind of internship you haven't applied to yet from Home, then
-- check the inbox in notify_email_to(). If nothing arrives, look at the last replies
-- from Resend:  select status_code, content from net._http_response order by created desc limit 5;
