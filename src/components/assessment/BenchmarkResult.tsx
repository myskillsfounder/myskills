import { Link } from '@tanstack/react-router'
import { ArrowRight, Target } from 'lucide-react'
import type { FoundationStatus } from '@/lib/foundationPath'
import { Eyebrow } from '@/components/landing/Eyebrow'

/**
 * An experienced student's first attempt under 60%: a benchmark, not a
 * result. It shows where they stand and what to practise; the next attempt
 * (always certified) opens once that's done.
 */
export function BenchmarkResult({ status, nextOpen, waitingOn }: { status: FoundationStatus; nextOpen: boolean; waitingOn?: string }) {
  const b = status.benchmark
  if (!b) return null
  const skillName = (id: string) => status.skills.find((s) => s.id === id)?.name ?? id
  const moduleTitle = (id: string) => status.modules.find((m) => m.id === id)?.title ?? id
  const skills = Object.entries(b.by_skill ?? {}).sort((x, y) => x[1].percent - y[1].percent)

  return (
    <div className="card-glass-dark glow-edge rounded-xl p-6 sm:p-9">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-amber-200">
          <Target size={19} />
        </span>
        <Eyebrow dark>Your benchmark</Eyebrow>
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
        {b.percent}%: a starting point, not a result
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
        You answered {b.correct} of {b.total}. Below 60%, an experienced start counts as a benchmark: no certificate yet, and nothing
        on your Global Readiness Score. It shows what to practise. Then you get one more attempt, and that one always earns your
        certificate.
      </p>

      {skills.length > 0 && (
        <div className="mt-6 space-y-2.5">
          {skills.map(([id, s]) => (
            <div key={id} className="flex items-center gap-3">
              <span className="w-44 shrink-0 truncate text-xs text-white/65">{skillName(id)}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${s.percent >= 70 ? 'bg-emerald-300' : 'bg-amber-300'}`} style={{ width: `${s.percent}%` }} />
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-xs font-bold tabular-nums text-white/80">{s.percent}%</span>
            </div>
          ))}
        </div>
      )}

      {status.gaps.length > 0 && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-semibold text-white">Practise these first (60% or more in each)</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {status.gaps.map((g) => (
              <li key={g} className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-medium text-amber-100">
                {moduleTitle(g)}
              </li>
            ))}
          </ul>
          {status.tested_out.length > 0 && <p className="mt-3 text-xs text-white/55">You’ve already shown the rest ({status.tested_out.length} tested out).</p>}
        </div>
      )}

      {!nextOpen && waitingOn && <p className="mt-5 text-sm text-white/70">{waitingOn}</p>}
      {!nextOpen && (
        <Link
          to="/practice"
          className="press mt-6 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
        >
          Go to Practice
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  )
}
