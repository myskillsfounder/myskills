import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Award, CalendarCheck, Lock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { bandFor } from '@/lib/readinessScore'
import {
  RESOURCE_LABEL,
  fetchStudentRecord,
  type RecordLevel,
  type RecordRelationship,
  type StudentRecord as Record_,
} from '@/lib/communityPortal'
import { Alert, Avatar, Badge, EmptyState, Skeleton } from '@/components/ui'

const day = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const PROGRAMME = { 'digital-marketing': 'Digital Marketing', 'career-readiness': 'Career Readiness' } as const

const STATUS: Record<RecordRelationship['status'], { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  active: { label: 'Active', tone: 'success' },
  requested: { label: 'Waiting', tone: 'warning' },
  ended: { label: 'Finished', tone: 'neutral' },
}

/** A phone number as WhatsApp wants it: digits only, with India's code added to a bare 10-digit number. */
function whatsappNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  return digits.length >= 11 ? digits : null
}

/** What this account can and cannot see, said plainly under the heading. */
const LEVEL_NOTE: Record<RecordLevel, string> = {
  full: 'You see this student’s contact details, progress, certificates and sessions.',
  progress: 'You see this student’s contact details, progress, certificates and the sessions with you.',
  contact: 'You see this student’s contact details and the dates of your sessions with them. Nothing about progress or what was discussed is shared.',
}

function Bar({ label, points, max }: { label: string; points: number; max: number }) {
  const pct = max ? Math.min(100, (points / max) * 100) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-ink-800">{label}</span>
        <span className="tabular-nums text-ink-500">
          <span className="font-semibold text-ink-900">{Math.round(points)}</span> / {max}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/**
 * One student, for the people working with them: who they are and how to reach
 * them, who they are working with, how far they have got on MySkills, and the
 * dates of their sessions. How much shows is decided on the server by how this
 * account works with the student (see the SQL), and the note under the heading
 * says which kind of view this is.
 */
export function StudentRecord({ studentId }: { studentId: string }) {
  const [rec, setRec] = useState<Record_ | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchStudentRecord(studentId)
      .then((r) => active && setRec(r))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [studentId])

  const back = (
    <Link
      to="/community-portal"
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
    >
      <ArrowLeft size={16} /> Back to Home
    </Link>
  )

  if (loading) {
    return (
      <>
        {back}
        <Skeleton className="h-40 w-full" />
        <Skeleton className="mt-4 h-56 w-full" />
      </>
    )
  }
  if (error || !rec) {
    return (
      <>
        {back}
        <Alert tone="danger" title="Couldn’t open this student">
          <p>{error ?? 'Something went wrong.'}</p>
        </Alert>
      </>
    )
  }

  const { student: s, relationships, progress, certificates, assessments, sessions, level } = rec
  const name = s.full_name || 'A MySkills student'
  const wa = s.phone ? whatsappNumber(s.phone) : null
  const band = progress ? bandFor(progress.score) : null

  return (
    <div className="space-y-6">
      {back}

      <header className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={name} src={s.avatar_url ?? undefined} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{name}</h1>
            {s.headline && <p className="mt-0.5 text-sm text-ink-600">{s.headline}</p>}
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
              {s.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} /> {s.location}
                </span>
              )}
              <span>On MySkills since {day(s.joined_on)}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`mailto:${s.email}`}
            className="press inline-flex h-10 items-center gap-2 rounded-full border border-ink-900/[0.12] px-4 text-sm font-semibold text-ink-800 hover:border-brand-300 hover:text-brand-800"
          >
            <Mail size={15} /> {s.email}
          </a>
          {s.phone && (
            <a
              href={`tel:${s.phone}`}
              className="press inline-flex h-10 items-center gap-2 rounded-full border border-ink-900/[0.12] px-4 text-sm font-semibold text-ink-800 hover:border-brand-300 hover:text-brand-800"
            >
              <Phone size={15} /> {s.phone}
            </a>
          )}
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex h-10 items-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle size={15} /> WhatsApp
            </a>
          )}
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs text-ink-500">
          <Lock size={13} className="mt-0.5 shrink-0" /> {LEVEL_NOTE[level]}
        </p>
      </header>

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Working with</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {relationships.map((r, i) => (
            <li key={i} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{RESOURCE_LABEL[r.resource]}</p>
                  <p className="truncate text-sm text-brand-700">
                    {r.provider || '—'}
                    {r.programme && ` · ${PROGRAMME[r.programme]}`}
                  </p>
                </div>
                <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
              </div>
              <p className="mt-2 text-xs text-ink-500">
                Since {day(r.started_on)}
                {r.ended_on && ` · finished ${day(r.ended_on)}`}
                {r.resource !== 'internships' && r.resource !== 'institutions' && (
                  <>
                    {' · '}
                    {r.sessions} {r.sessions === 1 ? 'session' : 'sessions'}
                    {r.last_session && ` · last on ${day(r.last_session)}`}
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {level !== 'contact' && (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Progress on MySkills</h2>
          {progress && band ? (
            <div className="card mt-3 grid gap-6 p-5 sm:grid-cols-[auto,1fr] sm:p-6">
              <div className="text-center sm:text-left">
                <p className="font-display text-5xl font-semibold tabular-nums text-ink-900">{progress.score}</p>
                <p className="text-xs text-ink-500">Career Readiness Score, out of 100</p>
                <p className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{band.label}</p>
              </div>
              <div className="space-y-4">
                {progress.personal && <Bar label="Personal Development" points={progress.personal.points} max={progress.personal.max} />}
                {progress.professional && (
                  <Bar label="Professional Development" points={progress.professional.points} max={progress.professional.max} />
                )}
                <p className="text-xs leading-relaxed text-ink-500">
                  {[
                    progress.personal?.modules_done != null && `${progress.personal.modules_done} of 5 modules finished`,
                    progress.professional?.tracks_passed != null && `${progress.professional.tracks_passed} of 8 practice tracks passed`,
                    progress.professional?.foundation_percent != null && `Foundation assessment ${progress.professional.foundation_percent}%`,
                    progress.personal?.project_status === 'approved' && 'Career Readiness project passed',
                    progress.professional?.project_status === 'approved' && 'Digital Marketing project passed',
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'No activity yet.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="card mt-3 p-5 text-sm text-ink-600">No score yet — this student hasn’t started the programmes.</div>
          )}

          {assessments && (
            <p className="mt-3 text-sm text-ink-600">
              Aptitude assessments:{' '}
              <span className="font-medium text-ink-900">
                Marketing {assessments.digital_marketing ? 'taken' : 'not taken'}
              </span>
              {' · '}
              <span className="font-medium text-ink-900">Personal {assessments.career_readiness ? 'taken' : 'not taken'}</span>
            </p>
          )}

          {certificates.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {certificates.map((c, i) => (
                <li
                  key={i}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200"
                >
                  <Award size={14} /> {c.title} · {c.kind} · {c.percent}% · {day(c.issued_at)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Sessions</h2>
        {sessions.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={CalendarCheck}
              title="No sessions yet"
              description="Sessions appear here once they have been logged."
            />
          </div>
        ) : (
          <ol className="card mt-3 divide-y divide-ink-900/[0.06]">
            {sessions.map((x, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="inline-flex min-w-0 items-center gap-2 text-ink-800">
                  <CalendarCheck size={15} className="shrink-0 text-ink-400" />
                  <span className="font-medium tabular-nums">{day(x.date)}</span>
                  <span className="truncate text-ink-500">
                    {RESOURCE_LABEL[x.resource]}
                    {x.provider && ` · ${x.provider}`}
                    {x.title && ` · ${x.title}`}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
