import { homeEntry } from '@/lib/guards'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
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
import { AiEraArt, TONES, type ArtKind, type ArtTone } from '@/components/landing/AiEraArt'
import { FRONT_DOOR_LINE, FrontDoorCards, FrontDoorHeadline, FrontDoorTagline, StudentsRow } from '@/components/landing/FrontDoor'

export const Route = createFileRoute('/')({
  beforeLoad: homeEntry,
  component: HomePage,
})

/*
 * The home page of the standard website. Its top is the phone's front door
 * at a computer's size (Paul, 4 Nov 2026: "make the PC experience similar to
 * the one in mobile, same H1 and landing experience"): the students, the
 * headline, the four cards (components/landing/FrontDoor.tsx) and Study
 * Online. Below it: why now, the courses, the Global Readiness Score and a
 * last call.
 */

/** Liquid glass: see-through, frosted, a light top edge and a purple glow. */
const glass =
  'rounded-2xl border border-[#6d7bff]/20 bg-gradient-to-br from-[#1b2470]/45 via-[#0b1438]/40 to-[#060b24]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_16px_44px_-18px_rgba(76,86,240,0.7)] backdrop-blur-xl'

/** The page: deep navy-blue, as in Paul's picture. */
const PAGE = '#040a1e'

const eyebrow = 'text-[11px] font-semibold uppercase tracking-[0.32em] text-[#b9a6ff]'
const h2 = 'mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl'
const gradientText = 'bg-gradient-to-r from-[#8f6bff] via-[#b496ff] to-[#dcc7ff] bg-clip-text text-transparent'
/** Paul's handwritten notes beside the student. */

const primaryCta =
  'press inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#7b6cf6] to-[#4f46e5] px-6 text-[15px] font-semibold text-white shadow-[0_10px_30px_-8px_rgba(99,102,241,0.9)] transition-opacity hover:opacity-90'
const secondaryCta =
  'press inline-flex h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/[0.03] px-6 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/10'

/** Why MySkills now: what the AI era asks of a student, and how the platform answers. */
const AI_ERA: { icon: LucideIcon; title: string; body: string; art: ArtKind; tone: ArtTone }[] = [
  { icon: Sparkles, title: 'AI in every course', body: 'Learn the AI tools of your field as you learn the skill, with an AI coach giving feedback.', art: 'coach', tone: 'violet' },
  { icon: Users, title: 'People where it matters', body: 'Mentors, counsellors and companies who know you: real guidance, not just an app.', art: 'people', tone: 'teal' },
  { icon: Target, title: 'Start with your strengths', body: 'A free aptitude test shows where you stand before you spend an hour learning.', art: 'strengths', tone: 'amber' },
  { icon: Trophy, title: 'Proof employers trust', body: 'Your Global Readiness Score: every point graded by a mentor or checked by our team.', art: 'score', tone: 'pink' },
]

/** The parts of the Global Readiness Score (method v8). */
const SCORE_PARTS: { title: string; body: string; points: number; bar: string }[] = [
  { title: 'Personal skills', body: 'Global Leadership: the 14 skills employers hire for', points: 40, bar: 'from-amber-300 to-orange-500' },
  { title: 'Professional skills', body: 'The professional courses you take', points: 40, bar: 'from-brand-300 to-brand-600' },
  { title: 'Your first internship', body: 'Signed off by the company you worked with', points: 20, bar: 'from-emerald-300 to-teal-500' },
]

const BANDS = ['Getting started', 'Building', 'Strong', 'Standout']

/** A soft purple glow behind a section, reaching over its edges so one section runs into the next. */
function Glow({ className }: { className: string }) {
  return <span aria-hidden className={`pointer-events-none absolute rounded-full bg-[#5b4bff]/20 blur-3xl ${className}`} />
}

/** Every section's heading, centred like the hero, so the page reads as one (Paul, 4 Nov 2026: "make it look cohesive"). */
function SectionHead({ kicker, title, accent, body }: { kicker: string; title: string; accent: string; body?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className={eyebrow}>{kicker}</p>
      <h2 className={h2}>
        {title} <span className={gradientText}>{accent}</span>
      </h2>
      {body && <p className="mt-4 text-base leading-relaxed text-white/70 sm:text-lg">{body}</p>}
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
        {/* 1. The biggest online student community. */}
        <section className="relative mx-auto max-w-7xl px-4 pb-6 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <StudentsRow className="justify-center" />
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[4.25rem]">
              <FrontDoorHeadline />
            </h1>
            <FrontDoorTagline className="mt-5 text-2xl sm:text-3xl" />
            <p className="mx-auto mt-3 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">{FRONT_DOOR_LINE}</p>
          </div>

          <div className="relative mt-9 flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-3">
              {/* Into the app: Study rooms, through sign-in for a visitor (the
                  guard sends them to /login, and signing in lands there). */}
              <Link to="/study-rooms" onClick={() => trackEvent('home_cta', { cta: 'study_online', place: 'hero' })} className={`${primaryCta} h-14 px-9 text-lg`}>
                Study Online <ArrowRight size={20} />
              </Link>
              <Link
                to="/community-portal/signup"
                onClick={() => trackEvent('home_cta', { cta: 'partner', place: 'hero' })}
                className={`${secondaryCta} h-14 px-8 text-lg`}
              >
                Partner With Us
              </Link>
            </div>
            <p className="text-sm text-white/60">Free for students. Sign up in seconds with Google or your email.</p>
          </div>

          {/* What else a student gets (components/landing/FrontDoor.tsx, shared with the phone). */}
          <Glow className="bottom-0 left-1/2 h-64 w-2/3 -translate-x-1/2" />
          <div className="relative mx-auto mt-12 max-w-6xl">
            <FrontDoorCards signedIn={signedIn} place="home" />
          </div>
        </section>

        {/* 3. Why now: what the AI era asks of a student. */}
        <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Glow className="-top-24 left-1/4 h-72 w-1/2" />
          <div className="relative">
            <SectionHead
              kicker="Why MySkills, why now"
              title="What students need now,"
              accent="all in one place."
              body="Students now need more than marks: skills they can show, the AI tools of their field, people to guide them and a first internship. MySkills brings all of it together, from your first aptitude test to real work experience."
            />
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {AI_ERA.map((a) => (
                // Each card in its own colour, with a picture of what it is in the app.
                <li key={a.title} className={`${glass} ${TONES[a.tone].glow} group flex flex-col p-4 transition-transform duration-300 hover:-translate-y-1`}>
                  <AiEraArt kind={a.art} tone={a.tone} />
                  <span className="mt-4 flex items-center gap-2.5 px-1">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white ring-1 ring-white/20 ${TONES[a.tone].icon}`}>
                      <a.icon size={16} />
                    </span>
                    <span className="font-display text-base font-semibold text-white">{a.title}</span>
                  </span>
                  <span className="mt-2 block px-1 pb-1 text-sm leading-relaxed text-white/65">{a.body}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. The courses. */}
        <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Glow className="-right-24 top-1/3 h-80 w-96" />
          <SectionHead
            kicker="Learning programmes"
            title="Skills for"
            accent="the AI era."
            body="Each programme starts with a free aptitude test, then practice, a mentor and a project you can show."
          />
          <div className="relative mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                      Take the Aptitude Test <ArrowRight size={15} />
                    </a>
                  ) : (
                    <Link
                      to="/courses"
                      className="press inline-flex h-10 w-full items-center justify-center rounded-full border border-white/25 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      Tell Me When It Opens
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#b9a6ff] hover:text-white">
              All Courses <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {/* 5. The Global Readiness Score. */}
        <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Glow className="-left-24 top-0 h-80 w-96" />
          <div className={`${glass} relative grid gap-10 overflow-hidden p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center`}>
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

        {/* 6. Step in: the hero's promise again, to close the page. */}
        <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-brand-200/25 bg-gradient-to-br from-brand-600/40 via-brand-700/25 to-fuchsia-600/20 px-6 py-14 text-center shadow-[0_0_80px_-20px_rgba(143,133,238,0.7)] sm:px-12">
            <span aria-hidden className="absolute -top-24 left-1/2 h-48 w-[70%] -translate-x-1/2 rounded-full bg-brand-300/30 blur-3xl" />
            <h2 className="relative font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Join the biggest <span className={gradientText}>Study Online</span> student community.
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-white/75">
              Step into a live study room today, or start with a free aptitude test to see your strongest skills.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/study-rooms" onClick={() => trackEvent('home_cta', { cta: 'study_online', place: 'end' })} className={primaryCta}>
                Study Online <ArrowRight size={17} />
              </Link>
              <Link to="/courses" onClick={() => trackEvent('home_cta', { cta: 'test', place: 'end' })} className={secondaryCta}>
                Take the Free Aptitude Test
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer dark />
    </div>
  )
}
