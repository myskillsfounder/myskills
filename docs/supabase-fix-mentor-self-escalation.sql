-- CRITICAL FIX: profiles.is_mentor was freely self-writable.
--
-- profiles_update_own (and profiles_insert_own) check ownership only —
-- `auth.uid() = id` — with no column restriction. Since is_mentor governs
-- both the "is_mentor IS TRUE" public-profile visibility policy and
-- is_mentor_uid(), which gates support_sessions access, any signed-in user
-- could grant themselves mentor powers with a single client-side update —
-- no admin approval, and it opens every other user's "waiting" support
-- chat request (see sessions_select) to them.
--
-- RLS is row-level, not column-level, so the fix is a trigger: it silently
-- reverts any change to is_mentor unless the caller is an admin, regardless
-- of which policy or code path issued the UPDATE/INSERT. This leaves every
-- other self-editable profile field (name, headline, avatar, goals, ...)
-- untouched.
--
-- Depends on public.is_admin() from docs/supabase-mentor-onboarding.sql.
-- Run this once against Supabase Cloud (SQL editor).

-- ---------------------------------------------------------------------------
-- 1. Lock is_mentor to admin-only changes, at the table level
-- ---------------------------------------------------------------------------
create or replace function public.enforce_is_mentor_admin_only()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_mentor := false;
  else
    new.is_mentor := old.is_mentor;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_is_mentor on public.profiles;
create trigger trg_enforce_is_mentor
  before insert or update on public.profiles
  for each row
  execute function public.enforce_is_mentor_admin_only();

-- ---------------------------------------------------------------------------
-- 2. Give admins a real, RLS-safe way to flip it
-- ---------------------------------------------------------------------------
-- The in-app admin panel (src/lib/admin.ts: setMentorFlag) used a plain
-- client-side `.update()`, which only ever worked on the admin's OWN row —
-- there was never an RLS policy letting an admin update someone ELSE's
-- profile. This likely means "grant mentor" silently did nothing for any
-- user other than the admin themselves. A security-definer function fixes
-- both problems at once: it's the one legitimate path past the trigger
-- above, and it doesn't need a new blanket "admins can update profiles"
-- policy (which would be its own, broader hole) since it bypasses RLS
-- internally after checking is_admin() itself.
create or replace function public.admin_set_mentor_flag(target_id uuid, flag boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  update public.profiles set is_mentor = flag, updated_at = now() where id = target_id;
end;
$$;

revoke all on function public.admin_set_mentor_flag(uuid, boolean) from public, anon;
grant execute on function public.admin_set_mentor_flag(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
-- As a non-admin, this should have NO effect (is_mentor stays false):
--   update public.profiles set is_mentor = true where id = auth.uid();
--   select is_mentor from public.profiles where id = auth.uid();
--
-- As an admin, this should actually flip it:
--   select public.admin_set_mentor_flag('<some-user-uuid>', true);
