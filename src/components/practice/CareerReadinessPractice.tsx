import { Link } from '@tanstack/react-router'
import { ArrowRight, Bot, CheckCircle2 } from 'lucide-react'
import { MODULE_CONTENT } from '@/lib/careerReadinessContent'
import type { ProgrammeProgress } from '@/lib/careerReadinessProgramme'
import { PERSONAL_DEVELOPMENT_MODULES } from '@/lib/programmes'
import { SectionHeader } from '@/components/app/SectionHeader'

/**
 * The Career Readiness Programme's five modules, live on /practice beside
 * Digital Marketing's. Each card shows how far the learner is through that
 * module and opens it. The list is shared with /career-readiness.
 */
export function CareerReadinessPractice({ progress }: { progress: ProgrammeProgress }) {
  return (
    <section>
      <SectionHeader
        eyebrow="Career Readiness"
        title="The five modules"
        description="Learn it, practise it in writing, then reflect. A mentor reviews your work."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONAL_DEVELOPMENT_MODULES.map((m, i) => {
          const Icon = m.icon
          const p = progress.modules.find((x) => x.slug === m.slug)
          const content = MODULE_CONTENT.find((c) => c.slug === m.slug)
          const done = p?.done ?? 0
          const total = p?.total ?? 4
          const complete = Boolean(p?.complete)
          return (
            <Link
              key={m.slug}
              to="/career-module/$slug"
              params={{ slug: m.slug }}
              className="card lift rise-in group flex flex-col p-5"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-start justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-md ring-4 ring-brand-50">
                  <Icon size={24} />
                </span>
                {complete ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 size={12} /> Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-600">
                    <Bot size={11} /> ~{content?.minutes ?? 45} min
                  </span>
                )}
              </div>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">Module {i + 1}</p>
              <h3 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink-900">{m.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-600">{content?.outcome ?? m.body}</p>

              <div className="mt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={`h-full rounded-full ${complete ? 'bg-emerald-500' : 'bg-brand-500'}`}
                    style={{ width: `${Math.round((done / total) * 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-ink-600">
                    {done} of {total} written
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                    {complete ? 'Review' : done > 0 ? 'Continue' : 'Start'}
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
