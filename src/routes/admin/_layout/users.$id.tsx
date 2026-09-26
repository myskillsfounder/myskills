import { useEffect, useState, type ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2, Mail, Phone } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { fetchStudentDetail, type StudentDetail } from '@/lib/adminStudents'
import { bandFor } from '@/lib/readinessScore'
import { skillTracks } from '@/lib/skillTracks'
import { APTITUDES, levelFor as aptitudeLevel } from '@/lib/dmAptitude'
import { SKILLS, levelFor as skillLevel } from '@/lib/careerReadinessAssessment'
import { PERSONAL_DEVELOPMENT_MODULES } from '@/lib/programmes'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Alert, Avatar, Badge, EmptyState, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/admin/_layout/users/$id')({
  component: () => (
    <RequireSection section="users">
      <StudentPage />
    </RequireSection>
  ),
})

const fmtDate = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString() : '—')

function Panel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      <h2 className="font-display text-base font-semibold text-ink-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Bar({ label, points, max, detail }: { label: string; points: number; max: number; detail?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-ink-800">{label}</span>
        <span className="shrink-0 tabular-nums text-ink-500">
          <span className="font-semibold text-ink-900">{Math.round(points)}</span> / {max}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, (points / max) * 100)}%` }} />
      </div>
      {detail && <p className="mt-1 text-xs text-ink-500">{detail}</p>}
    </div>
  )
}

/** One aptitude result as a list of dimension · score · level. */
function AptitudeList({
  rows,
  reflection,
  completedAt,
}: {
  rows: { name: string; score: number; level: string }[]
  reflection: string | null
  completedAt: string
}) {
  return (
    <>
      <ul className="space-y-1.5 text-sm">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-3">
            <span className="truncate text-ink-700">{r.name}</span>
            <span className="shrink-0 text-ink-500">
              <span className="font-semibold tabular-nums text-ink-900">{r.score}</span>/16 · {r.level}
            </span>
          </li>
        ))}
      </ul>
      {reflection && <p className="mt-3 rounded-xl bg-ink-100 p-3 text-sm text-ink-700">“{reflection}”</p>}
      <p className="mt-2 text-xs text-ink-400">Taken {fmtDate(completedAt)}</p>
    </>
  )
}

/**
 * Everything about one student in one place: the Career Readiness Score and
 * what it's made of, both programmes, live sessions, mentor reviews and
 * verification. Read-only — each action still lives on its own page.
 */
function StudentPage() {
  const { id } = Route.useParams()
  const [d, setD] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchStudentDetail(id)
      .then((r) => active && setD(r))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  const back = (
    <Link to="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
      <ArrowLeft size={16} /> All students
    </Link>
  )

  if (loading) {
    return (
      <>
        {back}
        <Skeleton className="h-28 w-full" />
        <Skeleton className="mt-4 h-64 w-full" />
      </>
    )
  }
  if (error || !d) {
    return (
      <>
        {back}
        {error ? (
          <Alert tone="danger" title="Couldn’t load this student">
            <p>{error}</p>
          </Alert>
        ) : (
          <EmptyState icon={ArrowLeft} title="Student not found" />
        )}
      </>
    )
  }

  const { profile: p, score, digital_marketing: dm, career_readiness: cr } = d
  const best = new Map(dm.tracks.map((t) => [t.track, t]))
  const band = score ? bandFor(score.score).label : '—'

  return (
    <>
      {back}

      {/* Header */}
      <section className="card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={p.full_name || p.email} size={56} />
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 truncate font-display text-2xl font-semibold text-ink-900">
              {p.full_name || 'Unnamed student'}
              {score?.identity_verified && <CheckCircle2 size={18} className="shrink-0 text-emerald-600" aria-label="Identity verified" />}
            </h1>
            {p.headline && <p className="truncate text-sm text-ink-600">{p.headline}</p>}
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
              <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1 hover:text-brand-700">
                <Mail size={12} /> {p.email}
              </a>
              {p.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone size={12} /> {p.phone}
                </span>
              )}
              <span>Joined {fmtDate(p.created_at)}</span>
              <span>Last login {fmtDate(p.last_login)}</span>
              {p.is_mentor && <Badge tone="brand">Mentor</Badge>}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="font-display text-4xl font-semibold tabular-nums text-ink-900">
            {score?.score ?? '—'}
            <span className="text-base font-normal text-ink-500"> / 100</span>
          </p>
          <p className="text-sm font-medium text-brand-700">{band}</p>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Score */}
        <Panel title="Career Readiness Score">
          {score ? (
            <div className="space-y-4">
              <Bar label="Personal Development" points={score.personal.points} max={score.personal.max} />
              <Bar label="Professional Development" points={score.professional.points} max={score.professional.max} />
              <Bar label="Internship" points={score.internship?.points ?? 0} max={score.internship?.max ?? 20} />
              <p className="text-xs text-ink-500">
                Verified <span className="font-semibold text-emerald-700">{Math.round(score.verified_points)}</span> ·
                self-reported <span className="font-semibold text-amber-700">{Math.round(score.self_reported_points)}</span> ·{' '}
                method {score.method_version}
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-500">No score yet.</p>
          )}
        </Panel>

        {/* Verification + reviews */}
        <Panel title="Verification & mentor reviews">
          <p className="text-sm text-ink-700">
            {d.verification.request
              ? `Verification ${d.verification.request.status} · requested ${fmtDate(d.verification.request.created_at)}`
              : 'No verification requested'}
            {' · '}
            {d.verification.items} {d.verification.items === 1 ? 'item' : 'items'} verified
          </p>
          <ul className="mt-3 space-y-2">
            {d.mentor_reviews.length === 0 && <li className="text-sm text-ink-500">No mentor reviews yet.</li>}
            {d.mentor_reviews.map((r) => (
              <li key={`${r.programme}-${r.created_at}`} className="rounded-xl bg-ink-100 p-3 text-sm">
                <p className="font-medium text-ink-900">
                  {r.programme === 'digital-marketing' ? 'Digital Marketing' : 'Career Readiness'} ·{' '}
                  {r.status === 'approved' ? 'Signed off' : r.status === 'requested' ? 'Waiting' : 'Sent back'}
                </p>
                <p className="text-xs text-ink-500">
                  Asked {fmtDate(r.created_at)}
                  {r.reviewed_at && ` · reviewed ${fmtDate(r.reviewed_at)}`}
                </p>
                {r.reviewer_note && <p className="mt-1 text-xs text-ink-700">“{r.reviewer_note}”</p>}
              </li>
            ))}
          </ul>
          <Link to="/admin/mentor-reviews" className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:underline">
            Open mentor reviews
          </Link>
        </Panel>

        {/* Digital Marketing */}
        <Panel title="Digital Marketing">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Practice tracks</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {skillTracks.map((t) => {
              const r = best.get(t.slug)
              return (
                <li key={t.slug} className="flex items-center justify-between gap-3">
                  <span className="truncate text-ink-700">{t.name}</span>
                  <span
                    className={`shrink-0 tabular-nums ${r ? (r.best >= 70 ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700') : 'text-ink-400'}`}
                  >
                    {r ? `${r.best}% · ${r.attempts}×` : 'not practised'}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-sm text-ink-700">
            Foundation assessment:{' '}
            {dm.foundation ? (
              <span className="font-semibold">
                {dm.foundation.percent}% ({dm.foundation.correct}/{dm.foundation.total}) · {fmtDate(dm.foundation.completed_at)}
              </span>
            ) : (
              'not taken'
            )}
            {dm.certificate && <span className="text-ink-500"> · certificate {dm.certificate.code}</span>}
          </p>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Marketing aptitude</p>
          <div className="mt-2">
            {dm.aptitude ? (
              <AptitudeList
                rows={APTITUDES.map((a) => {
                  const sc = dm.aptitude!.scores[a.key] ?? 0
                  return { name: a.name, score: sc, level: aptitudeLevel(sc) }
                })}
                reflection={dm.aptitude.reflection}
                completedAt={dm.aptitude.completed_at}
              />
            ) : (
              <p className="text-sm text-ink-500">Not taken.</p>
            )}
          </div>
        </Panel>

        {/* Career Readiness */}
        <Panel title="Career Readiness">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Modules</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {PERSONAL_DEVELOPMENT_MODULES.map((m) => {
              const n = cr.modules[m.slug] ?? 0
              return (
                <li key={m.slug} className="flex items-center justify-between gap-3">
                  <span className="truncate text-ink-700">{m.title}</span>
                  <span
                    className={`shrink-0 tabular-nums ${n >= 4 ? 'font-semibold text-emerald-700' : n > 0 ? 'text-ink-700' : 'text-ink-400'}`}
                  >
                    {n}/4 written
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Personal aptitude</p>
          <div className="mt-2">
            {cr.aptitude ? (
              <AptitudeList
                rows={SKILLS.map((s) => {
                  const sc = cr.aptitude!.scores[s.key] ?? 0
                  return { name: s.name, score: sc, level: skillLevel(sc) }
                })}
                reflection={cr.aptitude.reflection}
                completedAt={cr.aptitude.completed_at}
              />
            ) : (
              <p className="text-sm text-ink-500">Not taken.</p>
            )}
          </div>
        </Panel>

        {/* Live sessions */}
        <Panel title="Live sessions" className="lg:col-span-2">
          {d.live_sessions.length === 0 ? (
            <p className="text-sm text-ink-500">None confirmed yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100 text-sm">
              {d.live_sessions.map((l) => (
                <li key={`${l.programme}-${l.title}-${l.held_on}`} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                  <span className="text-ink-800">
                    {l.title} <span className="text-ink-500">· {l.host_name} ({l.host_kind})</span>
                  </span>
                  <span className="text-xs text-ink-500">
                    {l.programme === 'digital-marketing' ? 'Digital Marketing' : 'Career Readiness'} · {fmtDate(l.held_on)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
