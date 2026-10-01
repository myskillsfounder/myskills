import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Link, Outlet, useRouter } from '@tanstack/react-router'
import { Briefcase, Building2, Compass, GraduationCap, HeartHandshake, User, Users } from 'lucide-react'
import { requireMentorSession } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import { fetchMyMentees, type MentorSideMatch } from '@/lib/mentorMatches'
import { fetchMyMentorProfile, type MyMentorProfile } from '@/lib/mentorPortal'
import {
  RESOURCE_LABEL,
  fetchMyCommunityAccess,
  type CommunityAccess,
  type CommunityResource,
} from '@/lib/communityPortal'
import { MentorPortalContext, PortalAccessContext } from '@/components/mentoring/MentorPortalContext'
import { MentorShell, type PortalTab } from '@/components/mentoring/MentorShell'
import { RequestsLine } from '@/components/mentoring/RequestsLine'
import { Alert, EmptyState, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/community-portal/_layout')({
  beforeLoad: requireMentorSession,
  component: MentorPortalLayout,
})

const RESOURCE_ICON: Record<CommunityResource, PortalTab['icon']> = {
  mentors: GraduationCap,
  wellness: HeartHandshake,
  guidance: Compass,
  internships: Briefcase,
  institutions: Building2,
}

/**
 * Loads what the signed-in account may use — its mentor profile and requests
 * if it is a mentor, and the other Community resources it was given — and
 * shows only those sections. An account with none sees an explanation, not
 * the student app.
 */
function MentorPortalLayout() {
  const router = useRouter()
  const [profile, setProfile] = useState<MyMentorProfile | null>(null)
  const [rows, setRows] = useState<MentorSideMatch[]>([])
  const [access, setAccess] = useState<CommunityAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    try {
      const [mine, granted] = await Promise.all([fetchMyMentorProfile(), fetchMyCommunityAccess()])
      // Only a mentor has requests to load; asking for anyone else is an error.
      const mentees = mine ? await fetchMyMentees() : []
      // Before the SQL is run there are no grants to read: mentors only, as before.
      // A mentor's own section comes from their profile, above; 'mentors' stays in
      // this list only as an overview (every mentor's students).
      const others = (granted ?? []).filter((a) => a.resource !== 'mentors' || a.sees_all)
      setProfile(mine)
      setRows(mentees)
      setAccess(others)
      setError(undefined)
      return { mine, others }
    } catch (e) {
      setError(errorMessage(e))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // A mentor who hasn't finished their profile starts on it. Only on the first
  // load — saving the profile mustn't move them anywhere.
  useEffect(() => {
    void load().then((loaded) => {
      if (!loaded) return
      const { mine, others } = loaded
      const here = window.location.pathname.replace(/\/$/, '')
      const onMentorPage = here === '/community-portal' || here === '/community-portal/profile'
      if (mine && !mine.ready && here === '/community-portal') {
        router.navigate({ to: '/community-portal/profile', replace: true })
      } else if (!mine && others.length > 0 && onMentorPage) {
        // Not a mentor: open on the first resource they do have.
        router.navigate({ to: '/community-portal/$resource', params: { resource: others[0].resource }, replace: true })
      }
    })
    // First load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const waiting = rows.filter((r) => r.status === 'requested').length
  const tabs: PortalTab[] = [
    ...(profile
      ? [
          { to: '/community-portal', label: 'My students', short: 'My students', icon: Users, count: waiting, exact: true },
        ]
      : []),
    ...access.map((a) => ({
      to: `/community-portal/${a.resource}`,
      label: RESOURCE_LABEL[a.resource],
      short: RESOURCE_LABEL[a.resource],
      icon: RESOURCE_ICON[a.resource],
    })),
    ...(profile
      ? [{ to: '/community-portal/profile', label: 'My profile', short: 'Profile', icon: User, dot: !profile.ready }]
      : []),
  ]

  return (
    <MentorShell name={profile?.full_name} photo={profile?.avatar_url} tabs={tabs}>
      {loading ? (
        <>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-4 h-48 w-full" />
        </>
      ) : error ? (
        <Alert tone="danger" title="Couldn’t load the Community portal">
          <p>{error}</p>
        </Alert>
      ) : !profile && access.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="This account doesn’t have access yet"
          description="The Community portal is for approved MySkills mentors, counsellors, career guides and partner organisations. Once the team gives this account access you’ll get an email, and your section will appear here."
          action={
            <Link to="/community" className="text-sm font-semibold text-brand-700 hover:underline">
              Partner with MySkills
            </Link>
          }
        />
      ) : (
        <PortalAccessContext.Provider value={access}>
          <MentorPortalContext.Provider
            value={profile ? { profile, rows, reload: async () => void (await load()) } : null}
          >
            {profile && <RequestsLine rows={rows} />}
            <Outlet />
          </MentorPortalContext.Provider>
        </PortalAccessContext.Provider>
      )}
    </MentorShell>
  )
}
