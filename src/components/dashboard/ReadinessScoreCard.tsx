import { Link } from '@tanstack/react-router'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { METHOD_VERSION, RESERVED_POINTS, type Readiness, type ReadinessComponent } from '@/lib/readinessScore'
import { rememberProgramme } from '@/lib/practiceProgramme'

function Breakdown({ label, c }: { label: string; c: ReadinessComponent }) {
  const pct = c.max ? (c.points / c.max) * 100 : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-ink-800">{label}</span>
        <span className="shrink-0 tabular-nums text-ink-500">
          <span className="font-semibold text-ink-900">{Math.round(c.points)}</span> / {c.max}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
          style={{
            width: c.points > 0 ? `${Math.max(pct, 3)}%` : '0%',
            transition: 'width 1s cubic-bezier(0.2,0.8,0.2,1)',
          }}
        />
      </div>
      <p className="mt-1 text-xs text-ink-500">{c.detail}</p>
    </div>
  )
}

/**
 * The LaunchPad's centrepiece. The ring answers "where am I?", the breakdown
 * answers "why that number?", and the next action answers "what do I do about
 * it?" — a score with no lever attached is just a grade.
 */
export function ReadinessScoreCard({ readiness }: { readiness: Readiness }) {
  const { score, band, personal, professional, experience, nextAction, verifiedPoints, selfReportedPoints } = readiness
  const counted = verifiedPoints + selfReportedPoints
  const verifiedShare = counted > 0 ? (verifiedPoints / counted) * 100 : 0
  const R = 54
  const C = 2 * Math.PI * R

  return (
    <section className="card flex h-full flex-col p-6 sm:p-7">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-brand-500" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
          Career Readiness Score
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="relative mx-auto h-40 w-40 shrink-0 sm:mx-0">
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
            <span className="font-display text-5xl font-semibold leading-none tabular-nums text-ink-900">
              {score}
            </span>
            <span className="mt-1 text-xs font-medium text-ink-500">out of 100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-semibold leading-tight text-ink-900">{band.label}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">{band.note}</p>

          <div className="mt-5 space-y-4">
            <Breakdown label="Personal Development" c={personal} />
            <Breakdown label="Professional Development" c={professional} />
            <Breakdown label="Experience" c={experience} />
            {/* Held back on purpose, so 100 isn't reachable yet and nobody is
                surprised when the number moves the day these are added. */}
            <div className="rounded-xl border border-dashed border-ink-300 bg-ink-50/70 p-3">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-ink-700">Coming next</span>
                <span className="shrink-0 tabular-nums text-ink-400">— / {RESERVED_POINTS}</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                Held back for now — more ways to earn points will be added here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {counted > 0 && (
        <div className="mt-6 rounded-2xl border border-ink-900/[0.06] bg-ink-50/70 p-4">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium text-ink-800">How much of it has been checked</span>
            <span className="shrink-0 tabular-nums text-ink-500">
              <span className="font-semibold text-ink-900">{Math.round(verifiedPoints)}</span> of {Math.round(counted)}
            </span>
          </div>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-ink-100" aria-hidden>
            <div className="bg-emerald-500" style={{ width: `${verifiedShare}%` }} />
            <div className="bg-amber-300" style={{ width: `${100 - verifiedShare}%` }} />
          </div>
          <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <span>
                <span className="font-semibold text-ink-800">Verified · {Math.round(verifiedPoints)} points.</span>{' '}
                Education, work and projects MySkills checked on a call, confirmed live sessions, and mentors’ sign-offs.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-300" />
              <span>
                <span className="font-semibold text-ink-800">Self-reported · {Math.round(selfReportedPoints)} points.</span>{' '}
                Career Readiness modules you’ve finished — they count, but a mentor hasn’t read them yet.
              </span>
            </li>
          </ul>
        </div>
      )}

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
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
              Biggest boost right now
            </p>
            <p className="text-sm font-semibold text-ink-900">
              {nextAction.label}{' '}
              <span className="font-medium text-brand-700">· up to +{nextAction.upTo}</span>
            </p>
          </div>
          <ArrowRight
            size={18}
            className="shrink-0 text-brand-600 transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-ink-400">
        Education, experience and projects count once the MySkills team verifies them, and each
        programme earns points when a mentor signs it off. Skills you list appear on your profile but
        aren’t scored.{' '}
        {readiness.source === 'server' && readiness.computedAt
          ? `Issued by MySkills on ${new Date(readiness.computedAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })} · method ${METHOD_VERSION}.`
          : 'Shown as calculated in your browser; the official score appears once it has synced.'}
      </p>
    </section>
  )
}
