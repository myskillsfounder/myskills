import { homeEntry } from '@/lib/guards'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  Bot,
  Briefcase,
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
 * bottom as the student's story: the five needs the platform takes care of,
 * the journey every course follows, the courses, the
 * Global Readiness Score, the AI at every step, and the partners behind it.
 * Liquid-glass cards on deep navy, in the brand's purple. Every pillar and
 * course is a link; the aptitude test is the highlighted call to action.
 */

type To = '/courses' | '/signup' | '/login' | '/community' | '/study-abroad'
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
  /** The line on its card. */
  body: string
  icon: LucideIcon
  photo: string
  visitor: Target2
  student: Target2
}

const PILLAR: Record<'learning' | 'mentorship' | 'abroad' | 'career' | 'wellness', Pillar> = {
  learning: {
    id: 'learning',
    title: 'Learning Programmes',
    body: 'AI-powered courses, certificates, free aptitude tests',
    icon: BookOpen,
    photo: 'institutions',
    visitor: { to: '/courses' },
    student: { to: '/courses' },
  },
  mentorship: {
    id: 'mentorship',
    title: 'Mentorship',
    body: 'Industry experts, 1:1 and group sessions',
    icon: Users,
    photo: 'mentors',
    visitor: { to: '/login', search: { next: '/community?category=mentors' } },
    student: { to: '/community', search: { category: 'mentors' } },
  },
  career: {
    id: 'career',
    title: 'Career & Internships',
    body: 'Career guidance, jobs, your first internship',
    icon: Briefcase,
    photo: 'career',
    visitor: { to: '/login', search: { next: '/community?category=internships' } },
    student: { to: '/community', search: { category: 'internships' } },
  },
  abroad: {
    id: 'study-abroad',
    title: 'Study Abroad',
    body: 'Universities, applications, test prep',
    icon: Plane,
    photo: 'study-abroad',
    visitor: { to: '/login', search: { next: '/study-abroad' } },
    student: { to: '/study-abroad' },
  },
  wellness: {
    id: 'wellness',
    title: 'Wellness & Mental Health',
    body: 'Counselling and wellness support, privately',
    icon: Heart,
    photo: 'wellness',
    visitor: { to: '/login', search: { next: '/community?category=wellness' } },
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

/** Each step's card a little taller than the last (from 1024px), so they climb. */
const STEP_HEIGHT = ['lg:min-h-[15rem]', 'lg:min-h-[16.5rem]', 'lg:min-h-[18rem]', 'lg:min-h-[19.5rem]', 'lg:min-h-[21rem]']

/** The AI at every step of the platform. */
const AI_STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Sparkles, title: 'AI-powered courses', body: 'Learn the AI tools of your field as you learn the skill itself.' },
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

/** A liquid-glass row: icon, title and line, its photo fading in from the right. */
function GlassRow({
  icon: Icon,
  title,
  body,
  photo,
  wide = false,
  children,
}: {
  icon: LucideIcon
  title: string
  body: string
  photo: string
  wide?: boolean
  /** The link itself, wrapping the row. */
  children: (className: string, inner: React.ReactNode) => React.ReactNode
}) {
  const inner = (
    <>
      <img
        src={`/home/${photo}.webp`}
        alt=""
        className="absolute inset-y-0 right-0 h-full w-28 object-cover opacity-90 [mask-image:linear-gradient(to_left,black_45%,transparent)]"
      />
      <span className="relative flex items-center gap-3">
        <Icon size={22} className="shrink-0 text-white" />
        <span className="min-w-0">
          <span className="block font-display text-[15px] font-semibold leading-tight text-white">{title}</span>
          <span className="mt-0.5 block text-[12px] leading-snug text-white/65">{body}</span>
        </span>
      </span>
    </>
  )
  return children(
    `${glass} group relative flex min-h-[5.5rem] items-center overflow-hidden py-3 pl-4 pr-24 transition-colors hover:border-brand-300/50 ${wide ? 'sm:col-span-2' : ''}`,
    inner,
  )
}

function PartnerCard({ p, wide = false }: { p: (typeof PARTNERS)[number]; wide?: boolean }) {
  return (
    <GlassRow icon={p.icon} title={p.title} body={p.body} photo={p.photo} wide={wide}>
      {(className, inner) => (
        <Link
          to={PARTNERS_HUB.to}
          search={PARTNERS_HUB.search as never}
          onClick={() => trackEvent('home_partner', { partner: p.title })}
          className={className}
        >
          {inner}
        </Link>
      )}
    </GlassRow>
  )
}

/** A pillar in the page's opening: the courses, or sign-in and then its place. */
function PillarCard({ p, signedIn, wide = false }: { p: Pillar; signedIn: boolean; wide?: boolean }) {
  const target = signedIn ? p.student : p.visitor
  return (
    <GlassRow icon={p.icon} title={p.title} body={p.body} photo={p.photo} wide={wide}>
      {(className, inner) => (
        <Link
          to={target.to}
          search={target.search as never}
          onClick={() => trackEvent('home_pillar', { pillar: p.id, signed_in: signedIn, place: 'top' })}
          className={className}
        >
          {inner}
        </Link>
      )}
    </GlassRow>
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
        {/* 1. Everything a student needs, laid out like the partners section
            (Paul, 27 Oct): the five pillars on the left, the words on the
            right, with no buttons (the pillars are the way in). Learning goes
            to the courses; the others go straight to sign-in, then to the
            Community or Study Abroad. On a narrow window the words come first. */}
        <section className="relative mx-auto max-w-[72rem] px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="lg:order-2">
              <p className={eyebrow}>Made for students in the AI era</p>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Everything you need, <span className={gradientText}>in one place.</span>
              </h1>
              <p className="mt-4 text-base leading-relaxed text-white/70 sm:text-lg">
                Courses with an AI coach, real mentors, your first internship, study abroad and wellness support: one
                platform for every need a student has as you step into the AI era.
              </p>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:order-1">
              <PillarCard p={P.learning} signedIn={signedIn} wide />
              <PillarCard p={P.mentorship} signedIn={signedIn} />
              <PillarCard p={P.career} signedIn={signedIn} />
              <PillarCard p={P.abroad} signedIn={signedIn} />
              <PillarCard p={P.wellness} signedIn={signedIn} />
            </div>
          </div>
        </section>

        {/* 2. The journey every course follows. */}
        <section className="relative mx-auto max-w-[72rem] px-4 py-16 sm:px-6 lg:px-8">
          <SectionHead kicker="Your journey" title="From your first test to" accent="your first internship." />
          {/* A staircase: each step a glass card a little taller than the last,
              climbing to the score, with a bar that fills as you go. */}
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
            {JOURNEY.map((s, i) => {
              const last = i === JOURNEY.length - 1
              return (
                <li
                  key={s.title}
                  className={`${glass} relative flex flex-col overflow-hidden p-5 ${STEP_HEIGHT[i]} ${
                    last ? 'border-brand-200/50 ring-1 ring-brand-300/40 sm:col-span-2 lg:col-span-1' : ''
                  }`}
                >
                  {/* The top step glows: the score is where the climb leads. */}
                  {last && (
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-brand-500/45 via-brand-600/10 to-fuchsia-500/25" />
                  )}
                  <span aria-hidden className="absolute -right-1 -top-3 font-display text-7xl font-bold text-white/[0.06]">
                    0{i + 1}
                  </span>
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-[0_0_24px_rgba(143,133,238,0.6)] ring-1 ring-white/25">
                    <s.icon size={20} strokeWidth={1.8} />
                  </span>
                  <span className="relative mt-4 block text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-200">Step {i + 1}</span>
                  <span className="relative mt-1 block font-display text-lg font-semibold leading-snug text-white">{s.title}</span>
                  <span className="relative mt-1.5 block text-sm leading-relaxed text-white/60">{s.body}</span>
                  <span aria-hidden className="relative mt-auto block pt-5">
                    <span className="block h-1 overflow-hidden rounded-full bg-white/10">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-brand-300 to-fuchsia-300"
                        style={{ width: `${((i + 1) / JOURNEY.length) * 100}%` }}
                      />
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>
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
