import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ClipboardCheck, Mail } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { skillTracks } from '@/lib/skillTracks'
import { LEVEL_TONE, SKILL_MAX, orderedSkills } from '@/lib/careerReadinessAssessment'
import {
  decideMentorReview,
  fetchMentorReviewQueue,
  type AdminMentorReview,
  type MentorReviewStatus,
} from '@/lib/mentorReview'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { CareerReadinessResponses } from '@/components/admin/CareerReadinessResponses'
import { Alert, Badge, Button, EmptyState, PageHeader, Skeleton, Textarea } from '@/components/ui'

export const Route = createFileRoute('/admin/_layout/mentor-reviews')({
  component: () => (
    <RequireSection section="mentor-reviews">
      <MentorReviewsPage />
    </RequireSection>
  ),
})

const FILTERS: { label: string; value: MentorReviewStatus | 'all' }[] = [
  { label: 'Waiting', value: 'requested' },
  { label: 'Signed off', value: 'approved' },
  { label: 'Sent back', value: 'changes_requested' },
  { label: 'All', value: 'all' },
]

const STATUS: Record<MentorReviewStatus, { label: string; tone: 'warning' | 'success' | 'neutral' | 'brand' }> = {
  requested: { label: 'Waiting', tone: 'warning' },
  approved: { label: 'Signed off', tone: 'success' },
  changes_requested: { label: 'Sent back', tone: 'brand' },
  cancelled: { label: 'Withdrawn', tone: 'neutral' },
}

const PROGRAMME: Record<string, string> = {
  'digital-marketing': 'Digital Marketing Programme',
  'career-readiness': 'Career Readiness Programme',
}

function ReviewCard({ review, onDone }: { review: AdminMentorReview; onDone: () => void }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const best = new Map(review.tracks.map((t) => [t.track, t]))
  const status = STATUS[review.status]

  async function decide(decision: 'approved' | 'changes_requested') {
    setBusy(true)
    setError(undefined)
    try {
      await decideMentorReview(review.id, decision, note)
      onDone()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-ink-900">{review.full_name || 'Unnamed learner'}</h2>
          <p className="mt-0.5 text-sm font-medium text-brand-600">{PROGRAMME[review.programme] ?? review.programme}</p>
          {review.email && (
            <a href={`mailto:${review.email}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-brand-700">
              <Mail size={13} /> {review.email}
            </a>
          )}
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      {review.programme === 'career-readiness' && (
        <CareerReadinessResponses userId={review.user_id} defaultOpen={review.status === 'requested'} />
      )}

      {review.programme === 'career-readiness' ? (
        // A Career Readiness review is about the personal skills, so show the
        // learner's self-awareness baseline, not their Digital Marketing scores.
        <div className="mt-4 border-t border-ink-200 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Personal aptitude assessment · baseline
          </p>
          {review.career_readiness ? (
            <>
              <ul className="mt-2 space-y-1.5 text-sm">
                {orderedSkills(review.career_readiness.scores).map((s) => (
                  <li key={s.key} className="flex items-center justify-between gap-3">
                    <span className="truncate text-ink-700">{s.name}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="tabular-nums font-semibold text-ink-900">
                        {s.score}
                        <span className="font-normal text-ink-400"> / {SKILL_MAX}</span>
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${LEVEL_TONE[s.level]}`}>
                        {s.level}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              {review.career_readiness.reflection && (
                <div className="mt-3 rounded-xl bg-ink-100 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Skill they most want to improve
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                    {review.career_readiness.reflection}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-500">This learner hasn’t taken the assessment yet.</p>
          )}
        </div>
      ) : (
        <div className="mt-4 border-t border-ink-200 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Results · assessment {review.assessment_percent != null ? `${review.assessment_percent}%` : '—'}
          </p>
          <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {skillTracks.map((t) => {
              const r = best.get(t.slug)
              return (
                <li key={t.slug} className="flex items-center justify-between gap-3">
                  <span className="truncate text-ink-700">{t.name}</span>
                  <span className={`shrink-0 tabular-nums font-semibold ${r ? (r.percent >= 70 ? 'text-emerald-700' : 'text-amber-700') : 'text-ink-400'}`}>
                    {r ? `${r.percent}% · ${r.attempts}×` : 'not practised'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {review.student_note && (
        <div className="mt-4 rounded-xl bg-ink-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">From the student</p>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">{review.student_note}</p>
        </div>
      )}

      {review.status === 'requested' ? (
        <div className="mt-4 border-t border-ink-200 pt-4">
          <Textarea
            label="Note to the student"
            hint="They see this, and it's emailed to them. Required when sending back."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required={false}
            rows={3}
            maxLength={2000}
          />
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => decide('approved')}>
              Sign off
            </Button>
            <Button size="sm" variant="secondary" disabled={busy || !note.trim()} onClick={() => decide('changes_requested')}>
              Send back with notes
            </Button>
          </div>
        </div>
      ) : (
        review.reviewer_note && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Your note</p>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">{review.reviewer_note}</p>
          </div>
        )
      )}

      <p className="mt-4 text-xs text-ink-500">
        Requested {new Date(review.created_at).toLocaleDateString()}
        {review.reviewed_at && ` · decided ${new Date(review.reviewed_at).toLocaleDateString()}`}
      </p>
    </article>
  )
}

function MentorReviewsPage() {
  const [reviews, setReviews] = useState<AdminMentorReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [filter, setFilter] = useState<MentorReviewStatus | 'all'>('requested')

  async function load() {
    setError(undefined)
    try {
      setReviews(await fetchMentorReviewQueue())
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const visible = reviews.filter((r) => filter === 'all' || r.status === filter)

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Mentor reviews"
        subtitle="Students who finished practice and asked for a sign-off. Signing off unlocks the internship stage."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-300 text-ink-600 hover:bg-ink-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load reviews">
            <p>{error}</p>
            <p className="mt-1">First run? Apply docs/supabase-mentor-reviews.sql in Supabase.</p>
          </Alert>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nothing here"
          description="When a student finishes all 8 tracks and asks for a review, it shows up here."
        />
      ) : (
        <div className="space-y-4">
          {visible.map((r) => (
            <ReviewCard key={r.id} review={r} onDone={() => void load()} />
          ))}
        </div>
      )}
    </>
  )
}
