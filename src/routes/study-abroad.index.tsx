import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, CalendarDays, Clock, GraduationCap, Languages, Plane } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import { APPLICATION_STATUS, dateText, fetchStudyProgrammes, type StudyProgramme } from '@/lib/studyAbroad'
import { AppShell } from '@/components/app/AppShell'
import { PageHeader } from '@/components/app/PageHeader'
import { Alert, Badge, EmptyState, Skeleton } from '@/components/ui'

// Behind sign-in, so not in PAGE_SEO.
export const Route = createFileRoute('/study-abroad/')({
  beforeLoad: requireOnboarded,
  component: StudyAbroadPage,
})

/** Every study-abroad programme the team has opened, by country. */
function StudyAbroadPage() {
  const [rows, setRows] = useState<StudyProgramme[] | null | undefined>(undefined)
  const [error, setError] = useState<string>()
  const [country, setCountry] = useState('all')
  useEffect(() => {
    fetchStudyProgrammes().then(setRows, (e) => setError(errorMessage(e)))
  }, [])

  const countries = [...new Set((rows ?? []).map((r) => r.country))].sort()
  const shown = (rows ?? []).filter((r) => country === 'all' || r.country === country)
  const byCountry = [...new Set(shown.map((r) => r.country))].sort().map((c) => ({ country: c, items: shown.filter((r) => r.country === c) }))

  return (
    <AppShell wide>
      <PageHeader
        eyebrow="Study abroad"
        title="Study in another country"
        description="Degree programmes abroad that MySkills helps you apply to: who each is for, what you need, the steps and the deadlines. Apply here, and a mentor guides you through it."
      />

      {error && (
        <Alert tone="danger" title="Couldn’t load the programmes">
          <p>{error}</p>
        </Alert>
      )}
      {rows === undefined && !error && <Skeleton className="h-48 w-full" />}
      {(rows === null || (rows && rows.length === 0)) && (
        <EmptyState icon={Plane} title="Coming soon" description="The first study-abroad programmes are being prepared. Check back soon." />
      )}

      {rows && rows.length > 0 && (
        <>
          {countries.length > 1 && (
            <div className="mb-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Country">
              {['all', ...countries].map((c) => (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={country === c}
                  onClick={() => setCountry(c)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${country === c ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-900/[0.08] hover:bg-ink-50'}`}
                >
                  {c === 'all' ? 'All countries' : c}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-8">
            {byCountry.map((g) => (
              <section key={g.country}>
                <h2 className="mb-3 font-display text-xl font-semibold text-ink-900">{g.country}</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {g.items.map((p) => (
                    <Link
                      key={p.slug}
                      to="/study-abroad/$slug"
                      params={{ slug: p.slug }}
                      className="lift group flex h-full flex-col rounded-2xl border border-ink-900/[0.08] bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                          <GraduationCap size={18} />
                        </span>
                        {p.my_status ? (
                          <Badge tone={APPLICATION_STATUS[p.my_status].tone}>{APPLICATION_STATUS[p.my_status].label}</Badge>
                        ) : p.status === 'closed' ? (
                          <Badge tone="neutral">Closed</Badge>
                        ) : (
                          <Badge tone="success">Open</Badge>
                        )}
                      </div>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                        {[p.field, p.country].filter(Boolean).join(' · ')}
                      </p>
                      <h3 className="mt-0.5 font-display text-lg font-semibold text-ink-900">{p.title}</h3>
                      {p.summary && <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-ink-600">{p.summary}</p>}
                      <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-500">
                        {p.duration && (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} /> {p.duration}
                          </span>
                        )}
                        {p.language && (
                          <span className="inline-flex items-center gap-1">
                            <Languages size={12} /> {p.language}
                          </span>
                        )}
                        {p.apply_by && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={12} /> Apply by {dateText(p.apply_by)}
                          </span>
                        )}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-700">
                        See the details <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </AppShell>
  )
}
