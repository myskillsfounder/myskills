import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, BadgeCheck, Clock, Users, type LucideIcon } from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { GlowOrb, GridBackdrop } from '@/components/landing/GridBackdrop'
import { trackEvent } from '@/lib/analytics'
import type { Course, EngineCourseContent } from '@/content/courses'

/**
 * Every course's public page (Digital Marketing, Global Leadership,
 * Entrepreneurship, Data Analytics), so similar courses read the same: what it
 * is, the facts, what you'll be able to do, the modules and the project. This
 * page is the way in, and its button opens the aptitude test, which a visitor
 * can take before signing up.
 */
export function EngineCoursePage({
  course,
  content,
  icon: Icon,
  accent,
  glow,
  closing,
}: {
  course: Course
  content: EngineCourseContent
  icon: LucideIcon
  /** The title's gradient and the closing band's tint. */
  accent: { title: string; band: string }
  /** The hero's coloured glow. */
  glow: string
  /** The closing band's two lines. */
  closing: { title: string; body: string }
}) {
  const test = course.test!
  const hours = content.hours ?? Math.round(content.modules.reduce((n, m) => n + m.minutes, 0) / 60)
  const unit = content.unit ?? 'modules'
  const words = course.title.split(' ')
  const last = words.pop()
  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar dark />

      <main>
        <section className="surface-wood-dark relative overflow-hidden">
          <GridBackdrop mask="ellipse 70% 60% at 30% 0%" />
          <GlowOrb className="-left-32 top-10 h-96 w-96" color={glow} />
          <GlowOrb className="-right-24 top-32 h-96 w-96" />

          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
            <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white">
              <ArrowLeft size={15} /> All courses
            </Link>

            <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Open · {course.kind === 'personal' ? 'Personal' : 'Professional'} skills
                </span>
                <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
                  {words.join(' ')} <span className={`bg-gradient-to-r bg-clip-text text-transparent ${accent.title}`}>{last}</span>
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{content.summary}</p>
                <p className="mt-3 max-w-xl text-sm text-white/55">{content.audience}</p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <a
                    href={test}
                    onClick={() => trackEvent('course_page_test', { course: course.id })}
                    className="press inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
                  >
                    Take the free aptitude test <ArrowRight size={17} />
                  </a>
                  <span className="text-sm text-white/55">About 5 minutes · no account needed yet</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white ring-1 ring-white/20 ${course.tile}`}>
                  <Icon size={22} />
                </span>
                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  {[
                    { k: unit[0].toUpperCase() + unit.slice(1), v: `${content.modules.length}` },
                    { k: 'Learning', v: `About ${hours} hours` },
                    { k: 'Project', v: content.projectTime },
                    { k: 'Level', v: 'Beginner' },
                  ].map((x) => (
                    <div key={x.k}>
                      <dt className="text-white/50">{x.k}</dt>
                      <dd className="mt-0.5 font-semibold text-white">{x.v}</dd>
                    </div>
                  ))}
                </dl>
                <ul className="mt-5 space-y-1.5 border-t border-white/10 pt-4">
                  {course.earn.map((e) => (
                    <li key={e} className="flex items-center gap-2 text-sm text-white/80">
                      <BadgeCheck size={15} className="shrink-0 text-brand-200" /> {e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] bg-ink-900">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-white">What you’ll be able to do</h2>
              <ul className="mt-6 space-y-3">
                {content.outcomes.map((o) => (
                  <li key={o} className="flex gap-3 text-[15px] leading-relaxed text-white/75">
                    <BadgeCheck size={18} className="mt-0.5 shrink-0 text-emerald-300" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-white">{content.modules.length} {unit}</h2>
              <ol className="mt-6 space-y-2.5">
                {content.modules.map((m, i) => (
                  <li key={m.title} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <span className="font-mono text-xs text-brand-200">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 font-medium text-white">{m.title}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-white/50">
                      <Clock size={12} /> {m.minutes} min
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 rounded-xl border border-brand-300/20 bg-brand-500/10 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Users size={16} className="text-brand-200" /> The project
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">{content.project}</p>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className={`flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-r p-6 sm:flex-row sm:items-center ${accent.band}`}>
              <div>
                <p className="font-display text-xl font-semibold text-white">{closing.title}</p>
                <p className="mt-1 text-sm text-white/70">{closing.body}</p>
              </div>
              <a href={test} className="press inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink-900 shadow-e2">
                Take the aptitude test <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
