import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Flame, Plane } from 'lucide-react'
import { glimpseOrOnboarded } from '@/lib/guards'
import { Glimpse } from '@/components/landing/Glimpse'
import { STUDY_ABROAD_GLIMPSE } from '@/content/glimpses'
import { errorMessage } from '@/lib/errors'
import { fetchStudyProgrammes, type StudyProgramme } from '@/lib/studyAbroad'
import { AppShell } from '@/components/app/AppShell'
import { GlobalHero } from '@/components/studyAbroad/Global'
import { UniversityCard } from '@/components/studyAbroad/UniversityCard'
import { FeaturedCard } from '@/components/studyAbroad/Cards'
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

/**
 * Every study-abroad programme the team has opened: the world hero, what is
 * trending, then each partner university as a big card with its programmes
 * (Paul, 4 Nov 2026: "just show partner universities and make those card
 * look big").
 */
function StudyAbroadPage() {
  const [rows, setRows] = useState<StudyProgramme[] | null | undefined>(undefined)
  const [error, setError] = useState<string>()
  useEffect(() => {
    fetchStudyProgrammes().then(setRows, (e) => setError(errorMessage(e)))
  }, [])

  const all = rows ?? []
  // Trending: the programmes the team features, or, while none is, the ones
  // open now, so the page always opens on something to apply to (Paul, 28 Oct 2026).
  const featured = all.filter((r) => r.featured)
  const trending = featured.length > 0 ? featured : all.filter((r) => r.status === 'open')
  // One card per partner university, in name order; a programme without one
  // is grouped under its country.
  const byUniversity = new Map<string, StudyProgramme[]>()
  for (const r of all) {
    const key = r.university || r.country
    byUniversity.set(key, [...(byUniversity.get(key) ?? []), r])
  }
  const universities = [...byUniversity.entries()].sort(([a], [b]) => a.localeCompare(b))

  return (
    <AppShell wide>
      {rows !== undefined && <GlobalHero rows={rows ?? []} />}

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
          {trending.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold text-ink-900">
                <Flame size={20} className="text-orange-500" /> Trending now
              </h2>
              <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">
                {trending.map((p) => (
                  <FeaturedCard key={p.slug} p={p} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold text-ink-900">Partner universities</h2>
            <div className="space-y-6">
              {universities.map(([name, programmes]) => (
                <UniversityCard key={name} university={name} programmes={programmes} />
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  )
}
