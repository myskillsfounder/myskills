import type { ComponentType, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Compass,
  GraduationCap,
  HeartHandshake,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react'
import type { Mentor } from '@/lib/mentors'
import type { InstitutionPartner } from '@/lib/institutionPartners'

type IconType = ComponentType<{ size?: number; className?: string }>

export type Category = 'all' | 'wellness' | 'guidance' | 'mentors' | 'internships' | 'institutions'

export const CATEGORIES: { id: Category; label: string; icon?: IconType }[] = [
  { id: 'all', label: 'All' },
  { id: 'wellness', label: 'Wellness', icon: HeartHandshake },
  { id: 'guidance', label: 'Career guidance', icon: Compass },
  { id: 'mentors', label: 'Mentors', icon: GraduationCap },
  { id: 'internships', label: 'Internships', icon: Briefcase },
  { id: 'institutions', label: 'Institutions', icon: Building2 },
]

export const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

/* ------------------------------------------------------------------ hero */

export function MarketplaceHero({
  query,
  onQuery,
  stats,
}: {
  query: string
  onQuery: (q: string) => void
  stats: { label: string; value: string }[]
}) {
  return (
    <section className="surface-wood-dark rise-in relative overflow-hidden rounded-3xl p-6 shadow-e2 sm:p-8">
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 opacity-[0.14]">
        <svg width="280" height="280" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="1.5">
          <circle cx="120" cy="80" r="76" />
          <circle cx="120" cy="80" r="56" />
          <circle cx="120" cy="80" r="36" />
          <circle cx="120" cy="80" r="16" />
        </svg>
      </span>

      <p className="relative text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
        You’re not doing this alone
      </p>
      <h1 className="relative mt-2 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
        Find the right person for what you need next
      </h1>
      <p className="relative mt-2 max-w-xl text-sm leading-relaxed text-white/70">
        Mentors, counsellors, career guides, internships and partner institutions — every kind of
        support in one place, all free for MySkills students.
      </p>

      <label className="relative mt-6 flex max-w-xl items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-e2 focus-within:ring-4 focus-within:ring-white/20">
        <Search size={18} className="shrink-0 text-ink-400" />
        <span className="sr-only">Search the community</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search mentors, skills, cities…"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery('')}
            aria-label="Clear search"
            className="flex h-6 w-6 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            <X size={14} />
          </button>
        )}
      </label>

      <dl className="relative mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-8">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-[11px] font-medium text-white/55">{s.label}</dt>
            <dd className="font-display text-xl font-semibold text-white">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* -------------------------------------------------------- category chips */

export function CategoryBar({
  active,
  onChange,
  counts,
}: {
  active: Category
  onChange: (c: Category) => void
  counts: Partial<Record<Category, number>>
}) {
  return (
    <div
      role="tablist"
      aria-label="Browse by category"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {CATEGORIES.map((c) => {
        const on = c.id === active
        const Icon = c.icon
        const count = counts[c.id]
        return (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(c.id)}
            className={`press inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              on
                ? 'border-ink-900 bg-ink-900 text-white'
                : 'border-ink-900/[0.1] bg-white text-ink-700 hover:border-ink-300'
            }`}
          >
            {Icon && <Icon size={15} />}
            {c.label}
            {count != null && (
              <span className={`text-xs tabular-nums ${on ? 'text-white/60' : 'text-ink-400'}`}>{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------- section shell */

export function MarketSection({
  icon: Icon,
  title,
  subtitle,
  seeAll,
  children,
}: {
  icon: IconType
  title: string
  subtitle: string
  seeAll?: { to: string; label: string }
  children: ReactNode
}) {
  return (
    <section className="rise-in">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon size={19} />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900">{title}</h2>
            <p className="mt-0.5 text-sm text-ink-600">{subtitle}</p>
          </div>
        </div>
        {seeAll && (
          <Link
            to={seeAll.to}
            className="group inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            {seeAll.label}
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

export const marketGrid = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'

/* ------------------------------------------------------ support services */

export interface Service {
  id: 'psychologist' | 'career_mentor'
  category: Category
  icon: IconType
  title: string
  who: string
  body: string
  tags: string[]
  cta: string
  tint: string
}

export const SERVICES: Service[] = [
  {
    id: 'psychologist',
    category: 'wellness',
    icon: HeartHandshake,
    title: 'Psychologists & counsellors',
    who: 'Wellness support',
    body: 'Exam pressure, stress, self-doubt, or something you can’t name yet — talk it through privately with someone who listens without judging.',
    tags: ['Private', 'Free', 'At your pace'],
    cta: 'Talk to a counsellor',
    tint: 'from-rose-100 via-brand-50 to-white',
  },
  {
    id: 'career_mentor',
    category: 'guidance',
    icon: Compass,
    title: 'Career guidance professionals',
    who: 'Career guidance',
    body: 'Which track to focus on, how to read a job description, what to do after your certificate — plan your next step with a career guide.',
    tags: ['1:1', 'Free', 'Any stage'],
    cta: 'Get career guidance',
    tint: 'from-amber-100 via-brand-50 to-white',
  },
]

export function ServiceCard({ service }: { service: Service }) {
  const Icon = service.icon
  return (
    <Link to="/wellness" className="card lift group flex flex-col overflow-hidden">
      <div className={`relative flex h-28 items-end bg-gradient-to-br p-5 ${service.tint}`}>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e2 transition-transform duration-300 group-hover:scale-105">
          <Icon size={26} />
        </span>
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-ink-700 backdrop-blur">
          <ShieldCheck size={12} className="text-emerald-600" /> Only our team sees it
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">{service.who}</p>
        <h3 className="mt-1 font-display text-xl font-semibold text-ink-900">{service.title}</h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-600">{service.body}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {service.tags.map((t) => (
            <span key={t} className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-medium text-ink-700">
              {t}
            </span>
          ))}
        </div>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
          {service.cta}
          <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}

/* ---------------------------------------------------------------- mentors */

export interface MentorListing {
  id: string
  name: string
  role: string
  avatar: string | null
  location: string | null
  expertise: string[]
}

export function MentorListingCard({ mentor }: { mentor: MentorListing }) {
  const extra = mentor.expertise.length - 3
  return (
    <Link to="/community/mentors" className="card lift group flex flex-col p-5">
      <div className="flex items-center gap-3.5">
        {mentor.avatar ? (
          <img src={mentor.avatar} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-brand-100" />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-semibold text-white">
            {initialsOf(mentor.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-display text-lg font-semibold text-ink-900">
            <span className="truncate">{mentor.name}</span>
            <BadgeCheck size={16} className="shrink-0 text-emerald-600" aria-label="Verified mentor" />
          </p>
          <p className="truncate text-sm text-brand-700">{mentor.role}</p>
          {mentor.location && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-500">
              <MapPin size={11} /> {mentor.location}
            </p>
          )}
        </div>
      </div>

      {mentor.expertise.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {mentor.expertise.slice(0, 3).map((e) => (
            <span key={e} className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
              {e}
            </span>
          ))}
          {extra > 0 && (
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-medium text-ink-600">+{extra}</span>
          )}
        </div>
      )}

      <div className="flex-1" />
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink-900/[0.06] pt-4">
        <span className="text-xs font-medium text-ink-500">Free · live chat</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
          View profile
          <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

export function toMentorListing(
  m: Mentor,
  db?: { full_name: string | null; headline: string | null; avatar_url: string | null; location: string | null; skills: string[] | null },
): MentorListing {
  // A mentor who is also a user keeps their listing in sync with their own
  // profile — same rule as the full mentors page.
  return {
    id: m.id,
    name: db?.full_name?.trim() || m.full_name,
    role: db?.headline?.trim() || m.headline,
    avatar: db?.avatar_url || m.avatar_url,
    location: db?.location?.trim() || m.location,
    expertise: db?.skills?.length ? db.skills : m.expertise,
  }
}

/** The "add yourself" tile that closes a row — dashed, so it reads as an
 *  invitation rather than another listing. */
export function JoinCard({ icon: Icon, title, body, to }: { icon: IconType; title: string; body: string; to: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-start justify-center rounded-2xl border-2 border-dashed border-ink-900/[0.12] p-5 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-ink-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
        <Icon size={19} />
      </span>
      <p className="mt-3 font-display text-lg font-semibold text-ink-900">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-600">{body}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
        Apply <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

/* ------------------------------------------------------------ internships */

export interface InternshipTrack {
  title: string
  skills: string[]
  body: string
}

/**
 * Internships aren't live, so these are the roles they'll open in — built
 * from the skill tracks students already practise, never invented company
 * listings.
 */
export const INTERNSHIP_TRACKS: InternshipTrack[] = [
  {
    title: 'Performance marketing intern',
    skills: ['Meta Ads', 'Google Ads'],
    body: 'Plan, launch and optimise real ad campaigns with a partner company’s budget.',
  },
  {
    title: 'SEO & content intern',
    skills: ['SEO & AEO', 'Content Marketing'],
    body: 'Research keywords, write and optimise pages, and track what ranks.',
  },
  {
    title: 'Marketing analytics intern',
    skills: ['Analytics', 'Market Research'],
    body: 'Turn campaign data into reports and recommendations a team acts on.',
  },
  {
    title: 'Marketing automation & AI intern',
    skills: ['Marketing Automation & AI'],
    body: 'Build email journeys and AI-assisted workflows that run on their own.',
  },
]

export function InternshipCard({ track }: { track: InternshipTrack }) {
  return (
    <div aria-disabled="true" className="card relative flex flex-col overflow-hidden p-5">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-100/80 to-transparent"
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ink-700 to-ink-900 text-white shadow-e1">
          <Briefcase size={21} />
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-600">
          <Lock size={11} /> Opening soon
        </span>
      </div>
      <h3 className="relative mt-4 font-display text-lg font-semibold text-ink-900">{track.title}</h3>
      <p className="relative mt-1 flex-1 text-sm leading-relaxed text-ink-600">{track.body}</p>
      <div className="relative mt-4 flex flex-wrap gap-1.5">
        {track.skills.map((s) => (
          <span key={s} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink-700 ring-1 ring-ink-900/[0.08]">
            {s}
          </span>
        ))}
      </div>
      <p className="relative mt-4 text-xs text-ink-500">Remote · with MySkills partner companies</p>
    </div>
  )
}

/* ----------------------------------------------------------- institutions */

export function InstitutionListingCard({ partner }: { partner: InstitutionPartner }) {
  const extra = partner.courses_offered.length - 2
  return (
    <Link to="/community/institutions" className="card lift group flex flex-col p-5">
      <div className="flex items-center gap-3.5">
        {partner.logo_url ? (
          <img src={partner.logo_url} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-ink-900/[0.08] bg-white object-contain p-1" />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-lg font-semibold text-white">
            {initialsOf(partner.legal_name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-semibold text-ink-900">{partner.legal_name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
            {partner.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} /> {partner.city}
              </span>
            )}
            {partner.google_rating != null && (
              <span className="inline-flex items-center gap-0.5 font-medium text-ink-700">
                <Star size={11} className="fill-amber-400 text-amber-400" /> {partner.google_rating.toFixed(1)}
              </span>
            )}
            <span>{partner.years_in_education}+ yrs</span>
          </p>
        </div>
      </div>
      {partner.courses_offered.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {partner.courses_offered.slice(0, 2).map((c) => (
            <span key={c} className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-medium text-ink-700">
              {c}
            </span>
          ))}
          {extra > 0 && <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-medium text-ink-600">+{extra}</span>}
        </div>
      )}
      <div className="flex-1" />
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink-900/[0.06] pt-4">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <BadgeCheck size={13} /> Verified partner
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
          View <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
