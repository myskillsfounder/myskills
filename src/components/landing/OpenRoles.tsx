import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Briefcase, Building2, CalendarClock, MapPin, Search, Users, X } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { MODE_LABEL, day, fetchPublicRoles, roleFacts, type PublicRole, type RoleMode } from '@/lib/internships'

/*
 * The public Internships page as an internship board (Paul, 11 Nov 2026,
 * picked "job-board style"): Log In to Apply and the search and filters at
 * the top, the roles as a list, and companies asked about hiring interns at
 * the bottom.
 *
 * Real roles only: what the team has made live (docs/supabase-public-
 * internship-roles.sql). Applying needs an account, so Apply logs in (or
 * signs up) and lands on the internships in the Community (lib/afterLogin.ts).
 * Until any are live, the board lists the areas internships are opening in,
 * each marked "Opening soon", never as a role that exists.
 */

const APPLY = { to: '/login' as const, search: { next: '/community?category=internships' } }

const glass =
  'rounded-2xl border border-[#6d7bff]/20 bg-gradient-to-br from-[#1b2470]/45 via-[#0b1438]/40 to-[#060b24]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_16px_44px_-18px_rgba(76,86,240,0.7)] backdrop-blur-xl'

const control =
  'h-11 min-w-0 rounded-xl border border-white/15 bg-[#0b1438]/80 px-3 text-sm text-white outline-none transition-colors focus:border-[#a48bff]'

type Duration = 'any' | 'short' | 'mid' | 'long'
const DURATIONS: { id: Duration; label: string; fits: (weeks: number) => boolean }[] = [
  { id: 'any', label: 'Any duration', fits: () => true },
  { id: 'short', label: 'Up to 1 month', fits: (w) => w <= 4 },
  { id: 'mid', label: '1 to 3 months', fits: (w) => w > 4 && w <= 13 },
  { id: 'long', label: 'Over 3 months', fits: (w) => w > 13 },
]

/** The areas internships open in, shown until real roles are live. */
const OPENING_SOON: { title: string; skills: string[] }[] = [
  { title: 'Digital marketing intern', skills: ['SEO', 'Social media', 'Google Ads'] },
  { title: 'Data analytics intern', skills: ['Spreadsheets', 'SQL', 'Dashboards'] },
  { title: 'Content and social media intern', skills: ['Writing', 'Video', 'Canva'] },
  { title: 'Design intern', skills: ['Figma', 'Branding', 'UI'] },
  { title: 'Business and operations intern', skills: ['Research', 'Excel', 'Communication'] },
  { title: 'Sales and growth intern', skills: ['Outreach', 'CRM', 'Pitching'] },
]

const matches = (q: string, ...fields: string[]) => !q || fields.some((f) => f.toLowerCase().includes(q))

function RoleRow({ r }: { r: PublicRole }) {
  return (
    <li className="flex flex-col gap-4 p-5 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6a55e6] to-[#4338ca] text-white ring-1 ring-white/20">
        <Briefcase size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="font-display text-[17px] font-semibold leading-snug text-white">{r.title}</h3>
          <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-emerald-200">Open</span>
        </div>
        <p className="mt-0.5 text-sm font-medium text-[#b9a6ff]">{r.organisation}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-white/60">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} /> {roleFacts(r)}
          </span>
          {r.apply_by && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock size={13} /> Apply by {day(r.apply_by)}
            </span>
          )}
          {r.openings > 1 && (
            <span className="inline-flex items-center gap-1.5">
              <Users size={13} /> {r.openings} places
            </span>
          )}
        </p>
        {r.skills.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {r.skills.slice(0, 5).map((s) => (
              <li key={s} className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11.5px] font-medium text-white/80">
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link
        {...APPLY}
        onClick={() => trackEvent('internship_apply_public', { role: r.id })}
        className="press inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-5 text-sm font-semibold text-ink-900 transition-colors hover:bg-brand-50"
      >
        Apply <ArrowRight size={15} />
      </Link>
    </li>
  )
}

function SoonRow({ title, skills }: { title: string; skills: string[] }) {
  return (
    <li className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/20 text-white/50">
        <Briefcase size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="font-display text-[17px] font-semibold leading-snug text-white/90">{title}</h3>
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-amber-200">Opening soon</span>
        </div>
        <p className="mt-1 text-[13px] text-white/50">With partner companies our team reviews · Remote and on-site</p>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <li key={s} className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11.5px] font-medium text-white/60">
              {s}
            </li>
          ))}
        </ul>
      </div>
      <Link
        to="/signup"
        onClick={() => trackEvent('internship_notify_public', { area: title })}
        className="press inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
      >
        Sign Up Free
      </Link>
    </li>
  )
}

export function OpenRoles() {
  const [roles, setRoles] = useState<PublicRole[]>()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<RoleMode | 'any'>('any')
  const [duration, setDuration] = useState<Duration>('any')

  useEffect(() => {
    let live = true
    fetchPublicRoles().then((r) => live && setRoles(r))
    return () => {
      live = false
    }
  }, [])

  const q = query.trim().toLowerCase()
  const fits = DURATIONS.find((d) => d.id === duration)!.fits
  const real = Boolean(roles?.length)
  const shownRoles = useMemo(
    () =>
      (roles ?? []).filter(
        (r) => matches(q, r.title, r.organisation, ...r.skills) && (mode === 'any' || r.mode === mode) && fits(r.duration_weeks),
      ),
    [roles, q, mode, fits],
  )
  // The areas opening soon say "Remote and on-site" with no set length, so
  // only the search narrows them.
  const shownSoon = OPENING_SOON.filter((s) => matches(q, s.title, ...s.skills))
  const count = real ? shownRoles.length : shownSoon.length
  const filtered = Boolean(q) || mode !== 'any' || duration !== 'any'
  const clear = () => {
    setQuery('')
    setMode('any')
    setDuration('any')
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-8">
      {/* Top: what this is, and the way in to apply. */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#8f6bff]/35 bg-[#1b2470]/40 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#d8c9ff] backdrop-blur">
            <span className="live-ping relative h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
            {real ? `${roles!.length} open ${roles!.length === 1 ? 'internship' : 'internships'}` : 'Internships'}
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            New internships. <span className="bg-gradient-to-r from-[#8f6bff] via-[#b496ff] to-[#dcc7ff] bg-clip-text text-transparent">Apply today.</span>
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">
            Real work experience with partner companies our team has reviewed. Apply with your Global Readiness Score, and the
            company signs off the work you do.
          </p>
        </div>
        <Link
          {...APPLY}
          onClick={() => trackEvent('internship_login_public')}
          className="press inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-ink-900 transition-colors hover:bg-brand-50"
        >
          Log In to Apply <ArrowRight size={15} />
        </Link>
      </div>

      {/* Search and filters. */}
      <div className={`${glass} mt-7 grid grid-cols-2 gap-2 p-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]`}>
        <label className="relative col-span-2 block sm:col-span-1">
          <span className="sr-only">Search internships</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by role, company or skill"
            className={`${control} w-full pl-10 placeholder:text-white/40`}
          />
        </label>
        <select aria-label="Work mode" value={mode} onChange={(e) => setMode(e.target.value as RoleMode | 'any')} className={control} style={{ colorScheme: 'dark' }}>
          <option value="any">Remote or on-site</option>
          {(Object.keys(MODE_LABEL) as RoleMode[]).map((m) => (
            <option key={m} value={m}>
              {MODE_LABEL[m]}
            </option>
          ))}
        </select>
        <select aria-label="Duration" value={duration} onChange={(e) => setDuration(e.target.value as Duration)} className={control} style={{ colorScheme: 'dark' }}>
          {DURATIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm">
        <p className="text-white/60">
          {roles === undefined
            ? 'Loading internships…'
            : real
              ? `${count} ${count === 1 ? 'internship' : 'internships'}`
              : `No open internships yet: ${count} ${count === 1 ? 'area' : 'areas'} opening soon`}
        </p>
        {filtered && (
          <button type="button" onClick={clear} className="inline-flex items-center gap-1 font-semibold text-[#b9a6ff] hover:text-white">
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      {/* The board. */}
      <div className={`${glass} mt-3 overflow-hidden`}>
        {roles === undefined ? (
          <ul className="divide-y divide-white/[0.07]" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-4 p-5">
                <span className="h-12 w-12 animate-pulse rounded-xl bg-white/10" />
                <span className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
              </li>
            ))}
          </ul>
        ) : count === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-white">Nothing matches that.</p>
            <button type="button" onClick={clear} className="mt-2 text-sm font-semibold text-[#b9a6ff] hover:text-white">
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.07]">
            {real ? shownRoles.map((r) => <RoleRow key={r.id} r={r} />) : shownSoon.map((s) => <SoonRow key={s.title} {...s} />)}
          </ul>
        )}
      </div>
      {roles !== undefined && !real && (
        <p className="mt-3 text-center text-[13px] text-white/50">
          These open as partner companies join. Sign up free and build your score now, so you are ready to apply.
        </p>
      )}

      {/* Bottom: companies looking for interns. */}
      <div className="mt-14 flex flex-col gap-5 rounded-2xl border border-[#8f6bff]/30 bg-gradient-to-r from-[#2a1f7a]/55 to-[#0a1036]/55 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <Building2 size={20} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-white">Looking to hire interns?</p>
            <p className="text-sm text-white/65">Get top-skilled students who have already shown what they can do.</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2.5">
          <Link
            to="/community-portal/signup"
            onClick={() => trackEvent('internships_partner_cta', { cta: 'signup' })}
            className="press inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#7b6cf6] to-[#4f46e5] px-5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(99,102,241,0.9)] transition-opacity hover:opacity-90"
          >
            Partner With Us <ArrowRight size={15} />
          </Link>
          <Link
            to="/become-an-internship-partner"
            onClick={() => trackEvent('internships_partner_cta', { cta: 'how' })}
            className="press inline-flex h-11 items-center rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            How it works
          </Link>
        </div>
      </div>
    </section>
  )
}
