import { homeEntry } from '@/lib/guards'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  GraduationCap,
  Heart,
  Plane,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuthUser } from '@/lib/useAuth'
import { setSiteMode } from '@/lib/siteMode'
import { trackEvent } from '@/lib/analytics'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { GlowOrb, GridBackdrop } from '@/components/landing/GridBackdrop'

export const Route = createFileRoute('/')({
  beforeLoad: homeEntry,
  component: HomePage,
})

/*
 * The home page of the standard website: MySkills as "the student development
 * platform" (Paul, 26 Oct 2026), the student at the centre and everything they
 * need around them, in the platform picture's dark, glowing purple. Five
 * pillars: learning programmes, mentorship, study abroad, career guidance and
 * wellness. Learning leads to /courses; the other four live inside the app, so
 * a visitor is asked to make a free account and a student goes straight there.
 * The partner side is one band that leads to "Partner with MySkills".
 */

type To = '/courses' | '/signup' | '/community' | '/study-abroad'

interface Pillar {
  id: string
  title: string
  body: string
  icon: LucideIcon
  /** Where a visitor goes, and where a signed-in student goes. */
  visitor: To
  student: { to: To; search?: Record<string, string> }
  cta: string
}

const PILLARS: Pillar[] = [
  {
    id: 'learning',
    title: 'Learning Programmes',
    body: 'Courses with an AI coach, mentor-graded projects and certificates.',
    icon: BookOpen,
    visitor: '/courses',
    student: { to: '/courses' },
    cta: 'Explore courses',
  },
  {
    id: 'mentorship',
    title: 'Mentorship',
    body: '1:1 and group sessions with industry experts who have done it.',
    icon: Users,
    visitor: '/signup',
    student: { to: '/community', search: { category: 'mentors' } },
    cta: 'Find a mentor',
  },
  {
    id: 'study-abroad',
    title: 'Study Abroad',
    body: 'University guidance, applications and test prep, with partner universities.',
    icon: Plane,
    visitor: '/signup',
    student: { to: '/study-abroad' },
    cta: 'See programmes',
  },
  {
    id: 'career',
    title: 'Career Guidance',
    body: 'Career counselling, internships and your first job opportunities.',
    icon: Briefcase,
    visitor: '/signup',
    student: { to: '/community', search: { category: 'internships' } },
    cta: 'Find internships',
  },
  {
    id: 'wellness',
    title: 'Wellness & Mental Health',
    body: 'Counselling, workshops and wellness resources, privately.',
    icon: Heart,
    visitor: '/signup',
    student: { to: '/community', search: { category: 'wellness' } },
    cta: 'Talk to someone',
  },
]

const PARTNERS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Building2, title: 'Institutions', body: 'Colleges, training institutes and skill centres' },
  { icon: Users, title: 'Mentors', body: 'Industry experts, professionals and coaches' },
  { icon: Plane, title: 'Study abroad partners', body: 'Universities and overseas education providers' },
  { icon: Briefcase, title: 'Career partners', body: 'Companies, internship providers and hiring partners' },
  { icon: Heart, title: 'Wellness partners', body: 'Therapists, counsellors and wellness platforms' },
]

const JOURNEY = ['Learn', 'Get guidance', 'Build skills', 'Grow']

/** One pillar, as a card around the student or in the list below. */
function PillarCard({ p, signedIn, className = '' }: { p: Pillar; signedIn: boolean; className?: string }) {
  const target = signedIn ? p.student : { to: p.visitor }
  return (
    <Link
      to={target.to}
      search={target.search as never}
      onClick={() => trackEvent('home_pillar', { pillar: p.id, signed_in: signedIn })}
      className={`group block rounded-2xl border border-white/10 bg-ink-900/70 p-4 shadow-[0_0_40px_-12px_rgba(143,133,238,0.45)] backdrop-blur-md transition-colors hover:border-brand-300/50 hover:bg-ink-900/90 ${className}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-100 ring-1 ring-brand-300/30">
        <p.icon size={19} />
      </span>
      <p className="mt-3 font-display text-[17px] font-semibold leading-tight text-white">{p.title}</p>
      <p className="mt-1 text-[13px] leading-snug text-white/60">{p.body}</p>
      <p className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-200 group-hover:text-white">
        {signedIn || p.visitor === '/courses' ? p.cta : 'Free account'} <ArrowRight size={13} />
      </p>
    </Link>
  )
}

/** The student at the centre, glowing, with the journey under them. */
function StudentCore({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const big = size === 'lg'
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`relative flex items-center justify-center ${big ? 'h-56 w-56' : 'h-40 w-40'}`}>
        <span aria-hidden className="absolute inset-0 rounded-full bg-brand-500/30 blur-2xl" />
        <span aria-hidden className="absolute inset-0 rounded-full border border-brand-300/40" />
        <span aria-hidden className="absolute inset-3 rounded-full border border-brand-300/20" />
        <span className="relative flex h-[78%] w-[78%] flex-col items-center justify-center rounded-full bg-gradient-to-br from-brand-400 via-brand-600 to-ink-900 shadow-[0_0_80px_-10px_rgba(143,133,238,0.9)] ring-2 ring-white/20">
          <GraduationCap size={big ? 44 : 32} className="text-white" />
          <span className={`mt-1 font-display font-semibold text-white ${big ? 'text-3xl' : 'text-2xl'}`}>You</span>
        </span>
      </div>
      <p className="mt-4 font-display text-xl font-semibold tracking-[0.18em] text-white">STUDENT</p>
      <p className="mt-1 text-sm text-white/60">{JOURNEY.join(' · ')}</p>
    </div>
  )
}

function HomePage() {
  const { user } = useAuthUser()
  const signedIn = Boolean(user)
  const byId = Object.fromEntries(PILLARS.map((p) => [p.id, p]))

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />

      <main>
        {/* The promise, and the student at the centre of everything. */}
        <section className="surface-wood-dark relative overflow-hidden">
          <GridBackdrop mask="ellipse 75% 60% at 50% 10%" />
          <GlowOrb className="-left-40 top-0 h-[28rem] w-[28rem]" />
          <GlowOrb className="-right-40 top-72 h-[28rem] w-[28rem]" color="rgba(143,133,238,0.18)" />

          <div className="relative mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-20 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-200">The student development platform</p>
                <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
                  A platform that puts{' '}
                  <span className="bg-gradient-to-r from-brand-200 to-brand-400 bg-clip-text text-transparent">students at the centre.</span>
                </h1>
              </div>
              <p className="border-l border-white/15 pl-5 text-base leading-relaxed text-white/70">
                Everything a student needs in one place, from learning to career: courses with an AI coach, mentors, study
                abroad, career guidance and wellness. Powered by AI, reviewed by people.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/courses"
                onClick={() => trackEvent('home_cta', { cta: 'courses' })}
                className="press inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
              >
                Find your course and take the free aptitude test <ArrowRight size={17} />
              </Link>
              <Link
                to="/start"
                onClick={() => setSiteMode('ai')}
                className="press inline-flex h-12 items-center gap-2 rounded-full border border-white/25 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Sparkles size={16} /> Not sure? Ask the AI guide
              </Link>
            </div>
          </div>

          {/* The hub: on a computer the five pillars sit around the student;
              narrower, the student comes first and the pillars follow. */}
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="font-display text-4xl font-semibold tracking-tight text-white">
                My<span className="text-brand-300">Skills</span>
              </p>
              <p className="mt-1 text-sm text-white/60">The Student Development Platform</p>
            </div>

            <div className="relative mx-auto mt-8 hidden h-[40rem] max-w-4xl lg:block">
              <span aria-hidden className="absolute left-1/2 top-[40%] h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-300/15" />
              <span aria-hidden className="absolute left-1/2 top-[40%] h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-300/10" />
              <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2">
                <StudentCore />
              </div>
              <PillarCard p={byId.learning} signedIn={signedIn} className="absolute left-[4%] top-0 w-60" />
              <PillarCard p={byId.mentorship} signedIn={signedIn} className="absolute right-[4%] top-0 w-60" />
              <PillarCard p={byId['study-abroad']} signedIn={signedIn} className="absolute left-0 top-[42%] w-60" />
              <PillarCard p={byId.career} signedIn={signedIn} className="absolute right-0 top-[42%] w-60" />
              <PillarCard p={byId.wellness} signedIn={signedIn} className="absolute bottom-0 left-1/2 w-64 -translate-x-1/2" />
            </div>

            <div className="mt-8 lg:hidden">
              <StudentCore size="sm" />
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {PILLARS.map((p) => (
                  <PillarCard key={p.id} p={p} signedIn={signedIn} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* The journey, end to end. */}
        <section className="relative overflow-hidden border-t border-white/[0.06] bg-ink-900">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">From learning to career</h2>
            <p className="mt-2 max-w-2xl text-white/65">
              Every step adds to your Global Readiness Score, the one number companies look at when they choose interns.
            </p>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { t: 'Know your aptitude', b: 'A free test before any course shows your strengths.' },
                { t: 'Learn with an AI coach', b: 'Short modules and real scenarios, with feedback.' },
                { t: 'Work with a mentor', b: 'An industry mentor guides you and grades your project.' },
                { t: 'Land your first internship', b: 'Hands-on, real experience with a partner company.' },
                { t: 'Grow your score', b: 'Proof of what you can do, for every company you apply to.' },
              ].map((s, i) => (
                <li key={s.t} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <span className="font-mono text-xs text-brand-200">0{i + 1}</span>
                  <p className="mt-2 font-semibold text-white">{s.t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">{s.b}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* The partners who make it possible. */}
        <section className="relative overflow-hidden border-t border-white/[0.06] bg-ink-900">
          <GlowOrb className="-right-40 top-0 h-96 w-96" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-200">Our partners &amp; providers</p>
                <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  We partner with the people students need
                </h2>
              </div>
              <Link
                to="/community"
                search={{ partners: true }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-200 hover:text-white"
              >
                Partner with MySkills <ArrowRight size={15} />
              </Link>
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {PARTNERS.map((x) => (
                <li key={x.title} className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-5">
                  <x.icon size={22} className="text-brand-200" />
                  <p className="mt-3 font-semibold text-white">{x.title}</p>
                  <p className="mt-1 text-sm leading-snug text-white/60">{x.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Start. */}
        <section className="relative overflow-hidden border-t border-white/[0.06] bg-ink-900">
          <div className="mx-auto max-w-6xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-brand-300/20 bg-gradient-to-br from-brand-600/40 via-brand-500/15 to-transparent p-8 sm:p-10">
              <GlowOrb className="-right-20 -top-20 h-72 w-72" />
              <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                <div>
                  <h2 className="font-display text-3xl font-semibold tracking-tight text-white">Start with what you’re good at</h2>
                  <p className="mt-2 max-w-xl text-white/70">
                    Pick a course and take its free aptitude test: no account needed until you want your results.
                  </p>
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/60">
                    {['Free to start', 'Verified mentors', 'Real internships'].map((t) => (
                      <span key={t} className="inline-flex items-center gap-1.5">
                        <BadgeCheck size={15} className="text-emerald-300" /> {t}
                      </span>
                    ))}
                  </p>
                </div>
                <Link
                  to="/courses"
                  className="press inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink-900 shadow-e2"
                >
                  Take the free aptitude test <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
