import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  Flame,
  Layers,
  Target,
  TrendingUp,
} from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser, userDisplayName } from '@/lib/useAuth'
import { useInitialAssessment } from '@/lib/assessmentResults'
import { fetchPracticeSummary, type PracticeSummary } from '@/lib/practiceResults'
import { fetchTestSummary, type TestSummary } from '@/lib/testResults'
import { skillTracks } from '@/lib/skillTracks'
import { AppShell } from '@/components/app/AppShell'

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
    <div className={`rounded-2xl border p-4 ${tint}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
        <Icon size={18} />
      </span>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">{value}</p>
      <p className="text-xs font-semibold">{label}</p>
      {sub && <p className="text-[11px] text-ink-500">{sub}</p>}
    </div>
  )
}

function DashboardPage() {
  const { user } = useAuthUser()
  const name = userDisplayName(user)
  const { result: assessment } = useInitialAssessment()
  const [practice, setPractice] = useState<PracticeSummary>({})
  const [tests, setTests] = useState<TestSummary>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPracticeSummary()
      .then(setPractice)
      .catch(() => {})
      .finally(() => setLoading(false))
    fetchTestSummary()
      .then(setTests)
      .catch(() => {})
  }, [])

  // Only tracks the user has actually attempted — real data, no zero-filled rows.
  const practiced = skillTracks
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      percent: practice[t.slug]?.percent ?? 0,
      attempts: practice[t.slug]?.attempts ?? 0,
      started: Boolean(practice[t.slug]),
    }))
    .filter((r) => r.started)

  const avg = practiced.length
    ? Math.round(practiced.reduce((s, r) => s + r.percent, 0) / practiced.length)
    : 0
  const attempts = practiced.reduce((s, r) => s + r.attempts, 0)
  // Lowest scores first — what to work on next.
  const toImprove = [...practiced].sort((a, b) => a.percent - b.percent).slice(0, 5)
  const testsPassed = Object.values(tests).filter((t) => t.passed).length

  return (
    <AppShell wide>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Welcome back, {name}
          </h1>
          <p className="mt-1 text-sm text-ink-500">Here’s your progress at a glance.</p>
        </div>

        {/* Overview stats — all derived from your assessment + practice records */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile
            icon={ClipboardCheck}
            value={assessment ? `${assessment.overall.percent}%` : '—'}
            label="Assessment"
            sub={assessment ? 'baseline score' : 'not taken yet'}
            tint="border-emerald-200 bg-emerald-50 text-emerald-600"
          />
          <StatTile
            icon={TrendingUp}
            value={`${avg}%`}
            label="Avg practice"
            sub="best-score average"
            tint="border-brand-200 bg-brand-50 text-brand-600"
          />
          <StatTile
            icon={Layers}
            value={`${practiced.length}/${skillTracks.length}`}
            label="Tracks practiced"
            tint="border-sky-200 bg-sky-50 text-sky-600"
          />
          <StatTile
            icon={Flame}
            value={String(attempts)}
            label="Total attempts"
            tint="border-amber-200 bg-amber-50 text-amber-600"
          />
          <StatTile
            icon={FileText}
            value={`${testsPassed}/${skillTracks.length}`}
            label="Tests passed"
            tint="border-violet-200 bg-violet-50 text-violet-600"
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

        {/* Continue practicing — only shows tracks you've actually practiced */}
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
    </AppShell>
  )
}
