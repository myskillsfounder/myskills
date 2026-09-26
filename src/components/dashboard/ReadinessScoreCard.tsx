import { Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react'
import type { Readiness, ReadinessComponent } from '@/lib/readinessScore'
import { rememberProgramme } from '@/lib/practiceProgramme'

/** One part of the score: what it is, how full it is, and where its points
 *  come from — in plain words, not a list of counts. */
function Part({ label, from, c }: { label: string; from: string; c: ReadinessComponent }) {
  const pct = c.max ? (c.points / c.max) * 100 : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-ink-900">{label}</span>
        <span className="shrink-0 text-sm tabular-nums text-ink-500">
          <span className="font-semibold text-ink-900">{Math.round(c.points)}</span> / {c.max}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-brand-600"
          style={{
            width: c.points > 0 ? `${Math.max(pct, 3)}%` : '0%',
            transition: 'width 1s cubic-bezier(0.2,0.8,0.2,1)',
          }}
        />
      </div>
      <p className="mt-1 text-xs text-ink-500">{from}</p>
    </div>
  )
}

/**
 * The LaunchPad's centrepiece, kept to three questions a student can answer at
 * a glance: where am I (the ring), what is it made of (three parts, each with
 * where its points come from), and what do I do next (one action). How much
 * of it has been checked is one line, not a panel of its own.
 */
export function ReadinessScoreCard({ readiness }: { readiness: Readiness }) {
  const { score, band, personal, professional, internship, nextAction, verifiedPoints, selfReportedPoints } = readiness
  const counted = Math.round(verifiedPoints + selfReportedPoints)
  const R = 54
  const C = 2 * Math.PI * R

  return (
    <section className="card flex h-full flex-col p-6 sm:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Career Readiness Score</p>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="relative mx-auto h-36 w-36 shrink-0 sm:mx-0">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="64" cy="64" r={R} fill="none" strokeWidth="10" className="stroke-brand-100" />
            {/* A round linecap still paints a dot at zero length — skip the
                arc entirely at 0 so an empty score looks empty. */}
            {score > 0 && (
              <circle
                cx="64"
                cy="64"
                r={R}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                className="stroke-brand-600"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - score / 100)}
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.2,0.8,0.2,1)' }}
              />
            )}
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            role="img"
            aria-label={`Career Readiness Score ${score} out of 100`}
          >
            <span className="font-display text-5xl font-semibold leading-none tabular-nums text-ink-900">{score}</span>
            <span className="mt-1 text-xs font-medium text-ink-500">out of 100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-semibold leading-tight text-ink-900">{band.label}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            This is what employers see. It only counts what you do on MySkills — learning, practice, live
            sessions and your mentors’ sign-off.
          </p>
          {counted > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-600">
              <CheckCircle2 size={14} className={verifiedPoints > 0 ? 'text-emerald-600' : 'text-ink-300'} />
              {Math.round(verifiedPoints)} of your {counted} points checked by MySkills
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Part
          label="Personal Development"
          from="Career Readiness modules, live sessions and a mentor’s sign-off"
          c={personal}
        />
        <Part
          label="Professional Development"
          from="Digital Marketing practice, the Foundation assessment, live training and a mentor’s sign-off"
          c={professional}
        />
        <Part label="Internship" from="An internship through MySkills — opens later" c={internship} />
      </div>

      {nextAction && (
        <Link
          to={nextAction.to}
          onClick={() => nextAction.programme && rememberProgramme(nextAction.programme)}
          className="group mt-6 flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 p-4 transition-colors hover:border-brand-300"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <TrendingUp size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">Your next step</p>
            <p className="text-sm font-semibold text-ink-900">
              {nextAction.label}
              {/* Some steps (practising the tracks) earn nothing on their own — they open the next one. */}
              {nextAction.upTo > 0 && <span className="font-medium text-brand-700"> · +{Math.round(nextAction.upTo)}</span>}
            </p>
          </div>
          <ArrowRight
            size={18}
            className="shrink-0 text-brand-600 transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      )}

      {readiness.source === 'server' && readiness.computedAt && (
        <p className="mt-4 text-[11px] text-ink-400">
          Issued by MySkills on{' '}
          {new Date(readiness.computedAt).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      )}
    </section>
  )
}
