import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { Briefcase, Building2, Compass, GraduationCap, HeartHandshake, LayoutDashboard, User, Users } from 'lucide-react'
import { requireMentorSession } from '@/lib/guards'
import { useAuthUser, userDisplayName } from '@/lib/useAuth'
import { errorMessage } from '@/lib/errors'
import { fetchMyMentees, type MentorSideMatch } from '@/lib/mentorMatches'
import { fetchMyMentorProfile, type MyMentorProfile } from '@/lib/mentorPortal'
import {
  RESOURCE_LABEL,
  fetchMyCommunityAccess,
  type CommunityAccess,
  type CommunityResource,
} from '@/lib/communityPortal'
import { MentorPortalContext, PortalAccessContext, PortalNameContext } from '@/components/mentoring/MentorPortalContext'
import { MentorShell, type PortalTab } from '@/components/mentoring/MentorShell'
import { PortalRequestStatus } from '@/components/mentoring/PortalRequestStatus'
import { RequestsLine } from '@/components/mentoring/RequestsLine'
import { Alert, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/community-portal/_layout')({
  beforeLoad: requireMentorSession,
  component: MentorPortalLayout,
})

/** The order of the student Community page's tiles: Mentors first. */
const ORDER: CommunityResource[] = ['mentors', 'wellness', 'guidance', 'internships', 'institutions']

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
  const { user } = useAuthUser()
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
      const { mine } = loaded
      const here = window.location.pathname.replace(/\/$/, '')
      // A mentor whose profile isn't finished starts there; everyone else on Home.
      if (mine && !mine.ready && here === '/community-portal') {
        router.navigate({ to: '/community-portal/profile', replace: true })
      }
    })
    // First load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const waiting = rows.filter((r) => r.status === 'requested').length
  const displayName = profile?.full_name || (user ? userDisplayName(user) : undefined)
  const sections = [...access].sort((a, b) => ORDER.indexOf(a.resource) - ORDER.indexOf(b.resource))
  // Mentors first, as on the Community page: this account's own students if it is
  // a mentor, and the overview beside them if it can also see every mentor's.
  const verified = Boolean(profile) || access.length > 0
  const tabs: PortalTab[] = !verified ? [] : [
    { to: '/community-portal', label: 'Home', icon: LayoutDashboard, exact: true },
    ...(profile
      ? [{ to: '/community-portal/students', label: 'My students', icon: Users, count: waiting, group: 'Community' }]
      : []),
    ...sections.map((a, i) => ({
      to: `/community-portal/${a.resource}`,
      label: a.resource === 'mentors' && profile ? 'All mentors’ students' : RESOURCE_LABEL[a.resource],
      icon: RESOURCE_ICON[a.resource],
      group: !profile && i === 0 ? 'Community' : undefined,
    })),
    // Everyone verified has a profile page: their verification, and how they show up.
    { to: '/community-portal/profile', label: 'My profile', icon: User, dot: profile ? !profile.ready : false, group: 'Account' },
  ]

  const roles = [
    profile ? 'Mentor' : null,
    ...sections.filter((a) => a.resource !== 'mentors' || !profile).map((a) => RESOURCE_LABEL[a.resource]),
  ].filter(Boolean) as string[]
  const subtitle =
    sections.find((a) => a.organisation)?.organisation ||
    (sections.some((a) => a.sees_all) ? 'Overview · all sections' : roles.slice(0, 2).join(' · '))

  return (
    <MentorShell name={displayName} photo={profile?.avatar_url} subtitle={subtitle} tabs={tabs}>
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
        // Signing up opens nothing: until the team verifies the request, this
        // says it is waiting (or was turned down, or lets them ask).
        <PortalRequestStatus name={displayName} email={user?.email} onCheck={async () => void (await load())} />
      ) : (
        <PortalAccessContext.Provider value={access}>
          <PortalNameContext.Provider value={displayName}>
          <MentorPortalContext.Provider
            value={profile ? { profile, rows, reload: async () => void (await load()) } : null}
          >
            {profile && <RequestsLine rows={rows} />}
            <Outlet />
          </MentorPortalContext.Provider>
          </PortalNameContext.Provider>
        </PortalAccessContext.Provider>
      )}
    </MentorShell>
  )
}
