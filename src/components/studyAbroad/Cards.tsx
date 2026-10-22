import { Link } from '@tanstack/react-router'
import { ArrowRight, BarChart3, Briefcase, CalendarDays, Clock, Cpu, GraduationCap, Hotel, Ship, Stethoscope, type LucideIcon } from 'lucide-react'
import { APPLICATION_STATUS, type StudyProgramme, type StudyTheme } from '@/lib/studyAbroad'

/**
 * The study-abroad cards: a large, colourful card for featured programmes
 * and a compact one for the rest. The colours are the programme's theme;
 * the picture is drawn here (a flag on its pole beside an icon for the
 * subject), so no images need to be made for a new programme.
 */

// Full class strings (Tailwind only keeps classes it can see written out).
export const THEMES: Record<StudyTheme, { card: string; badge: string; tile: string; accent: string; chip: string; disc: string; base: string }> = {
  violet: {
    card: 'border-violet-200 bg-gradient-to-br from-violet-50 via-white to-violet-100/70',
    badge: 'bg-violet-600 text-white',
    tile: 'bg-violet-100 text-violet-700',
    accent: 'text-violet-700',
    chip: 'border-violet-200 bg-white/80 text-violet-800',
    disc: 'from-violet-400 to-violet-600',
    base: 'bg-violet-200/70',
  },
  orange: {
    card: 'border-orange-200 bg-gradient-to-br from-orange-50 via-white to-orange-100/70',
    badge: 'bg-orange-500 text-white',
    tile: 'bg-orange-100 text-orange-700',
    accent: 'text-orange-700',
    chip: 'border-orange-200 bg-white/80 text-orange-800',
    disc: 'from-orange-300 to-orange-500',
    base: 'bg-orange-200/70',
  },
  teal: {
    card: 'border-teal-200 bg-gradient-to-br from-teal-50 via-white to-teal-100/70',
    badge: 'bg-teal-600 text-white',
    tile: 'bg-teal-100 text-teal-700',
    accent: 'text-teal-700',
    chip: 'border-teal-200 bg-white/80 text-teal-800',
    disc: 'from-teal-300 to-teal-600',
    base: 'bg-teal-200/70',
  },
  pink: {
    card: 'border-pink-200 bg-gradient-to-br from-pink-50 via-white to-pink-100/70',
    badge: 'bg-pink-500 text-white',
    tile: 'bg-pink-100 text-pink-700',
    accent: 'text-pink-700',
    chip: 'border-pink-200 bg-white/80 text-pink-800',
    disc: 'from-pink-300 to-pink-500',
    base: 'bg-pink-200/70',
  },
  blue: {
    card: 'border-sky-200 bg-gradient-to-br from-sky-50 via-white to-sky-100/70',
    badge: 'bg-sky-600 text-white',
    tile: 'bg-sky-100 text-sky-700',
    accent: 'text-sky-700',
    chip: 'border-sky-200 bg-white/80 text-sky-800',
    disc: 'from-sky-300 to-sky-600',
    base: 'bg-sky-200/70',
  },
  amber: {
    card: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100/70',
    badge: 'bg-amber-500 text-white',
    tile: 'bg-amber-100 text-amber-700',
    accent: 'text-amber-700',
    chip: 'border-amber-200 bg-white/80 text-amber-800',
    disc: 'from-amber-300 to-amber-500',
    base: 'bg-amber-200/70',
  },
}

export const themeOf = (p: Pick<StudyProgramme, 'theme'>) => THEMES[p.theme ?? 'violet'] ?? THEMES.violet

/** An icon for the subject, from its name. */
export function subjectIcon(p: Pick<StudyProgramme, 'field' | 'title'>): LucideIcon {
  const s = `${p.field ?? ''} ${p.title}`.toLowerCase()
  if (/nurs|medic|mbbs|health|pharm|dent/.test(s)) return Stethoscope
  if (/cruise|ship|marine/.test(s)) return Ship
  if (/hotel|hospitality|tourism/.test(s)) return Hotel
  if (/data|analytic|statistic/.test(s)) return BarChart3
  if (/\bai\b|robot|engineer|computer|software|tech/.test(s)) return Cpu
  if (/mba|business|management|finance/.test(s)) return Briefcase
  return GraduationCap
}

/** A country's flag (flagcdn.com), from its two-letter code. */
export function Flag({ code, className = 'h-4 w-6' }: { code?: string | null; className?: string }) {
  if (!code || !/^[a-z]{2}$/.test(code)) return null
  return <img src={`https://flagcdn.com/w80/${code}.png`} alt="" loading="lazy" className={`rounded-[3px] object-cover shadow-sm ring-1 ring-black/5 ${className}`} />
}

/** Nursing programmes get a nurse instead of an icon. */
export const isNursing = (p: Pick<StudyProgramme, 'field' | 'title'>) => /nurs/i.test(`${p.field ?? ''} ${p.title}`)

/**
 * A nurse, drawn here (no stock photo to license): scrubs, a cap with a red
 * cross, a stethoscope and a clipboard.
 */
export function Nurse({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden>
      {/* hair behind */}
      <path d="M36 52c0-17 11-28 24-28s24 11 24 28v22c0 6-5 10-11 10H47c-6 0-11-4-11-10z" fill="#3b2a24" />
      {/* body: scrubs */}
      <path d="M22 140c0-26 15-42 38-42s38 16 38 42z" fill="#2bb3a3" />
      <path d="M47 99l13 15 13-15" fill="#e8f7f5" />
      <path d="M47 99l13 15 13-15" fill="none" stroke="#1f8f82" strokeWidth="2" strokeLinejoin="round" />
      <rect x="70" y="118" width="12" height="9" rx="2" fill="#1f8f82" />
      {/* neck and face */}
      <rect x="53" y="80" width="14" height="16" rx="6" fill="#c98b62" />
      <ellipse cx="60" cy="60" rx="21" ry="23" fill="#d99b6f" />
      <ellipse cx="38.5" cy="62" rx="3.5" ry="5" fill="#c98b62" />
      <ellipse cx="81.5" cy="62" rx="3.5" ry="5" fill="#c98b62" />
      {/* hair fringe */}
      <path d="M39 55c2-14 11-22 21-22s19 8 21 22c-8-3-14-9-17-15-5 8-14 13-25 15z" fill="#3b2a24" />
      {/* nurse's cap */}
      <path d="M40 36c2-7 10-12 20-12s18 5 20 12l-3 6H43z" fill="#ffffff" stroke="#d6e4e2" strokeWidth="1.5" />
      <rect x="57" y="27" width="6" height="12" rx="1" fill="#e5484d" />
      <rect x="54" y="30" width="12" height="6" rx="1" fill="#e5484d" />
      {/* face */}
      <circle cx="52.5" cy="62" r="2.4" fill="#2b1d17" />
      <circle cx="67.5" cy="62" r="2.4" fill="#2b1d17" />
      <path d="M53 71c4 4 10 4 14 0" fill="none" stroke="#8a4b2f" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="47.5" cy="69" r="3" fill="#f2a08b" opacity=".55" />
      <circle cx="72.5" cy="69" r="3" fill="#f2a08b" opacity=".55" />
      {/* stethoscope */}
      <path d="M45 98c-3 10 0 20 9 23" fill="none" stroke="#334155" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M75 98c3 10 0 20-9 23" fill="none" stroke="#334155" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M54 121c3 3 9 3 12 0" fill="none" stroke="#334155" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="60" cy="127" r="4.2" fill="#94a3b8" stroke="#334155" strokeWidth="2" />
      {/* clipboard */}
      <rect x="26" y="112" width="20" height="24" rx="3" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
      <rect x="31" y="109" width="10" height="5" rx="1.5" fill="#64748b" />
      <path d="M30 121h12M30 126h12M30 131h8" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/** The drawn picture: a disc with the subject's icon (or a nurse) on a soft base, and the flag on a pole. */
export function Illustration({ p, size = 'lg' }: { p: StudyProgramme; size?: 'lg' | 'md' }) {
  const t = themeOf(p)
  const Icon = subjectIcon(p)
  const big = size === 'lg'
  return (
    <div aria-hidden className={`relative shrink-0 ${big ? 'h-32 w-36' : 'h-24 w-28'}`}>
      <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 rounded-[50%] ${t.base} ${big ? 'h-6 w-32' : 'h-5 w-24'}`} />
      {isNursing(p) ? (
        <span
          className={`absolute bottom-2 left-1/2 -translate-x-1/2 overflow-hidden rounded-b-[2.5rem] rounded-t-full bg-gradient-to-b shadow-lg ${t.disc} ${big ? 'h-[6.5rem] w-24' : 'h-[5.5rem] w-[5rem]'}`}
        >
          <Nurse className="absolute inset-x-0 bottom-0 mx-auto h-[115%] w-auto translate-y-[6%]" />
        </span>
      ) : (
        <span
          className={`absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg ${t.disc} ${big ? 'h-20 w-20' : 'h-16 w-16'}`}
        >
          <Icon size={big ? 36 : 28} strokeWidth={1.75} />
        </span>
      )}
      {p.country_code && (
        <span className={`absolute flex items-start ${big ? 'right-2 top-0' : 'right-1 top-0'}`}>
          <span className={`w-0.5 rounded-full bg-ink-400 ${big ? 'h-14' : 'h-11'}`} />
          <Flag code={p.country_code} className={big ? 'h-5 w-7' : 'h-4 w-6'} />
        </span>
      )}
      <span className="absolute left-0 top-5 h-2.5 w-6 rounded-full bg-white shadow-sm" />
      <span className="absolute left-3 top-3 h-3 w-4 rounded-full bg-white shadow-sm" />
    </div>
  )
}

function StatusPill({ p }: { p: StudyProgramme }) {
  if (p.my_status) {
    const s = APPLICATION_STATUS[p.my_status]
    return <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink-800 shadow-sm ring-1 ring-ink-900/5">{s.label}</span>
  }
  if (p.status === 'closed') return <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink-500 ring-1 ring-ink-900/5">Closed</span>
  return null
}

/** The large card at the top of Study abroad. */
export function FeaturedCard({ p }: { p: StudyProgramme }) {
  const t = themeOf(p)
  return (
    <Link
      to="/study-abroad/$slug"
      params={{ slug: p.slug }}
      className={`lift group relative flex h-full min-h-[17rem] w-[min(22rem,85vw)] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border p-5 sm:w-auto ${t.card}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {p.badge && <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${t.badge}`}>{p.badge}</span>}
          <StatusPill p={p} />
        </div>
      </div>
      <div className="mt-2 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-semibold leading-tight text-ink-900">{p.title}</h3>
          {p.university && <p className={`mt-1 text-xs font-semibold ${t.accent}`}>{p.university}</p>}
        </div>
        <Illustration p={p} size="md" />
      </div>
      {p.summary && <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-ink-600">{p.summary}</p>}
      {p.tags && p.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.tags.slice(0, 3).map((tag) => (
            <span key={tag} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${t.chip}`}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <span className={`mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold ${t.accent}`}>
        Explore the programme <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

/** The compact card in the grid of every programme. */
export function ProgrammeCard({ p }: { p: StudyProgramme }) {
  const t = themeOf(p)
  return (
    <Link to="/study-abroad/$slug" params={{ slug: p.slug }} className="lift group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-900/[0.08] bg-white">
      <div className={`flex flex-col items-center border-b px-3 pb-2 pt-3 ${t.card}`}>
        <div className="flex min-h-[22px] w-full flex-wrap gap-1.5">
          {p.badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${t.badge}`}>{p.badge}</span>}
          <StatusPill p={p} />
        </div>
        <Illustration p={p} size="md" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          <Flag code={p.country_code} className="h-3 w-[18px]" /> {p.country}
        </p>
        <h3 className="mt-1 font-display text-base font-semibold leading-snug text-ink-900">{p.title}</h3>
        {p.university && <p className={`mt-0.5 text-xs font-semibold ${t.accent}`}>{p.university}</p>}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-ink-900/[0.06] pt-3 text-xs">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Duration</p>
            <p className="mt-0.5 flex items-center gap-1 text-ink-800">
              <Clock size={12} className={t.accent} /> {p.duration || '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">Starts</p>
            <p className="mt-0.5 flex items-center gap-1 text-ink-800">
              <CalendarDays size={12} className={t.accent} /> <span className="truncate">{p.intake || '—'}</span>
            </p>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className={`truncate text-xs font-semibold ${t.accent}`}>{p.highlight || p.fees || ''}</span>
          <ArrowRight size={15} className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}
