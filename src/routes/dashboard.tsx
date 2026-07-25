import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, ClipboardCheck, Flame, Star, Target } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser, userDisplayName } from '@/lib/useAuth'
import { useProfile } from '@/lib/useProfile'
import { useInitialAssessment } from '@/lib/assessmentResults'
import { fetchPracticeSummary, type PracticeSummary } from '@/lib/practiceResults'
import { skillTracks } from '@/lib/skillTracks'
import { AppShell } from '@/components/app/AppShell'
import { PracticeOverview } from '@/components/practice/PracticeOverview'
import { TimeSpentChart } from '@/components/dashboard/TimeSpentChart'
import { PrimaryGoal } from '@/components/dashboard/PrimaryGoal'
import { TodayFocus } from '@/components/dashboard/TodayFocus'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireOnboarded,
  component: DashboardPage,
})

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Streak + assessment score in one compact card. */
function StatsCard({ userKey, assessmentPercent }: { userKey: string; assessmentPercent: string }) {
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const KEY = `myskills.streak.${userKey}`
    let data: { last: string; count: number }
    try {
      data = JSON.parse(localStorage.getItem(KEY) || 'null') || { last: '', count: 0 }
    } catch {
      data = { last: '', count: 0 }
    }
    const today = dayKey(new Date())
    const yesterday = dayKey(new Date(Date.now() - 86400000))
    if (data.last === today) {
      /* already counted */
    } else if (data.last === yesterday) {
      data = { last: today, count: data.count + 1 }
    } else {
      data = { last: today, count: 1 }
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch {
      /* ignore */
    }
    setStreak(data.count)
  }, [userKey])

  return (
    <div className="grid grid-cols-2 rounded-2xl border border-ink-100 bg-white p-4">
      <div className="pr-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
            <Flame size={15} />
          </span>
          <span className="text-[11px] font-medium text-ink-500">Daily streak</span>
        </div>
        <p className="mt-2 text-xl font-semibold tracking-tight text-ink-900">
          {streak}
          <span className="text-xs font-normal text-ink-400"> day{streak === 1 ? '' : 's'}</span>
        </p>
      </div>
      <div className="border-l border-ink-100 pl-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <ClipboardCheck size={15} />
          </span>
          <span className="text-[11px] font-medium text-ink-500">Assessment</span>
        </div>
        <p className="mt-2 text-xl font-semibold tracking-tight text-ink-900">{assessmentPercent}</p>
      </div>
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

        {/* Review promo — nudge every user to rate + review */}
        <Link
          to="/feedback"
          className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-500">
              <Star size={20} fill="currentColor" />
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-900">Enjoying MySkills?</p>
              <p className="mt-0.5 text-xs text-amber-700">Rate the app and leave a quick review — it helps us a lot.</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white">
            Rate &amp; review <ArrowRight size={13} />
          </span>
        </Link>

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
          {/* Main column — Overall skill level leads */}
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

          {/* Right column — quick stats + goals + today's focus (sticky on desktop) */}
          <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <StatsCard userKey={userKey} assessmentPercent={assessment ? `${assessment.overall.percent}%` : '—'} />
            <PrimaryGoal goals={goals} />
            <TodayFocus userKey={userKey} />
            <TimeSpentChart />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
