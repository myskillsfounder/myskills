-- Inbox claims: "I'm on it".
--
-- Anyone on the internal team can claim an Inbox item, so two people don't
-- call the same student or approve the same role, and everyone can see who has
-- what. A claim is only a marker: the item stays in the Inbox until it is
-- dealt with on its own page, as before.
--   - Claiming an item someone else holds takes it over (for when they're away).
--   - You can let go of your own claim; a super admin can clear anyone's.
--   - Claiming a new institution lead also makes you its owner, if it has none.
--   - Claims older than 60 days are cleared: by then the item is long done.
-- The Dashboard's "My work" lists what you've claimed, and your institution leads.
--
-- Run once, BEFORE OR AFTER the deploy: without it the Inbox simply shows no
-- "I'm on it" buttons. Safe to re-run.
-- Depends on: docs/supabase-staff-permissions.sql (has_any_staff_access),
-- docs/supabase-institution-leads.sql.

create table if not exists public.admin_inbox_claims (
  kind        text not null,
  ref         text not null,
  claimed_by  uuid not null references auth.users (id) on delete cascade,
  claimed_at  timestamptz not null default now(),
  primary key (kind, ref)
);

-- No policies: everything goes through the functions below.
alter table public.admin_inbox_claims enable row level security;

-- Every claim, with the claimer's name, for anyone on the team.
create or replace function public.admin_inbox_claims()
returns table (kind text, ref text, claimed_by uuid, name text, claimed_at timestamptz)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.has_any_staff_access() then
    raise exception 'Not authorised.';
  end if;
  return query
  select c.kind, c.ref, c.claimed_by,
         coalesce(nullif(btrim(p.full_name), ''), split_part(u.email::text, '@', 1)),
         c.claimed_at
    from public.admin_inbox_claims c
    join auth.users u on u.id = c.claimed_by
    left join public.profiles p on p.id = c.claimed_by;
end;
$$;
revoke execute on function public.admin_inbox_claims() from public, anon;
grant execute on function public.admin_inbox_claims() to authenticated;

-- p_claim true: claim it (or take it over). False: let go of it.
create or replace function public.admin_claim_inbox_item(p_kind text, p_ref text, p_claim boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_any_staff_access() then
    raise exception 'Not authorised.';
  end if;

  if p_claim then
    insert into public.admin_inbox_claims (kind, ref, claimed_by)
    values (p_kind, p_ref, auth.uid())
    on conflict (kind, ref) do update set claimed_by = excluded.claimed_by, claimed_at = now();

    -- A lead someone picks up from the Inbox is theirs in the leads list too.
    if p_kind in ('institution-lead', 'lead-follow-up') and public.has_section_access('demo-requests') then
      update public.institution_leads
         set owner_id = auth.uid()
       where id::text = p_ref and owner_id is null;
    end if;
  else
    delete from public.admin_inbox_claims
     where kind = p_kind and ref = p_ref
       and (claimed_by = auth.uid() or public.is_admin());
  end if;

  delete from public.admin_inbox_claims where claimed_at < now() - interval '60 days';
end;
$$;
revoke execute on function public.admin_claim_inbox_item(text, text, boolean) from public, anon;
grant execute on function public.admin_claim_inbox_item(text, text, boolean) to authenticated;

notify pgrst, 'reload schema';
