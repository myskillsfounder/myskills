import { CheckCircle2, Lock } from 'lucide-react'
import { isProgrammeComplete, type ProgrammeStage, type StageState } from '@/lib/programmes'

const BADGE: Record<StageState, string> = {
  done: 'bg-emerald-500 text-white',
  active: 'bg-brand-600 text-white ring-4 ring-brand-100',
  todo: 'bg-ink-100 text-ink-600',
  locked: 'bg-ink-100 text-ink-400',
}

const STATE_LABEL: Record<StageState, string> = {
  done: 'Done',
  active: 'In progress',
  todo: 'Not started',
  locked: 'Locked',
}

/**
 * The three stages every programme is finished through — practice, a mentor
 * review, an internship through MySkills — drawn the same way under both
 * programmes' score cards, so it's clear a high practice score is a start,
 * not a finish.
 */
export function ProgrammeCompletion({ stages }: { stages: ProgrammeStage[] }) {
  const complete = isProgrammeComplete(stages)
  const left = stages.filter((s) => s.state !== 'done').length

  return (
    <section className="card rise-in p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">
          To complete this programme
        </h3>
        <p className={`text-xs font-semibold ${complete ? 'text-emerald-700' : 'text-ink-500'}`}>
          {complete ? 'Complete' : `${left} of ${stages.length} stages to go`}
        </p>
      </div>

      <ol className="mt-4 grid gap-4 sm:grid-cols-3 sm:gap-3">
        {stages.map((s, i) => (
          <li key={s.key} className="flex items-start gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${BADGE[s.state]}`}
            >
              {s.state === 'done' ? (
                <CheckCircle2 size={16} />
              ) : s.state === 'locked' ? (
                <Lock size={13} />
              ) : (
                i + 1
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">
                {s.title}
                <span className="sr-only"> — {STATE_LABEL[s.state]}</span>
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
