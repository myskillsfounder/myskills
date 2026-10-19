import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight, ChevronRight, Sparkles, TrendingUp } from 'lucide-react'
import type { NextAction, Readiness } from '@/lib/readinessScore'
import type { ModuleProgress } from '@/lib/careerReadinessProgramme'
import type { ScoreTrend } from '@/lib/scoreTrend'
import { rememberProgramme } from '@/lib/practiceProgramme'
import { COURSE_LOOK } from '@/components/dashboard/KeyMeasures'
import { useEntered } from '@/components/dashboard/ReadinessScoreCard'

/** A programme's part of the score, in its colour: violet for Digital Marketing, green for Global Leadership. */
const LOOK = {
  1: { label: 'Professional', name: 'Digital Marketing', text: 'text-brand-700', track: 'bg-brand-100', bar: 'bg-gradient-to-r from-brand-400 to-brand-700' },
  2: { label: 'Personal', name: 'Global Leadership', text: 'text-emerald-700', track: 'bg-emerald-100', bar: 'bg-gradient-to-r from-emerald-400 to-teal-600' },
} as const

interface Row {
  name: string
  /** 0-100 */
  pct: number
  value: string
}

function GrowthCard({
  programme,
  points,
  max,
  summary,
  rows,
  empty,
}: {
  programme: 1 | 2
  points: number
  max: number
  summary: string
  rows: Row[]
  empty: string
}) {
  const look = LOOK[programme]
  const course = COURSE_LOOK[programme]
  const Icon = course.icon
  const entered = useEntered()
  return (
    <Link
      to="/practice"
      onClick={() => rememberProgramme(programme)}
      className="card lift group flex h-full flex-col p-5"
      aria-label={`${look.name}: ${Math.round(points)} of ${max} points. Open in Practice.`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-e1 ${course.tile}`}>
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-2xl font-semibold leading-none tabular-nums text-ink-900">
            {Math.round(points)}
            <span className="text-sm font-medium text-ink-400">/{max}</span>
          </p>
          <p className={`mt-1 text-xs font-semibold ${look.text}`}>{look.label}</p>
          <p className="truncate text-xs text-ink-500">{look.name}</p>
        </div>
        <ChevronRight size={16} className="ml-auto shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="mt-3 text-xs text-ink-500">{summary}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-600">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((r, i) => (
            <li key={r.name}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ink-800">{r.name}</span>
                <span className="shrink-0 tabular-nums text-ink-500">{r.value}</span>
              </div>
              <div className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${look.track}`}>
                <div
                  className={`h-full rounded-full ${look.bar}`}
                  style={{
                    width: entered ? `${Math.max(r.pct, 3)}%` : '0%',
                    transition: `width 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${120 + i * 90}ms`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Link>
  )
}

/**
 * The two programmes side by side, each with its part of the score and the
 * three things that show where it stands: the best practice tracks, and the
 * modules in progress (then the ones finished).
 */
export function GrowthCards({
  readiness,
  tracks,
  modules,
}: {
  readiness: Readiness
  /** Practised tracks with their best score. */
  tracks: { name: string; percent: number }[]
  modules: ModuleProgress[]
}) {
  const best = [...tracks].sort((a, b) => b.percent - a.percent).slice(0, 3)
  const doneModules = modules.filter((m) => m.done >= m.total).length
  const shownModules = [
    ...modules.filter((m) => m.done > 0 && m.done < m.total).sort((a, b) => b.done / b.total - a.done / a.total),
    ...modules.filter((m) => m.done >= m.total),
  ].slice(0, 3)
  return (
    <>
      <GrowthCard
        programme={1}
        points={readiness.professional.points}
        max={readiness.professional.max}
        summary={`${tracks.length} of 8 tracks practised`}
        rows={best.map((t) => ({ name: t.name, pct: t.percent, value: `${Math.round(t.percent)}%` }))}
        empty="Practise a track: your best scores show here."
      />
      <GrowthCard
        programme={2}
        points={readiness.personal.points}
        max={readiness.personal.max}
        summary={`${doneModules} of ${modules.length} modules done`}
        rows={shownModules.map((m) => ({
          name: m.title,
          pct: (m.done / m.total) * 100,
          value: m.done >= m.total ? 'Done' : `${m.done} of ${m.total}`,
        }))}
        empty="Start a module: what you’ve written shows here."
      />
    </>
  )
}

/**
 * Two short cards under the programmes: something that went well, and the
 * thing to do next. Worked out from the student's own progress, so they are
 * labelled as what they are, not as advice from an AI.
 */
export function NextStepCards({
  readiness,
  trend,
  bestTrack,
  modulesDone,
}: {
  readiness: Readiness
  trend: ScoreTrend | null
  bestTrack: { name: string; percent: number } | null
  modulesDone: number
}) {
  const held = Math.round((readiness.personal.held ?? 0) + (readiness.professional.held ?? 0))
  const heldIn: 1 | 2 = (readiness.personal.held ?? 0) >= (readiness.professional.held ?? 0) ? 2 : 1
  const next: NextAction | null = readiness.nextAction

  // The good news, if there is any.
  const good =
    trend && trend.change > 0
      ? { title: `Up ${trend.change} ${trend.change === 1 ? 'point' : 'points'} ${trend.since}`, body: 'Your Global Readiness Score is climbing.' }
      : bestTrack && bestTrack.percent >= 60
        ? { title: `Strongest track: ${bestTrack.name}`, body: `Your best score is ${Math.round(bestTrack.percent)}%.` }
        : modulesDone > 0
          ? { title: `${modulesDone} ${modulesDone === 1 ? 'module' : 'modules'} done`, body: 'Global Leadership is under way.' }
          : null

  // What to do: points waiting on a project come first, then the next step.
  const todo = held > 0
    ? {
        title: `${held} ${held === 1 ? 'point' : 'points'} waiting`,
        body: `Pass your ${heldIn === 2 ? 'Global Leadership' : 'Digital Marketing'} project to release them.`,
        to: '/practice',
        programme: heldIn,
        warn: true,
      }
    : next
      ? {
          title: next.label,
          body: next.upTo > 0 ? `Up to ${Math.round(next.upTo * 10) / 10} ${next.upTo === 1 ? 'point' : 'points'}.` : 'It opens your next step.',
          to: next.to,
          programme: next.programme,
          warn: false,
        }
      : null

  if (!good && !todo) return null
  return (
    <div className="grid h-full gap-4 sm:grid-cols-2">
      {good && (
        <div className={`flex h-full items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 ${todo ? '' : 'sm:col-span-2'}`}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-e1">
            {trend && trend.change > 0 ? <TrendingUp size={18} /> : <Sparkles size={18} />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-900">{good.title}</p>
            <p className="text-xs text-emerald-700">{good.body}</p>
          </div>
        </div>
      )}
      {todo && (
        <Link
          to={todo.to}
          onClick={() => todo.programme && rememberProgramme(todo.programme)}
          className={`group flex h-full items-center gap-3 rounded-2xl border p-4 transition-colors ${good ? '' : 'sm:col-span-2'} ${
            todo.warn ? 'border-amber-100 bg-amber-50 hover:border-amber-300' : 'border-brand-100 bg-brand-50 hover:border-brand-300'
          }`}
        >
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-e1 ${
              todo.warn ? 'text-amber-600' : 'text-brand-600'
            }`}
          >
            {todo.warn ? <AlertTriangle size={18} /> : <ArrowRight size={18} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${todo.warn ? 'text-amber-900' : 'text-brand-900'}`}>{todo.title}</p>
            <p className={`text-xs ${todo.warn ? 'text-amber-700' : 'text-brand-700'}`}>{todo.body}</p>
          </div>
          <ChevronRight size={16} className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${todo.warn ? 'text-amber-500' : 'text-brand-400'}`} />
        </Link>
      )}
    </div>
  )
}
