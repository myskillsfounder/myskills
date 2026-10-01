import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ClipboardCheck, Mail } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { skillTracks } from '@/lib/skillTracks'
import { LEVEL_TONE, SKILL_MAX, orderedSkills } from '@/lib/careerReadinessAssessment'
import {
  RUBRIC_CRITERIA,
  fetchMentorReviewQueue,
  gradeMentorReview,
  type AdminMentorReview,
  type MentorReviewStatus,
  type ReviewProgramme,
  type Rubric,
} from '@/lib/mentorReview'
import { PROJECT_CRITERIA_MAX, PROJECT_MAX, PROJECT_PASS, PROJECT_SUBMISSIONS } from '@/lib/readinessScore'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { CareerReadinessResponses } from '@/components/admin/CareerReadinessResponses'
import { Alert, Badge, Button, EmptyState, PageHeader, Skeleton, Textarea } from '@/components/ui'

// ?programme=digital-marketing|career-readiness narrows the queue to one
// programme; the sidebar links each programme's own reviews this way.
export const Route = createFileRoute('/admin/_layout/mentor-reviews')({
  validateSearch: (s: Record<string, unknown>): { programme?: ReviewProgramme } => ({
    programme:
      s.programme === 'digital-marketing' || s.programme === 'career-readiness' ? s.programme : undefined,
  }),
  component: () => (
    <RequireSection section="mentor-reviews">
      <MentorReviewsPage />
    </RequireSection>
  ),
})

const FILTERS: { label: string; value: MentorReviewStatus | 'all' }[] = [
  { label: 'To grade', value: 'requested' },
  { label: 'Passed', value: 'approved' },
  { label: 'Sent back', value: 'changes_requested' },
  { label: 'All', value: 'all' },
]

const STATUS: Record<MentorReviewStatus, { label: string; tone: 'warning' | 'success' | 'neutral' | 'brand' }> = {
  requested: { label: 'To grade', tone: 'warning' },
  approved: { label: 'Passed', tone: 'success' },
  changes_requested: { label: 'Sent back', tone: 'brand' },
  cancelled: { label: 'Withdrawn', tone: 'neutral' },
}

const NO_GRADE: Rubric = { relevance: 0, quality: 0, application: 0, presentation: 0 }

/** Turn the project's links field (one per line) into links a reviewer can open. */
function projectLinks(text: string | null): string[] {
  return (text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

const PROGRAMME: Record<string, string> = {
  'digital-marketing': 'Digital Marketing Programme',
  'career-readiness': 'Career Readiness Programme',
}

function ReviewCard({ review, onDone }: { review: AdminMentorReview; onDone: () => void }) {
  const [note, setNote] = useState('')
  const [grade, setGrade] = useState<Rubric>(NO_GRADE)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const best = new Map(review.tracks.map((t) => [t.track, t]))
  const status = STATUS[review.status]
  const total = grade.relevance + grade.quality + grade.application + grade.presentation
  const passes = total >= PROJECT_PASS

  async function submitGrade() {
    setBusy(true)
    setError(undefined)
    try {
      await gradeMentorReview(review.id, grade, note)
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

      {review.project_title && (
        <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Project · submission {review.attempt} of {PROJECT_SUBMISSIONS}
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-ink-900">{review.project_title}</p>
          {review.project_summary && (
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">{review.project_summary}</p>
          )}
          {projectLinks(review.project_links).length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {projectLinks(review.project_links).map((l) => (
                <li key={l} className="truncate">
                  {/^https?:\/\//i.test(l) ? (
                    <a href={l} target="_blank" rel="noreferrer noopener" className="text-brand-700 underline underline-offset-2">
                      {l}
                    </a>
                  ) : (
                    <span className="text-ink-700">{l}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
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
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Grade the project · {PROJECT_CRITERIA_MAX} per criterion, {PROJECT_MAX} in all
          </p>
          <ul className="mt-2 space-y-2.5">
            {RUBRIC_CRITERIA.map((c) => (
              <li key={c.key} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{c.label}</p>
                  <p className="text-xs text-ink-500">{c.hint}</p>
                </div>
                <div className="flex gap-1" role="radiogroup" aria-label={c.label}>
                  {Array.from({ length: PROJECT_CRITERIA_MAX + 1 }, (_, n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={grade[c.key] === n}
                      onClick={() => setGrade((g) => ({ ...g, [c.key]: n }))}
                      className={`h-9 w-9 rounded-lg border text-sm font-semibold tabular-nums transition-colors ${
                        grade[c.key] === n
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-ink-300 text-ink-700 hover:bg-ink-100'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <p className={`mt-3 text-sm font-semibold ${passes ? 'text-emerald-700' : 'text-amber-700'}`}>
            {total} of {PROJECT_MAX} · {passes ? 'passes — releases the held activity points' : `below the pass mark of ${PROJECT_PASS} — it goes back to the student`}
          </p>
          <div className="mt-3">
            <Textarea
              label="Feedback for the student"
              hint="They see the scores and this note, and it's emailed to them. Required below the pass mark."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required={false}
              rows={3}
              maxLength={2000}
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          <div className="mt-3">
            <Button size="sm" disabled={busy || (!passes && !note.trim())} onClick={() => void submitGrade()}>
              {busy ? 'Saving…' : 'Save grade'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-emerald-50 p-4">
          {review.project_points != null && (
            <p className="text-sm font-semibold text-ink-900">
              {review.project_points} <span className="font-normal text-ink-500">of {PROJECT_MAX}</span>
              {review.rubric && (
                <span className="ml-2 font-normal text-ink-500">
                  {RUBRIC_CRITERIA.map((c) => `${c.label} ${review.rubric?.[c.key]}`).join(' · ')}
                </span>
              )}
            </p>
          )}
          {review.reviewer_note && (
            <>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Your feedback</p>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">{review.reviewer_note}</p>
            </>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-ink-500">
        Submitted {new Date(review.created_at).toLocaleDateString()}
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

  const { programme } = Route.useSearch()
  const visible = reviews.filter(
    (r) => (filter === 'all' || r.status === filter) && (!programme || r.programme === programme),
  )

  return (
    <>
      <PageHeader
        eyebrow={programme ? PROGRAMME[programme] : 'Both programmes'}
        title="Mentor reviews"
        subtitle="Projects students submitted after finishing a programme's practice. Grade each on four criteria: 8 of 20 passes and releases the student's held activity points."
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
            <p className="mt-1">First run? Apply docs/supabase-mentor-reviews.sql and docs/supabase-programme-projects.sql in Supabase.</p>
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
          description="When a student finishes a programme and submits their project, it shows up here."
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
