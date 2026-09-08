-- LOW-severity fix: support_sessions' UPDATE policy has a USING clause but no
-- explicit WITH CHECK.
--
-- Postgres actually reuses USING as the check when none is given, so this
-- was never a wide-open hole — but that reused check only re-verifies row
-- VISIBILITY (auth.uid() = user_id, or = mentor_id, or the row is still
-- 'waiting' and the caller is a mentor). It says nothing about which COLUMNS
-- a party is allowed to change once they're a party to the row. Concretely:
-- a signed-in user owns their own support_sessions row (auth.uid() =
-- user_id), so nothing stops them sending a raw update — bypassing
-- lib/support.ts entirely — that sets mentor_id to a specific mentor's UUID
-- and status to 'active' directly, self-activating their own request and
-- picking their mentor instead of going through the real claim flow
-- (claimSession, gated client-side on status = 'waiting').
--
-- A plain WITH CHECK can't close this either: it only sees the NEW row, not
-- what changed, so it can't tell "a mentor claiming a waiting session" apart
-- from "a user self-activating their own session" — both just look like a
-- row where mentor_id and status changed. That distinction needs OLD vs
-- NEW, which is a trigger, not a policy — the same limitation
-- docs/supabase-fix-mentor-self-escalation.sql hit for profiles.is_mentor,
-- fixed the same way there.
--
-- Verified against every current caller of support_sessions update in
-- src/lib/support.ts: claimSession (mentor claims a waiting session),
-- cancelSession (user cancels their own), end_support_session (RPC, either
-- party ends), heartbeatSession/setTyping (either party, touches only the
-- *_seen_at/*_typing_at columns) — all pass through untouched; only a direct
-- self-activation/self-claim bypassing those functions is reverted.
--
-- Run this once against Supabase Cloud (SQL editor).

-- ---------------------------------------------------------------------------
-- 1. Make the check explicit (was an implicit reuse of USING; harmless
--    no-op change in behavior, but the audit flagged its absence, and being
--    explicit means it stays correct if USING is ever loosened later).
-- ---------------------------------------------------------------------------
drop policy if exists sessions_update on public.support_sessions;
create policy sessions_update on public.support_sessions
  for update
  using (
    (auth.uid() = user_id)
    or (auth.uid() = mentor_id)
    or ((status = 'waiting') and public.is_mentor_uid(auth.uid()))
  )
  with check (
    (auth.uid() = user_id)
    or (auth.uid() = mentor_id)
    or ((status = 'waiting') and public.is_mentor_uid(auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- 2. The actual guard: revert mentor_id/status transitions a party isn't
--    allowed to make, regardless of which policy let the UPDATE through.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_support_session_claim()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- mentor_id may only move from null to a value, only to the claiming
  -- mentor's own id, only while the session is still 'waiting', and only by
  -- that mentor (not the session's user, not a reassignment once claimed).
  if new.mentor_id is distinct from old.mentor_id then
    if old.mentor_id is not null
      or old.status <> 'waiting'
      or new.mentor_id <> auth.uid()
      or not public.is_mentor_uid(auth.uid())
    then
      new.mentor_id := old.mentor_id;
      new.status := old.status;
      new.started_at := old.started_at;
      return new;
    end if;
  end if;

  -- Status may always move to 'cancelled' (the user backing out) or 'ended'
  -- (end_support_session, either party) without being a mentor. Any other
  -- status change with mentor_id untouched — i.e. not a genuine claim, which
  -- the block above already handled — requires being a mentor.
  if new.status is distinct from old.status
    and new.mentor_id is not distinct from old.mentor_id
    and new.status not in ('cancelled', 'ended')
    and not public.is_mentor_uid(auth.uid())
  then
    new.status := old.status;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_support_session_claim on public.support_sessions;
create trigger trg_enforce_support_session_claim
  before update on public.support_sessions
  for each row
  execute function public.enforce_support_session_claim();

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
-- As a signed-in non-mentor user with a waiting session of your own, this
-- should have NO effect (mentor_id stays null, status stays 'waiting'):
--   update public.support_sessions
--     set mentor_id = '<any-other-uid>', status = 'active'
--     where id = '<your-session-id>';
--
-- The real claim path (lib/support.ts: claimSession) is unaffected — a
-- signed-in mentor claiming a currently-waiting session still works.
