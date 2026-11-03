import { createFileRoute, redirect } from '@tanstack/react-router'

// Focus Rooms became Study rooms, the app's first tab (3 Nov 2026).
export const Route = createFileRoute('/community/focus-rooms/$room')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/study-rooms/$room', params: { room: params.room } })
  },
})
