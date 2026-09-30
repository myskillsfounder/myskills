import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Link, Outlet, useRouter } from '@tanstack/react-router'
import { GraduationCap } from 'lucide-react'
import { requireMentorSession } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import { fetchMyMentees, type MentorSideMatch } from '@/lib/mentorMatches'
import { fetchMyMentorProfile, type MyMentorProfile } from '@/lib/mentorPortal'
import { MentorPortalContext } from '@/components/mentoring/MentorPortalContext'
import { MentorShell } from '@/components/mentoring/MentorShell'
import { Alert, EmptyState, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/mentor-portal/_layout')({
  beforeLoad: requireMentorSession,
  component: MentorPortalLayout,
})

/**
 * Loads the mentor's profile and their requests once and shares them with the
 * portal's pages. An account that isn't a linked mentor sees an explanation,
 * not the student app.
 */
function MentorPortalLayout() {
  const router = useRouter()
  const [profile, setProfile] = useState<MyMentorProfile | null>(null)
  const [rows, setRows] = useState<MentorSideMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    try {
      const [mine, mentees] = await Promise.all([fetchMyMentorProfile(), fetchMyMentees()])
      setProfile(mine)
      setRows(mentees)
      setError(undefined)
      return mine
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
    void load().then((mine) => {
      const atHome = window.location.pathname.replace(/\/$/, '') === '/mentor-portal'
      if (mine && !mine.ready && atHome) router.navigate({ to: '/mentor-portal/profile', replace: true })
    })
    // First load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const waiting = rows.filter((r) => r.status === 'requested').length

  return (
    <MentorShell
      name={profile?.full_name}
      photo={profile?.avatar_url}
      waiting={waiting}
      needsProfile={profile ? !profile.ready : false}
    >
      {loading ? (
        <>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-4 h-48 w-full" />
        </>
      ) : error ? (
        <Alert tone="danger" title="Couldn’t load the mentor portal">
          <p>{error}</p>
        </Alert>
      ) : !profile ? (
        <EmptyState
          icon={GraduationCap}
          title="This account isn’t set up as a mentor yet"
          description="The mentor portal is for approved MySkills mentors. If you’ve applied, we’ll link this account to your mentor listing once you’re approved — you’ll get an email when it’s ready."
          action={
            <Link to="/become-a-mentor" className="text-sm font-semibold text-brand-700 hover:underline">
              Apply to become a mentor
            </Link>
          }
        />
      ) : (
        <MentorPortalContext.Provider value={{ profile, rows, reload: async () => void (await load()) }}>
          <Outlet />
        </MentorPortalContext.Provider>
      )}
    </MentorShell>
  )
}
