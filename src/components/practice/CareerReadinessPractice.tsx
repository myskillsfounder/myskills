import { Link } from '@tanstack/react-router'
import { ArrowRight, Bot, Lock } from 'lucide-react'
import { CAREER_READINESS, PERSONAL_DEVELOPMENT_MODULES } from '@/lib/programmes'
import { SectionHeader } from '@/components/app/SectionHeader'

/**
 * The Career Readiness Programme's personal-development modules, previewed
 * on /practice beside Digital Marketing's. They don't exist until the
 * programme opens, so they're drawn locked with the way in, not as buttons
 * that do nothing. The list is shared with /career-readiness.
 */
export function CareerReadinessPractice() {
  return (
    <section>
      <SectionHeader
        eyebrow="Career Readiness"
        title="The five modules"
        description="Each one practised with AI and reviewed by a mentor."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONAL_DEVELOPMENT_MODULES.map((m, i) => {
          const Icon = m.icon
          return (
            <div
              key={m.title}
              className="rise-in relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-sm"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-100/90 to-transparent"
              />
              <div className="relative flex items-start justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-ink-700 to-ink-900 text-white shadow-md ring-4 ring-ink-100">
                  <Icon size={24} />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-ink-300 bg-ink-100 px-2.5 py-1 text-[11px] font-medium text-ink-600">
                  <Bot size={11} /> With AI
                </span>
              </div>

              <p className="relative mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">
                Module {i + 1}
              </p>
              <h3 className="relative mt-1 font-display text-xl font-semibold tracking-tight text-ink-900">
                {m.title}
              </h3>
              <p className="relative mt-1.5 text-sm leading-relaxed text-ink-600">{m.body}</p>
              <p className="relative mt-3 flex flex-1 items-start gap-2 text-xs leading-relaxed text-ink-500">
                <Bot size={13} className="mt-0.5 shrink-0" />
                {m.ai}
              </p>

              <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
                  <Lock size={12} /> Opens with the programme
                </span>
                <Link
                  to={CAREER_READINESS.path}
                  className="group inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                >
                  See the programme
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
