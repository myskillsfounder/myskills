import { useEffect, useState, type ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Globe2, GraduationCap, Plane, X } from 'lucide-react'
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

/** What "All programmes" is narrowed to: a country, a university, or nothing. */
type Pick = { country?: string; university?: string }

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** A titled row of tiles that scrolls sideways on a phone and wraps on a computer. */
function BrowseRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 font-display text-xl font-semibold text-ink-900">{title}</h2>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    </section>
  )
}

const tileClass = (on: boolean) =>
  `lift flex w-64 shrink-0 snap-start items-center gap-3 rounded-2xl border-2 p-4 text-left sm:w-auto ${on ? 'border-brand-500 bg-brand-50' : 'border-ink-900/[0.08] bg-white'}`

/** Every country with a programme: its flag, and how many programmes and universities. */
function CountryRow({ rows, pick, onPick }: { rows: StudyProgramme[]; pick: Pick; onPick: (p: Pick) => void }) {
  const countries = [...new Set(rows.map((r) => r.country))].sort((a, b) => a.localeCompare(b))
  if (countries.length === 0) return null
  return (
    <BrowseRow title="Countries">
      {countries.map((c) => {
        const here = rows.filter((r) => r.country === c)
        const unis = new Set(here.map((r) => r.university).filter(Boolean)).size
        const code = here.find((r) => r.country_code)?.country_code
        return (
          <button key={c} type="button" aria-pressed={pick.country === c && !pick.university} onClick={() => onPick({ country: c })} className={tileClass(pick.country === c && !pick.university)}>
            {code ? <Flag code={code} className="h-8 w-12 shrink-0" /> : <Globe2 size={28} className="shrink-0 text-brand-600" />}
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-semibold text-ink-900">{c}</span>
              <span className="block text-xs text-ink-500">
                {plural(here.length, 'programme', 'programmes')}
                {unis > 0 && ` · ${plural(unis, 'university', 'universities')}`}
              </span>
            </span>
          </button>
        )
      })}
    </BrowseRow>
  )
}

/** Every partner university: its name, where it is, and how many programmes. */
function UniversityRow({ rows, pick, onPick }: { rows: StudyProgramme[]; pick: Pick; onPick: (p: Pick) => void }) {
  const unis = [...new Set(rows.map((r) => r.university).filter((u): u is string => !!u))].sort((a, b) => a.localeCompare(b))
  if (unis.length === 0) return null
  return (
    <BrowseRow title="Universities">
      {unis.map((u) => {
        const here = rows.filter((r) => r.university === u)
        const first = here[0]
        return (
          <button key={u} type="button" aria-pressed={pick.university === u} onClick={() => onPick({ university: u })} className={tileClass(pick.university === u)}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <GraduationCap size={22} />
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 font-display text-sm font-semibold leading-snug text-ink-900">{u}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
                <Flag code={first.country_code} className="h-3 w-[18px]" /> {first.country} · {plural(here.length, 'programme', 'programmes')}
              </span>
            </span>
          </button>
        )
      })}
    </BrowseRow>
  )
}

/** Every study-abroad programme the team has opened: featured first, then by country and university, then all. */
function StudyAbroadPage() {
  const [rows, setRows] = useState<StudyProgramme[] | null | undefined>(undefined)
  const [error, setError] = useState<string>()
  const [pick, setPick] = useState<Pick>({})
  useEffect(() => {
    fetchStudyProgrammes().then(setRows, (e) => setError(errorMessage(e)))
  }, [])

  const all = rows ?? []
  const featured = all.filter((r) => r.featured)
  const shown = all.filter((r) => (!pick.country || r.country === pick.country) && (!pick.university || r.university === pick.university))

  // Picking a country or university in its row narrows "All programmes" and
  // takes the student there.
  const choose = (next: Pick) => {
    setPick(next)
    requestAnimationFrame(() => document.getElementById('all-programmes')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

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

          <CountryRow rows={all} pick={pick} onPick={choose} />
          <UniversityRow rows={all} pick={pick} onPick={choose} />

          <section id="all-programmes" className="scroll-mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-ink-900">
                {pick.university ? `Programmes at ${pick.university}` : pick.country ? `Programmes in ${pick.country}` : 'All programmes'}
              </h2>
              {(pick.country || pick.university) && (
                <button
                  type="button"
                  onClick={() => setPick({})}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-ink-700 ring-1 ring-ink-900/[0.08] transition-colors hover:bg-ink-50"
                >
                  <X size={14} /> Show all
                </button>
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
