-- Admin access: read policies for the in-app admin panel, and authenticated
-- write access for the content it manages.
--
-- RUN docs/supabase-mentor-onboarding.sql FIRST — it creates public.admins and
-- public.is_admin(), which everything here depends on.
--
-- Why this file exists: every user-data table is scoped to
-- `auth.uid() = profile_id`, so an admin opening the panel would see exactly
-- one row — their own. Postgres RLS combines multiple permissive policies with
-- OR, so adding an admin policy alongside the owner policy widens access for
-- admins without touching what a normal user can see.

-- ---------------------------------------------------------------------------
-- Read access for admins
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles',
    'login_events',
    'feedback',
    'initial_assessment_results',
    'initial_assessment_category_scores',
    'practice_attempts',
    'test_attempts',
    'certificates'
  ]
  loop
    execute format('drop policy if exists "admins read all" on public.%I', t);
    execute format(
      'create policy "admins read all" on public.%I for select to authenticated using (public.is_admin())',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Blog: replace the anon write policy
-- ---------------------------------------------------------------------------
-- The old policy was:
--   create policy "blog_posts admin all" on public.blog_posts
--     to anon using (true) with check (true);
--
-- No FOR clause means ALL commands, and `anon` is the UNAUTHENTICATED role —
-- so with the anon key (which ships in the browser bundle and is public by
-- design) anyone on the internet could insert, edit or delete posts. The name
-- said "admin"; the grant said "the whole world".
--
-- Replaced with the same capability restricted to signed-in admins. Reading
-- published posts stays public via the untouched
-- "blog_posts public read published" policy.
drop policy if exists "blog_posts admin all" on public.blog_posts;

drop policy if exists "admins manage blog posts" on public.blog_posts;
create policy "admins manage blog posts"
  on public.blog_posts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admins need to see drafts too, which the public read policy excludes.
drop policy if exists "admins read all" on public.blog_posts;
create policy "admins read all"
  on public.blog_posts for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Ads
-- ---------------------------------------------------------------------------
-- ads_public_read_active already exposes active ads to everyone; this adds
-- management and lets admins see inactive ones.
drop policy if exists "admins manage ads" on public.ads;
create policy "admins manage ads"
  on public.ads for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins read all" on public.ads;
create policy "admins read all"
  on public.ads for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Dashboard counts
-- ---------------------------------------------------------------------------
-- The overview needs totals across every user, which a client can only get by
-- fetching rows it is allowed to read and counting them — slow, and it pulls
-- personal data to the browser purely to produce a number. This returns the
-- aggregates directly and hands out nothing else.
create or replace function public.admin_overview()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select case when not public.is_admin() then null else json_build_object(
    'total_users',        (select count(*) from public.profiles),
    'active_today',       (select count(distinct profile_id) from public.login_events
                            where at >= date_trunc('day', now())),
    'new_this_week',      (select count(*) from public.profiles
                            where updated_at >= now() - interval '7 days'),
    'total_logins',       (select count(*) from public.login_events),
    'assessments_done',   (select count(*) from public.initial_assessment_results),
    'practice_attempts',  (select count(*) from public.practice_attempts),
    'avg_rating',         (select round(avg(rating)::numeric, 1) from public.feedback
                            where rating is not null),
    'feedback_count',     (select count(*) from public.feedback),
    'blog_posts',         (select count(*) from public.blog_posts),
    'blog_published',     (select count(*) from public.blog_posts where status = 'published'),
    'certificates',       (select count(*) from public.certificates),
    'mentor_applications_pending',
                          (select count(*) from public.mentor_applications where status = 'pending')
  ) end;
$$;

revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;

-- ---------------------------------------------------------------------------
-- User list for the admin panel
-- ---------------------------------------------------------------------------
-- profiles has no email — it lives in auth.users, which the client cannot read.
-- security definer bridges that, behind the same admin check.
create or replace function public.admin_users(search text default null, max_rows int default 200)
returns table (
  id uuid,
  email text,
  full_name text,
  headline text,
  is_mentor boolean,
  created_at timestamptz,
  last_login timestamptz,
  assessment_percent int
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    u.email::text,
    p.full_name,
    p.headline,
    p.is_mentor,
    u.created_at,
    (select max(le.at) from public.login_events le where le.profile_id = p.id),
    (select r.percent from public.initial_assessment_results r where r.profile_id = p.id)
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
    and (
      search is null or search = ''
      or p.full_name ilike '%' || search || '%'
      or u.email ilike '%' || search || '%'
    )
  order by u.created_at desc
  limit least(coalesce(max_rows, 200), 1000);
$$;

revoke all on function public.admin_users(text, int) from public, anon;
grant execute on function public.admin_users(text, int) to authenticated;
