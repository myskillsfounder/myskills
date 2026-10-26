import { homeEntry } from '@/lib/guards'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  GraduationCap,
  Heart,
  Plane,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuthUser } from '@/lib/useAuth'
import { setSiteMode } from '@/lib/siteMode'
import { trackEvent } from '@/lib/analytics'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const Route = createFileRoute('/')({
  beforeLoad: homeEntry,
  component: HomePage,
})

/*
 * The home page of the standard website, laid out like Paul's platform
 * picture (26 Oct 2026): "Learning centred around the student". The student
 * glows at the centre with the five pillars around them; the partners who
 * provide them flow in from the left; what a student gets is listed on the
 * right, where the picture had revenue (that is for investors, not here).
 * Deep navy-purple, as in the picture, rather than the site's warm dark.
 */

type To = '/courses' | '/signup' | '/community' | '/study-abroad'

interface Pillar {
  id: string
  title: string
  body: string
  icon: LucideIcon
  visitor: To
  student: { to: To; search?: Record<string, string> }
}

const PILLARS: Record<string, Pillar> = {
  learning: { id: 'learning', title: 'Learning Programmes', body: 'Courses, certificates and an AI coach', icon: BookOpen, visitor: '/courses', student: { to: '/courses' } },
  mentorship: { id: 'mentorship', title: 'Mentorship', body: '1:1 and group sessions with industry experts', icon: Users, visitor: '/signup', student: { to: '/community', search: { category: 'mentors' } } },
  abroad: { id: 'study-abroad', title: 'Study Abroad', body: 'University guidance, applications, test prep', icon: Plane, visitor: '/signup', student: { to: '/study-abroad' } },
  career: { id: 'career', title: 'Career Guidance', body: 'Career counselling, job and internship opportunities', icon: Briefcase, visitor: '/signup', student: { to: '/community', search: { category: 'internships' } } },
  wellness: { id: 'wellness', title: 'Wellness & Mental Health', body: 'Counselling, workshops, wellness resources', icon: Heart, visitor: '/signup', student: { to: '/community', search: { category: 'wellness' } } },
}

const PARTNERS: { icon: LucideIcon; title: string; body: string; tint: string }[] = [
  { icon: GraduationCap, title: 'Institutions', body: 'Colleges, training institutes, skill centres', tint: 'from-sky-500/35' },
  { icon: Users, title: 'Mentors', body: 'Industry experts, professionals, coaches', tint: 'from-amber-500/30' },
  { icon: Plane, title: 'Study Abroad Partners', body: 'Universities, consultants, overseas education', tint: 'from-indigo-500/35' },
  { icon: Briefcase, title: 'Career Partners', body: 'Companies, internship providers, hiring partners', tint: 'from-rose-500/30' },
  { icon: Heart, title: 'Wellness Partners', body: 'Therapists, counsellors, wellness platforms', tint: 'from-emerald-500/30' },
]

const BENEFITS: { icon: LucideIcon; title: string; body: string; tag: string }[] = [
  { icon: Target, title: 'Free aptitude test', body: 'Know your strengths before you start a course', tag: 'Start here' },
  { icon: Sparkles, title: 'An AI coach', body: 'Short modules and real scenarios, with feedback', tag: 'Every course' },
  { icon: Users, title: 'A real mentor', body: 'Guidance, sessions and a project they grade', tag: 'Verified' },
  { icon: Briefcase, title: 'Your first internship', body: 'Hands-on, real experience with a partner company', tag: 'Real work' },
  { icon: Plane, title: 'Study abroad support', body: 'Partner universities and application help', tag: 'Partners' },
  { icon: Heart, title: 'Wellness support', body: 'Someone to talk to, privately, when you need it', tag: 'Private' },
]

const glass =
  'rounded-2xl border border-brand-300/20 bg-[#151233]/80 shadow-[0_0_40px_-14px_rgba(143,133,238,0.55)] backdrop-blur-md'

/** A pillar around the student. */
function PillarCard({ p, signedIn, className = '' }: { p: Pillar; signedIn: boolean; className?: string }) {
  const target = signedIn ? p.student : { to: p.visitor }
  return (
    <Link
      to={target.to}
      search={target.search as never}
      onClick={() => trackEvent('home_pillar', { pillar: p.id, signed_in: signedIn })}
      className={`${glass} group block p-4 transition-colors hover:border-brand-300/50 ${className}`}
    >
      <p.icon size={26} strokeWidth={1.5} className="text-brand-100" />
      <p className="mt-2.5 font-display text-[17px] font-semibold leading-tight text-white">{p.title}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-white/60">{p.body}</p>
    </Link>
  )
}

/** The student: a drawn head and shoulders in a glowing ring (a photo can replace it). */
function Student() {
  return (
    <div className="relative flex h-52 w-52 items-center justify-center min-[1600px]:h-60 min-[1600px]:w-60">
      <span aria-hidden className="absolute -inset-6 rounded-full bg-brand-500/30 blur-3xl" />
      <span aria-hidden className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(196,190,255,0.55),rgba(108,92,231,0.35)_45%,rgba(21,18,51,0.9)_72%)] ring-1 ring-brand-200/40" />
      <span aria-hidden className="absolute -inset-3 rounded-full border border-brand-300/30" />
      <svg viewBox="0 0 200 200" className="relative h-full w-full overflow-hidden rounded-full" role="img" aria-label="A student">
        <defs>
          <linearGradient id="studentBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a2550" />
            <stop offset="1" stopColor="#0f0d24" />
          </linearGradient>
          <linearGradient id="studentHead" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a3366" />
            <stop offset="1" stopColor="#1d1940" />
          </linearGradient>
        </defs>
        <path d="M30 200 C34 150 62 128 100 128 C138 128 166 150 170 200 Z" fill="url(#studentBody)" />
        <path d="M82 128 L100 150 L118 128" fill="none" stroke="#4b4380" strokeWidth="3" />
        <circle cx="100" cy="88" r="34" fill="url(#studentHead)" />
        <path d="M66 82 C66 56 86 46 102 48 C122 50 136 62 134 84 C126 72 112 66 98 68 C84 70 74 76 66 82 Z" fill="#141130" />
      </svg>
    </div>
  )
}

function HomePage() {
  const { user } = useAuthUser()
  const signedIn = Boolean(user)
  const P = PILLARS

  return (
    <div className="min-h-screen bg-[#0b0a1c]">
      <Navbar />

      <main className="relative overflow-hidden bg-[#0b0a1c] bg-[radial-gradient(60rem_40rem_at_50%_55%,rgba(108,92,231,0.22),transparent_70%),radial-gradient(40rem_30rem_at_100%_0%,rgba(143,133,238,0.12),transparent_70%),radial-gradient(40rem_30rem_at_0%_100%,rgba(108,92,231,0.14),transparent_70%)]">
        {/* The heading, and what MySkills is in one breath. */}
        <section className="relative mx-auto max-w-[88rem] px-4 pt-12 sm:px-6 sm:pt-16 lg:px-10">
          <p className="text-xs font-medium uppercase tracking-[0.42em] text-brand-200">MySkills · The student development platform</p>
          <div className="mt-5 grid gap-8 xl:grid-cols-[1fr_24rem] xl:items-end">
            <h1 className="font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight text-white sm:text-6xl xl:text-7xl">
              Learning centred
              <br />
              around{' '}
              <span className="bg-gradient-to-r from-brand-200 via-brand-300 to-brand-400 bg-clip-text text-transparent">the student.</span>
            </h1>
            <p className="border-l border-white/20 pl-5 text-[15px] leading-relaxed text-white/75 sm:text-base">
              We bring together institutions, mentors and service providers to deliver everything a student needs in one
              place, from learning to career. Powered by AI, reviewed by people.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/courses"
              onClick={() => trackEvent('home_cta', { cta: 'courses' })}
              className="press inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink-900 shadow-[0_0_30px_-6px_rgba(143,133,238,0.8)] transition-colors hover:bg-brand-50"
            >
              Take the free aptitude test <ArrowRight size={17} />
            </Link>
            <Link
              to="/start"
              onClick={() => setSiteMode('ai')}
              className="press inline-flex h-12 items-center gap-2 rounded-full border border-brand-300/40 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Sparkles size={16} /> Not sure? Ask the AI guide
            </Link>
          </div>
        </section>

        {/* Partners → the student and the five pillars → what a student gets. */}
        {/* The picture's three columns need 1400px; narrower, the student takes the
            width and the partners and "for you" sit side by side below. */}
        <section className="relative mx-auto mt-12 grid max-w-[88rem] gap-10 px-4 pb-20 sm:px-6 lg:px-10 lg:max-[1399px]:grid-cols-2 min-[1400px]:grid-cols-[20rem_1fr_22rem] min-[1400px]:gap-6">
          {/* Partners. */}
          <div className="order-2 min-[1400px]:order-1">
            <p className="font-display text-3xl font-bold text-brand-300">Partners</p>
            <p className="mt-1 text-white/70">Our partners &amp; providers</p>
            <ul className="mt-5 space-y-3">
              {PARTNERS.map((x) => (
                <li key={x.title} className={`relative overflow-hidden ${glass} p-4 pr-16`}>
                  <span aria-hidden className={`absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l ${x.tint} to-transparent`} />
                  <x.icon aria-hidden size={64} strokeWidth={1} className="absolute -right-2 top-1/2 -translate-y-1/2 text-white/15" />
                  <span className="relative flex items-start gap-3">
                    <x.icon size={26} className="mt-0.5 shrink-0 text-white" />
                    <span>
                      <span className="block font-display text-[17px] font-semibold leading-tight text-white">{x.title}</span>
                      <span className="mt-0.5 block text-[12.5px] leading-snug text-white/65">{x.body}</span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              to="/community"
              search={{ partners: true }}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-200 hover:text-white"
            >
              Partner with MySkills <ArrowRight size={15} />
            </Link>
          </div>

          {/* The student at the centre. */}
          <div className="relative order-1 lg:max-[1399px]:col-span-2 min-[1400px]:order-2">
            {/* The flow from the partners (a computer: they sit to the left). */}
            <svg aria-hidden className="pointer-events-none absolute -left-16 top-24 hidden h-[30rem] w-32 min-[1400px]:block" viewBox="0 0 128 480" fill="none">
              <defs>
                <linearGradient id="flow" x1="0" x2="1">
                  <stop offset="0" stopColor="#8f85ee" stopOpacity="0.15" />
                  <stop offset="1" stopColor="#b9b2ff" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              {[40, 130, 220, 310, 400].map((y, i) => (
                <path key={y} d={`M0 ${y} C 60 ${y}, 50 ${i < 3 ? 190 : 290}, 120 ${i < 3 ? 190 : 290}`} stroke="url(#flow)" strokeWidth="1.5" />
              ))}
              <path d="M112 184 L122 190 L112 196" stroke="#b9b2ff" strokeWidth="1.5" />
              <path d="M112 284 L122 290 L112 296" stroke="#b9b2ff" strokeWidth="1.5" />
            </svg>
            <p className="pointer-events-none absolute -left-4 top-[17rem] hidden w-28 text-[13px] font-semibold leading-snug text-white/80 min-[1400px]:block">
              Content, services &amp; opportunities
            </p>

            <div className="text-center">
              <p className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
                My<span className="text-brand-300">Skills</span>
              </p>
              <p className="mt-1 text-white/80">The Student Development Platform</p>
            </div>

            {/* A computer: the pillars around the student, as in the picture. */}
            <div className="relative mx-auto mt-6 hidden h-[41rem] max-w-[40rem] md:block">
              <span aria-hidden className="absolute left-1/2 top-[40%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-300/15" />
              <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2">
                <Student />
              </div>
              <div className="absolute left-1/2 top-[60%] -translate-x-1/2 text-center">
                <p className="font-display text-2xl font-bold tracking-wide text-white">STUDENT</p>
                <p className="mt-1 whitespace-nowrap text-sm text-white/70">Learn · Get Guidance · Build Skills · Grow</p>
              </div>
              <PillarCard p={P.learning} signedIn={signedIn} className="absolute left-[3%] top-0 w-40 min-[1600px]:w-44" />
              <PillarCard p={P.mentorship} signedIn={signedIn} className="absolute right-[3%] top-0 w-40 min-[1600px]:w-44" />
              <PillarCard p={P.abroad} signedIn={signedIn} className="absolute left-0 top-[31%] w-40 min-[1600px]:w-44" />
              <PillarCard p={P.career} signedIn={signedIn} className="absolute right-0 top-[31%] w-40 min-[1600px]:w-44" />
              <PillarCard p={P.wellness} signedIn={signedIn} className="absolute bottom-0 left-1/2 w-60 -translate-x-1/2" />
            </div>

            {/* Narrow: the student, then the pillars. */}
            <div className="mt-6 md:hidden">
              <div className="flex flex-col items-center">
                <Student />
                <p className="mt-5 font-display text-2xl font-bold tracking-wide text-white">STUDENT</p>
                <p className="mt-1 text-sm text-white/70">Learn · Get Guidance · Build Skills · Grow</p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {Object.values(P).map((p) => (
                  <PillarCard key={p.id} p={p} signedIn={signedIn} />
                ))}
              </div>
            </div>
          </div>

          {/* What a student gets, numbered, where the picture had revenue. */}
          <div className="order-3 min-[1400px]:border-l min-[1400px]:border-white/15 min-[1400px]:pl-6">
            <p className="font-display text-3xl font-bold text-white">FOR YOU</p>
            <p className="mt-1 text-white/70">Everything a student gets, free to start</p>
            <ol className="mt-5 space-y-3">
              {BENEFITS.map((b, i) => (
                <li key={b.title} className={`${glass} flex items-center gap-3 p-3.5`}>
                  <span className="font-display text-2xl font-bold text-brand-300">0{i + 1}</span>
                  <b.icon size={24} className="shrink-0 text-white" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-tight text-white">{b.title}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-white/60">{b.body}</span>
                  </span>
                  <span className="shrink-0 border-l border-white/15 pl-3 text-[11px] font-semibold text-brand-200">{b.tag}</span>
                </li>
              ))}
            </ol>
            <Link
              to="/courses"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-200 hover:text-white"
            >
              Start with a free aptitude test <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
