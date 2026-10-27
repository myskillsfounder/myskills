import { homeEntry } from '@/lib/guards'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  GraduationCap,
  Heart,
  Plane,
  Plus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuthUser } from '@/lib/useAuth'
import { trackEvent } from '@/lib/analytics'
import { COURSES } from '@/content/courses'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const Route = createFileRoute('/')({
  beforeLoad: homeEntry,
  component: HomePage,
})

/*
 * The home page of the standard website, built from Paul's platform picture
 * (27 Oct 2026): "Your future won't wait", a student at the centre of a ring
 * of light with the platform's five parts on a curved glass bar; then the
 * five parts as photo cards, the partners, the courses, the Global Readiness
 * Score and a last call to take the test. The photos are cut from his
 * picture (public/home/card-*, face-*; the ring holds Paul's own photo; sharper originals can
 * replace them). Learning goes to the courses; Mentorship, Careers, Study
 * Abroad and Wellness are inside the platform, so a visitor signs in first
 * and lands on them (lib/afterLogin.ts). Partners go to the partner sign-up.
 */

type To = '/courses' | '/login' | '/community' | '/study-abroad' | '/community-portal/signup'
type Target = { to: To; search?: Record<string, unknown> }

/** Liquid glass: see-through, frosted, a light top edge and a purple glow. */
const glass =
  'rounded-2xl border border-[#6d7bff]/20 bg-gradient-to-br from-[#1b2470]/45 via-[#0b1438]/40 to-[#060b24]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_16px_44px_-18px_rgba(76,86,240,0.7)] backdrop-blur-xl'

/** The page: deep navy-blue, as in Paul's picture. */
const PAGE = '#040a1e'

const eyebrow = 'text-[11px] font-semibold uppercase tracking-[0.32em] text-[#b9a6ff]'
const h2 = 'mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl'
const gradientText = 'bg-gradient-to-r from-[#8f6bff] via-[#b496ff] to-[#dcc7ff] bg-clip-text text-transparent'
/** Paul's handwritten notes beside the student. */
const hand = "font-['Caveat',cursive] text-white/80"

const primaryCta =
  'press inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#7b6cf6] to-[#4f46e5] px-6 text-[15px] font-semibold text-white shadow-[0_10px_30px_-8px_rgba(99,102,241,0.9)] transition-opacity hover:opacity-90'
const secondaryCta =
  'press inline-flex h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/[0.03] px-6 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/10'

const PARTNER_SIGNUP: Target = { to: '/community-portal/signup' }
const signIn = (next: string): Target => ({ to: '/login', search: { next } })

interface Pillar {
  id: string
  /** On the curved bar. */
  short: string
  /** On its photo card. */
  title: string
  body: string
  cta: string
  icon: LucideIcon
  photo: string
  visitor: Target
  student: Target
}

const PILLARS: Pillar[] = [
  {
    id: 'learning',
    short: 'Learning Programmes',
    title: 'Learning Programmes',
    body: 'Industry-relevant courses, certifications and micro-learning.',
    cta: 'Explore Courses',
    icon: BookOpen,
    photo: 'card-learning',
    visitor: { to: '/courses' },
    student: { to: '/courses' },
  },
  {
    id: 'mentorship',
    short: 'Mentorship',
    title: 'Mentorship',
    body: '1:1 and group sessions with industry experts.',
    cta: 'Meet Mentors',
    icon: Users,
    photo: 'card-mentorship',
    visitor: signIn('/community?category=mentors'),
    student: { to: '/community', search: { category: 'mentors' } },
  },
  {
    id: 'study-abroad',
    short: 'Study Abroad',
    title: 'Study Abroad Services',
    body: 'University guidance, applications and test prep.',
    cta: 'Explore Universities',
    icon: Plane,
    photo: 'card-study-abroad',
    visitor: signIn('/study-abroad'),
    student: { to: '/study-abroad' },
  },
  {
    id: 'career',
    short: 'Career Guidance',
    title: 'Career Guidance',
    body: 'Career counselling, jobs and your first internship.',
    cta: 'Find Opportunities',
    icon: Briefcase,
    photo: 'card-career',
    visitor: signIn('/community?category=internships'),
    student: { to: '/community', search: { category: 'internships' } },
  },
  {
    id: 'wellness',
    short: 'Wellness & Mental Health',
    title: 'Wellness & Mental Health',
    body: 'Counselling, workshops and wellness resources.',
    cta: 'Take Care',
    icon: Heart,
    photo: 'card-wellness',
    visitor: signIn('/community?category=wellness'),
    student: { to: '/community', search: { category: 'wellness' } },
  },
]

const PARTNERS: { icon: LucideIcon; title: string; body: string; photo: string }[] = [
  { icon: GraduationCap, title: 'Institutions', body: 'Colleges, training institutes, skill centres', photo: 'institutions' },
  { icon: Users, title: 'Mentors', body: 'Industry experts, professionals, coaches', photo: 'paul-mentorship' },
  { icon: Plane, title: 'Study Abroad Partners', body: 'Universities, consultants, overseas education providers', photo: 'card-study-abroad' },
  { icon: Briefcase, title: 'Career Partners', body: 'Companies, internship providers, hiring partners', photo: 'card-career' },
]

/** The parts of the Global Readiness Score (method v8). */
const SCORE_PARTS: { title: string; body: string; points: number; bar: string }[] = [
  { title: 'Personal skills', body: 'Global Leadership: the 14 skills employers hire for', points: 40, bar: 'from-amber-300 to-orange-500' },
  { title: 'Professional skills', body: 'The professional courses you take', points: 40, bar: 'from-brand-300 to-brand-600' },
  { title: 'Your first internship', body: 'Signed off by the company you worked with', points: 20, bar: 'from-emerald-300 to-teal-500' },
]

const BANDS = ['Getting started', 'Building', 'Strong', 'Standout']

const target = (p: Pillar, signedIn: boolean) => (signedIn ? p.student : p.visitor)

/** A row of faces, overlapping, in rings of the page's navy. */
function Faces({ faces, size = 'h-9 w-9' }: { faces: string[]; size?: string }) {
  return (
    <span className="flex -space-x-2.5">
      {faces.map((f) => (
        <img key={f} src={`/home/${f}.webp`} alt="" className={`${size} rounded-full object-cover ring-2 ring-[#040a1e]`} />
      ))}
    </span>
  )
}

/** A glass note floating beside the student. */
function Note({ icon: Icon, title, className = '', children }: { icon: LucideIcon; title: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={`${glass} absolute flex items-start gap-3 p-3.5 ${className}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6a55e6] to-[#4338ca] text-white shadow-[0_0_20px_rgba(99,102,241,0.6)] ring-1 ring-white/20">
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="font-display text-[14px] font-semibold leading-snug text-white">{title}</p>
        {children}
      </div>
    </div>
  )
}

/** How far each of the five parts rises on the curved bar, its ends highest. */
const BAR_LIFT = ['-translate-y-6', '-translate-y-1.5', 'translate-y-0.5', '-translate-y-1.5', '-translate-y-6']

/** The student at the centre: a ring of light, three notes, the curved bar of the five parts. */
function StudentStage({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="relative mx-auto h-[31rem] w-full max-w-[38rem]">
      {/* Indigo light around the ring. */}
      <span aria-hidden className="absolute left-1/2 top-0 h-[27rem] w-[27rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(70,80,220,0.45),rgba(40,46,150,0.2)_55%,rgba(4,10,30,0)_72%)] blur-2xl" />

      {/* A real photo, framed in the ring (Paul, 27 Oct: "more realistic, not
          a cut-out"; the learning pose in the black sweatshirt): it fills the circle, tinted into the page's blues and
          shaded at the foot where the bar crosses it. */}
      <div className="absolute left-1/2 top-4 h-[24rem] w-[24rem] -translate-x-1/2 overflow-hidden rounded-full">
        <img src="/home/paul-study.webp" alt="A student learning at his desk" className="h-full w-full object-cover object-[50%_35%]" />
        <span aria-hidden className="absolute inset-0 bg-[#3b3fd1]/25 mix-blend-color" />
        <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,transparent_45%,rgba(4,10,30,0.55)_100%)]" />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#040a1e]/90 to-transparent" />
      </div>
      {/* The ring's line: bright violet-blue. */}
      <span
        aria-hidden
        className="absolute left-1/2 top-4 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full p-[2px] [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)] bg-[conic-gradient(from_200deg,rgba(124,92,246,0.2),#8f6bff_25%,#c9b8ff_38%,#6d7bff_55%,rgba(109,123,255,0.25)_75%,rgba(124,92,246,0.2))]"
        style={{ filter: 'drop-shadow(0 0 12px rgba(124,108,255,0.8))' }}
      />
      <span aria-hidden className="absolute left-1/2 top-0 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full border border-[#8f9bff]/15" />

      {/* Paul's handwriting. */}
      <p aria-hidden className={`${hand} absolute left-[2%] top-0 -rotate-[10deg] text-[1.15rem] leading-tight`}>
        Learn
        <br />
        Build Skills
        <br />
        Get Guidance
        <br />
        Grow
      </p>
      <svg aria-hidden className="absolute left-[17%] top-[15%] h-10 w-14 text-white/60" viewBox="0 0 64 48" fill="none">
        <path d="M4 6 C 30 4, 48 18, 52 40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M44 34 L52 41 L56 31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p aria-hidden className={`${hand} absolute right-0 top-[64%] rotate-[-10deg] text-right text-[1.1rem] leading-tight`}>
        More
        <br />
        than just
        <br />
        courses
      </p>

      <Note icon={BookOpen} title="Expert Mentorship" className="left-0 top-[30%] w-52">
        <span className="mt-2.5 flex items-center gap-2">
          <Faces faces={['paul-mentor', 'face-2', 'face-3']} size="h-8 w-8" />
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80">
            <Plus size={14} />
          </span>
        </span>
      </Note>
      <Link
        to="/courses"
        onClick={() => trackEvent('home_note', { note: 'path' })}
        className="group absolute right-0 top-[5%] w-56 transition-transform hover:-translate-y-0.5"
      >
        <Note icon={BarChart3} title="Personalised Learning Path" className="relative inset-auto w-full pr-10">
          <p className="mt-1 text-xs font-medium text-[#b9a6ff]">Powered by AI</p>
          <ArrowRight size={16} className="absolute bottom-4 right-4 text-[#b9a6ff] transition-transform group-hover:translate-x-0.5" />
        </Note>
      </Link>
      <Note icon={Briefcase} title="Real-world Opportunities" className="right-0 top-[33%] w-56">
        <p className="mt-1.5 text-xs leading-relaxed text-white/60">
          Internships · Jobs
          <br />
          Projects · Global Exposure
        </p>
      </Note>

      {/* The curved glass bar, the ring's lower edge: the five parts of the platform. */}
      <nav aria-label="The platform" className="absolute inset-x-0 bottom-0 h-32">
        <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 600 144" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="bar-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2a2f8f" stopOpacity="0.55" />
              <stop offset="1" stopColor="#070c28" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="bar-edge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#6d7bff" stopOpacity="0.35" />
              <stop offset="0.5" stopColor="#a48bff" />
              <stop offset="1" stopColor="#6d7bff" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <path d="M6 18 Q 300 92 594 18 L 594 78 Q 300 150 6 78 Z" fill="url(#bar-fill)" />
          <path d="M6 18 Q 300 92 594 18" stroke="url(#bar-edge)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 6px rgba(140,120,255,0.9))' }} />
          <path d="M6 78 Q 300 150 594 78" stroke="#6d7bff" strokeOpacity="0.25" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d="M6 18 L 6 78 M594 18 L 594 78" stroke="#6d7bff" strokeOpacity="0.3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        <ul className="relative grid h-full grid-cols-5 px-2 pt-9">
          {PILLARS.map((p, i) => {
            const to = target(p, signedIn)
            return (
              <li key={p.id} className={BAR_LIFT[i]}>
                <Link
                  to={to.to}
                  search={to.search as never}
                  onClick={() => trackEvent('home_pillar', { pillar: p.id, signed_in: signedIn, place: 'bar' })}
                  className="flex flex-col items-center gap-1.5 px-1 text-center text-[12px] font-medium leading-tight text-white transition-colors hover:text-[#dcc7ff]"
                >
                  <p.icon size={22} strokeWidth={1.5} className="text-[#d6bcff] drop-shadow-[0_0_8px_rgba(180,150,255,0.8)]" />
                  {p.short}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

/** One of the five parts as a photo card. */
function PillarCard({ p, n, signedIn }: { p: Pillar; n: number; signedIn: boolean }) {
  const to = target(p, signedIn)
  return (
    <Link
      to={to.to}
      search={to.search as never}
      onClick={() => trackEvent('home_pillar', { pillar: p.id, signed_in: signedIn, place: 'card' })}
      className={`${glass} group relative flex min-h-[15.5rem] flex-col overflow-hidden p-5 transition-colors hover:border-brand-300/50`}
    >
      <img
        src={`/home/${p.photo}.webp`}
        alt=""
        loading="lazy"
        className="absolute right-0 top-0 h-[80%] w-[62%] object-cover object-[50%_20%] transition-transform duration-500 group-hover:scale-105 [mask-image:linear-gradient(to_left,black_45%,transparent),linear-gradient(to_top,transparent,black_35%)] [mask-composite:intersect]"
        style={{ WebkitMaskComposite: 'source-in' }}
      />
      <span className="relative">
        <p.icon size={28} strokeWidth={1.5} className="text-[#cdb5f8]" />
      </span>
      <span className="relative mt-4 font-mono text-[11px] text-white/50">0{n}</span>
      <span className="relative mt-1 block max-w-[85%] font-display text-lg font-semibold leading-snug text-white [text-shadow:0_1px_14px_rgba(4,10,30,0.95)]">{p.title}</span>
      <span className="relative mt-1.5 block max-w-[80%] text-[13px] leading-relaxed text-white/70 [text-shadow:0_1px_10px_rgba(4,10,30,0.95)]">{p.body}</span>
      <span className="relative mt-auto inline-flex w-fit items-center gap-2 rounded-lg border border-white/25 bg-[#040a1e]/50 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors group-hover:border-brand-200/60 group-hover:bg-white/10">
        {p.cta} <ArrowRight size={14} />
      </span>
    </Link>
  )
}

function PartnerCard({ p }: { p: (typeof PARTNERS)[number] }) {
  return (
    <Link
      to={PARTNER_SIGNUP.to}
      onClick={() => trackEvent('home_partner', { partner: p.title })}
      className={`${glass} group relative flex min-h-[5.5rem] items-center overflow-hidden py-3 pl-4 pr-28 transition-colors hover:border-brand-300/50`}
    >
      <img
        src={`/home/${p.photo}.webp`}
        alt=""
        loading="lazy"
        className="absolute inset-y-0 right-0 h-full w-32 object-cover object-[50%_25%] opacity-90 [mask-image:linear-gradient(to_left,black_45%,transparent)]"
      />
      <span className="relative flex items-center gap-3">
        <p.icon size={24} fill="currentColor" className="shrink-0 text-white" />
        <span className="min-w-0">
          <span className="block font-display text-[15px] font-semibold leading-tight text-white">{p.title}</span>
          <span className="mt-0.5 block text-[12px] leading-snug text-white/65">{p.body}</span>
        </span>
      </span>
    </Link>
  )
}

function SectionHead({ kicker, title, accent, body }: { kicker: string; title: string; accent: string; body?: string }) {
  return (
    <div className="max-w-2xl">
      <p className={eyebrow}>{kicker}</p>
      <h2 className={h2}>
        {title} <span className={gradientText}>{accent}</span>
      </h2>
      {body && <p className="mt-3 text-base leading-relaxed text-white/70">{body}</p>}
    </div>
  )
}

function HomePage() {
  const { user } = useAuthUser()
  const signedIn = Boolean(user)

  return (
    <div className="min-h-screen" style={{ background: PAGE }}>
      <Navbar dark />

      <main className="relative overflow-hidden bg-[#040a1e] bg-[radial-gradient(42rem_34rem_at_68%_22%,rgba(56,64,200,0.45),transparent_70%),radial-gradient(30rem_24rem_at_72%_8%,rgba(124,92,246,0.30),transparent_70%),radial-gradient(40rem_30rem_at_0%_30%,rgba(30,40,120,0.30),transparent_70%),radial-gradient(50rem_30rem_at_50%_100%,rgba(40,50,150,0.25),transparent_70%)]">
        {/* 1. Your future won't wait. */}
        <section className="relative mx-auto max-w-7xl px-4 pb-6 pt-10 sm:px-6 sm:pt-14 lg:px-8">
          <div className="grid items-center gap-8 xl:grid-cols-[1fr_38rem] xl:gap-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/75">
                Learn <span className="mx-1.5 text-[#8f6bff]">•</span> Get guidance <span className="mx-1.5 text-[#8f6bff]">•</span> Build skills{' '}
                <span className="mx-1.5 text-[#8f6bff]">•</span> Grow
              </p>
              <h1 className="mt-5 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-6xl xl:text-[4rem]">
                <span className="block">Your future won’t wait.</span> <span className={`block pb-2 ${gradientText}`}>Neither should your learning.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
                AI-guided learning, expert mentorship, career guidance and real-world opportunities: everything a student needs,
                in one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/courses" onClick={() => trackEvent('home_cta', { cta: 'explore', place: 'hero' })} className={primaryCta}>
                  Explore MySkills <ArrowRight size={18} />
                </Link>
                <Link to={PARTNER_SIGNUP.to} onClick={() => trackEvent('home_cta', { cta: 'partner', place: 'hero' })} className={secondaryCta}>
                  Partner with us
                </Link>
              </div>
              <div className="mt-9 flex items-center gap-4">
                <Faces faces={['face-1', 'face-4', 'face-3', 'face-2']} />
                <p className="text-sm leading-snug text-white/70">
                  Join a growing community
                  <br />
                  of ambitious learners.
                </p>
              </div>
            </div>

            <StudentStage signedIn={signedIn} />
          </div>
        </section>

        {/* 2. The five parts of the platform. */}
        <section className="relative mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {PILLARS.map((p, i) => (
              <PillarCard key={p.id} p={p} n={i + 1} signedIn={signedIn} />
            ))}
          </div>
        </section>

        {/* 3. Our partners and providers. */}
        <section className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className={`${glass} grid gap-4 p-4 lg:grid-cols-[14rem_1fr] lg:items-center`}>
            <div className="px-2 py-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white">Our partners &amp; providers</p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/60">
                We work with institutions, mentors and service providers to deliver everything a student needs.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {PARTNERS.map((p) => (
                <PartnerCard key={p.title} p={p} />
              ))}
            </div>
          </div>
        </section>

        {/* 4. The courses. */}
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead kicker="Learning programmes" title="Skills for" accent="the AI era." />
            <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#b9a6ff] hover:text-white">
              All courses <ArrowRight size={15} />
            </Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {COURSES.map((c) => (
              <article key={c.id} className={`${glass} flex flex-col p-5`}>
                <div className="flex items-start justify-between gap-2">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white ring-1 ring-white/20 ${c.tile}`}>
                    <c.icon size={20} />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide ${c.status === 'open' ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-400/15 text-amber-200'}`}
                  >
                    {c.status === 'open' ? 'Open' : 'Opens soon'}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-white">{c.title}</h3>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/45">
                  {c.kind === 'personal' ? 'Personal skills' : 'Professional skills'}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{c.tagline}</p>
                <div className="mt-auto pt-5">
                  {c.test ? (
                    <a
                      href={c.test}
                      onClick={() => trackEvent('home_course_test', { course: c.id })}
                      className="press inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-sm font-semibold text-ink-900 transition-colors hover:bg-brand-50"
                    >
                      Take the aptitude test <ArrowRight size={15} />
                    </a>
                  ) : (
                    <Link
                      to="/courses"
                      className="press inline-flex h-10 w-full items-center justify-center rounded-full border border-white/25 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      Tell me when it opens
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 5. The Global Readiness Score. */}
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className={`${glass} grid gap-10 overflow-hidden p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center`}>
            <div>
              <p className={eyebrow}>Global Readiness Score</p>
              <h2 className={h2}>
                One score that shows <span className={gradientText}>you’re ready.</span>
              </h2>
              <p className="mt-3 text-base leading-relaxed text-white/70">
                Everything you do on MySkills adds up to one score out of 100: the number companies look at when they choose
                interns. Every point is graded by a mentor or checked by our team, so it means something.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {BANDS.map((b, i) => (
                  <span
                    key={b}
                    className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/75"
                    style={{ background: `rgba(143,133,238,${0.06 + i * 0.08})` }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <ul className="space-y-5">
              {SCORE_PARTS.map((s) => (
                <li key={s.title}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-white">{s.title}</span>
                    <span className="font-display text-lg font-bold text-white">
                      {s.points}
                      <span className="text-xs font-medium text-white/50"> points</span>
                    </span>
                  </div>
                  <p className="text-sm text-white/55">{s.body}</p>
                  <span className="mt-2 block h-2 overflow-hidden rounded-full bg-white/10">
                    <span className={`block h-full rounded-full bg-gradient-to-r ${s.bar}`} style={{ width: `${s.points * 2.5}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. Step in. */}
        <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-brand-200/25 bg-gradient-to-br from-brand-600/40 via-brand-700/25 to-fuchsia-600/20 px-6 py-12 text-center shadow-[0_0_80px_-20px_rgba(143,133,238,0.7)] sm:px-12">
            <span aria-hidden className="absolute -top-24 left-1/2 h-48 w-[70%] -translate-x-1/2 rounded-full bg-brand-300/30 blur-3xl" />
            <h2 className="relative font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Your future starts with five minutes.</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-white/75">
              Take a free aptitude test, see your strongest skills, and step into the AI era with a plan.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/courses" onClick={() => trackEvent('home_cta', { cta: 'test', place: 'end' })} className={primaryCta}>
                Take the free aptitude test <ArrowRight size={17} />
              </Link>
              {!signedIn && (
                <Link to="/signup" onClick={() => trackEvent('home_cta', { cta: 'signup', place: 'end' })} className={secondaryCta}>
                  Create a free account
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
