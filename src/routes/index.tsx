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
import { trackEvent } from '@/lib/analytics'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const Route = createFileRoute('/')({
  beforeLoad: homeEntry,
  component: HomePage,
})

/*
 * The home page of the standard website, built like Paul's platform picture
 * (26 Oct 2026): our partners and providers flow into MySkills, where the
 * student sits at the centre of the five pillars. Liquid-glass cards on deep
 * navy, the photos cut from his artwork (public/home/*.webp; larger photos can
 * replace them). The picture's B2B and revenue parts are not on the student
 * site. Every card is a link: partners to "Partner with MySkills", learning to
 * the courses, the other pillars to a free account or, signed in, the page.
 */

type To = '/courses' | '/signup' | '/community' | '/study-abroad'
type Target2 = { to: To; search?: Record<string, unknown> }

/** Liquid glass: see-through, frosted, a light top edge and a purple glow. */
const glass =
  'rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.10] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_40px_-18px_rgba(108,92,231,0.75)] backdrop-blur-xl'

const PARTNERS_HUB: Target2 = { to: '/community', search: { partners: true } }

const PARTNERS: { icon: LucideIcon; title: string; body: string; photo: string }[] = [
  { icon: GraduationCap, title: 'Institutions', body: 'Colleges, training institutes, skill centres', photo: 'institutions' },
  { icon: Users, title: 'Mentors', body: 'Industry experts, professionals, coaches', photo: 'mentors' },
  { icon: Plane, title: 'Study Abroad Partners', body: 'Universities, consultants, overseas education', photo: 'study-abroad' },
  { icon: Briefcase, title: 'Career Partners', body: 'Companies, internship providers, hiring partners', photo: 'career' },
  { icon: Heart, title: 'Wellness & Mental Health Partners', body: 'Therapists, counsellors, wellness platforms', photo: 'wellness' },
]

interface Pillar {
  id: string
  title: string
  body: string
  icon: LucideIcon
  visitor: Target2
  student: Target2
}

const PILLAR: Record<'learning' | 'mentorship' | 'abroad' | 'career' | 'wellness', Pillar> = {
  learning: { id: 'learning', title: 'Learning Programmes', body: 'Courses, certifications, micro-learning', icon: BookOpen, visitor: { to: '/courses' }, student: { to: '/courses' } },
  mentorship: { id: 'mentorship', title: 'Mentorship', body: '1:1 and group sessions with industry experts', icon: Users, visitor: { to: '/signup' }, student: { to: '/community', search: { category: 'mentors' } } },
  abroad: { id: 'study-abroad', title: 'Study Abroad', body: 'University guidance, applications, test prep', icon: Plane, visitor: { to: '/signup' }, student: { to: '/study-abroad' } },
  career: { id: 'career', title: 'Career Guidance', body: 'Career counselling, job and internship opportunities', icon: Briefcase, visitor: { to: '/signup' }, student: { to: '/community', search: { category: 'internships' } } },
  wellness: { id: 'wellness', title: 'Wellness & Mental Health', body: 'Counselling, workshops, wellness resources', icon: Heart, visitor: { to: '/signup' }, student: { to: '/community', search: { category: 'wellness' } } },
}

const BENEFITS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Target, title: 'Free aptitude test', body: 'Know your strengths before you start a course.' },
  { icon: Sparkles, title: 'An AI coach', body: 'Short modules and real scenarios, with feedback.' },
  { icon: Users, title: 'A real mentor', body: 'Guidance, sessions and a project they grade.' },
  { icon: Briefcase, title: 'Your first internship', body: 'Hands-on, real experience with a partner company.' },
  { icon: Plane, title: 'Study abroad support', body: 'Partner universities and application help.' },
  { icon: Heart, title: 'Wellness support', body: 'Someone to talk to, privately, when you need it.' },
]

function PartnerCard({ p }: { p: (typeof PARTNERS)[number] }) {
  return (
    <Link
      to={PARTNERS_HUB.to}
      search={PARTNERS_HUB.search as never}
      onClick={() => trackEvent('home_partner', { partner: p.title })}
      className={`${glass} group relative flex min-h-[4.75rem] items-center overflow-hidden py-3 pl-4 pr-24 transition-colors hover:border-brand-300/50`}
    >
      {/* The photo on the right, fading into the glass. */}
      <img
        src={`/home/${p.photo}.webp`}
        alt=""
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

function PillarCard({ p, signedIn, className = '' }: { p: Pillar; signedIn: boolean; className?: string }) {
  const target = signedIn ? p.student : p.visitor
  return (
    <Link
      to={target.to}
      search={target.search as never}
      onClick={() => trackEvent('home_pillar', { pillar: p.id, signed_in: signedIn })}
      className={`${glass} block p-3.5 transition-colors hover:border-brand-300/50 ${className}`}
    >
      <p.icon size={24} strokeWidth={1.6} className="text-brand-100" />
      <p className="mt-2 font-display text-[15px] font-semibold leading-tight text-white">{p.title}</p>
      <p className="mt-1 text-[11.5px] leading-snug text-white/65">{p.body}</p>
    </Link>
  )
}

function StudentPhoto({ className = 'h-44 w-44' }: { className?: string }) {
  return (
    <Link to="/courses" aria-label="Start with a course" className={`group relative block ${className}`}>
      <span aria-hidden className="absolute -inset-8 rounded-full bg-brand-500/35 blur-3xl" />
      <span aria-hidden className="absolute -inset-2 rounded-full border border-brand-200/40 shadow-[0_0_40px_rgba(143,133,238,0.6)]" />
      <img src="/home/student.webp" alt="A student at the centre of MySkills" className="relative h-full w-full rounded-full object-cover ring-2 ring-white/20" />
    </Link>
  )
}

function HomePage() {
  const { user } = useAuthUser()
  const signedIn = Boolean(user)
  const P = PILLAR

  return (
    <div className="min-h-screen bg-[#0b0a1c]">
      <Navbar dark />

      <main className="relative overflow-hidden bg-[#0b0a1c] bg-[radial-gradient(50rem_34rem_at_68%_45%,rgba(108,92,231,0.28),transparent_70%),radial-gradient(36rem_28rem_at_0%_100%,rgba(108,92,231,0.14),transparent_70%),radial-gradient(30rem_24rem_at_100%_0%,rgba(143,133,238,0.12),transparent_70%)]">
        <h1 className="sr-only">Learning centred around the student: MySkills, the student development platform</h1>

        <section className="relative mx-auto max-w-[68rem] px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[21rem_5.5rem_1fr] lg:gap-0">
            {/* Our partners & providers. */}
            <div className="order-2 lg:order-1">
              <p className="font-display text-xl text-white/90">Our Partners &amp; Providers</p>
              <div className="mt-3 space-y-2.5">
                {PARTNERS.map((p) => (
                  <PartnerCard key={p.title} p={p} />
                ))}
              </div>
            </div>

            {/* The flow from the partners into MySkills. */}
            <div aria-hidden className="relative order-3 hidden lg:order-2 lg:block">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 88 420" preserveAspectRatio="none" fill="none">
                <defs>
                  <linearGradient id="flow" x1="0" x2="1">
                    <stop offset="0" stopColor="#8f85ee" stopOpacity="0.15" />
                    <stop offset="1" stopColor="#c4beff" stopOpacity="0.95" />
                  </linearGradient>
                </defs>
                {[72, 152, 232, 312, 392].map((y, i) => {
                  const to = i < 3 ? 168 : 268
                  return <path key={y} d={`M0 ${y} C 40 ${y}, 40 ${to}, 86 ${to}`} stroke="url(#flow)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
                })}
              </svg>
              <span className="absolute right-0 top-[37%] h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-brand-100" />
              <span className="absolute right-0 top-[61%] h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-brand-100" />
              <p className="absolute left-1 top-[44%] w-[5rem] text-[12px] font-semibold leading-snug text-white/85">
                Content, Services &amp; Opportunities
              </p>
            </div>

            {/* MySkills: the student at the centre of the five pillars. */}
            <div className="order-1 lg:order-3">
              <div className="text-center">
                <p className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  My<span className="bg-gradient-to-r from-brand-200 to-brand-400 bg-clip-text text-transparent">Skills</span>
                </p>
                <p className="mt-1 text-sm text-white/80">The Student Development Platform</p>
              </div>

              <div className="relative mx-auto mt-4 hidden h-[30rem] max-w-[36rem] sm:block">
                <span aria-hidden className="absolute left-1/2 top-[36%] h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-300/15" />
                <div className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2">
                  <StudentPhoto />
                </div>
                <div className="absolute left-1/2 top-[55%] -translate-x-1/2 text-center">
                  <p className="font-display text-xl font-bold tracking-wide text-white">STUDENT</p>
                  <p className="mt-0.5 whitespace-nowrap text-xs text-white/70">Learn · Get Guidance · Build Skills · Grow</p>
                </div>
                <PillarCard p={P.learning} signedIn={signedIn} className="absolute left-0 top-[4%] w-36" />
                <PillarCard p={P.mentorship} signedIn={signedIn} className="absolute right-0 top-[4%] w-36" />
                <PillarCard p={P.abroad} signedIn={signedIn} className="absolute left-0 top-[44%] w-36" />
                <PillarCard p={P.career} signedIn={signedIn} className="absolute right-0 top-[44%] w-36" />
                <PillarCard p={P.wellness} signedIn={signedIn} className="absolute bottom-0 left-1/2 w-52 -translate-x-1/2" />
              </div>

              {/* A narrow window: the student, then the pillars. */}
              <div className="mt-6 sm:hidden">
                <div className="flex flex-col items-center">
                  <StudentPhoto className="h-36 w-36" />
                  <p className="mt-5 font-display text-xl font-bold tracking-wide text-white">STUDENT</p>
                  <p className="mt-0.5 text-xs text-white/70">Learn · Get Guidance · Build Skills · Grow</p>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  {Object.values(P).map((p) => (
                    <PillarCard key={p.id} p={p} signedIn={signedIn} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What a student gets. */}
        <section className="relative mx-auto max-w-[68rem] px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-2xl font-bold text-white">For you</p>
              <p className="mt-1 text-sm text-white/70">Everything a student gets, free to start</p>
            </div>
            <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-200 hover:text-white">
              Take the free aptitude test <ArrowRight size={15} />
            </Link>
          </div>
          <ol className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => (
              <li key={b.title} className={`${glass} flex items-center gap-3.5 p-3.5`}>
                <span className="font-display text-xl font-bold text-brand-300">0{i + 1}</span>
                <b.icon size={22} className="shrink-0 text-white" />
                <span>
                  <span className="block text-[15px] font-semibold text-white">{b.title}</span>
                  <span className="mt-0.5 block text-[12.5px] text-white/60">{b.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <Footer />
    </div>
  )
}
