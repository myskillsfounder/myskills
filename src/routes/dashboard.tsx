import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  ClipboardCheck,
  Flame,
  MessagesSquare,
  Sparkles,
  Star,
  Target,
} from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser, userDisplayName } from '@/lib/useAuth'
import { useProfile } from '@/lib/useProfile'
import { useInitialAssessment } from '@/lib/assessmentResults'
import { useHasFeedback } from '@/lib/feedback'
import { fetchPracticeSummary, type PracticeSummary } from '@/lib/practiceResults'
import { fetchOnlineMentors } from '@/lib/support'
import { skillTracks } from '@/lib/skillTracks'
import { AppShell } from '@/components/app/AppShell'
import { TimeSpentChart } from '@/components/dashboard/TimeSpentChart'
import { PrimaryGoal } from '@/components/dashboard/PrimaryGoal'
import { PathToMastery } from '@/components/dashboard/PathToMastery'
import { VocabularyCoach } from '@/components/dashboard/VocabularyCoach'
import { Badge, ButtonLink, Card, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireOnboarded,
  component: DashboardPage,
})

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Local daily streak (per device). */
function useStreak(userKey: string) {
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
    if (data.last !== today) {
      data = { last: today, count: data.last === yesterday ? data.count + 1 : 1 }
      try {
        localStorage.setItem(KEY, JSON.stringify(data))
      } catch {
        /* ignore */
      }
    }
    setStreak(data.count)
  }, [userKey])
  return streak
}

/** Distinct days the dashboard has been opened on this device — a proxy for
 *  "logins" since sign-in frequency isn't tracked server-side. Used only to
 *  gate the review nudge so it isn't shown to brand-new users. */
function useVisitCount(userKey: string) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const KEY = `myskills.visits.${userKey}`
    let data: { lastDay: string; count: number }
    try {
      data = JSON.parse(localStorage.getItem(KEY) || 'null') || { lastDay: '', count: 0 }
    } catch {
      data = { lastDay: '', count: 0 }
    }
    const today = dayKey(new Date())
    if (data.lastDay !== today) {
      data = { lastDay: today, count: data.count + 1 }
      try {
        localStorage.setItem(KEY, JSON.stringify(data))
      } catch {
        /* ignore */
      }
    }
    setCount(data.count)
  }, [userKey])
  return count
}

function greet() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/** Progress at a glance: a ring for track coverage + the key numbers. */
function ProgressCard({
  streak,
  assessment,
  practicedCount,
}: {
  streak: number
  assessment: number | null
  practicedCount: number
}) {
  const total = skillTracks.length
  const pct = Math.round((practicedCount / total) * 100)
  const R = 30
  const C = 2 * Math.PI * R

  const rows = [
    {
      icon: Flame,
      label: 'Day streak',
      value: `${streak} day${streak === 1 ? '' : 's'}`,
      tone: 'bg-orange-50 text-orange-500',
    },
    {
      icon: ClipboardCheck,
      label: 'Assessment',
      value: assessment != null ? `${assessment}%` : 'Not taken',
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: Target,
      label: 'Tracks practiced',
      value: `${practicedCount}/${total}`,
      tone: 'bg-brand-50 text-brand-600',
    },
  ]

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-center gap-4">
        <div className="relative h-[76px] w-[76px] shrink-0">
          <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="38" cy="38" r={R} fill="none" strokeWidth="7" className="stroke-brand-100" />
            <circle
              cx="38"
              cy="38"
              r={R}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              className="stroke-brand-600"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct / 100)}
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.2,0.8,0.2,1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-lg font-semibold leading-none text-ink-900">
              {practicedCount}
              <span className="text-ink-400">/{total}</span>
            </span>
            <span className="mt-0.5 text-[9px] font-medium text-ink-500">tracks</span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">
            Your progress
          </p>
          <p className="mt-1 font-display text-xl font-semibold leading-tight text-ink-900">
            {practicedCount === 0 ? 'Just getting started' : `${pct}% covered`}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-600">
            {practicedCount === 0 ? 'Practice a track to begin.' : 'Consistency compounds.'}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-ink-900/[0.06] pt-4">
        {rows.map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className="flex items-center gap-2.5">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>
              <Icon size={14} />
            </span>
            <span className="flex-1 text-xs font-medium text-ink-600">{label}</span>
            <span className="text-sm font-semibold text-ink-900">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

/** One clear next action, chosen from the user's actual state. */
function NextStep({
  assessmentDone,
  practicedCount,
}: {
  assessmentDone: boolean
  practicedCount: number
}) {
  const step = !assessmentDone
    ? {
        eyebrow: 'Start here',
        title: 'Take your initial assessment',
        body: 'A one-time assessment unlocks your skill tracks, your certificate, and personalised practice.',
        to: '/practice',
        cta: 'Begin assessment',
      }
    : practicedCount === 0
      ? {
          eyebrow: 'Next up',
          title: 'Run your first Decision Lab',
          body: 'Real business scenarios that build the judgment employers actually test for.',
          to: '/practice',
          cta: 'Start practicing',
        }
      : {
          eyebrow: 'Keep going',
          title: 'Continue where you left off',
          body: 'Practice one more track today — small, regular reps beat long sessions.',
          to: '/practice',
          cta: 'Open practice',
        }

  return (
    <Link
      to={step.to}
      className="surface-wood-dark lift group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-6 text-left shadow-e2 sm:p-7"
    >
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 opacity-[0.16]">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="2">
          <circle cx="130" cy="70" r="76" />
          <circle cx="130" cy="70" r="56" />
          <circle cx="130" cy="70" r="36" />
          <circle cx="130" cy="70" r="16" />
        </svg>
      </span>
      <div className="relative flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-brand-400" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
          {step.eyebrow}
        </p>
      </div>
      <h2 className="relative mt-3 font-display text-[1.75rem] font-semibold leading-[1.15] text-white sm:text-[2rem]">
        {step.title}
      </h2>
      <p className="relative mt-2 max-w-md text-sm leading-relaxed text-white/75">{step.body}</p>
      <span className="relative mt-5 inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-e2 transition-transform duration-300 group-hover:translate-x-1">
        {step.cta}
        <ArrowRight size={16} />
      </span>
    </Link>
  )
}

function DashboardPage() {
  const { user } = useAuthUser()
  const raw = userDisplayName(user).split(' ')[0]
  const name = raw.charAt(0).toUpperCase() + raw.slice(1)
  const userKey = user?.id ?? 'guest'
  const { profile } = useProfile()
  const goals = profile?.goals ?? []
  const { result: assessment } = useInitialAssessment()
  const hasFeedback = useHasFeedback()
  const streak = useStreak(userKey)
  const visits = useVisitCount(userKey)
  const eligibleForReviewNudge = assessment != null || visits >= 5

  const [practice, setPractice] = useState<PracticeSummary>({})
  const [loading, setLoading] = useState(true)
  const [mentorOnline, setMentorOnline] = useState(false)

  useEffect(() => {
    fetchPracticeSummary()
      .then(setPractice)
      .catch(() => {})
      .finally(() => setLoading(false))
    fetchOnlineMentors()
      .then((ids) => setMentorOnline(ids.length > 0))
      .catch(() => {})
  }, [])

  const practicedCount = useMemo(
    () => skillTracks.filter((t) => practice[t.slug]).length,
    [practice],
  )

  return (
    <AppShell wide>
      {/* Greeting — personal, low-chrome, no competing CTA. The certificate
          lives on /practice (see CertificateRow there), where it sits next to
          the assessment that earned it, rather than competing with the
          greeting here. */}
      <header className="rise-in mb-6">
        <p className="text-sm font-medium text-ink-600">{greet()},</p>
        <h1 className="mt-1 font-display text-3xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-4xl">
          {name}
        </h1>
      </header>

      <div className="space-y-6">
        {loading ? (
          <div className="grid gap-5 lg:grid-cols-3">
            <Skeleton className="h-28 lg:col-span-2" />
            <Skeleton className="h-28" />
          </div>
        ) : (
          <div className="grid items-stretch gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <NextStep assessmentDone={assessment != null} practicedCount={practicedCount} />
            </div>
            <ProgressCard
              streak={streak}
              assessment={assessment?.overall.percent ?? null}
              practicedCount={practicedCount}
            />
          </div>
        )}

        {/* Talk to a mentor — promoted: a real person, one tap away */}
        <Link
          to="/support"
          className="group card lift flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6"
        >
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-e2">
            <MessagesSquare size={26} />
            {mentorOnline && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center">
                <span className="live-ping relative h-2.5 w-2.5 rounded-full bg-emerald-500 text-emerald-500 ring-2 ring-white" />
              </span>
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-semibold text-ink-900">Talk to a mentor</h2>
              {mentorOnline ? (
                <Badge tone="success">Online now</Badge>
              ) : (
                <Badge tone="neutral">Replies soon</Badge>
              )}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-ink-600">
              Stuck on a concept, a campaign, or your next career step? Start a live chat and get a
              real answer — not a search result.
            </p>
          </div>

          <span className="press inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-e1 transition-transform duration-300 group-hover:translate-x-0.5">
            Start chat
            <ArrowRight size={16} />
          </span>
        </Link>

        {/* Rate & review — deliberately eye-catching, and only until they leave one */}
        {hasFeedback === false && eligibleForReviewNudge && (
          <Link
            to="/feedback"
            className="attention group flex flex-col gap-3 rounded-2xl border border-gold-200 bg-gradient-to-r from-gold-50 via-gold-50 to-white p-4 shadow-e1 transition-colors hover:border-gold-300 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
          >
            <span className="nudge flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-400 text-white shadow-e1">
              <Star size={20} fill="currentColor" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-gold-700">Enjoying MySkills?</p>
              <p className="mt-0.5 text-sm text-ink-600">
                Rate the app in 30 seconds — it genuinely shapes what we build next.
              </p>
            </div>
            <span className="press inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-gold-500 px-4 text-sm font-semibold text-white transition-transform duration-300 group-hover:translate-x-0.5">
              Rate &amp; review
              <ArrowRight size={15} />
            </span>
          </Link>
        )}

        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <div className="space-y-6 lg:col-span-2">
            <PathToMastery
              assessmentDone={assessment != null}
              practicedCount={practicedCount}
              totalTracks={skillTracks.length}
            />

            <VocabularyCoach userKey={userKey} />
          </div>

          <aside className="space-y-6 lg:sticky lg:top-8">
            <PrimaryGoal goals={goals} />

            <TimeSpentChart />

            <Card className="p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink-100 text-ink-600">
                <Sparkles size={18} />
              </span>
              <p className="mt-3 font-display text-lg font-semibold text-ink-900">Prompt Library</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">
                Expert prompts that turn any AI into your marketing tutor.
              </p>
              <ButtonLink to="/prompt-library" variant="secondary" size="sm" className="mt-3" iconRight={ArrowRight}>
                Explore
              </ButtonLink>
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}
