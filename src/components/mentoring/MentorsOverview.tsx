import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Mail, Users } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { fetchCommunityMentorStudents, type MentorStudent } from '@/lib/communityPortal'
import { Alert, EmptyState, Skeleton } from '@/components/ui'

const day = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

const PROGRAMME: Record<MentorStudent['programme'], string> = {
  'digital-marketing': 'Digital Marketing',
  'career-readiness': 'Career Readiness',
}

const GROUPS: { status: MentorStudent['status']; title: string; tone: string; label: string }[] = [
  { status: 'active', title: 'Working with a mentor', tone: 'bg-emerald-50 text-emerald-700', label: 'Active' },
  { status: 'requested', title: 'Waiting for a mentor to accept', tone: 'bg-amber-50 text-amber-700', label: 'Waiting' },
  { status: 'ended', title: 'Finished', tone: 'bg-ink-100 text-ink-600', label: 'Finished' },
]

/**
 * Every student working with a mentor, and which one — the Mentors section for
 * someone overseeing the Community rather than mentoring. Read-only: mentors
 * accept requests and log sessions in their own section.
 */
export function MentorsOverview() {
  const [rows, setRows] = useState<MentorStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    fetchCommunityMentorStudents()
      .then((r) => active && setRows(r))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  if (loading) return <Skeleton className="h-32 w-full" />
  if (error) {
    return (
      <Alert tone="danger" title="Couldn’t load mentors’ students">
        <p>{error}</p>
      </Alert>
    )
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No students yet"
        description="Students appear here as soon as one asks a mentor to work with them."
      />
    )
  }

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm leading-relaxed text-ink-600">
        Every student working with a mentor, which mentor, and the sessions logged so far.
      </p>
      {GROUPS.map((g) => {
        const list = rows.filter((r) => r.status === g.status)
        if (list.length === 0) return null
        return (
          <section key={g.status}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              {g.title} · {list.length}
            </h2>
            <ul className="mt-2 space-y-3">
              {list.map((r) => (
                <li key={r.id} className="card p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to="/community-portal/student/$id"
                        params={{ id: r.student_id }}
                        className="font-display text-lg font-semibold text-ink-900 hover:text-brand-700 hover:underline"
                      >
                        {r.student_name || 'A MySkills student'}
                      </Link>
                      <p className="text-sm font-medium text-brand-700">
                        With {r.mentor_name} · {PROGRAMME[r.programme]}
                      </p>
                      <a
                        href={`mailto:${r.student_email}`}
                        className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-brand-700"
                      >
                        <Mail size={13} /> {r.student_email}
                      </a>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${g.tone}`}>{g.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-ink-500">
                    Since {day(r.started_on)} · {r.sessions} {r.sessions === 1 ? 'session' : 'sessions'}
                    {r.last_session && ` · last on ${day(r.last_session)}`}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
