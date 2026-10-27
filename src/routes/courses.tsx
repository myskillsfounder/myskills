import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BadgeCheck, Bell, Briefcase, Check, GraduationCap, Sparkles, Target, Trophy, type LucideIcon } from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { GlowOrb, GridBackdrop } from '@/components/landing/GridBackdrop'
import { ProgrammeLeadForm } from '@/components/programmes/ProgrammeLeadForm'
import { GUIDE_ON, setSiteMode } from '@/lib/siteMode'
import { trackEvent } from '@/lib/analytics'
import { COURSES, type Course } from '@/content/courses'

/**
 * Every course in one place (Paul, 26 Oct 2026): the learning-programmes
 * pillar of the standard website, "the student development platform".
 * Open courses lead to their own page and their free aptitude test (taken
 * before signing up); a course that isn't open takes a name and number.
 */
export const Route = createFileRoute('/courses')({
  component: CoursesPage,
})

type Filter = 'all' | 'professional' | 'personal'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All courses' },
  { id: 'professional', label: 'Professional skills' },
  { id: 'personal', label: 'Personal skills' },
]

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Target, title: 'Know your aptitude', body: 'A free test before you start shows your strengths and where to begin.' },
  { icon: Sparkles, title: 'Learn with an AI coach', body: 'Short modules and real scenarios, with feedback as you practise.' },
  { icon: GraduationCap, title: 'Prove it with a mentor', body: 'A real project, graded by an industry mentor, not a multiple-choice quiz.' },
  { icon: Briefcase, title: 'Land your first internship', body: 'Hands-on, real experience with a partner company: work you can show, not just a certificate.' },
  { icon: Trophy, title: 'Grow your score', body: 'Every step adds to your Global Readiness Score, what companies look at when they hire.' },
]

function CourseCard({ c }: { c: Course }) {
  const [notify, setNotify] = useState(false)
  const open = c.status === 'open'
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(143,133,238,0.06)] backdrop-blur transition-colors hover:border-brand-300/40 hover:bg-white/[0.06] sm:p-7">
      {/* The glow behind the icon, as on the platform picture. */}
      <span aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-e1 ring-1 ring-white/20 ${c.tile}`}>
          <c.icon size={22} />
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/75">
            {c.kind === 'personal' ? 'Personal skills' : 'Professional skills'}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${open ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-400/15 text-amber-200'}`}
          >
            {open ? 'Open' : 'Opens soon'}
          </span>
        </div>
      </div>

      <h2 className="relative mt-5 font-display text-2xl font-semibold tracking-tight text-white">{c.title}</h2>
      <p className="relative mt-2 text-[15px] leading-relaxed text-white/70">{c.tagline}</p>

      <p className="relative mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/55">
        {c.facts.map((f, i) => (
          <span key={f} className="inline-flex items-center gap-2">
            {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-white/30" />}
            {f}
          </span>
        ))}
      </p>

      <ul className="relative mt-4 flex flex-wrap gap-2" aria-label="Skills you'll learn">
        {c.skills.map((s) => (
          <li key={s} className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-white/80">
            {s}
          </li>
        ))}
      </ul>

      <div className="relative mt-5 border-t border-white/10 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200">You earn</p>
        <ul className="mt-2 space-y-1.5">
          {c.earn.map((e) => (
            <li key={e} className="flex items-center gap-2 text-sm text-white/75">
              <BadgeCheck size={15} className="shrink-0 text-brand-200" />
              {e}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-auto pt-6">
        {open ? (
          // The aptitude test is every course's first step, so it leads.
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            {c.test && (
              <a
                href={c.test}
                onClick={() => trackEvent('courses_test', { course: c.id })}
                className="press inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
              >
                Take the free aptitude test <ArrowRight size={16} />
              </a>
            )}
            {c.page && (
              <Link
                to={c.page}
                onClick={() => trackEvent('courses_open', { course: c.id })}
                className="text-sm font-semibold text-brand-200 transition-colors hover:text-white"
              >
                Explore the course →
              </Link>
            )}
          </div>
        ) : notify ? (
          <ProgrammeLeadForm programme="data-analytics" title={c.title} start="courses" />
        ) : (
          <button
            type="button"
            onClick={() => setNotify(true)}
            className="press inline-flex h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <Bell size={15} /> Tell me when it opens
          </button>
        )}
      </div>
    </article>
  )
}

function CoursesPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const shown = COURSES.filter((c) => filter === 'all' || c.kind === filter)

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar dark />

      <main>
        <section className="surface-wood-dark relative overflow-hidden">
          <GridBackdrop mask="ellipse 70% 60% at 50% 0%" />
          <GlowOrb className="-left-32 top-10 h-96 w-96" />
          <GlowOrb className="-right-32 top-40 h-96 w-96" color="rgba(143,133,238,0.16)" />

          {/* The courses first (Paul, 27 Oct 2026): the filters, the cards, then
              the heading under them, smaller. */}
          <div className="relative mx-auto max-w-6xl px-4 pb-6 pt-10 sm:px-6 sm:pt-12 lg:px-8">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Show courses">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    filter === f.id ? 'bg-white text-ink-900' : 'bg-white/10 text-white/75 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
            {shown.map((c) => (
              <CourseCard key={c.id} c={c} />
            ))}
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-200">Learning programmes</p>
            <h1 className="mt-3 max-w-3xl font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
              Courses that put{' '}
              <span className="bg-gradient-to-r from-brand-200 to-brand-400 bg-clip-text text-transparent">you at the centre.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/70">
              Personal and professional skills, each built the same way: a free aptitude test first, short modules with an
              AI coach, a real project a mentor grades, and then your first internship: hands-on, real experience.
            </p>
          </div>
        </section>

        {/* How every course works: the same four steps. */}
        <section className="relative overflow-hidden border-t border-white/[0.06] bg-ink-900">
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white">How every course works</h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <span className="flex items-center gap-2 text-brand-200">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/25 text-brand-100">
                      <s.icon size={18} />
                    </span>
                    <span className="font-mono text-xs text-white/40">0{i + 1}</span>
                  </span>
                  <p className="mt-4 font-semibold text-white">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">{s.body}</p>
                </li>
              ))}
            </ol>

            {GUIDE_ON && (
              <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-brand-300/20 bg-gradient-to-r from-brand-600/30 to-brand-400/10 p-6 sm:flex-row sm:items-center">
                <div>
                  <p className="font-display text-xl font-semibold text-white">Not sure which course is for you?</p>
                  <p className="mt-1 text-sm text-white/70">Four quick choices, and the AI guide shows you where to start.</p>
                </div>
                <Link
                  to="/start"
                  onClick={() => setSiteMode('ai')}
                  className="press inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink-900 shadow-e2"
                >
                  <Sparkles size={15} /> Find my starting point
                </Link>
              </div>
            )}
            <p className="mt-6 flex items-center gap-2 text-sm text-white/50">
              <Check size={14} className="text-emerald-300" /> Free to start · No account needed for the aptitude test
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
