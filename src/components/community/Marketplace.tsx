import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  MoonStar,
  ChevronRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  Compass,
  GraduationCap,
  HeartHandshake,
  Lock,
  X,
  MapPin,
  Send,
  ShieldCheck,
  Star,
} from 'lucide-react'
import type { Mentor } from '@/lib/mentors'
import type { InstitutionPartner } from '@/lib/institutionPartners'
import { RequestMentoring } from '@/components/community/RequestMentoring'

type IconType = ComponentType<{ size?: number; className?: string }>

export type Category = 'all' | 'wellness' | 'guidance' | 'mentors' | 'internships' | 'institutions'

export const CATEGORIES: { id: Category; label: string; icon?: IconType }[] = [
  { id: 'all', label: 'All' },
  { id: 'mentors', label: 'Mentors', icon: GraduationCap },
  { id: 'wellness', label: 'Wellness', icon: HeartHandshake },
  { id: 'guidance', label: 'Career Guidance', icon: Compass },
  { id: 'internships', label: 'Internships', icon: Briefcase },
  { id: 'institutions', label: 'Institutions', icon: Building2 },
]

/**
 * What a student comes to the Community for, as the page presents it: four
 * groups, each given the same weight. Wellness and career guidance are one
 * group here (both are "talk to someone on the team's side"); the address
 * still accepts either, so older links keep working.
 */
export type Group = 'mentors' | 'support' | 'internships' | 'institutions'

export const groupOf = (c: Category): Group | null => (c === 'all' ? null : c === 'wellness' || c === 'guidance' ? 'support' : c)

/** Each group's own page (Paul, 27 Oct 2026), opened from its tile. */
export type GroupPage = '/community/internships' | '/community/mentors' | '/community/institutions' | '/wellness'

export const GROUPS: { id: Group; category: Category; label: string; blurb: string; icon: IconType; tile: string; to: GroupPage }[] = [
  {
    id: 'internships',
    category: 'internships',
    label: 'Internships',
    blurb: 'Real work with partner companies.',
    icon: Briefcase,
    tile: 'from-emerald-400 to-teal-600',
    to: '/community/internships',
  },
  {
    id: 'mentors',
    category: 'mentors',
    label: 'Mentors',
    blurb: 'Work one to one with someone who has done it.',
    icon: GraduationCap,
    tile: 'from-brand-400 to-brand-700',
    to: '/community/mentors',
  },
  {
    id: 'institutions',
    category: 'institutions',
    label: 'Institutions',
    blurb: 'Verified places for classroom learning.',
    icon: Building2,
    tile: 'from-sky-400 to-blue-600',
    to: '/community/institutions',
  },
  {
    id: 'support',
    category: 'wellness',
    label: 'Wellness & Guidance',
    blurb: 'Talk privately to a counsellor or a career guide.',
    icon: HeartHandshake,
    tile: 'from-rose-400 to-pink-600',
    to: '/wellness',
  },
]

/**
 * The four groups as tiles, in the order students come for them: internships
 * first, then mentors, institutions, and wellness & guidance, then Focus Rooms. Right under the
 * search, and each opens the group's own page (Paul, 27 Oct 2026).
 */
export function BrowseTiles({ meta }: { meta: Partial<Record<Group, string>> }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {GROUPS.map((g) => (
        <Link key={g.id} to={g.to} className="card lift group flex flex-col items-start p-4 text-left sm:p-5">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-e1 ${g.tile}`}>
            <g.icon size={20} />
          </span>
          <span className="mt-3 font-display text-lg font-semibold leading-tight text-ink-900">{g.label}</span>
          <span className="mt-1 flex-1 text-sm leading-snug text-ink-600">{g.blurb}</span>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
            {meta[g.id] ?? 'Browse'}
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
      {/* Focus Rooms (1 Nov 2026): studying alongside others in the same
          programme. Not a group of listings, so it isn't one of GROUPS. */}
      <Link to="/community/focus-rooms" className="card lift group col-span-2 flex flex-col items-start p-4 text-left sm:p-5 lg:col-span-1">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-500 text-white shadow-e1">
          <MoonStar size={20} />
        </span>
        <span className="mt-3 font-display text-lg font-semibold leading-tight text-ink-900">Focus Rooms</span>
        <span className="mt-1 flex-1 text-sm leading-snug text-ink-600">Study live with others in your programme.</span>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
          Join a room
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </div>
  )
}

export const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

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
  /** A way to the rest: a page (`to`) or a filter on this one (`onClick`). */
  seeAll?: { to?: string; onClick?: () => void; label: string }
  children: ReactNode
}) {
  const more = 'group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800'
  const arrow = <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
  return (
    <section className="rise-in">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon size={19} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900">{title}</h2>
            <p className="mt-0.5 text-sm text-ink-600">{subtitle}</p>
          </div>
        </div>
        {seeAll &&
          (seeAll.to ? (
            <Link to={seeAll.to} className={more}>
              {seeAll.label}
              {arrow}
            </Link>
          ) : (
            <button type="button" onClick={seeAll.onClick} className={more}>
              {seeAll.label}
              {arrow}
            </button>
          ))}
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
    title: 'Psychologists & Counsellors',
    who: 'Wellness Support',
    body: 'Exam pressure, stress, self-doubt, or something you can’t name yet — talk it through privately with someone who listens without judging.',
    tags: ['Private', 'At Your Pace'],
    cta: 'Talk to a Counsellor',
    tint: 'from-rose-400 to-pink-600',
  },
  {
    id: 'career_mentor',
    category: 'guidance',
    icon: Compass,
    title: 'Career Guidance Professionals',
    who: 'Career Guidance',
    body: 'Which track to focus on, how to read a job description, what to do after your certificate — plan your next step with a career guide.',
    tags: ['1:1', 'Any Stage'],
    cta: 'Get Career Guidance',
    tint: 'from-amber-400 to-orange-600',
  },
]

/** One line of icon, what it is and what to do: quiet enough to sit beside the
 *  listings without competing with them. */
export function ServiceCard({ service }: { service: Service }) {
  const Icon = service.icon
  return (
    <Link to="/wellness" className="card lift group flex items-start gap-4 p-5">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-e1 ${service.tint}`}>
        <Icon size={22} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">{service.who}</p>
        <h3 className="mt-0.5 font-display text-lg font-semibold leading-snug text-ink-900">{service.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-600">{service.body}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-500">
            <ShieldCheck size={13} className="text-emerald-600" /> Private: only our team sees it
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
            {service.cta}
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
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
  bio: string
  linkedin: string | null
  /** False when they have paused new requests. */
  accepting?: boolean
}

function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

/** The avatar: their photo, or their initials on the brand colour. */
export function MentorAvatar({ mentor, size }: { mentor: MentorListing; size: 'card' | 'large' }) {
  const box = size === 'card' ? 'h-20 w-20 text-2xl ring-4 ring-white shadow-e1' : 'h-20 w-20 text-2xl ring-2 ring-brand-100'
  return mentor.avatar ? (
    <img src={mentor.avatar} alt="" className={`${box} shrink-0 rounded-full bg-white object-cover`} />
  ) : (
    <span
      className={`${box} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white`}
    >
      {initialsOf(mentor.name)}
    </span>
  )
}

/**
 * A mentor's full profile, in a pop-up over the page. The card itself never
 * grows, so every card in a row stays the same size however much a mentor has
 * written; this is where the whole bio and every area of expertise live.
 */
export function MentorProfileDialog({ mentor, preview, onClose }: { mentor: MentorListing; preview?: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    // The page behind doesn't scroll while the profile is open.
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`${mentor.name}’s profile`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink-900/50" />
      <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-e2 sm:max-w-lg sm:rounded-3xl">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close profile"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
        >
          <X size={18} />
        </button>
        <div className="overflow-y-auto p-6 sm:p-8">
          <div className="flex items-center gap-4 pr-8">
            <MentorAvatar mentor={mentor} size="large" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-display text-2xl font-semibold leading-tight text-ink-900">
                {mentor.name}
                <BadgeCheck size={18} className="shrink-0 text-emerald-600" aria-label="Verified mentor" />
              </p>
              <p className="text-sm font-medium text-brand-700">{mentor.role}</p>
              {mentor.location && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-500">
                  <MapPin size={12} /> {mentor.location}
                </p>
              )}
            </div>
          </div>

          {mentor.expertise.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {mentor.expertise.map((e) => (
                <span key={e} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                  {e}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5">
            {mentor.bio ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{mentor.bio}</p>
            ) : (
              <p className="text-sm text-ink-500">This mentor hasn’t written a bio yet.</p>
            )}
          </div>

          {/* What the profile is for: asking this mentor. A mentor previewing
              their own profile sees where the button sits, but can't ask themselves. */}
          {preview ? (
            <div className="mt-6">
              <span className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600/50 px-5 py-3 text-sm font-semibold text-white">
                <Send size={16} /> Request mentoring from {mentor.name.split(' ')[0]}
              </span>
              <p className="mt-2 text-center text-xs text-ink-500">
                Students ask you from here: they pick what they want help with and send you a message.
              </p>
            </div>
          ) : (
            <RequestMentoring mentor={mentor} />
          )}

          {mentor.linkedin && (
            <a
              href={mentor.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="press mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-ink-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-400 hover:bg-ink-50"
            >
              <LinkedInIcon size={16} /> Connect on LinkedIn
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * A mentor's card: a face first. The photo (or initials) sits in the middle
 * with the verified tick on it, then who they are, a line about them and what
 * they know, and one button. Always the same size: every part has a fixed
 * place and room, and anything longer is trimmed; View profile has the lot,
 * and is where a student asks them to be their mentor.
 * `preview` is the mentor looking at their own card in the Community portal.
 */
export function MentorListingCard({ mentor, preview }: { mentor: MentorListing; preview?: boolean }) {
  const [open, setOpen] = useState(false)
  const shown = mentor.expertise.slice(0, 2)
  const extra = mentor.expertise.length - shown.length
  return (
    <div className="card lift relative flex h-full flex-col items-center overflow-hidden px-5 pb-5 pt-6 text-center">
      {/* A soft wash behind the photo, fading out: warmth without a hard band. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-brand-50 to-transparent" />

      <div className="relative">
        <MentorAvatar mentor={mentor} size="card" />
        <span
          title="Verified by MySkills"
          aria-label="Verified mentor"
          className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white"
        >
          <Check size={13} strokeWidth={3.5} />
        </span>
      </div>

      <p className="relative mt-3 w-full truncate font-display text-lg font-semibold leading-snug text-ink-900">{mentor.name}</p>
      <p className="w-full truncate text-sm font-medium leading-snug text-brand-700">{mentor.role}</p>
      {/* Always a line, so a mentor without a location doesn't make a shorter card. */}
      <p className="mt-1 flex h-4 w-full items-center justify-center gap-1 text-xs text-ink-500">
        {mentor.location && (
          <>
            <MapPin size={11} className="shrink-0" /> <span className="truncate">{mentor.location}</span>
          </>
        )}
      </p>

      {/* Exactly two lines tall: a taller box would let a third line peek out under the clamp. */}
      <p className="mt-3 line-clamp-2 h-10 w-full text-sm leading-5 text-ink-600">{mentor.bio}</p>

      <div className="mt-3 flex h-7 w-full flex-nowrap items-center justify-center gap-1.5 overflow-hidden">
        {shown.map((e) => (
          <span
            key={e}
            className="min-w-0 truncate rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700"
          >
            {e}
          </span>
        ))}
        {extra > 0 && (
          <span className="shrink-0 rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-medium text-ink-600">+{extra}</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`View ${mentor.name}’s profile`}
        className="press mt-4 inline-flex w-full items-center justify-center gap-1 rounded-full bg-brand-50 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-600 hover:text-white"
      >
        View profile
        <ChevronRight size={15} />
      </button>

      {open && <MentorProfileDialog mentor={mentor} preview={preview} onClose={() => setOpen(false)} />}
    </div>
  )
}

/**
 * A mentor's card is their listing and nothing else. It used to be overlaid
 * with the linked account's student profile (name, title, photo, skills), which
 * meant a mentor could change their listing in the Community portal and see no
 * change here. The portal is where a mentor edits what students see, so the
 * listing is the one source.
 */
export function toMentorListing(
  m: Pick<Mentor, 'id' | 'full_name' | 'headline' | 'avatar_url' | 'location' | 'expertise' | 'bio' | 'linkedin_url' | 'accepting'>,
): MentorListing {
  return {
    id: m.id,
    name: m.full_name,
    role: m.headline,
    avatar: m.avatar_url,
    location: m.location,
    expertise: m.expertise,
    bio: m.bio ?? '',
    linkedin: m.linkedin_url || null,
    accepting: m.accepting,
  }
}

/** The "add yourself" tile that closes a row — dashed, so it reads as an
 *  invitation rather than another listing. */
// Spelled out so Tailwind sees each class. How many columns the tile takes at
// each width, and whether that is wide enough to lay it out as a strip.
const JOIN_SM: Record<number, string> = {
  1: 'sm:col-span-1 sm:flex-col sm:items-start',
  2: 'sm:col-span-2 sm:flex-row sm:items-center',
}
const JOIN_LG: Record<number, string> = {
  1: 'lg:col-span-1 lg:flex-col lg:items-start',
  2: 'lg:col-span-2 lg:flex-row lg:items-center',
  3: 'lg:col-span-3 lg:flex-row lg:items-center',
}

export function JoinCard({
  icon: Icon,
  title,
  body,
  to,
  after = 0,
}: {
  icon: IconType
  title: string
  body: string
  to: string
  /** How many listings come before it in the grid. The tile takes whatever the
   *  last row has left, so it never sits alone in a column beside empty space. */
  after?: number
}) {
  return (
    <Link
      to={to}
      className={`group flex flex-col items-start gap-4 rounded-2xl border-2 border-dashed border-ink-900/[0.12] p-5 transition-colors hover:border-brand-300 hover:bg-brand-50/40 ${JOIN_SM[2 - (after % 2)]} ${JOIN_LG[3 - (after % 3)]}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-semibold text-ink-900">{title}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-ink-600">{body}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700">
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
    title: 'Performance Marketing Intern',
    skills: ['Meta Ads', 'Google Ads'],
    body: 'Plan, launch and optimise real ad campaigns with a partner company’s budget.',
  },
  {
    title: 'SEO & Content Intern',
    skills: ['SEO & AEO', 'Content Marketing'],
    body: 'Research keywords, write and optimise pages, and track what ranks.',
  },
  {
    title: 'Marketing Analytics Intern',
    skills: ['Analytics', 'Market Research'],
    body: 'Turn campaign data into reports and recommendations a team acts on.',
  },
  {
    title: 'Marketing Automation & AI Intern',
    skills: ['Marketing Automation & AI'],
    body: 'Build email journeys and AI-assisted workflows that run on their own.',
  },
]

export function InternshipCard({ track }: { track: InternshipTrack }) {
  return (
    <div aria-disabled="true" className="card relative flex flex-col overflow-hidden p-5">
      <div className="relative flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-e1">
          <Briefcase size={20} />
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-600">
          <Lock size={11} /> Example
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
      <p className="relative mt-4 text-xs text-ink-500">The kind of role partner companies post. None is open right now.</p>
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
