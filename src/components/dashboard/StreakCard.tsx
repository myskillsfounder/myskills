import { Flame, Trophy } from 'lucide-react'
import { localDay, type Activity } from '@/lib/activity'
import { useEntered } from '@/components/dashboard/ReadinessScoreCard'

const DAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** The last seven days, oldest first, ending today. */
function lastWeek(): { key: string; letter: string; today: boolean }[] {
  const out = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push({ key: localDay(d), letter: DAY_LETTER[d.getDay()], today: i === 0 })
  }
  return out
}

const minutesLabel = (s: number) => (s < 60 ? 'Opened MySkills' : `${Math.round(s / 60)} min`)

/**
 * The student's rhythm: the streak they're on (and their best), the last
 * seven days as bars, a day they used MySkills in orange, and their hours over
 * thirty days. Built from the days the account records (lib/activity.ts); a
 * day counts when they open MySkills, and the bar grows with the time spent.
 */
export function StreakCard({ activity, className = '' }: { activity: Activity; className?: string }) {
  const entered = useEntered()
  const week = lastWeek()
  const secs = week.map((d) => activity.seconds[d.key])
  const top = Math.max(...secs.map((s) => s ?? 0), 60)
  const { streak, best, hours30, active30 } = activity
  const record = streak >= 3 && streak >= best

  const line =
    streak === 0
      ? 'Start a streak today: any practice counts.'
      : record
        ? `Your best streak yet. Come back tomorrow for day ${streak + 1}.`
        : `Come back tomorrow for day ${streak + 1}.${best > streak ? ` Your best is ${best}.` : ''}`

  return (
    <section className={`card flex flex-col p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            streak > 0 ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-e1' : 'bg-ink-100 text-ink-400'
          }`}
        >
          <Flame size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-3xl font-semibold leading-none tabular-nums text-ink-900">{streak}</span>
            <span className="text-sm font-semibold text-ink-700">{streak === 1 ? 'day streak' : 'day streak'}</span>
          </p>
          <p className="mt-1 text-xs leading-snug text-ink-500">{line}</p>
        </div>
        {best > 0 && (
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
              record ? 'bg-amber-50 text-amber-700' : 'bg-ink-100 text-ink-600'
            }`}
            title="Your longest streak in the last 90 days"
          >
            <Trophy size={12} /> Best {best}
          </span>
        )}
      </div>

      {/* The week: a bar per day, orange when they used MySkills. */}
      <div className="mt-4 grid grid-cols-7 gap-1.5" role="img" aria-label={`Last 7 days: ${week.map((d, i) => `${d.letter} ${secs[i] != null ? minutesLabel(secs[i]!) : 'not used'}`).join(', ')}`}>
        {week.map((d, i) => {
          const s = secs[i]
          const used = s != null
          const h = used ? Math.max(18, Math.round(((s ?? 0) / top) * 100)) : 10
          return (
            <div key={d.key} className="flex flex-col items-center gap-1.5" title={used ? minutesLabel(s!) : 'Not used'}>
              <div className="flex h-14 w-full items-end justify-center">
                <div
                  className={`w-full max-w-[1.4rem] rounded-md ${
                    used ? 'bg-gradient-to-t from-orange-500 to-amber-400' : 'bg-ink-100'
                  }`}
                  style={{
                    height: entered ? `${h}%` : '0%',
                    transition: `height 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${i * 60}ms`,
                  }}
                />
              </div>
              <span className={`text-[11px] ${d.today ? 'font-bold text-ink-900' : 'font-medium text-ink-400'}`}>{d.letter}</span>
            </div>
          )
        })}
      </div>

      <p className="mt-4 border-t border-ink-900/[0.06] pt-3 text-xs text-ink-600">
        <span className="font-semibold tabular-nums text-ink-900">{hours30 < 10 ? hours30.toFixed(1) : Math.round(hours30)} hrs</span> in
        the last 30 days · <span className="font-semibold tabular-nums text-ink-900">{active30}</span>{' '}
        {active30 === 1 ? 'day' : 'days'} active
      </p>
    </section>
  )
}
