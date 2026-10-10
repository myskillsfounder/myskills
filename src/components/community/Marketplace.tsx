import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  ChevronRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Clock,
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
    title: 'Psychologists & Counsellors',
    who: 'Wellness Support',
    body: 'Exam pressure, stress, self-doubt, or something you can’t name yet — talk it through privately with someone who listens without judging.',
    tags: ['Private', 'At Your Pace'],
    cta: 'Talk to a Counsellor',
    tint: 'from-rose-100 via-brand-50 to-white',
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
function MentorAvatar({ mentor, size }: { mentor: MentorListing; size: 'card' | 'large' }) {
  // On the card the avatar sits over the coloured band, so it carries a white
  // ring to lift it off both the band and the card.
  const box =
    size === 'card' ? 'h-[4.5rem] w-[4.5rem] text-xl ring-4 ring-white shadow-e1' : 'h-20 w-20 text-2xl ring-2 ring-brand-100'
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
function MentorProfileDialog({
  mentor,
  preview,
  startRequest,
  onRequested,
  onClose,
}: {
  mentor: MentorListing
  preview?: boolean
  /** Opened from the card's "Request mentoring": the request is already open. */
  startRequest?: boolean
  onRequested?: () => void
  onClose: () => void
}) {
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
            <RequestMentoring mentor={mentor} autoOpen={startRequest} onSent={onRequested} />
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

/** Where the student stands with this mentor, when they stand anywhere. */
export type MentorRelation = 'active' | 'requested'

/**
 * A mentor's card: always the same size. Every part has a fixed place and room
 * (one line each for name, role and location; two lines of bio; one row of up
 * to two skills), and anything longer is trimmed. The card's own button is the
 * thing a student came to do, ask this mentor; View profile is beside it.
 * `preview` is the mentor looking at their own card in the Community portal.
 */
export function MentorListingCard({
  mentor,
  preview,
  relation,
  onRequested,
}: {
  mentor: MentorListing
  preview?: boolean
  /** Already this student's mentor, or already asked: shown instead of the button. */
  relation?: MentorRelation
  /** A request was sent from this card: the page can refresh what it shows. */
  onRequested?: () => void
}) {
  const [open, setOpen] = useState<false | 'profile' | 'request'>(false)
  const shown = mentor.expertise.slice(0, 2)
  const extra = mentor.expertise.length - shown.length
  const first = mentor.name.trim().split(' ')[0]
  return (
    <div className="card lift flex h-full flex-col overflow-hidden">
      {/* A band of colour with the photo set over its edge: the card reads as
          a person's profile rather than a row of text. */}
      <div className="relative h-16 bg-gradient-to-br from-brand-300/70 via-brand-200/60 to-gold-200/70">
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-e1">
          <BadgeCheck size={13} />
          Verified
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="-mt-9">
          <MentorAvatar mentor={mentor} size="card" />
        </div>

        <p className="mt-3 truncate font-display text-lg font-semibold leading-snug text-ink-900">{mentor.name}</p>
        <p className="truncate text-sm font-medium leading-snug text-brand-700">{mentor.role}</p>
        {/* Always a line, so a mentor without a location doesn't make a shorter card. */}
        <p className="mt-1 flex h-4 items-center gap-1 text-xs text-ink-500">
          {mentor.location && (
            <>
              <MapPin size={11} className="shrink-0" /> <span className="truncate">{mentor.location}</span>
            </>
          )}
        </p>

        {/* Exactly two lines tall: a taller box would let a third line peek out under the clamp. */}
        <p className="mt-3 line-clamp-2 h-10 text-sm leading-5 text-ink-600">{mentor.bio}</p>

        <div className="mt-3 flex h-7 flex-nowrap items-center gap-1.5 overflow-hidden">
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

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink-900/[0.06] pt-4">
          <button
            type="button"
            onClick={() => setOpen('profile')}
            aria-haspopup="dialog"
            aria-label={`View ${mentor.name}’s profile`}
            className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full py-2 pr-2 text-sm font-semibold text-ink-600 hover:text-brand-700"
          >
            View profile
            <ChevronRight size={15} />
          </button>

          {relation === 'active' ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              <BadgeCheck size={15} /> Your mentor
            </span>
          ) : relation === 'requested' ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              <Clock size={15} /> Request sent
            </span>
          ) : mentor.accepting === false ? (
            <span className="shrink-0 whitespace-nowrap rounded-full bg-ink-100 px-3 py-2 text-sm font-medium text-ink-500" title="Not taking new students right now">
              Paused
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setOpen('request')}
              aria-haspopup="dialog"
              aria-label={`Request mentoring from ${mentor.name}`}
              className="press inline-flex min-w-0 items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Send size={14} className="shrink-0" /> <span className="truncate">Ask {first}</span>
            </button>
          )}
        </div>
      </div>

      {open && (
        <MentorProfileDialog
          mentor={mentor}
          preview={preview}
          startRequest={open === 'request'}
          onRequested={onRequested}
          onClose={() => setOpen(false)}
        />
      )}
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
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-100/80 to-transparent"
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ink-700 to-ink-900 text-white shadow-e1">
          <Briefcase size={21} />
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-600">
          <Lock size={11} /> Opening Soon
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
