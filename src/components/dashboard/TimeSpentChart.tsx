import { useMemo, useState } from 'react'
import { timeSeries, type Period } from '@/lib/timeTracker'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'day', label: '1 Day' },
  { key: 'month', label: '1 Month' },
  { key: 'year', label: '1 Year' },
  { key: 'max', label: 'Max' },
]

const W = 640
const H = 220
const PAD = { l: 8, r: 8, t: 16, b: 24 }

export function TimeSpentChart() {
  const [period, setPeriod] = useState<Period>('month')
  const { points, totalHours } = useMemo(() => timeSeries(period), [period])

  const max = Math.max(0.5, ...points.map((p) => p.value))
  const n = points.length
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const x = (i: number) => PAD.l + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (v: number) => PAD.t + (1 - v / max) * innerH

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ')
  const area = `${line} L ${x(n - 1).toFixed(1)} ${(PAD.t + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(PAD.t + innerH).toFixed(1)} Z`

  // a few evenly spaced x labels
  const labelIdx = n <= 7 ? points.map((_, i) => i) : [0, 1, 2, 3, 4, 5, 6].map((k) => Math.round((k / 6) * (n - 1)))
  const gridVals = [max, max / 2, 0]

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-700">Time spent</h2>
        <span className="text-sm font-semibold text-brand-600">{totalHours.toFixed(1)} hrs</span>
      </div>

      <div className="relative w-full text-brand-600">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
          <defs>
            <linearGradient id="ts-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridVals.map((v, i) => (
            <line
              key={i}
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(v)}
              y2={y(v)}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeDasharray="4 5"
            />
          ))}

          <path d={area} fill="url(#ts-fill)" stroke="none" />
          <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* y-axis labels */}
        <div className="pointer-events-none absolute left-1 top-0 flex h-[180px] flex-col justify-between py-2 text-[10px] text-ink-400">
          {gridVals.map((v, i) => (
            <span key={i}>{v.toFixed(1)}</span>
          ))}
        </div>
      </div>

      {/* x labels */}
      <div className="mt-1 flex justify-between px-1 text-[11px] font-medium text-ink-400">
        {labelIdx.map((idx, i) => (
          <span key={i} className={points[idx] && idx === n - 1 ? 'text-brand-600' : ''}>
            {points[idx]?.label ?? ''}
          </span>
        ))}
      </div>

      {/* period toggle */}
      <div className="mt-4 flex items-center gap-1 rounded-xl bg-ink-50 p-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              period === p.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </section>
  )
}
