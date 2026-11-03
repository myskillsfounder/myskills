import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowRight, BarChart3, Check, Globe2, GraduationCap, Megaphone, MicOff, MoonStar, Rocket, Sparkles, Users, Video } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import type { TestRoute } from '@/lib/pendingAptitude'
import type { LeadProgramme } from '@/lib/programmes'
import { ProgrammeLeadForm } from '@/components/programmes/ProgrammeLeadForm'
import { requirePhoneWelcome } from '@/lib/guards'
import { GlowOrb, GridBackdrop } from '@/components/landing/GridBackdrop'

/**
 * The phone's front door, for someone signed out. First, studying online with
 * others: sign up, and a new account lands in Study rooms (Paul, 4 Nov 2026).
 * Then "What do you want to learn?", four programmes. The open ones (Digital Marketing, Global Leadership) go to their
 * aptitude test through sign-up; the coming ones (Entrepreneurship, Data
 * Analytics) take a lead. Anyone signed in is sent on by the guard: since 3 Nov
 * 2026 a new account answers no questions first (Paul).
 */
export const Route = createFileRoute('/welcome')({
  beforeLoad: requirePhoneWelcome,
  component: WelcomePage,
})

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="surface-wood-dark relative min-h-[100dvh] overflow-hidden">
      <GridBackdrop mask="ellipse 90% 55% at 50% 0%" />
      <GlowOrb className="-left-24 top-16 h-64 w-64" />
      <GlowOrb className="-right-24 bottom-10 h-64 w-64" color="rgba(211,164,65,0.10)" />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6">{children}</div>
    </div>
  )
}

const Brand = () => (
  <span className="flex items-center gap-2.5">
    <span className="font-display text-lg font-semibold tracking-tight text-white">MySkills</span>
  </span>
)

/* --------------------------------------------------------------- signed out */

type Learn = {
  id: string
  label: string
  body: string
  icon: typeof GraduationCap
  tile: string
} & ({ open: true; test: TestRoute } | { open: false; lead: LeadProgramme })

/**
 * What a visitor can come to learn. The open programmes start with their free
 * aptitude test (Entrepreneurship's is the course engine's); the one that isn't
 * open yet takes a name and number so the team can call when it is.
 */
const LEARN: Learn[] = [
  { id: 'dm', label: 'Digital Marketing', body: 'Ads, content, SEO and data, with practice and a mentor.', icon: Megaphone, tile: 'from-brand-400 to-brand-700', open: true, test: '/aptitude-assessment' },
  { id: 'gl', label: 'Global Leadership', body: 'Goals, communication and leading people: the Global Readiness programme.', icon: Globe2, tile: 'from-amber-400 to-orange-500', open: true, test: '/career-readiness-assessment' },
  { id: 'en', label: 'Entrepreneurship', body: 'Turn an idea into a business people pay for, with AI at every step.', icon: Rocket, tile: 'from-rose-400 to-pink-600', open: true, test: '/programmes/ai-powered-entrepreneurship/aptitude' },
  { id: 'da', label: 'Data Analytics', body: 'Spreadsheets, SQL and dashboards that answer real questions.', icon: BarChart3, tile: 'from-emerald-400 to-teal-600', open: true, test: '/programmes/data-analytics/aptitude' },
]

function Intro() {
  const router = useRouter()
  const [opened, setOpened] = useState<string | null>(null)

  // An open programme starts with its aptitude test, before any account: the
  // result is what signing up unlocks (lib/pendingAptitude.ts).
  function start(l: Learn) {
    if (!l.open) {
      setOpened((cur) => (cur === l.id ? null : l.id))
      return
    }
    trackEvent('welcome_programme', { programme: l.id })
    router.history.push(l.test)
  }

  return (
    <Frame>
      <header className="flex items-center justify-between">
        <Brand />
        <Link to="/login" className="text-sm font-semibold text-white/80">
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center py-6">
        {/* First: study online with others (Paul, 4 Nov 2026). Sign-up is the
            way in, and a new account lands in Study rooms (lib/device.ts). */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#92400e] p-5 ring-1 ring-white/10">
          <span aria-hidden className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl" />
          <MoonStar aria-hidden size={120} strokeWidth={1} className="absolute -bottom-6 -right-4 text-white/[0.07]" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Study rooms · Live now
            </span>
            <h1 className="mt-3 font-display text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-white">
              Study online with the biggest online community of learners
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-white/75">
              Join a live study room, camera on and no sound, and get your work done alongside students like you. Any
              subject, any time.
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-white/75">
              <li className="inline-flex items-center gap-1.5">
                <Users size={14} className="text-amber-200" /> Students online now
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Video size={14} className="text-amber-200" /> Camera on
              </li>
              <li className="inline-flex items-center gap-1.5">
                <MicOff size={14} className="text-amber-200" /> No sound
              </li>
            </ul>
            <Link
              to="/signup"
              onClick={() => trackEvent('welcome_cta', { cta: 'study_online' })}
              className="press mt-5 flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-full bg-amber-400 text-base font-bold text-[#1e1b4b] shadow-e2"
            >
              Start studying online <ArrowRight size={18} />
            </Link>
            <p className="mt-2 text-center text-xs text-white/65">Free. Sign up in seconds with Google or your email.</p>
          </div>
        </section>

        {/* Then: a programme, starting with its aptitude test. */}
        <span className="mt-8 inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500/40 to-brand-400/20 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-brand-300/30">
          <Sparkles size={13} />
          Powered by AI
        </span>
        <h2 className="mt-3 font-display text-[1.5rem] font-semibold leading-[1.15] tracking-tight text-white">
          Or know your aptitude before you learn
        </h2>
        <p className="mt-2.5 text-[15px] leading-relaxed text-white/70">
          Take a short aptitude test first. Your AI coach reads your strengths and shows you where to start. Free, and
          no account needed yet.
        </p>

        <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="How it works">
          {['Pick a programme', 'Take the aptitude test', 'Your AI coach’s read'].map((s, i) => (
            <li key={s} className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.06] px-2 py-2.5 text-center">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/40 font-display text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-xs font-medium leading-tight text-white/80">{s}</span>
            </li>
          ))}
        </ol>

        <h2 className="mt-6 font-display text-lg font-semibold text-white">What do you want to learn?</h2>
        <ul className="mt-3 space-y-2.5">
          {LEARN.map((l) => (
            <li key={l.id} className="card-glass-dark p-3">
              <button
                type="button"
                onClick={() => start(l)}
                aria-expanded={l.open ? undefined : opened === l.id}
                className="flex w-full items-center gap-3.5 text-left"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-e1 ${l.tile}`}>
                  <l.icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-white">{l.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${l.open ? 'bg-emerald-400/20 text-emerald-200' : 'bg-white/10 text-white/60'}`}
                    >
                      {l.open ? 'Open' : 'Soon'}
                    </span>
                  </span>
                  <span className="block text-sm leading-snug text-white/60">{l.body}</span>
                  {l.open && <span className="mt-1 block text-xs font-semibold text-brand-200">Take the aptitude test →</span>}
                </span>
              </button>
              {!l.open && opened === l.id && <ProgrammeLeadForm programme={l.lead} title={l.label} start="mobile" />}
            </li>
          ))}
        </ul>

        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-white/65">
          {['Verified mentors', 'Internships', 'Certificates you can share'].map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <Check size={14} className="text-emerald-300" />
              {t}
            </li>
          ))}
        </ul>
      </main>

      <footer className="space-y-3">
        <Link
          to="/login"
          className="press flex min-h-[3.25rem] w-full items-center justify-center rounded-full border border-white/25 text-base font-semibold text-white"
        >
          I already have an account
        </Link>
        <p className="pt-1 text-center text-sm text-white/55">
          A mentor, company or institute?{' '}
          <Link to="/community" search={{ partners: true }} className="font-semibold text-white underline underline-offset-4">
            Partner with MySkills
          </Link>
        </p>
      </footer>
    </Frame>
  )
}

function WelcomePage() {
  // Signed in, the guard has already sent them on: a new account no longer
  // answers questions first (Paul, 3 Nov 2026), so this is only the welcome.
  return <Intro />
}
