import type { ComponentType } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Briefcase,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  Lock,
  Megaphone,
  Sparkles,
  Sprout,
  Target,
} from 'lucide-react'
import { useAuthUser } from '@/lib/useAuth'
import { skillTracks } from '@/lib/skillTracks'
import { CAREER_READINESS, PERSONAL_DEVELOPMENT_MODULES } from '@/lib/programmes'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

type IconType = ComponentType<{ size?: number; className?: string }>

export const Route = createFileRoute('/')({
  component: HomePage,
})

/*
 * The homepage is MySkills as a whole: personal and professional skills,
 * built together with AI, so nothing is impossible for a student who's
 * ready to work for it. It shares the Career Readiness page's dark theme.
 * Each programme has its own page — /digital-marketing (live) and
 * /career-readiness (opening soon) — and this page routes to both, then
 * makes room for the three things beyond the skill tracks: mentors,
 * internships, and wellness support.
 * Nothing here names a price, a date or a guaranteed outcome — "nothing is
 * impossible" is a rallying line, not a claim about any specific result.
 */

const STEPS: { icon: IconType; title: string; body: string; tag: string }[] = [
  {
    icon: ClipboardCheck,
    title: 'Find out where you stand',
    body: 'A free initial assessment benchmarks your skills, so you know exactly where to start.',
    tag: 'Free',
  },
  {
    icon: Bot,
    title: 'Practise with AI',
    body: 'Real scenarios and AI coaching, on demand — so you improve fast, with instant feedback instead of waiting for it.',
    tag: 'You + AI',
  },
  {
    icon: GraduationCap,
    title: 'Get reviewed by a mentor',
    body: 'A real person reads your results and signs your practice off — or tells you what to work on.',
    tag: 'Human',
  },
  {
    icon: Briefcase,
    title: 'Complete an internship',
    body: 'Real briefs with partner companies — the last step, and work experience you can show.',
    tag: 'Opening soon',
  },
]

/**
 * The three things students said they actually needed, beyond the skill
 * tracks themselves — each a real card with its own status and CTA, not a
 * decorative footnote. Counsellors and career guidance used to be two
 * separate tiles; they're one Wellness card now, since both are the same
 * request form on /wellness.
 */
const CONCEPTS: {
  icon: IconType
  title: string
  body: string
  tag: string
  live: boolean
  to: string
  cta: string
}[] = [
  {
    icon: GraduationCap,
    title: 'Expert career mentors',
    body: 'Working marketers and career professionals review your work, answer your questions in live chat, and tell you what a score alone can’t.',
    tag: 'Live',
    live: true,
    to: '/community/mentors',
    cta: 'Meet the mentors',
  },
  {
    icon: Briefcase,
    title: 'Land your first internship',
    body: 'Most students never get real, hands-on experience before their first job. We’re building direct paths to internships with partner companies — proof that turns practice into a resume.',
    tag: 'Opening soon',
    live: false,
    to: '/community',
    cta: 'See what’s coming',
  },
  {
    icon: HeartHandshake,
    title: 'Wellness support, built in',
    body: 'Exams, deadlines, and the pressure to have it all figured out take a toll. Confidential counselling and career guidance are part of the experience, not an afterthought.',
    tag: 'Free',
    live: true,
    to: '/wellness',
    cta: 'Get support',
  },
]

/** Hero side card: the two programmes, drawn as the two halves of one path. */
function ProgrammesCard() {
  const rows = [
    {
      icon: Megaphone,
      kind: 'Professional skills',
      name: 'Digital Marketing Programme',
      detail: `${skillTracks.length} skill tracks`,
      live: true,
      to: '/digital-marketing',
    },
    {
      icon: Sprout,
      kind: 'Personal skills',
      name: CAREER_READINESS.name,
      detail: `${PERSONAL_DEVELOPMENT_MODULES.length} modules with AI`,
      live: false,
      to: CAREER_READINESS.path,
    },
  ]
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">Two programmes, one path</p>
      <ul className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <li key={r.name}>
            <Link
              to={r.to}
              className="group flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-3 text-white transition-colors hover:bg-white/[0.12]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <r.icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-white/50">{r.kind}</span>
                <span className="block text-sm font-semibold">{r.name}</span>
                <span className="block text-xs text-white/60">{r.detail}</span>
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  r.live ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/10 text-white/60'
                }`}
              >
                {r.live ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : <Lock size={10} />}
                {r.live ? 'Live' : 'Opens soon'}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-xl bg-white p-4 text-ink-900">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">Every programme finishes the same way</p>
        <ol className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm font-medium">
          {['Practice', 'Mentor review', 'Internship'].map((s, i, all) => (
            <li key={s} className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                {i + 1}
              </span>
              {s}
              {i < all.length - 1 && <ArrowRight size={14} className="text-ink-300" />}
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-white/55">
        Professional skills get you shortlisted. Personal skills get you hired. Build both, and
        nothing is impossible.
      </p>
    </div>
  )
}

function PillarCard({
  kind,
  title,
  body,
  items,
  live,
  to,
  cta,
}: {
  kind: string
  title: string
  body: string
  items: string[]
  live: boolean
  to: string
  cta: string
}) {
  return (
    <div className="card flex flex-col p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">{kind}</p>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            live ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-600'
          }`}
        >
          {live ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : <Lock size={10} />}
          {live ? 'Live now' : 'Opens soon'}
        </span>
      </div>
      <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">{body}</p>
      <div className="mt-5 flex flex-1 flex-wrap content-start gap-2">
        {items.map((i) => (
          <span key={i} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
            {i}
          </span>
        ))}
      </div>
      <Link
        to={to}
        className="group mt-6 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        {cta}
        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  )
}

function HomePage() {
  const { user } = useAuthUser()
  const assessmentTo = user ? '/practice' : '/signup'

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="surface-wood-dark relative overflow-hidden">
          <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 opacity-[0.12]">
            <svg width="420" height="420" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="1.2">
              <circle cx="100" cy="100" r="96" />
              <circle cx="100" cy="100" r="74" />
              <circle cx="100" cy="100" r="52" />
              <circle cx="100" cy="100" r="30" />
            </svg>
          </span>

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8">
            <div className="rise-in">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                <Sparkles size={13} />
                Powered by AI · Reviewed by people
              </span>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Personal &amp; professional development
              </h1>
              <p className="mt-3 font-display text-2xl leading-snug text-brand-200 sm:text-3xl">powered by AI.</p>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                Personal skills and professional skills, built together — practising with AI so you move
                fast, reviewed by mentors so you know it’s real, and proven with an internship you can show
                for it. Free to start.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  to={assessmentTo}
                  className="press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
                >
                  <ClipboardCheck size={16} />
                  Take the initial assessment
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/wellness"
                  hash="career-guidance"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/40"
                >
                  <CalendarCheck size={16} />
                  Book a career consultation
                </Link>
              </div>

              {/* The three things students actually ask for, right up front
                  — not buried at the bottom of the page. */}
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65">
                {['Expert career mentors', 'Your first internship', 'Wellness support, built in'].map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <BadgeCheck size={15} className="text-brand-200" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <ProgrammesCard />
          </div>
        </section>

        {/* Two kinds of skill */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Two programmes, one goal</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Whatever your goal, these two skill sets get you there.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-600">
              Professional skills get you shortlisted. Personal skills get you hired, and help you grow once
              you’re in. Build both with AI, and there’s nothing standing between you and your goal.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <PillarCard
              kind="Professional skills"
              title="Digital Marketing Programme"
              body="Scenario-based practice across the skills marketing teams hire for — including AI-assisted marketing and answer-engine SEO — with a free certificate."
              items={skillTracks.map((t) => t.name)}
              live
              to="/digital-marketing"
              cta="Explore Digital Marketing"
            />
            <PillarCard
              kind="Personal skills"
              title={CAREER_READINESS.name}
              body="Five modules on the skills that decide careers, each practised with AI as your coach and reviewed by a mentor."
              items={PERSONAL_DEVELOPMENT_MODULES.map((m) => m.title)}
              live={false}
              to={CAREER_READINESS.path}
              cta="See the programme"
            />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-ink-100 bg-ink-50/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">How it works</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                From “I think I know this” to “I can prove it.”
              </h2>
            </div>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="card flex flex-col p-6">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e1">
                      <s.icon size={20} />
                    </span>
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">{s.tag}</span>
                  </div>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-brand-600">Step {i + 1}</p>
                  <h3 className="mt-1 text-lg font-semibold text-ink-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* You're not doing this alone — the three things beyond the skill
            tracks themselves, each a real card with real status, not a
            decorative footnote. */}
        <section className="border-t border-ink-100 bg-ink-50/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                You’re not doing this alone
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                AI does the coaching. People are still the point.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-ink-600">
                AI is tireless and instant — perfect for practice. It’s also confidently wrong sometimes,
                which is why real mentors, real internships and real support are part of the experience,
                not an afterthought.
              </p>
            </div>

            <ul className="mt-10 grid gap-5 lg:grid-cols-3">
              {CONCEPTS.map((c) => (
                <li key={c.title}>
                  <Link to={c.to} className="card lift group flex h-full flex-col p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e1">
                        <c.icon size={22} />
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          c.live ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-600'
                        }`}
                      >
                        {c.live ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : <Lock size={10} />}
                        {c.tag}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink-900">
                      {c.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{c.body}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                      {c.cta}
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="surface-wood-dark flex flex-col items-start justify-between gap-6 rounded-2xl px-6 py-10 sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Nothing is impossible. Start with where you stand.
              </h2>
              <p className="mt-2 max-w-md text-sm text-white/70 sm:text-base">
                The initial assessment is free, with no time limit. Everything else builds from it.
              </p>
            </div>
            <Link
              to={assessmentTo}
              className="press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
            >
              <Target size={16} />
              Take the initial assessment
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
