import type { ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight, ChevronRight, Lightbulb, Sparkles, TrendingUp } from 'lucide-react'
import type { Readiness } from '@/lib/readinessScore'
import type { ModuleProgress } from '@/lib/careerReadinessProgramme'
import type { ScoreTrend } from '@/lib/scoreTrend'
import type { Activity } from '@/lib/activity'
import { BALANCE_AREAS, type Balance } from '@/lib/skillBalance'
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

/** One programme inside the Skills growth panel: its points and what is behind them. */
function ProgrammeGrowth({
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
      className="group flex flex-col rounded-2xl border border-ink-900/[0.08] bg-white p-4 transition-colors hover:border-ink-900/20"
      aria-label={`${look.name}: ${Math.round(points)} of ${max} points. Open in Practice.`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${course.tile}`}>
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-2xl font-semibold leading-none tabular-nums text-ink-900">
            {Math.round(points)}
            <span className="text-sm font-medium text-ink-400">/{max}</span>
          </p>
          <p className={`mt-1 text-xs font-semibold ${look.text}`}>{look.label}</p>
        </div>
        <ChevronRight size={16} className="ml-auto shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="mt-2 text-xs text-ink-500">
        {look.name} · {summary}
      </p>
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
 * Skills growth: the two programmes side by side in one panel, each with its
 * part of the score and what is behind it: the best practice tracks, and the
 * modules in progress (then the ones finished).
 */
export function SkillsGrowthPanel({
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
    <section className="card h-full p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink-900">Skills growth</h2>
      <p className="text-sm text-ink-500">Your progress in both programmes</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ProgrammeGrowth
          programme={1}
          points={readiness.professional.points}
          max={readiness.professional.max}
          summary={`${tracks.length} of 8 tracks practised`}
          rows={best.map((t) => ({ name: t.name, pct: t.percent, value: `${Math.round(t.percent)}%` }))}
          empty="Practise a track: your best scores show here."
        />
        <ProgrammeGrowth
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
      </div>
    </section>
  )
}

type Tone = 'good' | 'warn' | 'next'

export interface Insight {
  key: string
  tone: Tone
  icon: ComponentType<{ size?: number }>
  title: string
  body: string
  to?: string
  programme?: 1 | 2
}

const TONE: Record<Tone, { box: string; icon: string; title: string; body: string; chevron: string }> = {
  good: { box: 'border-emerald-100 bg-emerald-50/70', icon: 'text-emerald-600', title: 'text-emerald-950', body: 'text-emerald-800', chevron: 'text-emerald-500' },
  warn: { box: 'border-amber-100 bg-amber-50/80', icon: 'text-amber-600', title: 'text-amber-950', body: 'text-amber-800', chevron: 'text-amber-500' },
  next: { box: 'border-brand-100 bg-brand-50/70', icon: 'text-brand-600', title: 'text-brand-950', body: 'text-brand-700', chevron: 'text-brand-400' },
}

/** Days since MySkills was last used, from the account's days; null if unknown. */
function daysAway(activity: Activity | null): number | null {
  if (!activity) return null
  const days = Object.keys(activity.seconds).sort()
  const last = days[days.length - 1]
  if (!last) return null
  const ms = new Date().setHours(0, 0, 0, 0) - new Date(`${last}T00:00:00`).getTime()
  return Math.round(ms / 86400000)
}

/**
 * What the student's own progress says, worked out on the page (not by an
 * AI, and labelled as such): what went well, what needs attention, and the
 * next step. Up to three, in that order.
 */
export function buildInsights({
  readiness,
  trend,
  bestTrack,
  modulesDone,
  activity,
  progress,
}: {
  readiness: Readiness
  trend: ScoreTrend | null
  bestTrack: { name: string; percent: number } | null
  modulesDone: number
  activity: Activity | null
  progress: Balance
}): Insight[] {
  const out: Insight[] = []

  // What went well.
  if (trend && trend.change > 0) {
    out.push({
      key: 'trend',
      tone: 'good',
      icon: TrendingUp,
      title: `Up ${trend.change} ${trend.change === 1 ? 'point' : 'points'} ${trend.since}`,
      body: 'Your Global Readiness Score is climbing.',
    })
  } else if (bestTrack && bestTrack.percent >= 60) {
    out.push({
      key: 'best',
      tone: 'good',
      icon: Lightbulb,
      title: `Strongest track: ${bestTrack.name}`,
      body: `Your best score is ${Math.round(bestTrack.percent)}%.`,
      to: '/practice',
      programme: 1,
    })
  } else if (modulesDone > 0) {
    out.push({
      key: 'modules',
      tone: 'good',
      icon: Sparkles,
      title: `${modulesDone} ${modulesDone === 1 ? 'module' : 'modules'} done`,
      body: 'Global Leadership is under way.',
      to: '/practice',
      programme: 2,
    })
  } else if (activity && activity.streak >= 3) {
    out.push({
      key: 'streak',
      tone: 'good',
      icon: Sparkles,
      title: `${activity.streak} days in a row`,
      body: 'Keep the streak going: any practice counts.',
    })
  }

  // What needs attention: points waiting first, then time away, then the weakest area.
  const held = Math.round((readiness.personal.held ?? 0) + (readiness.professional.held ?? 0))
  const heldIn: 1 | 2 = (readiness.personal.held ?? 0) >= (readiness.professional.held ?? 0) ? 2 : 1
  const away = daysAway(activity)
  const started = BALANCE_AREAS.some((a) => (progress[a.key] ?? 0) > 0)
  const weakest = started ? [...BALANCE_AREAS].sort((a, b) => (progress[a.key] ?? 0) - (progress[b.key] ?? 0))[0] : null
  if (held > 0) {
    out.push({
      key: 'held',
      tone: 'warn',
      icon: AlertTriangle,
      title: `${held} ${held === 1 ? 'point' : 'points'} waiting`,
      body: `Pass your ${heldIn === 2 ? 'Global Leadership' : 'Digital Marketing'} project to release them.`,
      to: '/practice',
      programme: heldIn,
    })
  } else if (away != null && away >= 4) {
    out.push({
      key: 'away',
      tone: 'warn',
      icon: AlertTriangle,
      title: 'Your practice has gone quiet',
      body: `Last here ${away} days ago. Ten minutes today starts a new streak.`,
      to: '/practice',
    })
  } else if (weakest && (progress[weakest.key] ?? 0) < 0.25) {
    out.push({
      key: 'weak',
      tone: 'warn',
      icon: AlertTriangle,
      title: `${weakest.label} needs attention`,
      body:
        weakest.key === 'marketing'
          ? 'Your lowest area on the radar: practise a Digital Marketing track.'
          : `Your lowest area on the radar: start a ${weakest.label.toLowerCase()} module.`,
      to: '/practice',
      programme: weakest.key === 'marketing' ? 1 : 2,
    })
  }

  // The next step.
  const next = readiness.nextAction
  if (next) {
    out.push({
      key: 'next',
      tone: 'next',
      icon: ArrowRight,
      title: next.label,
      body: next.upTo > 0 ? `Up to ${Math.round(next.upTo * 10) / 10} ${next.upTo === 1 ? 'point' : 'points'}.` : 'It opens your next step.',
      to: next.to,
      programme: next.programme,
    })
  }
  return out.slice(0, 3)
}

/** The insights, as a panel of tinted rows: green for good news, amber for attention, violet for the next step. */
export function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null
  return (
    <section className="card h-full p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink-900">Insights</h2>
      <p className="text-sm text-ink-500">From your own progress</p>
      <ul className="mt-4 space-y-3">
        {insights.map((i) => {
          const t = TONE[i.tone]
          const Icon = i.icon
          const inner = (
            <>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-e1 ${t.icon}`}>
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${t.title}`}>{i.title}</span>
                <span className={`block text-xs ${t.body}`}>{i.body}</span>
              </span>
              {i.to && (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-e1">
                  <ChevronRight size={16} className={`transition-transform group-hover:translate-x-0.5 ${t.chevron}`} />
                </span>
              )}
            </>
          )
          return (
            <li key={i.key}>
              {i.to ? (
                <Link
                  to={i.to}
                  onClick={() => i.programme && rememberProgramme(i.programme)}
                  className={`group flex items-center gap-3 rounded-2xl border p-3.5 transition-colors hover:brightness-[0.98] ${t.box}`}
                >
                  {inner}
                </Link>
              ) : (
                <div className={`flex items-center gap-3 rounded-2xl border p-3.5 ${t.box}`}>{inner}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
