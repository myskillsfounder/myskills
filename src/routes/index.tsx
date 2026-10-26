import { homeEntry } from '@/lib/guards'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bot,
  Briefcase,
  Compass,
  GraduationCap,
  Heart,
  MessageSquareText,
  Plane,
  Sparkles,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuthUser } from '@/lib/useAuth'
import { trackEvent } from '@/lib/analytics'
import { setSiteMode } from '@/lib/siteMode'
import { COURSES } from '@/content/courses'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const Route = createFileRoute('/')({
  beforeLoad: homeEntry,
  component: HomePage,
})

/*
 * The home page of the standard website (Paul, 26 Oct 2026): one platform for
 * every need a student has as they step into the AI era. It reads top to
 * bottom as the student's story: step into the AI zone, the journey every
 * course follows, the five needs the platform takes care of, the courses, the
 * Global Readiness Score, the AI at every step, and the partners behind it.
 * Liquid-glass cards on deep navy, in the brand's purple. Every pillar and
 * course is a link; the aptitude test is the highlighted call to action.
 */

type To = '/courses' | '/signup' | '/community' | '/study-abroad'
type Target2 = { to: To; search?: Record<string, unknown> }

/** Liquid glass: see-through, frosted, a light top edge and a purple glow. */
const glass =
  'rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.10] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_40px_-18px_rgba(108,92,231,0.75)] backdrop-blur-xl'

const eyebrow = 'text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-200'
const h2 = 'mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl'
const gradientText = 'bg-gradient-to-r from-brand-200 via-brand-300 to-fuchsia-300 bg-clip-text text-transparent'

/** The highlighted call to action: the free aptitude test (Paul, 26 Oct). */
const primaryCta =
  'press inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink-900 shadow-[0_0_32px_rgba(143,133,238,0.55)] transition-colors hover:bg-brand-50'
const secondaryCta =
  'press inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-white/[0.04] px-6 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/10'

const PARTNERS_HUB: Target2 = { to: '/community', search: { partners: true } }

const PARTNERS: { icon: LucideIcon; title: string; body: string; photo: string }[] = [
  { icon: GraduationCap, title: 'Institutions', body: 'Colleges, training institutes, skill centres', photo: 'institutions' },
  { icon: Users, title: 'Mentors', body: 'Industry experts, professionals, coaches', photo: 'mentors' },
  { icon: Plane, title: 'Study Abroad Partners', body: 'Universities, consultants, overseas education', photo: 'study-abroad' },
  { icon: Briefcase, title: 'Career Partners', body: 'Companies, internship providers, hiring partners', photo: 'career' },
  { icon: Heart, title: 'Wellness Partners', body: 'Therapists, counsellors, wellness platforms', photo: 'wellness' },
]

interface Pillar {
  id: string
  title: string
  body: string
  /** The longer line on the "everything you need" cards. */
  more: string
  icon: LucideIcon
  photo?: string
  visitor: Target2
  student: Target2
}

const PILLAR: Record<'learning' | 'mentorship' | 'abroad' | 'career' | 'wellness', Pillar> = {
  learning: {
    id: 'learning',
    title: 'Learning Programmes',
    body: 'Courses, certificates, micro-learning',
    more: 'AI-powered courses in personal and professional skills, each starting with a free aptitude test and ending with a project a mentor grades.',
    icon: BookOpen,
    photo: 'institutions',
    visitor: { to: '/courses' },
    student: { to: '/courses' },
  },
  mentorship: {
    id: 'mentorship',
    title: 'Mentorship',
    body: '1:1 and group sessions with experts',
    more: 'Industry experts who guide you through live sessions and grade the real project you build.',
    icon: Users,
    photo: 'mentors',
    visitor: { to: '/signup' },
    student: { to: '/community', search: { category: 'mentors' } },
  },
  career: {
    id: 'career',
    title: 'Career & Internships',
    body: 'Counselling, jobs and internships',
    more: 'Career guidance and your first internship with a partner company: hands-on, real experience you can show.',
    icon: Briefcase,
    photo: 'career',
    visitor: { to: '/signup' },
    student: { to: '/community', search: { category: 'internships' } },
  },
  abroad: {
    id: 'study-abroad',
    title: 'Study Abroad',
    body: 'Universities, applications, test prep',
    more: 'Partner universities abroad, help with your applications and the tests you need to get in.',
    icon: Plane,
    photo: 'study-abroad',
    visitor: { to: '/signup' },
    student: { to: '/study-abroad' },
  },
  wellness: {
    id: 'wellness',
    title: 'Wellness & Mental Health',
    body: 'Counselling and wellness resources',
    more: 'Someone to talk to, privately, when you need it, and resources to look after yourself.',
    icon: Heart,
    photo: 'wellness',
    visitor: { to: '/signup' },
    student: { to: '/community', search: { category: 'wellness' } },
  },
}

/** The journey every course follows, from the courses page. */
const JOURNEY: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Target, title: 'Know your aptitude', body: 'A free test shows your strengths before you start. No account needed.' },
  { icon: Bot, title: 'Learn with an AI coach', body: 'Short modules and real scenarios, with feedback as you practise.' },
  { icon: Users, title: 'Prove it with a mentor', body: 'A real project, graded by an industry mentor.' },
  { icon: Briefcase, title: 'Land your first internship', body: 'Hands-on, real experience with a partner company.' },
  { icon: Trophy, title: 'Grow your score', body: 'Every step adds to your Global Readiness Score.' },
]

/** The AI at every step of the platform. */
const AI_STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Compass, title: 'An AI guide', body: 'Tell it what you want in one sentence and it shows you where to start.' },
  { icon: Target, title: 'Aptitude tests first', body: 'Know your strongest skills before you spend an hour learning.' },
  { icon: Bot, title: 'An AI coach in every course', body: 'Practise on real scenarios and get feedback on every answer.' },
  { icon: MessageSquareText, title: 'Notes from your coach', body: 'A personal note on what you did well and what to work on next.' },
]

/** The parts of the Global Readiness Score (method v8). */
const SCORE_PARTS: { title: string; body: string; points: number; bar: string }[] = [
  { title: 'Personal skills', body: 'Global Leadership: the 14 skills employers hire for', points: 40, bar: 'from-amber-300 to-orange-500' },
  { title: 'Professional skills', body: 'The professional courses you take', points: 40, bar: 'from-brand-300 to-brand-600' },
  { title: 'Your first internship', body: 'Signed off by the company you worked with', points: 20, bar: 'from-emerald-300 to-teal-500' },
]

const BANDS = ['Getting started', 'Building', 'Strong', 'Standout']

function PartnerCard({ p, wide = false }: { p: (typeof PARTNERS)[number]; wide?: boolean }) {
  return (
    <Link
      to={PARTNERS_HUB.to}
      search={PARTNERS_HUB.search as never}
      onClick={() => trackEvent('home_partner', { partner: p.title })}
      className={`${glass} group relative flex min-h-[5.5rem] items-center overflow-hidden py-3 pl-4 pr-24 transition-colors hover:border-brand-300/50 ${wide ? 'sm:col-span-2' : ''}`}
    >
      {/* The photo on the right, fading into the glass. */}
      <img
        src={`/home/${p.photo}.webp`}
        alt=""
        loading="lazy"
        className="absolute inset-y-0 right-0 h-full w-28 object-cover opacity-90 [mask-image:linear-gradient(to_left,black_45%,transparent)]"
      />
      <span className="relative flex items-center gap-3">
        <p.icon size={22} className="shrink-0 text-white" />
        <span className="min-w-0">
          <span className="block font-display text-[15px] font-semibold leading-tight text-white">{p.title}</span>
          <span className="mt-0.5 block text-[12px] leading-snug text-white/65">{p.body}</span>
        </span>
      </span>
    </Link>
  )
}

/** A pillar as a floating holographic chip around the AI zone. */
function HoloChip({ p, signedIn, className = '' }: { p: Pillar; signedIn: boolean; className?: string }) {
  const target = signedIn ? p.student : p.visitor
  return (
    <Link
      to={target.to}
      search={target.search as never}
      onClick={() => trackEvent('home_pillar', { pillar: p.id, signed_in: signedIn, place: 'zone' })}
      className={`${glass} group flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brand-200/60 ${className}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400/70 to-brand-700/70 text-white shadow-[0_0_16px_rgba(143,133,238,0.6)] ring-1 ring-white/25">
        <p.icon size={16} strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold leading-tight text-white">{p.title}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-white/60">{p.body}</span>
      </span>
    </Link>
  )
}

/** A pillar as a large card in "everything you need". */
function NeedCard({ p, signedIn, wide = false }: { p: Pillar; signedIn: boolean; wide?: boolean }) {
  const target = signedIn ? p.student : p.visitor
  return (
    <Link
      to={target.to}
      search={target.search as never}
      onClick={() => trackEvent('home_pillar', { pillar: p.id, signed_in: signedIn, place: 'needs' })}
      className={`${glass} group relative flex min-h-[13rem] flex-col justify-end overflow-hidden p-5 transition-colors hover:border-brand-300/50 ${wide ? 'lg:col-span-2' : ''}`}
    >
      {p.photo && (
        <img
          src={`/home/${p.photo}.webp`}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-35 transition-opacity duration-300 [mask-image:linear-gradient(to_top,transparent_15%,black_85%)] group-hover:opacity-50"
        />
      )}
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400/80 to-brand-700/80 text-white shadow-[0_0_20px_rgba(143,133,238,0.6)] ring-1 ring-white/25">
        <p.icon size={19} strokeWidth={1.8} />
      </span>
      <span className="relative mt-4 block font-display text-xl font-semibold text-white">{p.title}</span>
      <span className="relative mt-1.5 block max-w-md text-sm leading-relaxed text-white/70">{p.more}</span>
      <span className="relative mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-200 transition-colors group-hover:text-white">
        {p.id === 'learning' ? 'See the courses' : signedIn ? 'Open' : 'Join free'} <ArrowRight size={14} />
      </span>
    </Link>
  )
}

/** The student stepping into the AI zone: a glowing portal with a turning ring of light. */
function AiPortal({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const ring = size === 'lg' ? 'h-56 w-56' : 'h-44 w-44'
  return (
    <Link to="/courses" aria-label="Step in: start with a course" className={`group relative block ${ring}`}>
      <span aria-hidden className="absolute -inset-10 rounded-full bg-brand-500/40 blur-3xl" />
      {/* The turning ring of light. */}
      <span
        aria-hidden
        className="absolute -inset-1.5 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,#8f85ee_70deg,#e4e0ff_110deg,transparent_160deg,transparent_200deg,#6c5ce7_270deg,transparent_330deg)] [mask:radial-gradient(farthest-side,transparent_calc(100%-3px),black_calc(100%-2px))] motion-safe:animate-[spin_14s_linear_infinite]"
      />
      <span aria-hidden className="absolute inset-2 rounded-full border border-brand-200/30" />
      <img
        src="/home/student.webp"
        alt="A student stepping into the AI zone"
        className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] rounded-full object-cover shadow-[0_0_60px_rgba(143,133,238,0.7)] ring-2 ring-white/25"
      />
      {/* A band of light passing over the portal. */}
      <span aria-hidden className="absolute inset-4 overflow-hidden rounded-full">
        <span className="absolute inset-x-0 top-1/3 h-8 bg-gradient-to-b from-transparent via-brand-200/25 to-transparent motion-safe:animate-pulse" />
      </span>
    </Link>
  )
}

/** The glowing grid floor of the AI zone, receding to a bright horizon. */
function GridFloor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-[-8%] bottom-0 h-[46%] overflow-hidden [mask-image:linear-gradient(to_top,black_30%,transparent)]">
      <div
        className="absolute inset-x-0 -top-1/2 h-[200%] origin-top"
        style={{
          backgroundImage:
            'linear-gradient(rgba(164,154,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(164,154,255,0.35) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          transform: 'perspective(420px) rotateX(62deg)',
        }}
      />
    </div>
  )
}

/** Small points of light in the zone, in percent of its width and height. */
const SPARKS: [number, number][] = [
  [12, 30], [22, 62], [35, 18], [64, 12], [78, 36], [88, 64], [52, 78], [8, 80], [70, 82], [44, 40],
]

/** The AI zone: the student in the portal, the five pillars floating around them. */
function AiZone({ signedIn }: { signedIn: boolean }) {
  const P = PILLAR
  return (
    <>
      <div className="relative mx-auto hidden h-[30rem] w-full max-w-[36rem] sm:block">
        <GridFloor />
        <span aria-hidden className="absolute bottom-[40%] left-1/2 h-20 w-[85%] -translate-x-1/2 rounded-[50%] bg-brand-400/35 blur-3xl" />
        <span aria-hidden className="absolute left-1/2 top-[43%] h-[62%] w-[96%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-brand-200/20" />
        {SPARKS.map(([x, y], i) => (
          <span
            key={i}
            aria-hidden
            className="absolute h-1 w-1 rounded-full bg-brand-100 shadow-[0_0_8px_2px_rgba(196,190,255,0.8)] motion-safe:animate-pulse"
            style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.4}s` }}
          />
        ))}

        {/* Beams from each pillar to the student. */}
        <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 576 480" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="beam" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#c4beff" stopOpacity="0.7" />
              <stop offset="1" stopColor="#8f85ee" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {[
            [160, 80],
            [416, 80],
            [160, 262],
            [416, 262],
            [288, 410],
          ].map(([x, y]) => (
            <path key={`${x}-${y}`} d={`M${x} ${y} L288 206`} stroke="url(#beam)" strokeWidth="1" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>

        <div className="absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2">
          <AiPortal />
        </div>
        <p className="absolute left-1/2 top-[71%] -translate-x-1/2 whitespace-nowrap text-center text-xs font-medium tracking-wide text-white/75">
          <span className="font-display text-base font-bold text-white">You</span>
          <span className="mx-2 text-brand-300">·</span>Learn · Get guidance · Build skills · Grow
        </p>

        <HoloChip p={P.learning} signedIn={signedIn} className="absolute left-[1%] top-[8%] w-40" />
        <HoloChip p={P.mentorship} signedIn={signedIn} className="absolute right-[1%] top-[8%] w-40" />
        <HoloChip p={P.abroad} signedIn={signedIn} className="absolute left-0 top-[46%] w-40" />
        <HoloChip p={P.career} signedIn={signedIn} className="absolute right-0 top-[46%] w-40" />
        <HoloChip p={P.wellness} signedIn={signedIn} className="absolute bottom-[2%] left-1/2 w-56 -translate-x-1/2" />
      </div>

      {/* A narrow window: the portal alone; the pillars follow as cards below. */}
      <div className="mt-4 flex flex-col items-center sm:hidden">
        <AiPortal size="sm" />
        <p className="mt-6 text-xs text-white/75">
          <span className="font-display text-base font-bold text-white">You</span> · Learn · Get guidance · Build skills · Grow
        </p>
      </div>
    </>
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
  const P = PILLAR

  return (
    <div className="min-h-screen bg-[#0b0a1c]">
      <Navbar dark />

      <main className="relative overflow-hidden bg-[#0b0a1c] bg-[radial-gradient(50rem_34rem_at_75%_8%,rgba(108,92,231,0.30),transparent_70%),radial-gradient(40rem_30rem_at_0%_30%,rgba(108,92,231,0.14),transparent_70%),radial-gradient(44rem_30rem_at_100%_60%,rgba(143,133,238,0.12),transparent_70%),radial-gradient(40rem_30rem_at_10%_95%,rgba(108,92,231,0.16),transparent_70%)]">
        {/* 1. Step into the AI era. */}
        <section className="relative mx-auto max-w-[72rem] px-4 pb-8 pt-10 sm:px-6 sm:pt-14 lg:px-8">
          <div className="grid items-center gap-6 xl:grid-cols-[1fr_36rem] xl:gap-10">
            <div className="text-center xl:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200/25 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-brand-100 backdrop-blur">
                <Sparkles size={13} /> The student development platform · Powered by AI
              </span>
              <h1 className="mt-5 font-display text-4xl font-bold leading-[1.06] tracking-tight text-white sm:text-5xl xl:text-[3.6rem]">
                Learning centred around you, <span className={gradientText}>as you step into the AI era.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg xl:mx-0">
                Courses with an AI coach, real mentors, your first internship, study abroad and wellness support. Every
                need a student has, in one place. Start by finding out your aptitude, free.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 xl:justify-start">
                <Link to="/courses" onClick={() => trackEvent('home_cta', { cta: 'test', place: 'hero' })} className={primaryCta}>
                  Take the free aptitude test <ArrowRight size={17} />
                </Link>
                {signedIn ? (
                  <Link to="/dashboard" className={secondaryCta}>
                    Go to my dashboard
                  </Link>
                ) : (
                  <Link
                    to="/start"
                    onClick={() => {
                      setSiteMode('ai')
                      trackEvent('home_cta', { cta: 'guide', place: 'hero' })
                    }}
                    className={secondaryCta}
                  >
                    <Compass size={16} /> Let AI find my starting point
                  </Link>
                )}
              </div>
              <ul className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/60 xl:justify-start">
                {['Free to start', 'No account for the test', 'Mentor-graded projects'].map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <BadgeCheck size={15} className="text-emerald-300" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <AiZone signedIn={signedIn} />
          </div>
        </section>

        {/* 2. The journey every course follows. */}
        <section className="relative mx-auto max-w-[72rem] px-4 py-16 sm:px-6 lg:px-8">
          <SectionHead kicker="Your journey" title="From your first test to" accent="your first internship." />
          <ol className="relative mt-10 grid gap-8 md:grid-cols-5 md:gap-4">
            {/* The line of light the steps sit on. */}
            <span aria-hidden className="absolute left-[10%] right-[10%] top-6 hidden h-px bg-gradient-to-r from-brand-300/0 via-brand-300/70 to-brand-300/0 md:block" />
            {JOURNEY.map((s, i) => (
              <li key={s.title} className="relative text-center">
                <span className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-[0_0_24px_rgba(143,133,238,0.7)] ring-4 ring-[#0b0a1c]">
                  <s.icon size={20} strokeWidth={1.8} />
                </span>
                <span className="mt-4 block font-mono text-[11px] text-brand-200">STEP 0{i + 1}</span>
                <span className="mt-1 block font-semibold text-white">{s.title}</span>
                <span className="mx-auto mt-1 block max-w-[14rem] text-sm leading-relaxed text-white/60">{s.body}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* 3. Everything a student needs. */}
        <section className="relative mx-auto max-w-[72rem] px-4 py-16 sm:px-6 lg:px-8">
          <SectionHead
            kicker="One platform"
            title="Everything you need,"
            accent="in one place."
            body="Learning is only one part of growing into a career. MySkills takes care of the rest too."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NeedCard p={P.learning} signedIn={signedIn} wide />
            <NeedCard p={P.mentorship} signedIn={signedIn} />
            <NeedCard p={P.career} signedIn={signedIn} />
            <NeedCard p={P.abroad} signedIn={signedIn} />
            <NeedCard p={P.wellness} signedIn={signedIn} />
          </div>
        </section>

        {/* 4. The courses. */}
        <section className="relative mx-auto max-w-[72rem] px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead kicker="Learning programmes" title="Skills for" accent="the AI era." />
            <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-200 hover:text-white">
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
        <section className="relative mx-auto max-w-[72rem] px-4 py-16 sm:px-6 lg:px-8">
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

        {/* 6. AI at every step. */}
        <section className="relative mx-auto max-w-[72rem] px-4 py-16 sm:px-6 lg:px-8">
          <SectionHead
            kicker="Powered by AI"
            title="AI at every step,"
            accent="people where it matters."
            body="AI makes learning faster and more personal. Mentors, counsellors and companies make it real."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AI_STEPS.map((a) => (
              <div key={a.title} className={`${glass} p-5`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/25 text-brand-100 ring-1 ring-brand-200/25">
                  <a.icon size={19} strokeWidth={1.8} />
                </span>
                <p className="mt-4 font-semibold text-white">{a.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/60">{a.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. The partners behind the platform. */}
        <section className="relative mx-auto max-w-[72rem] px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <SectionHead
                kicker="Our partners & providers"
                title="Real people and places"
                accent="behind every step."
                body="Colleges, mentors, universities abroad, companies and wellness professionals bring their content, services and opportunities to you through MySkills."
              />
              <Link
                to={PARTNERS_HUB.to}
                search={PARTNERS_HUB.search as never}
                onClick={() => trackEvent('home_partner', { partner: 'become' })}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-200 hover:text-white"
              >
                Partner with MySkills <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {PARTNERS.map((p, i) => (
                <PartnerCard key={p.title} p={p} wide={i === PARTNERS.length - 1} />
              ))}
            </div>
          </div>
        </section>

        {/* 8. Step in. */}
        <section className="relative mx-auto max-w-[72rem] px-4 pb-24 pt-8 sm:px-6 lg:px-8">
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
