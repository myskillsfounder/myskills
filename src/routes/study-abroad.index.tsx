import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plane } from 'lucide-react'
import { glimpseOrOnboarded } from '@/lib/guards'
import { Glimpse } from '@/components/landing/Glimpse'
import { STUDY_ABROAD_GLIMPSE } from '@/content/glimpses'
import { errorMessage } from '@/lib/errors'
import { fetchStudyProgrammes, type StudyProgramme } from '@/lib/studyAbroad'
import { AppShell } from '@/components/app/AppShell'
import { PageHeader } from '@/components/app/PageHeader'
import { FeaturedCard, Flag, ProgrammeCard } from '@/components/studyAbroad/Cards'
import { Alert, EmptyState, Skeleton } from '@/components/ui'

// The programmes are behind sign-in; a visitor sees a glimpse of them first
// (Paul, 27 Oct 2026).
export const Route = createFileRoute('/study-abroad/')({
  beforeLoad: (ctx) => glimpseOrOnboarded(ctx),
  component: StudyAbroadRoute,
})

function StudyAbroadRoute() {
  const { guest } = Route.useRouteContext()
  return guest ? <Glimpse {...STUDY_ABROAD_GLIMPSE} /> : <StudyAbroadPage />
}

/** Real numbers only: what is on the page, nothing rounded up. */
function Stats({ rows }: { rows: StudyProgramme[] }) {
  const items = [
    { label: 'Countries', value: new Set(rows.map((r) => r.country)).size },
    { label: 'Universities', value: new Set(rows.map((r) => r.university).filter(Boolean)).size },
    { label: 'Programmes', value: rows.length },
    { label: 'Open now', value: rows.filter((r) => r.status === 'open').length },
    { label: 'Your applications', value: rows.filter((r) => r.my_status && r.my_status !== 'withdrawn').length },
  ]
  return (
    <div className="card mb-8 grid grid-cols-2 divide-ink-900/[0.06] sm:grid-cols-5 sm:divide-x">
      {items.map((s) => (
        <div key={s.label} className="px-5 py-4">
          <p className="text-xs font-medium text-ink-500">{s.label}</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-900">{s.value}</p>
        </div>
      ))}
    </div>
  )
}

/** Every study-abroad programme the team has opened: featured first, then all, by country. */
function StudyAbroadPage() {
  const [rows, setRows] = useState<StudyProgramme[] | null | undefined>(undefined)
  const [error, setError] = useState<string>()
  const [country, setCountry] = useState('all')
  useEffect(() => {
    fetchStudyProgrammes().then(setRows, (e) => setError(errorMessage(e)))
  }, [])

  const all = rows ?? []
  const countries = [...new Map(all.map((r) => [r.country, r.country_code])).entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const featured = all.filter((r) => r.featured)
  const shown = all.filter((r) => country === 'all' || r.country === country)

  return (
    <AppShell wide>
      <PageHeader
        eyebrow="Study abroad"
        title="Study in another country"
        description="Degree programmes abroad with our partner universities: who each is for, what you need, the steps and the deadlines. Apply here, and a mentor guides you through it."
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
          <Stats rows={all} />

          {featured.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-3 font-display text-xl font-semibold text-ink-900">Featured programmes</h2>
              <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">
                {featured.map((p) => (
                  <FeaturedCard key={p.slug} p={p} />
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-ink-900">All programmes</h2>
              {countries.length > 1 && (
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Country">
                  {[['all', null] as const, ...countries].map(([c, code]) => (
                    <button
                      key={c}
                      type="button"
                      role="tab"
                      aria-selected={country === c}
                      onClick={() => setCountry(c)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${country === c ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-900/[0.08] hover:bg-ink-50'}`}
                    >
                      {code && <Flag code={code} className="h-3 w-[18px]" />}
                      {c === 'all' ? 'All countries' : c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shown.map((p) => (
                <ProgrammeCard key={p.slug} p={p} />
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  )
}
