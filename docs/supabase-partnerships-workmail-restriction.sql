-- Restricts the partnerships-manager role to @myskills.org.in accounts.
-- Deliberately scoped to partnership_managers only, NOT admins — admins are
-- vetted one at a time already, and the existing admin account is on Gmail;
-- restricting /admin by domain would risk locking that out.
--
-- Two layers on purpose:
--   1. A trigger that rejects the INSERT/UPDATE outright with a clear error,
--      so running the grant statement on a non-work email fails loudly
--      right in the SQL editor instead of silently doing nothing useful.
--   2. A runtime check inside is_partnership_manager() itself, so even a
--      row that somehow got in some other way (a future admin UI, a bulk
--      import) still can't grant access unless the email matches today.
--
-- Depends on docs/supabase-partnerships-portal.sql already being applied.
-- Run this once against Supabase Cloud (SQL editor).

create or replace function public.enforce_partnership_manager_workmail()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_email text;
begin
  select u.email into target_email from auth.users u where u.id = new.user_id;
  if target_email is null or lower(target_email) not like '%@myskills.org.in' then
    raise exception 'partnership_managers requires a @myskills.org.in email (got %)',
      coalesce(target_email, '<none>');
  end if;
  return new;
end;
$$;

drop trigger if exists partnership_managers_workmail_check on public.partnership_managers;
create trigger partnership_managers_workmail_check
  before insert or update on public.partnership_managers
  for each row execute function public.enforce_partnership_manager_workmail();

create or replace function public.is_partnership_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.partnership_managers where user_id = auth.uid())
     and lower(coalesce(
           (select u.email from auth.users u where u.id = auth.uid()), ''
         )) like '%@myskills.org.in';
$$;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--   -- Should fail with the exception above (replace with any non-work-email
--   -- user id, e.g. your own myskillsfounder@gmail.com account):
--   -- insert into public.partnership_managers (user_id) values ('<gmail-account-uuid>');
--
--   -- Should succeed (replace with a real @myskills.org.in user id):
--   -- insert into public.partnership_managers (user_id) values ('<workmail-account-uuid>');
