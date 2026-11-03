import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Lock } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser } from '@/lib/useAuth'
import { useProfile } from '@/lib/useProfile'
import { fetchMyFocusRooms, type FocusRoom } from '@/lib/focusRooms'
import { AppShell } from '@/components/app/AppShell'
import { FocusLobby, FocusRoomLive } from '@/components/focus/FocusRoom'
import { ButtonLink, EmptyState, Skeleton } from '@/components/ui'

/** Joined from the top of Study rooms (components/focus/StudyNowCard.tsx),
 *  which has already asked what they're on and checked the camera: no lobby. */
type JoinSearch = { on?: string; cam?: 0 | 1 }

export const Route = createFileRoute('/study-rooms/$room')({
  validateSearch: (s: Record<string, unknown>): JoinSearch =>
    s.cam === 1 || s.cam === 0 ? { on: typeof s.on === 'string' ? s.on.slice(0, 80) : '', cam: s.cam } : {},
  beforeLoad: requireOnboarded,
  component: FocusRoomPage,
})

/** The lobby first (what you're on, camera or not), then the room itself. */
function FocusRoomPage() {
  const { room: slug } = Route.useParams()
  const navigate = useNavigate()
  const { user } = useAuthUser()
  const { profile, loading: profileLoading } = useProfile()
  const [room, setRoom] = useState<FocusRoom | null>()
  const joined = Route.useSearch()
  const [entered, setEntered] = useState<{ workingOn: string; camera: boolean } | undefined>(
    joined.cam === undefined ? undefined : { workingOn: joined.on ?? '', camera: joined.cam === 1 },
  )

  useEffect(() => {
    fetchMyFocusRooms().then((rooms) => setRoom(rooms.find((r) => r.slug === slug) ?? null))
  }, [slug])

  return (
    <AppShell wide>
      {(room === undefined || !user || profileLoading) && <Skeleton className="h-64 w-full" />}
      {room === null && (
        <EmptyState
          icon={Lock}
          title="This room is for students in the programme"
          description="Start the programme first, then come back to its study room."
          action={<ButtonLink to="/study-rooms">Your rooms</ButtonLink>}
        />
      )}
      {room && user && !profileLoading && !entered && <FocusLobby room={room} onEnter={(workingOn, camera) => setEntered({ workingOn, camera })} />}
      {room && user && !profileLoading && entered && (
        <FocusRoomLive
          room={room}
          me={{ user_id: user.id, name: profile?.full_name?.trim() || 'Student', avatar: profile?.avatar_url ?? null }}
          workingOn={entered.workingOn}
          camera={entered.camera}
          onLeave={() => void navigate({ to: '/study-rooms' })}
        />
      )}
    </AppShell>
  )
}
