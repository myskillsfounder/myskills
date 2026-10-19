import { useEffect, useState, type ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Award, BookOpenCheck, Briefcase, Building2, ChevronRight, Clock, Compass, Megaphone, Sparkles, Trophy } from 'lucide-react'
import type { MentorSuggestion } from '@/lib/mentorMatch'
import { rememberProgramme } from '@/lib/practiceProgramme'
import { supabase } from '@/lib/supabase'
import { MentorProfileDialog, initialsOf, toMentorListing } from '@/components/community/Marketplace'

/* ------------------------------------------------------------- explore */

interface Tile {
  key: string
  label: string
  meta: string
  icon: ComponentType<{ size?: number }>
  tone: string
  to: string
  search?: Record<string, string>
  programme?: 1 | 2
}

/**
 * Explore: the two programmes and the two ways into real-world work, as
 * tinted tiles, each one tap from its page.
 */
export function ExplorePanel({ openRoles, institutions }: { openRoles: number | null; institutions: number | null }) {
  const tiles: Tile[] = [
    { key: 'dm', label: 'Digital Marketing', meta: '8 skill tracks', icon: Megaphone, tone: 'bg-brand-50 text-brand-700', to: '/practice', programme: 1 },
    { key: 'gl', label: 'Global Leadership', meta: '14 modules', icon: Compass, tone: 'bg-emerald-50 text-emerald-700', to: '/practice', programme: 2 },
    {
      key: 'in',
      label: 'Internships',
      meta: openRoles == null ? 'Real work' : openRoles === 1 ? '1 open role' : `${openRoles} open roles`,
      icon: Briefcase,
      tone: 'bg-amber-50 text-amber-700',
      to: '/community',
      search: { category: 'internships' },
    },
    {
      key: 'is',
      label: 'Institutions',
      meta: institutions == null ? 'Classroom learning' : institutions === 1 ? '1 institution' : `${institutions} institutions`,
      icon: Building2,
      tone: 'bg-sky-50 text-sky-700',
      to: '/community',
      search: { category: 'institutions' },
    },
  ]
  return (
    <section className="card h-full p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Explore</h2>
          <p className="text-sm text-ink-500">Programmes, internships and institutions</p>
        </div>
        <Link to="/community" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
          See all <ArrowRight size={14} />
        </Link>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <li key={t.key}>
            <Link
              to={t.to}
              search={t.search as never}
              onClick={() => t.programme && rememberProgramme(t.programme)}
              className={`press flex h-full flex-col items-center rounded-2xl p-4 text-center transition-transform hover:-translate-y-0.5 ${t.tone}`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-e1">
                <t.icon size={20} />
              </span>
              <span className="mt-3 text-sm font-semibold leading-tight text-ink-900">{t.label}</span>
              <span className="mt-0.5 text-xs text-ink-500">{t.meta}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ------------------------------------------------------------- mentors */

function MentorCard({ s }: { s: MentorSuggestion }) {
  const [open, setOpen] = useState(false)
  const listing = toMentorListing(s.mentor)
  return (
    <li className="flex h-full flex-col rounded-2xl border border-ink-900/[0.08] p-4">
      <div className="flex items-center gap-3">
        {listing.avatar ? (
          <img src={listing.avatar} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-brand-100" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
            {initialsOf(listing.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{listing.name}</p>
          <p className="truncate text-xs text-ink-500">{listing.role}</p>
        </div>
      </div>
      <p className="mt-3 flex flex-1 items-start gap-1.5 text-xs font-medium leading-snug text-emerald-700">
        <Sparkles size={13} className="mt-px shrink-0" /> {s.reason}
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="press mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl border border-brand-200 bg-white text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-600 hover:text-white"
      >
        Connect
      </button>
      {open && <MentorProfileDialog mentor={listing} onClose={() => setOpen(false)} />}
    </li>
  )
}

/**
 * Mentors for this student, best fit first, each with the reason it was
 * suggested (lib/mentorMatch.ts). Connect opens the mentor's profile, where
 * the student asks them, as on the Community page.
 */
export function MentorsForYou({ suggestions, hasMentor }: { suggestions: MentorSuggestion[]; hasMentor: boolean }) {
  return (
    <section className="card h-full p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">Mentors for you</h2>
          <p className="text-sm text-ink-500">From your goal, your skills and your progress</p>
        </div>
        <Link
          to="/community"
          search={{ category: 'mentors' } as never}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          All mentors <ArrowRight size={14} />
        </Link>
      </div>
      {suggestions.length === 0 ? (
        <p className="mt-4 text-sm text-ink-600">
          {hasMentor ? 'You’re working with a mentor. More appear here as they join.' : 'Mentors appear here as they join MySkills.'}
        </p>
      ) : (
        <ul className={`mt-4 grid gap-3 ${suggestions.length >= 3 ? 'sm:grid-cols-3' : suggestions.length === 2 ? 'sm:grid-cols-2' : ''}`}>
          {suggestions.map((s) => (
            <MentorCard key={s.mentor.id} s={s} />
          ))}
        </ul>
      )}
    </section>
  )
}

/* ------------------------------------------------------------- numbers */

interface Stat {
  key: string
  icon: ComponentType<{ size?: number }>
  value: string
  label: string
  to?: string
}

/** Where the student ranks (docs/supabase-score-rank.sql); null without the SQL or too few students. */
export function useTopPercent(): number | null {
  const [top, setTop] = useState<number | null>(null)
  useEffect(() => {
    let active = true
    void (async () => {
      const { data, error } = await supabase.rpc('my_score_rank')
      if (!active || error || !data) return
      const r = data as { score: number | null; scored: number; above: number }
      if (!r.score || r.score <= 0 || r.scored < 10) return
      // "Top n%": the share of scored students at or above them, at least 1%.
      setTop(Math.max(1, Math.ceil(((r.above + 1) / r.scored) * 100)))
    })()
    return () => {
      active = false
    }
  }, [])
  return top
}

/**
 * The numbers along the foot of the LaunchPad: programmes started, hours in
 * the last 30 days, certificates, and where their score ranks (or, before
 * that is known, their best streak).
 */
export function StatsStrip({
  programmes,
  hours30,
  certificates,
  topPercent,
  bestStreak,
}: {
  programmes: number
  hours30: number | null
  certificates: number | null
  topPercent: number | null
  bestStreak: number | null
}) {
  const stats: Stat[] = [
    { key: 'prog', icon: BookOpenCheck, value: `${programmes} of 2`, label: 'Programmes started', to: '/practice' },
    { key: 'hours', icon: Clock, value: hours30 == null ? '—' : hours30 < 10 ? hours30.toFixed(1) : String(Math.round(hours30)), label: 'Learning hours, last 30 days' },
    { key: 'cert', icon: Award, value: certificates == null ? '—' : String(certificates), label: certificates === 1 ? 'Certificate earned' : 'Certificates earned', to: '/profile' },
    topPercent != null
      ? { key: 'rank', icon: Trophy, value: `Top ${topPercent}%`, label: 'Among all learners' }
      : { key: 'best', icon: Trophy, value: bestStreak == null ? '—' : `${bestStreak} ${bestStreak === 1 ? 'day' : 'days'}`, label: 'Best streak' },
  ]
  return (
    <section className="card grid grid-cols-2 divide-ink-900/[0.06] p-2 lg:grid-cols-4 lg:divide-x" aria-label="Your numbers">
      {stats.map((s) => {
        const inner = (
          <>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <s.icon size={20} />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-xl font-semibold leading-tight tabular-nums text-ink-900">{s.value}</span>
              <span className="block text-xs text-ink-500">{s.label}</span>
            </span>
            {s.to && <ChevronRight size={15} className="ml-auto shrink-0 text-ink-300" />}
          </>
        )
        return s.to ? (
          <Link key={s.key} to={s.to} className="flex items-center gap-3 rounded-xl p-4 transition-colors hover:bg-ink-50">
            {inner}
          </Link>
        ) : (
          <div key={s.key} className="flex items-center gap-3 p-4">
            {inner}
          </div>
        )
      })}
    </section>
  )
}
