import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, ClipboardCheck, Flame, MessagesSquare, Star } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser, userDisplayName } from '@/lib/useAuth'
import { useProfile } from '@/lib/useProfile'
import { useInitialAssessment } from '@/lib/assessmentResults'
import { AppShell } from '@/components/app/AppShell'
import { AdSlider } from '@/components/app/AdSlider'
import { TimeSpentChart } from '@/components/dashboard/TimeSpentChart'
import { PrimaryGoal } from '@/components/dashboard/PrimaryGoal'
import { PromptLibraryCard } from '@/components/dashboard/PromptLibrary'
import { PromptSuggestions } from '@/components/dashboard/PromptSuggestions'

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
  const { user } = useAuthUser()
  const name = userDisplayName(user)
  const userKey = user?.id ?? 'guest'
  const { profile } = useProfile()
  const goals = profile?.goals ?? []
  const { result: assessment } = useInitialAssessment()

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

        {/* Talk to a mentor — live chat support */}
        <Link
          to="/support"
          className="flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 transition-colors hover:bg-brand-100"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600">
              <MessagesSquare size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-900">Talk to a mentor</p>
              <p className="mt-0.5 text-xs text-brand-700">Stuck on something? Chat live with a mentor.</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white">
            Start chat <ArrowRight size={13} />
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

        {/* Prompt library is the priority surface, so it takes the wide
            column; the chart and stats sit in the rail. The wrappers are
            `contents` below lg, so their children become direct flex items
            and `order-*` can interleave across columns:
              mobile   streak -> ad -> library -> suggestions -> time spent -> goals
              desktop  library + suggestions in cols 1-2, rest in col 3 */}
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-3 lg:items-start">
          <div className="contents lg:col-span-2 lg:block lg:space-y-5">
            <div className="order-3 lg:order-none">
              <PromptLibraryCard />
            </div>
            <div className="order-4 lg:order-none">
              <PromptSuggestions assessment={assessment} userKey={userKey} />
            </div>
          </div>

          <div className="contents lg:block lg:space-y-5">
            <div className="order-1 lg:order-none">
              <StatsCard userKey={userKey} assessmentPercent={assessment ? `${assessment.overall.percent}%` : '—'} />
            </div>
            {/* Ads — mobile only (desktop shows them in the sidebar). Right after
                the streak card: prime position, visible on the first screen, yet
                below the user's own progress so it isn't intrusive. Renders
                nothing when there are no active ads. */}
            <div className="order-2 lg:hidden">
              <AdSlider />
            </div>
            <div className="order-5 lg:order-none">
              <TimeSpentChart />
            </div>
            <div className="order-6 lg:order-none">
              <PrimaryGoal goals={goals} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
