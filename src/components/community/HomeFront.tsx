import { useRef, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  MapPin,
  MoonStar,
  Plane,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { ROOMS_NOW, useRoomsOnline } from '@/lib/focusRooms'
import type { InstitutionPartner } from '@/lib/institutionPartners'
import { OnlineNow, uniqueStudents } from '@/components/focus/OnlineNow'
import { Skeleton } from '@/components/ui'
import {
  INTERNSHIP_TRACKS,
  InstitutionListingCard,
  InternshipCard,
  MentorAvatar,
  MentorListingCard,
  MentorProfileDialog,
  SERVICES,
  ServiceCard,
  type MentorListing,
} from './Marketplace'
import { InternshipRoleCard, type useInternships } from './Internships'

/**
 * The front of Home (Paul, 18 Nov 2026: a modern marketplace, great vibes, a feeling
 * of discovery). A warm greeting and one clear way in, six colourful doors, who is
 * studying right now, a mentor to meet, then rows you can swipe through: mentors,
 * internships, places to learn, and people to talk to. It shows only real listings
 * (never invented ones: internships say they are examples until a company opens a
 * role). Searching replaces all of this with results, on the page that holds it.
 */

type Roles = ReturnType<typeof useInternships>['roles']

function greeting(): string {
  const h = new Date().getHours()
  return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Still up'
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/* ------------------------------------------------------------------- rail */

/** A row you swipe (or scroll with the arrows): every card the same width. */
function Rail({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const by = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * Math.max(280, ref.current.clientWidth * 0.8), behavior: 'smooth' })
  return (
    <div className="group/rail relative">
      <div
        ref={ref}
        role="list"
        aria-label={label}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => by(-1)}
        aria-label={`Scroll ${label} back`}
        className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-800 shadow-e2 transition-opacity hover:bg-ink-100 lg:flex lg:opacity-0 lg:group-hover/rail:opacity-100"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={() => by(1)}
        aria-label={`Scroll ${label} forward`}
        className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-800 shadow-e2 transition-opacity hover:bg-ink-100 lg:flex lg:opacity-0 lg:group-hover/rail:opacity-100"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

function Slot({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div role="listitem" className={`shrink-0 snap-start ${wide ? 'w-[19rem] sm:w-[21rem]' : 'w-[16.5rem] sm:w-[17.5rem]'} [&>*]:h-full`}>
      {children}
    </div>
  )
}

function RailHeader({
  icon: Icon,
  title,
  subtitle,
  to,
  seeAll,
  tint,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  to: string
  seeAll: string
  tint: string
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-e1 ${tint}`}>
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-600">{subtitle}</p>
        </div>
      </div>
      <Link to={to} className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
        {seeAll}
        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  )
}

/* ---------------------------------------------------------------- the doors */

interface Door {
  to: string
  label: string
  blurb: string
  icon: LucideIcon
  grad: string
  meta: string
}

function Doors({ doors }: { doors: Door[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {doors.map((d) => (
        <Link
          key={d.label}
          to={d.to}
          className={`group relative flex min-h-[9.5rem] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-e1 transition-all duration-300 hover:-translate-y-1 hover:shadow-e2 sm:min-h-[10.5rem] sm:p-5 ${d.grad}`}
        >
          <d.icon aria-hidden size={110} strokeWidth={1.25} className="pointer-events-none absolute -bottom-5 -right-4 text-white/[0.16] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/25 backdrop-blur-sm">
            <d.icon size={20} />
          </span>
          <span className="relative">
            <span className="block font-display text-lg font-semibold leading-tight sm:text-xl">{d.label}</span>
            <span className="mt-0.5 block text-xs leading-snug text-white/85 sm:text-sm">{d.blurb}</span>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-semibold">
              {d.meta}
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </span>
        </Link>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ the page */

/** The welcome at the top of Home. The search box sits right under it, on the page. */
export function HomeHero({ firstName }: { firstName: string }) {
  return (
      <header className="surface-wood-dark relative overflow-hidden rounded-3xl p-6 shadow-e2 sm:p-9">
        <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 opacity-[0.14]">
          <svg width="260" height="260" viewBox="0 0 260 260" fill="none" stroke="#f6e3c8" strokeWidth="2">
            <circle cx="160" cy="100" r="96" />
            <circle cx="160" cy="100" r="72" />
            <circle cx="160" cy="100" r="48" />
            <circle cx="160" cy="100" r="24" />
          </svg>
        </span>
        <div className="relative max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-white/15">
            <Sparkles size={13} /> {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Discover What’s Next for You
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/75 sm:text-base">
            Meet mentors who have done it, find internships, explore places to learn, and talk to someone when you need to.
          </p>
        </div>
      </header>

  )
}

export function HomeBody({
  mentors,
  institutions,
  roles,
  loading,
  onOpenRole,
}: {
  mentors: MentorListing[]
  institutions: InstitutionPartner[]
  roles: Roles
  loading: boolean
  onOpenRole: (id: string) => void
}) {
  const online = useRoomsOnline(ROOMS_NOW)
  const everyone = uniqueStudents(Object.values(online).flat())
  const [profileOf, setProfileOf] = useState<MentorListing | null>(null)

  const hasRoles = roles.length > 0
  const accepting = mentors.filter((m) => m.accepting !== false)
  // A different mentor in the spotlight each day.
  const day = Math.floor(Date.now() / 86400000)
  const spotlight = accepting.length ? accepting[day % accepting.length] : null

  const doors: Door[] = [
    {
      to: '/community/mentors',
      label: 'Mentors',
      blurb: 'Learn one to one from someone who has done it.',
      icon: GraduationCap,
      grad: 'from-brand-500 to-brand-800',
      meta: loading ? 'Browse' : mentors.length ? plural(mentors.length, 'mentor', 'mentors') : 'Coming soon',
    },
    {
      to: '/community/internships',
      label: 'Internships',
      blurb: 'Real work with partner companies.',
      icon: Briefcase,
      grad: 'from-emerald-500 to-teal-700',
      meta: hasRoles ? plural(roles.length, 'open role', 'open roles') : 'Apply with your CV',
    },
    {
      to: '/community/institutions',
      label: 'Institutions',
      blurb: 'Verified places for classroom learning.',
      icon: Building2,
      grad: 'from-sky-500 to-blue-700',
      meta: loading ? 'Browse' : institutions.length ? plural(institutions.length, 'institution', 'institutions') : 'Coming soon',
    },
    {
      to: '/wellness',
      label: 'Wellness & Guidance',
      blurb: 'Talk privately to a counsellor or career guide.',
      icon: HeartHandshake,
      grad: 'from-rose-500 to-pink-700',
      meta: 'Ask privately',
    },
    {
      to: '/study-rooms',
      label: 'Study Rooms',
      blurb: 'Study alongside others, camera on, no sound.',
      icon: MoonStar,
      grad: 'from-amber-500 to-orange-700',
      meta: everyone.length ? `${everyone.length} studying now` : 'Join a room',
    },
    {
      to: '/study-abroad',
      label: 'Study Abroad',
      blurb: 'Explore countries, universities and what it takes.',
      icon: Plane,
      grad: 'from-violet-500 to-fuchsia-700',
      meta: 'Explore',
    },
  ]

  return (
    <div className="space-y-10">
      {/* Six doors */}
      <section aria-label="Browse">
        <Doors doors={doors} />
      </section>

      {/* Who is studying right now */}
      <section
        aria-label="Studying now"
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <MoonStar size={20} />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-300 ring-2 ring-emerald-600" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-ink-900">
              {everyone.length > 0 ? `${plural(everyone.length, 'student is', 'students are')} studying right now` : 'The study rooms are open'}
            </p>
            <div className="mt-0.5">
              <OnlineNow people={everyone} max={5} empty="Be the first in today. Pick a room and start." />
            </div>
          </div>
        </div>
        <Link
          to="/study-rooms"
          className="press inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-emerald-700"
        >
          Join a Room <ArrowRight size={15} />
        </Link>
      </section>

      {/* A mentor to meet */}
      {spotlight && (
        <section aria-label="Mentor spotlight" className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-amber-50 p-5 shadow-e1 sm:p-8">
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-300/30 blur-3xl" />
          <p className="relative inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
            <Sparkles size={13} /> Meet a Mentor
          </p>
          <div className="relative mt-4 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
            <MentorAvatar mentor={spotlight} size="large" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
                {spotlight.name}
                <BadgeCheck size={20} className="text-emerald-600" aria-label="Verified mentor" />
              </p>
              <p className="mt-0.5 text-sm font-medium text-brand-700">{spotlight.role}</p>
              {spotlight.location && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-500">
                  <MapPin size={12} /> {spotlight.location}
                </p>
              )}
              {spotlight.bio && <p className="mt-3 line-clamp-3 max-w-2xl text-[15px] leading-relaxed text-ink-700">{spotlight.bio}</p>}
              {spotlight.expertise.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {spotlight.expertise.slice(0, 4).map((e) => (
                    <span key={e} className="rounded-full border border-brand-200 bg-white px-2.5 py-1 text-xs font-medium text-brand-700">
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setProfileOf(spotlight)}
              aria-haspopup="dialog"
              className="press inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
            >
              View Profile <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* Mentors */}
      <section aria-label="Mentors">
        <RailHeader
          icon={GraduationCap}
          title="Mentors Who Have Done It"
          subtitle="Open a profile to ask someone to mentor you."
          to="/community/mentors"
          seeAll={mentors.length > 4 ? `All ${mentors.length} Mentors` : 'See Mentors'}
          tint="from-brand-500 to-brand-800"
        />
        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 w-[17rem] shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : mentors.length === 0 ? (
          <p className="card p-6 text-sm text-ink-600">No mentors are listed yet. Check back soon.</p>
        ) : (
          <Rail label="Mentors">
            {mentors.map((m) => (
              <Slot key={m.id}>
                <MentorListingCard mentor={m} />
              </Slot>
            ))}
          </Rail>
        )}
      </section>

      {/* Internships */}
      <section aria-label="Internships">
        <RailHeader
          icon={Briefcase}
          title="Internships"
          subtitle="Real work with partner companies. Apply with your CV: the step that turns practice into experience you can show."
          to="/community/internships"
          seeAll={hasRoles ? `All ${roles.length} Roles` : 'See Internships'}
          tint="from-emerald-500 to-teal-700"
        />
        <Rail label="Internships">
          {[...roles]
            .sort((a, b) => b.posted_on.localeCompare(a.posted_on))
            .map((r) => (
              <Slot key={r.id} wide>
                <InternshipRoleCard role={r} onOpen={() => onOpenRole(r.id)} />
              </Slot>
            ))}
          {INTERNSHIP_TRACKS.map((t) => (
            <Slot key={t.slug} wide>
              <InternshipCard track={t} />
            </Slot>
          ))}
        </Rail>
      </section>

      {/* Institutions */}
      {(loading || institutions.length > 0) && (
        <section aria-label="Institutions">
          <RailHeader
            icon={Building2}
            title="Places to Learn in Person"
            subtitle="Verified training institutions for classroom and offline learning."
            to="/community/institutions"
            seeAll={institutions.length > 3 ? `All ${institutions.length} Institutions` : 'See Institutions'}
            tint="from-sky-500 to-blue-700"
          />
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-44 w-[19rem] shrink-0 rounded-2xl" />
              ))}
            </div>
          ) : (
            <Rail label="Institutions">
              {institutions.map((p) => (
                <Slot key={p.id} wide>
                  <InstitutionListingCard partner={p} />
                </Slot>
              ))}
            </Rail>
          )}
        </section>
      )}

      {/* Someone to talk to */}
      <section aria-label="Wellness and guidance">
        <RailHeader
          icon={HeartHandshake}
          title="Someone to Talk To"
          subtitle="For the moments practice alone can’t fix: overwhelm, self-doubt, or not knowing what’s next."
          to="/wellness"
          seeAll="Your Wellbeing"
          tint="from-rose-500 to-pink-700"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {SERVICES.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>

      {/* Have something to offer */}
      <section aria-label="Offer something" className="rounded-3xl border border-ink-200 bg-white p-5 shadow-e1 sm:p-7">
        <p className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">Have Something to Offer?</p>
        <p className="mt-1 text-sm text-ink-600">Students find the people and places that help them next. Join them.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { to: '/become-a-mentor', label: 'Become a Mentor', body: 'Share what you have learned, one to one.', icon: GraduationCap },
            { to: '/become-an-internship-partner', label: 'Offer Internships', body: 'Give students real work to do.', icon: Briefcase },
            { to: '/become-a-partner-institution', label: 'List Your Institution', body: 'Reach students who want classrooms.', icon: Building2 },
          ].map((o) => (
            <Link
              key={o.to}
              to={o.to}
              className="group flex items-start gap-3 rounded-2xl border border-dashed border-ink-300 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <o.icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 font-semibold text-ink-900">
                  {o.label}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-0.5 block text-sm text-ink-600">{o.body}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {profileOf && <MentorProfileDialog mentor={profileOf} onClose={() => setProfileOf(null)} />}
    </div>
  )
}
