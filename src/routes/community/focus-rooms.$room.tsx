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

export const Route = createFileRoute('/community/focus-rooms/$room')({
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
  const [entered, setEntered] = useState<{ workingOn: string; camera: boolean }>()

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
          description="Start the programme first, then come back to its Focus Room."
          action={<ButtonLink to="/community/focus-rooms">Your rooms</ButtonLink>}
        />
      )}
      {room && user && !profileLoading && !entered && <FocusLobby room={room} onEnter={(workingOn, camera) => setEntered({ workingOn, camera })} />}
      {room && user && !profileLoading && entered && (
        <FocusRoomLive
          room={room}
          me={{ user_id: user.id, name: profile?.full_name?.trim() || 'Student', avatar: profile?.avatar_url ?? null }}
          workingOn={entered.workingOn}
          camera={entered.camera}
          onLeave={() => void navigate({ to: '/community/focus-rooms' })}
        />
      )}
    </AppShell>
  )
}
