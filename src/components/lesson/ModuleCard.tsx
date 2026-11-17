import type { ReactNode } from 'react'
import { ArrowRight, Check, Clock } from 'lucide-react'

/**
 * A module as a card on a programme's page, the same card as the Digital Marketing
 * modules: its number, title and what it teaches, a dot for each step with a tick when
 * done, and Start, Continue or Review. The page that owns the programme says where it
 * goes (`link`), so each can use its own typed address.
 */
export interface ModuleCardStep {
  label: string
  done: boolean
}

const card =
  'group flex h-full w-full flex-col rounded-2xl border border-ink-200 bg-white p-4 text-left shadow-e1 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-e2'

export function ModuleCard({
  n,
  title,
  blurb,
  meta,
  minutes,
  steps,
  tag,
  link,
}: {
  n: number
  title: string
  blurb?: string
  /** One short line under the blurb: the skill, the level. */
  meta?: string
  minutes?: number
  steps: ModuleCardStep[]
  /** A small label beside the number, such as Core. */
  tag?: string
  link: (className: string, inner: ReactNode) => ReactNode
}) {
  const done = steps.filter((s) => s.done).length
  const complete = steps.length > 0 && done === steps.length
  return (
    <>
      {link(
        card,
        <>
          <span className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Module {n}</span>
              {tag && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">{tag}</span>}
            </span>
            {minutes ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-500">
                <Clock size={11} /> {minutes} min
              </span>
            ) : null}
          </span>
          <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug text-ink-900">{title}</h3>
          {blurb && <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-ink-600">{blurb}</p>}
          {meta && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-500">{meta}</p>}
          <span className="mt-auto flex items-center justify-between gap-3 pt-4">
            <span className="flex items-center gap-1.5" role="img" aria-label={`${done} of ${steps.length} steps done`}>
              {steps.map((s, i) => (
                <span key={`${s.label}-${i}`} title={s.label} className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${s.done ? 'bg-emerald-600' : 'bg-ink-200'}`}>
                  {s.done && <Check size={12} strokeWidth={3} />}
                </span>
              ))}
              <span className="ml-1 text-xs text-ink-500">
                {done}/{steps.length}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
              {complete ? 'Review' : done > 0 ? 'Continue' : 'Start'}
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </span>
        </>,
      )}
    </>
  )
}
