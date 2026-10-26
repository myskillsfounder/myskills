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
  learning: { id: 'learning', title: 'Learning Programmes', body: 'Courses, certificates, micro-learning', icon: BookOpen, visitor: { to: '/courses' }, student: { to: '/courses' } },
  mentorship: { id: 'mentorship', title: 'Mentorship', body: '1:1 and group sessions with experts', icon: Users, visitor: { to: '/signup' }, student: { to: '/community', search: { category: 'mentors' } } },
  abroad: { id: 'study-abroad', title: 'Study Abroad', body: 'Universities, applications, test prep', icon: Plane, visitor: { to: '/signup' }, student: { to: '/study-abroad' } },
  career: { id: 'career', title: 'Career Guidance', body: 'Counselling, jobs and internships', icon: Briefcase, visitor: { to: '/signup' }, student: { to: '/community', search: { category: 'internships' } } },
  wellness: { id: 'wellness', title: 'Wellness & Mental Health', body: 'Counselling and wellness resources', icon: Heart, visitor: { to: '/signup' }, student: { to: '/community', search: { category: 'wellness' } } },
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

/** A pillar as a floating holographic chip around the AI zone. */
function HoloChip({ p, signedIn, className = '' }: { p: Pillar; signedIn: boolean; className?: string }) {
  const target = signedIn ? p.student : p.visitor
  return (
    <Link
      to={target.to}
      search={target.search as never}
      onClick={() => trackEvent('home_pillar', { pillar: p.id, signed_in: signedIn })}
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
          {/* Side by side from 1280px; narrower, the AI zone comes first and the partners follow. */}
          <div className="grid gap-10 xl:grid-cols-[21rem_5.5rem_1fr] xl:gap-0">
            {/* Our partners & providers. */}
            <div className="order-2 xl:order-1">
              <p className="font-display text-xl text-white/90">Our Partners &amp; Providers</p>
              <div className="mt-3 space-y-2.5">
                {PARTNERS.map((p) => (
                  <PartnerCard key={p.title} p={p} />
                ))}
              </div>
            </div>

            {/* The flow from the partners into MySkills. */}
            <div aria-hidden className="relative order-3 hidden xl:order-2 xl:block">
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

            {/* The AI zone: the student steps through a portal of light into the
                future of learning, the five pillars floating around them. */}
            <div className="order-1 xl:order-3">
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-brand-200">The future of learning</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Step into the{' '}
                  <span className="bg-gradient-to-r from-brand-200 via-brand-300 to-fuchsia-300 bg-clip-text text-transparent">AI zone</span>
                </h2>
              </div>

              <div className="relative mx-auto mt-2 hidden h-[30rem] max-w-[36rem] sm:block">
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

              {/* A narrow window: the portal, then the pillars. */}
              <div className="mt-8 sm:hidden">
                <div className="flex flex-col items-center">
                  <AiPortal size="sm" />
                  <p className="mt-6 text-xs text-white/75">
                    <span className="font-display text-base font-bold text-white">You</span> · Learn · Get guidance · Build skills · Grow
                  </p>
                </div>
                <div className="mt-5 grid gap-2.5">
                  {Object.values(P).map((p) => (
                    <HoloChip key={p.id} p={p} signedIn={signedIn} />
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
