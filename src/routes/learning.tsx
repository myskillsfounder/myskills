import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Lock } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { fetchInitialAssessment as fetchAssessment } from '@/lib/assessmentResults'
import { AppShell } from '@/components/app/AppShell'
import { learningTracks } from '@/lib/learningTracks'

export const Route = createFileRoute('/learning')({
  beforeLoad: requireOnboarded,
  component: LearningPage,
})

const LEVEL_TINT: Record<string, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700',
  Intermediate: 'bg-amber-50 text-amber-700',
  Advanced: 'bg-sky-50 text-sky-700',
}

function LockedState() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-ink-100 bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-500">
        <Lock size={26} />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-ink-900">Learning is locked</h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Complete the initial assessment to unlock your learning tracks. It only
        takes a few minutes.
      </p>
      <Link
        to="/assessment"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Take the initial assessment
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}

function UnlockedTracks() {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Learning</h1>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            Unlocked
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-500">
          {learningTracks.length} tracks unlocked from your assessment. Work through
          them at your own pace.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {learningTracks.map((track) => (
          <div
            key={track.slug}
            className="flex flex-col rounded-2xl border border-ink-100 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <BookOpen size={20} />
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${LEVEL_TINT[track.level]}`}
              >
                {track.level}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-ink-900">{track.name}</h3>
            <p className="mt-1 flex-1 text-sm text-ink-500">{track.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-ink-400">{track.lessons} lessons</span>
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-4 py-2 text-sm font-medium text-ink-400"
              >
                Start (coming soon)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LearningPage() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null)

  useEffect(() => {
    fetchAssessment()
      .then((r) => setUnlocked(!!r))
      .catch(() => setUnlocked(false))
  }, [])

  return (
    <AppShell wide>
      {unlocked === null ? (
        <p className="text-sm text-ink-500">Loading…</p>
      ) : unlocked ? (
        <UnlockedTracks />
      ) : (
        <LockedState />
      )}
    </AppShell>
  )
}
