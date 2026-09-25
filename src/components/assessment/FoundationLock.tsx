import { Link } from '@tanstack/react-router'
import { ArrowRight, Lock } from 'lucide-react'
import type { FoundationUnlock } from '@/lib/foundation'
import { Eyebrow } from '@/components/landing/Eyebrow'

/**
 * What a learner sees before the Foundation assessment opens: how far they
 * are through the Beginner vocabulary, and the way to keep going. The
 * assessment tests what the vocabulary teaches, so it comes after it.
 */
export function FoundationLock({ unlock }: { unlock: FoundationUnlock }) {
  const toGo = Math.max(0, unlock.required - unlock.percent)
  return (
    <div className="card-glass-dark glow-edge relative overflow-hidden rounded-xl p-6 sm:p-9">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-200">
          <Lock size={19} />
        </span>
        <Eyebrow dark>Locked for now</Eyebrow>
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
        Learn the language first
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
        The Foundation assessment tests what the marketing vocabulary teaches, so it opens once you’ve learned{' '}
        {unlock.required}% of the Beginner words. Work through a few vocabulary sessions in Practice and it will
        unlock on its own.
      </p>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-3xl font-semibold tabular-nums text-white">
            {unlock.percent}%
            <span className="text-sm font-medium text-white/40"> / {unlock.required}% to unlock</span>
          </p>
          <p className="font-mono text-[11px] font-bold tabular-nums text-white/50">
            {unlock.learned} of {unlock.total} words
          </p>
        </div>
        <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-200 transition-all"
            style={{ width: `${Math.min(100, Math.round((unlock.percent / unlock.required) * 100))}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/50">{toGo}% to go — the Vocabulary Builder is in Practice.</p>
      </div>

      <Link
        to="/practice"
        className="press mt-7 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
      >
        Go to Practice
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}
