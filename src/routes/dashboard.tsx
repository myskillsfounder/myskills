import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, ClipboardCheck, Target } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser, userDisplayName } from '@/lib/useAuth'
import { useProfile } from '@/lib/useProfile'
import { useInitialAssessment } from '@/lib/assessmentResults'
import { fetchPracticeSummary, type PracticeSummary } from '@/lib/practiceResults'
import { skillTracks } from '@/lib/skillTracks'
import { AppShell } from '@/components/app/AppShell'
import { PracticeOverview } from '@/components/practice/PracticeOverview'
import { TimeSpentChart } from '@/components/dashboard/TimeSpentChart'
import { StreakCard } from '@/components/dashboard/StreakCard'
import { PrimaryGoal } from '@/components/dashboard/PrimaryGoal'
import { TodayFocus } from '@/components/dashboard/TodayFocus'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireOnboarded,
  component: DashboardPage,
})

type IconType = typeof Target

function StatTile({
  icon: Icon,
  value,
  label,
  sub,
  tint,
}: {
  icon: IconType
  value: string
  label: string
  sub?: string
  tint: string
}) {
  return (
    <div className={`rounded-2xl border p-3 sm:p-4 ${tint}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white sm:h-9 sm:w-9 sm:rounded-xl">
        <Icon size={16} />
      </span>
      <p className="mt-2 text-lg font-semibold tracking-tight text-ink-900 sm:mt-3 sm:text-2xl">{value}</p>
      <p className="text-[11px] font-semibold sm:text-xs">{label}</p>
      {sub && <p className="hidden text-[11px] text-ink-500 sm:block">{sub}</p>}
    </div>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthUser()
  const name = userDisplayName(user)
  const userKey = user?.id ?? 'guest'
  const { profile } = useProfile()
  const goals = profile?.goals ?? []
  const { result: assessment } = useInitialAssessment()
  const [practice, setPractice] = useState<PracticeSummary>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPracticeSummary()
      .then(setPractice)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const practiced = skillTracks
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      percent: practice[t.slug]?.percent ?? 0,
      started: Boolean(practice[t.slug]),
    }))
    .filter((r) => r.started)
  const toImprove = [...practiced].sort((a, b) => a.percent - b.percent).slice(0, 5)

  return (
    <AppShell wide>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Welcome back, {name}
          </h1>
          <p className="mt-1 text-sm text-ink-500">Here’s your progress at a glance.</p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <StreakCard userKey={userKey} />
          <StatTile
            icon={ClipboardCheck}
            value={assessment ? `${assessment.overall.percent}%` : '—'}
            label="Assessment"
            sub={assessment ? 'baseline score' : 'not taken yet'}
            tint="border-emerald-200 bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* Take the assessment (only until it's completed) */}
        {!assessment && (
          <Link
            to="/practice"
            className="flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-5 transition-colors hover:bg-brand-100"
          >
            <div>
              <p className="text-sm font-semibold text-brand-900">Start with your initial assessment</p>
              <p className="mt-0.5 text-xs text-brand-700">
                A one-time assessment unlocks your skill tracks and your progress.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white">
              Begin <ArrowRight size={13} />
            </span>
          </Link>
        )}

        <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
          {/* Main column */}
          <div className="space-y-5 lg:col-span-2">
            {loading ? (
              <div className="rounded-2xl border border-ink-100 bg-white p-6 text-sm text-ink-500">
                Loading your progress…
              </div>
            ) : (
              <PracticeOverview practice={practice} onSelect={() => navigate({ to: '/practice' })} />
            )}

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink-900">Continue practicing</h2>
                <Link to="/practice" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                  All tracks <ArrowRight size={14} />
                </Link>
              </div>

              {loading ? (
                <p className="text-sm text-ink-500">Loading…</p>
              ) : toImprove.length === 0 ? (
                <Link
                  to="/practice"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-ink-200 bg-white p-5 transition-colors hover:border-brand-300"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-800">No practice yet</p>
                    <p className="mt-0.5 text-xs text-ink-500">Pick a skill track to start building your scores.</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-600">
                    Start <ArrowRight size={14} />
                  </span>
                </Link>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {toImprove.map((r) => (
                    <Link
                      key={r.slug}
                      to="/practice"
                      className="group flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3.5 transition-colors hover:border-brand-200"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Target size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900">{r.name}</p>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${r.percent}%` }} />
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-ink-400">{r.percent}%</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Side column: goals, today's focus, time spent — sticky on desktop */}
          <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <PrimaryGoal goals={goals} />
            <TodayFocus userKey={userKey} />
            <TimeSpentChart />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
