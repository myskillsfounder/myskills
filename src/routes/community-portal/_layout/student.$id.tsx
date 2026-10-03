import { createFileRoute } from '@tanstack/react-router'
import { StudentRecord } from '@/components/mentoring/StudentRecord'

// One student's record. What it shows is decided on the server by how the
// signed-in account works with them; an account that doesn't gets an error.
export const Route = createFileRoute('/community-portal/_layout/student/$id')({
  component: StudentPage,
})

function StudentPage() {
  const { id } = Route.useParams()
  return <StudentRecord key={id} studentId={id} />
}
