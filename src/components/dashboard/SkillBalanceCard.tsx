import { Link } from '@tanstack/react-router'
import { ArrowRight, Radar } from 'lucide-react'
import { BALANCE_AREAS, hasAny, type Balance } from '@/lib/skillBalance'
import { useEntered } from '@/components/dashboard/ReadinessScoreCard'

// Wider than tall: the side labels need room.
const W = 360
const H = 280
const CX = W / 2
const CY = H / 2 + 6
const R = 92

/** A point `frac` of the way out along axis `i` of `n`, the first straight up. */
function point(i: number, n: number, frac: number): [number, number] {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
  return [CX + Math.cos(a) * R * frac, CY + Math.sin(a) * R * frac]
}
const poly = (vals: number[]) => vals.map((v, i) => point(i, vals.length, v).join(',')).join(' ')

/**
 * Where the student is across five areas, two ways: where they started (their
 * aptitude tests, a dashed outline) and the work they've done since (the
 * filled shape). Marketing comes from Digital Marketing practice; Leadership,
 * Thinking, People and Self from the Global Leadership modules.
 */
export function SkillBalanceCard({ aptitude, progress }: { aptitude: Balance; progress: Balance }) {
  const entered = useEntered()
  const areas = BALANCE_AREAS
  const prog = areas.map((a) => progress[a.key] ?? 0)
  // The starting outline only when both tests are taken: a missing area at the
  // centre would draw a shape that isn't theirs.
  const aptVals = areas.map((a) => aptitude[a.key])
  const aptComplete = aptVals.every((v): v is number => v != null)
  const missingTests = [
    aptitude.marketing == null ? 'the marketing aptitude test' : null,
    aptitude.leadership == null ? 'the Leadership Aptitude Test' : null,
  ].filter(Boolean)
  const anything = hasAny(progress) || aptComplete

  return (
    <section className="card flex h-full flex-col p-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900">Skill balance</h2>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-ink-500">
          {aptComplete && (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-0 w-3.5 border-t-2 border-dashed border-gold-500" /> Aptitude
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-brand-500/70" /> Progress
          </span>
        </span>
      </div>

      {!anything ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Radar size={20} />
          </span>
          <p className="mt-3 max-w-[16rem] text-sm text-ink-600">
            Take an aptitude test, then practise: your balance across five areas shows here.
          </p>
          <Link to="/practice" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
            Go to Practice <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="mx-auto my-2 w-full max-w-[24rem] overflow-visible"
            role="img"
            aria-label={`Skill balance. Progress: ${areas.map((a, i) => `${a.label} ${Math.round(prog[i] * 100)}%`).join(', ')}.`}
          >
            {[1, 0.66, 0.33].map((f) => (
              <polygon key={f} points={poly(areas.map(() => f))} fill="none" className="stroke-ink-200" strokeWidth={1} />
            ))}
            {areas.map((_, i) => {
              const [x, y] = point(i, areas.length, 1)
              return <line key={i} x1={CX} y1={CY} x2={x} y2={y} className="stroke-ink-200" strokeWidth={1} />
            })}
            <g
              style={{
                transform: entered ? 'scale(1)' : 'scale(0.2)',
                transformOrigin: `${CX}px ${CY}px`,
                transition: 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <polygon
                points={poly(prog.map((v) => Math.max(v, 0.04)))}
                className="fill-brand-500/25 stroke-brand-600"
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {aptComplete && (
                <polygon
                  points={poly(aptVals as number[])}
                  fill="none"
                  className="stroke-gold-500"
                  strokeWidth={1.75}
                  strokeDasharray="5 4"
                  strokeLinejoin="round"
                />
              )}
            </g>
            {areas.map((a, i) => {
              const [x, y] = point(i, areas.length, 1.14)
              const anchor = Math.abs(x - CX) < 4 ? 'middle' : x > CX ? 'start' : 'end'
              return (
                <text key={a.key} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="fill-ink-700 text-[14px] font-semibold">
                  {a.label}
                  <tspan className="fill-ink-400 font-medium"> {Math.round(prog[i] * 100)}%</tspan>
                </text>
              )
            })}
          </svg>
          <p className="mt-auto pt-2 text-xs leading-relaxed text-ink-500">
            {aptComplete
              ? 'The dashed line is where your aptitude tests put you. The shape is the work you’ve done since: practice scores and modules written.'
              : `The shape is the work you’ve done: practice scores and modules written. Take ${missingTests.join(' and ')} to see where you started.`}
          </p>
        </>
      )}
    </section>
  )
}
