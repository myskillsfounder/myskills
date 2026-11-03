import { useEffect, useState } from 'react'
import { Bell, BellRing, Check, Globe2 } from 'lucide-react'
import { COMING_SOON, fetchMyStudyInterest, toggleStudyInterest, type StudyProgramme } from '@/lib/studyAbroad'
import { errorMessage } from '@/lib/errors'
import { Flag } from './Cards'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** The countries with a live programme, by name, with their flag code. */
export function liveCountries(rows: StudyProgramme[]) {
  const names = [...new Set(rows.map((r) => r.country))].sort((a, b) => a.localeCompare(b))
  return names.map((country) => ({ country, code: rows.find((r) => r.country === country && r.country_code)?.country_code ?? null }))
}

/**
 * The top of Study abroad (Paul, 4 Nov 2026: "should give global vibes"): the
 * world behind it, the flags of where students can go, open now and coming
 * soon, and only real numbers.
 */
export function GlobalHero({ rows }: { rows: StudyProgramme[] }) {
  const live = liveCountries(rows)
  const liveCodes = new Set(live.map((l) => l.code))
  const soon = COMING_SOON.filter((c) => !liveCodes.has(c.code))
  const open = rows.filter((r) => r.status === 'open').length
  const unis = new Set(rows.map((r) => r.university).filter(Boolean)).size

  return (
    <section className="theme-light relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#06142e] via-[#0b2a4a] to-[#0f4c5c] p-6 text-white shadow-e2 sm:p-9">
      {/* A dotted world: the grid fades out towards the words. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1.5px)',
          backgroundSize: '18px 18px',
          maskImage: 'radial-gradient(ellipse 60% 80% at 85% 40%, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 80% at 85% 40%, black, transparent 75%)',
        }}
      />
      <Globe2 aria-hidden size={300} strokeWidth={0.6} className="pointer-events-none absolute -right-16 -top-10 hidden text-cyan-200/20 md:block" />
      <span aria-hidden className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">Study abroad</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-5xl">
          Study anywhere <span className="text-cyan-200">in the world.</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/80 sm:text-base">
          Degrees with partner universities abroad: who each is for, what you need, the steps and the deadlines. Apply here,
          and a mentor guides you all the way.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/85">
          <span>
            <strong className="font-semibold text-white">{plural(open, 'programme', 'programmes')}</strong> open now
          </span>
          {unis > 0 && <span>{plural(unis, 'partner university', 'partner universities')}</span>}
          <span>{plural(live.length + soon.length, 'destination', 'destinations')}</span>
        </p>
      </div>

      {/* Where students can go: open first, then coming soon. */}
      <div className="relative mt-6 flex flex-wrap gap-2">
        {live.map((l) => (
          <span key={l.country} className="inline-flex items-center gap-2 rounded-full bg-white/15 py-1.5 pl-1.5 pr-3 text-sm font-semibold ring-1 ring-white/25">
            {l.code ? <Flag code={l.code} className="h-5 w-7" /> : <Globe2 size={18} />}
            {l.country}
            <span className="rounded-full bg-emerald-400 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-950">Open</span>
          </span>
        ))}
        {soon.map((c) => (
          <span key={c.code} className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] py-1.5 pl-1.5 pr-3 text-sm text-white/75 ring-1 ring-white/10">
            <Flag code={c.code} className="h-5 w-7 opacity-80" />
            {c.country}
          </span>
        ))}
      </div>
    </section>
  )
}

const tileClass = (on: boolean) =>
  `lift flex w-64 shrink-0 snap-start items-center gap-3 rounded-2xl border-2 p-4 text-left sm:w-auto ${on ? 'border-brand-500 bg-brand-50' : 'border-ink-900/[0.08] bg-white'}`

/**
 * Every destination: the countries with programmes open (a tap narrows "All
 * programmes"), then the ones coming soon, each with Notify me.
 */
export function Destinations({
  rows,
  picked,
  onPick,
}: {
  rows: StudyProgramme[]
  picked: string | undefined
  onPick: (country: string) => void
}) {
  const live = liveCountries(rows)
  const liveCodes = new Set(live.map((l) => l.code))
  const soon = COMING_SOON.filter((c) => !liveCodes.has(c.code))

  const [mine, setMine] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string>()
  const [error, setError] = useState<string>()
  useEffect(() => {
    void fetchMyStudyInterest().then((codes) => setMine(new Set(codes)))
  }, [])

  async function toggle(code: string) {
    setBusy(code)
    setError(undefined)
    try {
      const on = await toggleStudyInterest(code)
      setMine((m) => {
        const next = new Set(m)
        if (on) next.add(code)
        else next.delete(code)
        return next
      })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(undefined)
    }
  }

  return (
    <section className="mb-10">
      <h2 className="font-display text-xl font-semibold text-ink-900">Destinations</h2>
      <p className="mb-3 text-sm text-ink-600">Open now, and where we’re adding partner universities next. Tap Notify me to hear first.</p>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-4">
        {live.map((l) => {
          const here = rows.filter((r) => r.country === l.country)
          const unis = new Set(here.map((r) => r.university).filter(Boolean)).size
          return (
            <button key={l.country} type="button" aria-pressed={picked === l.country} onClick={() => onPick(l.country)} className={tileClass(picked === l.country)}>
              {l.code ? <Flag code={l.code} className="h-8 w-12 shrink-0" /> : <Globe2 size={28} className="shrink-0 text-brand-600" />}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-display text-base font-semibold text-ink-900">{l.country}</span>
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">Open</span>
                </span>
                <span className="block text-xs text-ink-500">
                  {plural(here.length, 'programme', 'programmes')}
                  {unis > 0 && ` · ${plural(unis, 'university', 'universities')}`}
                </span>
              </span>
            </button>
          )
        })}
        {soon.map((c) => {
          const on = mine.has(c.code)
          return (
            <div key={c.code} className="flex w-64 shrink-0 snap-start flex-col gap-3 rounded-2xl border-2 border-dashed border-ink-900/[0.1] p-4 sm:w-auto">
              <span className="flex items-center gap-3">
                <Flag code={c.code} className="h-8 w-12 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base font-semibold text-ink-900">{c.country}</span>
                  <span className="block text-xs leading-snug text-ink-500">{c.note}</span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => void toggle(c.code)}
                disabled={busy === c.code}
                aria-pressed={on}
                aria-label={on ? `Stop notifying me about ${c.country}` : `Notify me about ${c.country}`}
                className={`inline-flex items-center justify-center gap-1.5 self-start rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                  on ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                {on ? <Check size={13} /> : busy === c.code ? <BellRing size={13} /> : <Bell size={13} />}
                {on ? 'Notified' : 'Notify me'}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
