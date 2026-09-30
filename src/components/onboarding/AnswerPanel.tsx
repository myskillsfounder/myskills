import { useEffect, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { START_LABEL, type Plan, type StartKey } from '@/lib/onboardingContent'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The answer to the sentence: a short "thinking" beat, the headline typed out,
 * then the choices it's based on, the three steps and the buttons revealed one
 * after another. With reduced motion everything appears at once. The parent
 * keys this by the plan, so a new answer starts the sequence again.
 *
 * The full headline is also in the DOM as plain text (for screen readers), so
 * the typing is decoration only.
 */
export function AnswerPanel({
  plan,
  busy,
  onPick,
  onSkip,
}: {
  plan: Plan
  busy: boolean
  onPick: (start: StartKey) => void
  onSkip: () => void
}) {
  const still = prefersReducedMotion()
  const total = plan.headline.length
  const [phase, setPhase] = useState<'thinking' | 'typing' | 'done'>(still ? 'done' : 'thinking')
  const [chars, setChars] = useState(still ? total : 0)
  // 0: nothing, 1: based-on, 2-4: the steps, 5: the buttons
  const [reveal, setReveal] = useState(still ? 5 : 0)

  useEffect(() => {
    if (phase !== 'thinking') return
    const t = setTimeout(() => setPhase('typing'), 750)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'typing') return
    const id = setInterval(() => {
      setChars((c) => {
        const next = Math.min(total, c + 2)
        if (next >= total) {
          clearInterval(id)
          setPhase('done')
        }
        return next
      })
    }, 22)
    return () => clearInterval(id)
  }, [phase, total])

  useEffect(() => {
    if (phase !== 'done' || reveal >= 5) return
    const t = setTimeout(() => setReveal((r) => r + 1), 300)
    return () => clearTimeout(t)
  }, [phase, reveal])

  const fade = (visible: boolean) =>
    `transition-all duration-500 ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`

  return (
    <section aria-label="Your plan" className="glow-edge card-glass-dark relative mt-6 overflow-hidden rounded-2xl p-5 sm:p-7">
      <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-brand-200">
        <Sparkles size={14} />
        {phase === 'thinking' ? 'Building your plan' : 'Your plan'}
      </p>

      {phase === 'thinking' ? (
        <div className="mt-4 space-y-2.5" aria-hidden>
          <span className="block h-3 w-11/12 animate-pulse rounded-full bg-white/10" />
          <span className="block h-3 w-8/12 animate-pulse rounded-full bg-white/10" />
        </div>
      ) : (
        <>
          <p className="sr-only" role="status">
            {phase === 'done' ? plan.headline : ''}
          </p>
          <p aria-hidden className="mt-3 font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
            {plan.headline.slice(0, chars)}
            {phase === 'typing' && <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-brand-200 align-middle" />}
          </p>
        </>
      )}

      <div className={`mt-4 flex flex-wrap items-center gap-2 text-xs ${fade(reveal >= 1)}`}>
        <span className="font-mono uppercase tracking-wide text-white/45">Based on</span>
        {plan.basedOn.map((b) => (
          <span key={b} className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-white/80">
            {b}
          </span>
        ))}
      </div>

      <ol className="mt-5 space-y-3.5">
        {plan.steps.map((s, i) => (
          <li key={s.title} className={`flex gap-3.5 ${fade(reveal >= i + 2)}`}>
            <span
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/30 font-display text-sm font-semibold text-brand-100"
            >
              {i + 1}
            </span>
            <div>
              <p className="text-[15px] font-semibold text-white">{s.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-white/65">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className={`mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${fade(reveal >= 5)}`}>
        <button
          type="button"
          disabled={busy}
          onClick={() => onPick(plan.start)}
          className="press inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Saving…' : `Start the ${START_LABEL[plan.start]}`}
          <ArrowRight size={17} />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onPick(plan.other)}
          className="press inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Take the {START_LABEL[plan.other]} instead
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onSkip}
          className="px-2 py-3 text-sm font-medium text-white/65 transition-colors hover:text-white disabled:opacity-60"
        >
          I’ll look around first
        </button>
      </div>
    </section>
  )
}
