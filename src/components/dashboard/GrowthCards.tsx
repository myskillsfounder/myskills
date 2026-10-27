import { useEffect, useRef, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight, ChevronRight, Lightbulb, Lock, Sparkles, TrendingUp, X } from 'lucide-react'
import { ACTIVITY_HELD_CAP, PROJECT_PASS, PROJECT_MAX, type NextAction, type Readiness } from '@/lib/readinessScore'
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

/**
 * A part of the score, opened from Skills growth (Paul, 27 Oct 2026: "these
 * should clearly show how the score is calculated, the next steps to improve
 * it, and the current breakdown affecting it", not send the student to
 * Practice). Its points, each piece with what is earned and the rule behind
 * it, anything held until the project passes, and the steps that raise it.
 */
function ScoreBreakdownDialog({ programme, readiness, onClose }: { programme: 1 | 2; readiness: Readiness; onClose: () => void }) {
  const look = LOOK[programme]
  const course = COURSE_LOOK[programme]
  const Icon = course.icon
  const part = programme === 1 ? readiness.professional : readiness.personal
  const closeRef = useRef<HTMLButtonElement>(null)
  // This programme's steps, in journey order: the Foundation assessment is Digital Marketing's.
  const steps: NextAction[] = readiness.nextActions.filter((a) => (a.programme ?? 1) === programme)
  const several = programme === 1 && (part.programmes?.length ?? 0) > 1

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`${look.label} score`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink-900/50" />
      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-e2 sm:max-w-2xl sm:rounded-3xl">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
        >
          <X size={18} />
        </button>

        {/* The number. */}
        <div className="border-b border-ink-900/[0.06] p-6 pr-14">
          <div className="flex items-center gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${course.tile}`}>
              <Icon size={22} />
            </span>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${look.text}`}>{look.label} development</p>
              <p className="font-display text-lg font-semibold text-ink-900">{look.name}</p>
            </div>
            <p className="ml-auto font-display text-4xl font-semibold tabular-nums text-ink-900">
              {Math.round(part.points)}
              <span className="text-lg font-medium text-ink-400">/{part.max}</span>
            </p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            {programme === 1
              ? `Worth ${part.max} of your 100-point Global Readiness Score: practice, the Foundation assessment and live training (up to 20), and a project a mentor grades (up to 20).`
              : `Worth ${part.max} of your 100-point Global Readiness Score: the modules (up to 25) and a project a mentor grades (up to 15).`}
            {several && ' With more than one professional programme started, this is the average of them.'}
          </p>
        </div>

        <div className="space-y-6 p-6">
          {/* Where the points are now, and how each is worked out. */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Your breakdown</h3>
            <ul className="mt-3 space-y-4">
              {(part.parts ?? []).map((p) => (
                <li key={p.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-ink-900">{p.label}</span>
                    <span className="shrink-0 tabular-nums text-sm text-ink-700">
                      <span className="font-semibold text-ink-900">{Math.round(p.earned * 10) / 10}</span> / {p.max}
                    </span>
                  </div>
                  <div className={`mt-1.5 h-2 overflow-hidden rounded-full ${look.track}`}>
                    <div className={`h-full rounded-full ${look.bar}`} style={{ width: `${Math.min(100, (p.earned / p.max) * 100)}%` }} />
                  </div>
                  <p className="mt-1.5 text-sm text-ink-700">{p.status}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{p.how}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* The hold: why earned points may not all count yet. */}
          {(part.held ?? 0) > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <Lock size={17} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-sm leading-relaxed text-amber-900">
                <span className="font-semibold">{Math.round((part.held ?? 0) * 10) / 10} points are held.</span> Until your project passes
                ({PROJECT_PASS} of {PROJECT_MAX}), only the first {ACTIVITY_HELD_CAP} activity points count. The rest are released the moment it
                passes.
              </p>
            </div>
          )}
          {(part.held ?? 0) === 0 && part.projectStatus !== 'approved' && (
            <p className="text-xs leading-relaxed text-ink-500">
              Until your project passes, at most {ACTIVITY_HELD_CAP} of your activity points count; the rest wait for it.
            </p>
          )}

          {several && (
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Your professional programmes</h3>
              <ul className="mt-2 divide-y divide-ink-900/[0.06] rounded-xl border border-ink-900/[0.08]">
                {part.programmes!.map((p) => (
                  <li key={p.slug} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="text-ink-800">{p.title}</span>
                    <span className="tabular-nums text-ink-600">{Math.round(p.points)} / 40{p.completed ? ' · Completed' : ''}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* What raises it next. */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Next steps to raise it</h3>
            {steps.length === 0 ? (
              <p className="mt-2 text-sm text-ink-600">Nothing left here: this part is complete.</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {steps.map((st, i) => (
                  <li key={st.label}>
                    <Link
                      to={st.to}
                      onClick={() => st.programme && rememberProgramme(st.programme)}
                      className="group flex items-center gap-3 rounded-xl border border-ink-900/[0.08] p-3 transition-colors hover:border-brand-300"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 font-display text-xs font-semibold text-white">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-ink-900">{st.label}</span>
                      {st.upTo > 0 && <span className={`shrink-0 text-xs font-semibold ${look.text}`}>up to +{st.upTo}</span>}
                      <ArrowRight size={15} className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <Link
            to="/practice"
            onClick={() => rememberProgramme(programme)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Open {look.name} in Practice <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** One programme inside the Skills growth panel: its points and what is behind them.
 *  Opening it shows how its part of the score adds up (ScoreBreakdownDialog). */
function ProgrammeGrowth({
  programme,
  readiness,
  points,
  max,
  summary,
  rows,
  empty,
}: {
  programme: 1 | 2
  readiness: Readiness
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
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex flex-col rounded-2xl border border-ink-900/[0.08] bg-white p-4 text-left transition-colors hover:border-ink-900/20"
        aria-label={`${look.name}: ${Math.round(points)} of ${max} points. See how it adds up.`}
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
      </button>
      {open && <ScoreBreakdownDialog programme={programme} readiness={readiness} onClose={() => setOpen(false)} />}
    </>
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
          readiness={readiness}
          points={readiness.professional.points}
          max={readiness.professional.max}
          summary={`${tracks.length} of 8 tracks practised`}
          rows={best.map((t) => ({ name: t.name, pct: t.percent, value: `${Math.round(t.percent)}%` }))}
          empty="Practise a track: your best scores show here."
        />
        <ProgrammeGrowth
          programme={2}
          readiness={readiness}
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
