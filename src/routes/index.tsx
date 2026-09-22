import type { ComponentType } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Briefcase,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  Lock,
  Sparkles,
  Target,
} from 'lucide-react'
import { useAuthUser } from '@/lib/useAuth'
import { skillTracks } from '@/lib/skillTracks'
import { CAREER_READINESS, PERSONAL_DEVELOPMENT_MODULES } from '@/lib/programmes'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Eyebrow } from '@/components/landing/Eyebrow'
import { AiCoachPreview } from '@/components/landing/AiCoachPreview'
import { GridBackdrop } from '@/components/landing/GridBackdrop'

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
]

/** The shared finish line, under both programme cards: whichever you pick,
 *  it ends the same way. */
function CompletionPath() {
  return (
    <div className="card-glass-dark mt-6 p-4 sm:p-5">
      <Eyebrow dark>Every programme finishes the same way</Eyebrow>
      <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm font-medium text-white">
        {['Practice', 'Mentor review', 'Internship'].map((s, i, all) => (
          <li key={s} className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {i + 1}
            </span>
            {s}
            {i < all.length - 1 && <ArrowRight size={14} className="text-white/30" />}
          </li>
        ))}
      </ol>
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
    <div className="card-glass-dark flex flex-col p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brand-200">{kind}</p>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            live ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/10 text-white/60'
          }`}
        >
          {live ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : <Lock size={10} />}
          {live ? 'Live now' : 'Opens soon'}
        </span>
      </div>
      <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/70">{body}</p>
      <div className="mt-5 flex flex-1 flex-wrap content-start gap-2">
        {items.map((i) => (
          <span key={i} className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/80">
            {i}
          </span>
        ))}
      </div>
      <Link
        to={to}
        className="group mt-6 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand-200 hover:text-white"
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
    <div className="min-h-screen bg-ink-900">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="surface-wood-dark relative overflow-hidden">
          <GridBackdrop mask="ellipse 75% 65% at 30% 20%" />
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
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-medium text-white/85">
                <span className="live-ping relative flex h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
                <Sparkles size={13} />
                Powered by AI · Reviewed by people
              </span>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Personal &amp; Professional Development
              </h1>
              <p className="mt-3 font-display text-2xl leading-snug text-brand-200 sm:text-3xl">powered by AI.</p>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                Personal skills and professional skills, built together — practising with AI so you move
                fast, reviewed by mentors so you know it’s real, and proven with an internship you can show
                for it. Free to start.
              </p>

              {/* No CTA here — the hero's job is the idea, not the click.
                  "Take the initial assessment" is the final CTA further
                  down the page, once the case has been made. */}
              <p className="mt-8 max-w-xl font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
                Two kinds of skill. <span className="text-brand-200">One destination — your goals.</span>
              </p>

              {/* The three things students actually ask for, right up front
                  — not buried at the bottom of the page. */}
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65">
                {['Expert career mentors', 'Your first internship', 'Wellness support, built in'].map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <BadgeCheck size={15} className="text-brand-200" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <AiCoachPreview />
          </div>
        </section>

        {/* Two kinds of skill */}
        <section className="surface-wood-dark relative overflow-hidden border-t border-white/[0.06]">
          <GridBackdrop mask="ellipse 55% 50% at 95% 0%" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <Eyebrow dark>Two programmes, one goal</Eyebrow>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Whatever your goal, these two skill sets get you there.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-white/70">
                Professional skills get you shortlisted. Personal skills get you hired, and help you grow
                once you’re in. Build both with AI, and there’s nothing standing between you and your goal.
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
            <CompletionPath />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="surface-wood-dark relative overflow-hidden border-t border-white/[0.06]">
          <GridBackdrop mask="ellipse 60% 50% at 5% 100%" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <Eyebrow dark>How it works</Eyebrow>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Four steps. One system.
              </h2>
            </div>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="card-glass-dark flex flex-col p-6">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e1">
                      <s.icon size={20} />
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">{s.tag}</span>
                  </div>
                  <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-wide text-brand-200">
                    Step_{String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Real people, real experience — mentors and internships. Wellness
            gets its own section next: mental health isn't a feature bullet
            next to "internships", it deserves the room on its own. */}
        <section className="surface-wood-dark relative overflow-hidden border-t border-white/[0.06]">
          <GridBackdrop mask="ellipse 55% 45% at 90% 100%" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <Eyebrow dark>You’re not doing this alone</Eyebrow>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Real people, at every step.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-white/70">
                AI is tireless and instant — perfect for practice. It’s also confidently wrong sometimes,
                which is why real mentors and real internships are part of the experience, not an
                afterthought.
              </p>
            </div>

            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {CONCEPTS.map((c) => (
                <li key={c.title}>
                  <Link to={c.to} className="card-glass-dark lift group flex h-full flex-col p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e1">
                        <c.icon size={22} />
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          c.live ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/10 text-white/60'
                        }`}
                      >
                        {c.live ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : <Lock size={10} />}
                        {c.tag}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-white">
                      {c.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">{c.body}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-200">
                      {c.cta}
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Wellness — its own main section, not a card sharing space with
            mentors and internships. Same treatment as the final CTA panel
            below: the gradient/glow "vibe" that's the site's signature. */}
        <section className="relative overflow-hidden border-t border-white/[0.06] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="surface-wood-dark glow-edge relative mx-auto flex max-w-6xl flex-col items-start gap-8 overflow-hidden rounded-xl p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
            <GridBackdrop mask="ellipse 65% 70% at 15% 30%" />
            <div className="relative max-w-lg">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e2">
                <HeartHandshake size={26} />
              </span>
              <div className="mt-4">
                <Eyebrow dark>Wellness support</Eyebrow>
              </div>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Your mental health matters as much as your skills.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-white/70">
                Exams, deadlines, and the pressure to have it all figured out take a real toll.
                Confidential counselling and career guidance are built into MySkills — free, private,
                and one message away — not an afterthought bolted onto a skills app.
              </p>
              <Link
                to="/wellness"
                className="press relative mt-7 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
              >
                Get support
                <ArrowRight size={16} />
              </Link>
            </div>
            <ul className="relative grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:max-w-xs">
              {['Confidential, always', 'No diagnosis, just support', 'Free for every student', 'A real person replies'].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-white/80">
                    <BadgeCheck size={16} className="shrink-0 text-brand-200" />
                    {t}
                  </li>
                ),
              )}
            </ul>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden border-t border-white/[0.06] px-4 pt-16 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="surface-wood-dark glow-edge relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 overflow-hidden rounded-xl px-6 py-10 sm:flex-row sm:items-center sm:px-10">
            <GridBackdrop mask="ellipse 70% 90% at 90% 50%" />
            <div className="relative">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Nothing is impossible. Start with where you stand.
              </h2>
              <p className="mt-2 max-w-md text-sm text-white/70 sm:text-base">
                The initial assessment is free, with no time limit. Everything else builds from it.
              </p>
            </div>
            <Link
              to={assessmentTo}
              className="press relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
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
