import { useEffect, useState, type ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileBadge,
  Gauge,
  GraduationCap,
  MapPin,
  Plus,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Eyebrow } from '@/components/landing/Eyebrow'
import { GridBackdrop } from '@/components/landing/GridBackdrop'
import { initialsOf } from '@/components/community/Marketplace'
import { hubPage, partnerPage, PartnerFaq, type PartnerKey } from '@/components/partner/PartnerLanding'
import { fetchMentors, type Mentor } from '@/lib/mentors'
import { fetchInstitutionPartners, type InstitutionPartner } from '@/lib/institutionPartners'
import type { PortalRole } from '@/lib/portalAccess'

type IconType = ComponentType<{ size?: number; className?: string }>

const ICONS: Record<string, IconType> = {
  mentors: GraduationCap,
  institutions: Building2,
  companies: Briefcase,
  guides: Compass,
}
const PROOF_ICONS: IconType[] = [ClipboardCheck, Gauge, FileBadge, Award]

const whiteButton =
  'press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50'
const brandButton =
  'press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700'

/** The listings are public (they are also this page's proof that the community
 *  is real), so a signed-out visitor can be shown who is already in it. A list
 *  that fails to load just leaves its part of the page out. */
function usePartners() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [institutions, setInstitutions] = useState<InstitutionPartner[]>([])
  useEffect(() => {
    let active = true
    fetchMentors().then((l) => active && setMentors(l), () => {})
    fetchInstitutionPartners().then((l) => active && setInstitutions(l), () => {})
    return () => {
      active = false
    }
  }, [])
  return { mentors, institutions }
}

function Avatar({ name, src, square = false, size = 'h-10 w-10' }: { name: string; src: string | null; square?: boolean; size?: string }) {
  const shape = square ? 'rounded-lg' : 'rounded-full'
  return src ? (
    <img src={src} alt="" loading="lazy" className={`${size} ${shape} shrink-0 bg-white object-cover`} />
  ) : (
    <span className={`${size} ${shape} flex shrink-0 items-center justify-center bg-brand-600 text-xs font-semibold text-white`}>
      {initialsOf(name)}
    </span>
  )
}

/* ------------------------------------------------------------------ hero */

interface BoardTile {
  key: string
  kind: string
  name: string
  detail: string
  avatar?: { src: string | null; square: boolean }
  /** A place nobody has taken yet: an invitation, never an invented partner. */
  open?: IconType
}

/** The hero's picture of the community: real mentors and institutes, and the
 *  places still open. Never a made-up company. */
function CommunityBoard({ mentors, institutions }: { mentors: Mentor[]; institutions: InstitutionPartner[] }) {
  const tiles: BoardTile[] = [
    ...mentors.slice(0, 2).map((m) => ({
      key: m.id,
      kind: 'Mentor',
      name: m.full_name,
      detail: m.headline,
      avatar: { src: m.avatar_url, square: false },
    })),
    ...institutions.slice(0, 2).map((p) => ({
      key: p.id,
      kind: 'Institute',
      name: p.legal_name,
      detail: p.city ?? 'Training institute',
      avatar: { src: p.logo_url, square: true },
    })),
  ]
  const open: BoardTile[] = [
    { key: 'o-company', kind: 'Company', name: 'Your internship roles', detail: 'Open to join', open: Briefcase },
    { key: 'o-guide', kind: 'Counsellor or guide', name: 'Your profile', detail: 'Open to join', open: Compass },
    { key: 'o-mentor', kind: 'Mentor', name: 'Your profile', detail: 'Open to join', open: GraduationCap },
    { key: 'o-inst', kind: 'Institute', name: 'Your listing', detail: 'Open to join', open: Building2 },
  ]
  const shown = [...tiles, ...open].slice(0, 6)

  return (
    <div className="card-glass-dark glow-edge p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <p className="text-sm font-semibold text-white">{hubPage.boardTitle}</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Open to partners
        </span>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-2.5">
        {shown.map((t) => {
          const OpenIcon = t.open
          return (
            <li
              key={t.key}
              className={`min-w-0 rounded-lg p-3 ${
                OpenIcon ? 'border border-dashed border-white/20' : 'border border-white/10 bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {OpenIcon ? (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/60">
                    <OpenIcon size={16} />
                  </span>
                ) : (
                  <Avatar name={t.name} src={t.avatar?.src ?? null} square={t.avatar?.square} size="h-9 w-9" />
                )}
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-brand-200">{t.kind}</p>
                  <p className={`truncate text-[13px] font-semibold ${OpenIcon ? 'text-white/70' : 'text-white'}`}>{t.name}</p>
                </div>
              </div>
              <p className="mt-2 flex items-center gap-1 truncate text-[11px] text-white/55">
                {OpenIcon ? <Plus size={11} className="shrink-0" /> : <BadgeCheck size={12} className="shrink-0 text-emerald-300" />}
                <span className="truncate">{OpenIcon ? t.detail : t.detail || 'Verified partner'}</span>
              </p>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-white/65">
        <ShieldCheck size={14} className="shrink-0 text-brand-200" />
        {hubPage.boardNote}
      </p>
    </div>
  )
}

function HubHero({ mentors, institutions }: { mentors: Mentor[]; institutions: InstitutionPartner[] }) {
  return (
    <section className="surface-wood-dark relative overflow-hidden">
      <GridBackdrop mask="ellipse 75% 65% at 30% 20%" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-14 sm:px-6 sm:pt-16 sm:pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-8">
        <div className="rise-in">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-medium text-white/85">
            <span className="live-ping relative flex h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
            Mentors · Institutes · Companies<span className="hidden sm:inline"> · Counsellors</span>
          </span>
          <h1 className="mt-5 font-display font-semibold leading-tight tracking-tight text-white">
            <span className="block text-4xl sm:text-5xl lg:text-[3.4rem]">{hubPage.h1}</span>
            <span className="mt-2 block text-2xl text-brand-200 sm:text-3xl">{hubPage.h1Accent}</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">{hubPage.intro}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Link to="/community-portal/signup" className={whiteButton}>
              {hubPage.primaryCta}
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/community-portal/login"
              className="text-center text-sm font-medium text-white/65 transition-colors hover:text-white"
            >
              Already a partner? <span className="font-semibold text-white underline-offset-4 hover:underline">Sign in</span>
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65">
            {hubPage.trust.map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <BadgeCheck size={15} className="text-brand-200" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <CommunityBoard mentors={mentors} institutions={institutions} />
      </div>
    </section>
  )
}

/* ------------------------------------------------------- ways to partner */

function WaysToPartner() {
  return (
    <section className="surface-paper px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <Eyebrow>Partner types</Eyebrow>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">{hubPage.rolesTitle}</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">{hubPage.rolesIntro}</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {hubPage.sections.map((s) => {
            const Icon = ICONS[s.key]
            const joins = s.joins ?? (s.role ? [{ role: s.role, label: s.joinCta }] : [])
            return (
              <article key={s.key} id={s.anchor} className="card lift flex scroll-mt-24 flex-col p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e1">
                    <Icon size={22} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">{s.eyebrow}</p>
                    <h3 className="mt-0.5 font-display text-xl font-semibold text-ink-900">{s.name}</h3>
                    <p className="text-sm font-medium text-ink-600">{s.tagline}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-ink-600">{s.summary}</p>
                <ul className="mt-4 flex-1 space-y-2.5">
                  {s.bullets.map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-sm text-ink-700">
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand-600" />
                      {line}
                    </li>
                  ))}
                </ul>

                {/* Every way in is the same sign-up and the same verification: the role only presets its first step. */}
                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-ink-900/[0.06] pt-5">
                  {joins.map((j) => (
                    <Link key={j.role} to="/community-portal/signup" search={{ role: j.role as PortalRole }} className={brandButton}>
                      {j.label}
                      <ArrowRight size={15} />
                    </Link>
                  ))}
                  {s.learnCta && (
                    <Link
                      to={partnerPage(s.key as PartnerKey).path}
                      className="text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
                    >
                      {s.learnCta}
                    </Link>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------ who is already here */

interface PartnerCard {
  key: string
  kind: string
  name: string
  image: string | null
  square: boolean
  line: string
  place: string | null
  rating: number | null
}

// Spelled out so Tailwind sees each class.
const SM_SPAN: Record<number, string> = { 1: 'sm:col-span-1', 2: 'sm:col-span-2' }
const LG_SPAN: Record<number, string> = { 1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4' }

function AlreadyHere({ mentors, institutions }: { mentors: Mentor[]; institutions: InstitutionPartner[] }) {
  if (mentors.length === 0 && institutions.length === 0) return null
  const count = [
    mentors.length ? `${mentors.length} ${mentors.length === 1 ? 'mentor' : 'mentors'}` : null,
    institutions.length ? `${institutions.length} ${institutions.length === 1 ? 'institute' : 'institutes'}` : null,
  ].filter(Boolean)
  // At most seven, so with the invitation the grid is never more than two rows.
  const cards: PartnerCard[] = [
    ...mentors.slice(0, 4).map((m) => ({
      key: m.id,
      kind: 'Mentor',
      name: m.full_name,
      image: m.avatar_url,
      square: false,
      line: m.headline,
      place: m.location,
      rating: null,
    })),
    ...institutions.slice(0, 3).map((p) => ({
      key: p.id,
      kind: 'Training institute',
      name: p.legal_name,
      image: p.logo_url,
      square: true,
      line: p.courses_offered.slice(0, 3).join(' · '),
      place: p.city,
      rating: p.google_rating,
    })),
  ]

  return (
    <section className="border-t border-ink-900/[0.06] bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <Eyebrow>The community</Eyebrow>
            <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">{hubPage.communityTitle}</h2>
            <p className="mt-3 text-base leading-relaxed text-ink-600">{hubPage.communityIntro}</p>
          </div>
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-800">
            <BadgeCheck size={15} />
            {count.join(' · ')} verified
          </p>
        </div>

        {/* One grid of everyone, closed by the invitation: it takes whatever
            columns the last row has left, so the grid always ends flush. */}
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <li key={c.key} className="flex flex-col rounded-xl border border-ink-900/[0.07] bg-ink-50 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={c.name} src={c.image} square={c.square} size="h-11 w-11" />
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-brand-700">{c.kind}</p>
                  <p className="truncate text-sm font-semibold text-ink-900">{c.name}</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 flex-1 text-[13px] leading-snug text-ink-700">{c.line}</p>
              <p className="mt-3 flex items-center gap-3 text-xs text-ink-500">
                {c.place && (
                  <span className="flex min-w-0 items-center gap-1 truncate">
                    <MapPin size={11} className="shrink-0" />
                    <span className="truncate">{c.place}</span>
                  </span>
                )}
                {c.rating != null && (
                  <span className="flex shrink-0 items-center gap-0.5 font-semibold text-gold-600">
                    <Star size={11} className="fill-current" />
                    {c.rating.toFixed(1)}
                  </span>
                )}
                <span className="ml-auto flex shrink-0 items-center gap-1 font-semibold text-emerald-700">
                  <BadgeCheck size={13} />
                  Verified
                </span>
              </p>
            </li>
          ))}

          <li
            className={`flex flex-col justify-between gap-4 rounded-xl border border-dashed border-brand-300 bg-brand-50/60 p-5 ${SM_SPAN[2 - (cards.length % 2)]} ${LG_SPAN[4 - (cards.length % 4)]} ${
              4 - (cards.length % 4) >= 3 ? 'lg:flex-row lg:items-center' : ''
            }`}
          >
            <div>
              <p className="font-display text-lg font-semibold text-ink-900">Your name could be here</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">
                Companies offering internships, counsellors and career guides are joining now.
              </p>
            </div>
            <div>
              <Link to="/community-portal/signup" className={brandButton}>
                {hubPage.primaryCta}
                <ArrowRight size={15} />
              </Link>
            </div>
          </li>
        </ul>
      </div>
    </section>
  )
}

/* -------------------------------------------------- what students bring */

/** What a partner sees of a student in their portal. An illustration, and
 *  labelled as one: no real student is shown on a public page. */
function ExampleStudent() {
  const score = 72
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="card-glass-dark p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-brand-200">In your partner portal</p>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/70">Example</span>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" />
            <circle
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke="var(--color-brand-300)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - score / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-semibold text-white">{score}</span>
            <span className="text-[10px] text-white/55">out of 100</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-white">A MySkills student</p>
          <p className="text-sm text-white/60">Career Readiness Score</p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
            <BadgeCheck size={12} />
            Built from verified activity
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {[
          { icon: ClipboardCheck, label: 'Aptitude report', value: 'Shared with you' },
          { icon: FileBadge, label: 'Certificates', value: 'SEO · Google Ads · Analytics' },
          { icon: Award, label: 'Projects', value: '2 verified by a mentor' },
        ].map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm">
            <span className="flex items-center gap-2 text-white/75">
              <Icon size={15} className="text-brand-200" />
              {label}
            </span>
            <span className="truncate text-right text-xs font-medium text-white/60">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StudentProof() {
  return (
    <section className="surface-wood-dark relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <GridBackdrop mask="ellipse 60% 70% at 85% 50%" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <Eyebrow dark>Who you will work with</Eyebrow>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">{hubPage.proofTitle}</h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/70">{hubPage.proofIntro}</p>
          <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {hubPage.proof.map((p, i) => {
              const Icon = PROOF_ICONS[i % PROOF_ICONS.length]
              return (
                <li key={p.title} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-200">
                    <Icon size={17} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{p.title}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/60">{p.body}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        <ExampleStudent />
      </div>
    </section>
  )
}

/* ------------------------------------------------------- how it works */

function HowPartnering() {
  return (
    <section className="surface-paper px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <Eyebrow>Verified, every time</Eyebrow>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">{hubPage.howTitle}</h2>
        </div>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {hubPage.howSteps.map((step, i) => (
            <li key={step.title} className="relative">
              {/* The line to the next step, on the row layout only. */}
              {i < hubPage.howSteps.length - 1 && (
                <span aria-hidden className="absolute left-12 right-[-1.5rem] top-5 hidden h-px bg-ink-300 lg:block" />
              )}
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-display text-sm font-semibold text-white shadow-e1">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function ClosingCta() {
  return (
    <section className="bg-ink-100 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
      <div className="surface-wood-dark glow-edge relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 overflow-hidden rounded-xl px-6 py-10 sm:px-10 lg:flex-row lg:items-center">
        <GridBackdrop mask="ellipse 70% 90% at 90% 50%" />
        <div className="relative">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">{hubPage.ctaTitle}</h2>
          <p className="mt-2 max-w-md text-sm text-white/70 sm:text-base">{hubPage.ctaBody}</p>
        </div>
        <div className="relative flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-5">
          <Link to="/community-portal/signup" className={whiteButton}>
            {hubPage.primaryCta}
            <ArrowRight size={16} />
          </Link>
          <Link to="/community-portal/login" className="text-center text-sm font-semibold text-white/75 transition-colors hover:text-white">
            {hubPage.secondaryCta}
          </Link>
        </div>
      </div>
    </section>
  )
}

/**
 * The signed-out Community page: the front door for everyone who works with
 * MySkills students. It reads as a marketplace does: who is in it, the ways to
 * join, what the other side brings, and how joining works. Every button leads
 * to the same sign-up, and so to the same verification.
 */
export function PartnerHub() {
  const { mentors, institutions } = usePartners()
  return (
    <div className="min-h-screen bg-ink-100">
      <Navbar />
      <main>
        <HubHero mentors={mentors} institutions={institutions} />
        <WaysToPartner />
        <AlreadyHere mentors={mentors} institutions={institutions} />
        <StudentProof />
        <HowPartnering />
        <PartnerFaq faqs={hubPage.faqs} title="Common questions" />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  )
}
