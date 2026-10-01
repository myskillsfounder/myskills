import { useState } from 'react'
import { CheckCircle2, Clock, MessageSquareText, Send } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  RUBRIC_CRITERIA,
  cancelMyMentorReview,
  submitProject,
  type MentorReview,
  type ReviewProgramme,
  type ReviewState,
} from '@/lib/mentorReview'
import { PROJECT_CRITERIA_MAX, PROJECT_MAX, PROJECT_PASS, PROJECT_SUBMISSIONS } from '@/lib/readinessScore'
import { Alert, Button, Input, Textarea } from '@/components/ui'

/** What a mentor said about a graded project: the four scores and the note. */
function Grade({ review }: { review: MentorReview }) {
  return (
    <div className="mt-2 rounded-xl bg-white p-3 ring-1 ring-ink-900/[0.06]">
      {review.project_points != null && (
        <p className="text-sm font-semibold text-ink-900">
          {review.project_points} <span className="font-normal text-ink-500">out of {PROJECT_MAX}</span>
        </p>
      )}
      {review.rubric && (
        <ul className="mt-1.5 space-y-0.5 text-xs text-ink-600">
          {RUBRIC_CRITERIA.map((c) => (
            <li key={c.key} className="flex justify-between gap-3">
              <span>{c.label}</span>
              <span className="tabular-nums font-semibold text-ink-800">
                {review.rubric?.[c.key]}/{PROJECT_CRITERIA_MAX}
              </span>
            </li>
          ))}
        </ul>
      )}
      {review.reviewer_note && (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">{review.reviewer_note}</p>
      )}
    </div>
  )
}

/**
 * The programme's capstone project, made actionable. Sits under the programme's
 * completion stages and only appears once the practice is finished — before
 * that there's nothing to submit. A mentor grades it on four criteria; 8 of 20
 * passes it and releases the programme's held activity points. The server
 * re-checks eligibility and the three-submission limit, so this is guidance,
 * not the gate.
 */
export function MentorReviewPanel({
  programme,
  practiceDone,
  review,
  state,
  submissionsLeft,
  onChange,
}: {
  programme: ReviewProgramme
  practiceDone: boolean
  review: MentorReview | null
  state: ReviewState
  /** Submissions the student still has, including this one. */
  submissionsLeft: number
  onChange: () => void
}) {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [links, setLinks] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  if (!practiceDone && state === 'none') return null

  const isCareer = programme === 'career-readiness'

  async function run(fn: () => Promise<void>, clear = false) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      if (clear) {
        setTitle('')
        setSummary('')
        setLinks('')
        setNote('')
      }
      onChange()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (state === 'approved') {
    return (
      <div className="mt-5 rounded-xl bg-emerald-50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <CheckCircle2 size={16} /> Your project passed
          {review?.project_title && <span className="font-normal text-emerald-800/80">· {review.project_title}</span>}
        </p>
        {review && <Grade review={review} />}
        <p className="mt-2 text-xs text-emerald-700">
          Your earned points are released into your Career Readiness Score. Next: an internship through MySkills — we’ll
          let you know when they open.
        </p>
      </div>
    )
  }

  if (state === 'requested') {
    return (
      <div className="mt-5 flex flex-col gap-3 rounded-xl bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-900">
            <Clock size={16} /> Project with a mentor
            {review && <span className="font-normal text-brand-800/80">· {new Date(review.created_at).toLocaleDateString()}</span>}
          </p>
          <p className="mt-0.5 text-xs text-brand-800/80">
            {review?.project_title ? `“${review.project_title}” is being graded. ` : ''}We’ll email you when it has been.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => cancelMyMentorReview(programme))}
          className="shrink-0 self-start text-xs font-semibold text-ink-600 hover:text-ink-900 disabled:opacity-60 sm:self-auto"
        >
          Withdraw
        </button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    )
  }

  const again = state === 'changes_requested'

  if (submissionsLeft <= 0) {
    return (
      <div className="mt-5 rounded-xl border border-ink-900/[0.08] bg-ink-900/[0.02] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <MessageSquareText size={16} className="text-amber-600" /> All {PROJECT_SUBMISSIONS} submissions used
        </p>
        {review && <Grade review={review} />}
        <p className="mt-2 text-sm text-ink-600">
          Your best grade still counts toward your score. If you’d like to talk it through, ask a mentor on the Practice
          page.
        </p>
      </div>
    )
  }

  // 'none' (practice finished) or 'changes_requested'
  return (
    <div className="mt-5 rounded-xl border border-ink-900/[0.08] bg-ink-900/[0.02] p-4">
      {again ? (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <MessageSquareText size={16} className="text-amber-600" /> Your mentor’s feedback
          </p>
          {review && <Grade review={review} />}
          <p className="mt-3 text-sm text-ink-600">
            Below the pass mark of {PROJECT_PASS} out of {PROJECT_MAX}. Improve the project using the notes, then submit
            it again. {submissionsLeft} {submissionsLeft === 1 ? 'submission' : 'submissions'} left.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-ink-900">
            {isCareer ? 'Modules done — submit your project' : 'Practice done — submit your project'}
          </p>
          <p className="mt-0.5 text-sm text-ink-600">
            A mentor grades your project out of {PROJECT_MAX} on relevance, quality, how you applied the skills, and how
            you present it. {PROJECT_PASS} or more passes and releases the points you’ve earned in this programme.
          </p>
        </>
      )}

      <div className="mt-3 space-y-3">
        <Input
          label="Project title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder={
            isCareer ? 'e.g. My 90-day plan to move into a team lead role' : 'e.g. A launch campaign for a local bakery'
          }
        />
        <Textarea
          label="What did you do, and what did you learn?"
          hint="A few sentences: the goal, what you made or decided, how you used the programme, and the result."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={5}
          maxLength={2000}
        />
        <Textarea
          label="Links to the work"
          hint="One per line: a document, a folder, a page, a video. Make sure the mentor can open them."
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          required={false}
          rows={2}
          maxLength={1000}
        />
        <Textarea
          label="Anything you’d like the mentor to look at?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required={false}
          rows={2}
          maxLength={1000}
        />
      </div>

      {error && (
        <div className="mt-3">
          <Alert tone="danger" title="Couldn’t submit your project">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      <Button
        size="sm"
        icon={Send}
        className="mt-3"
        disabled={busy || title.trim().length < 3 || summary.trim().length < 60}
        onClick={() => run(() => submitProject(programme, { title, summary, links, note }), true)}
      >
        {busy ? 'Submitting…' : again ? 'Submit again' : 'Submit project'}
      </Button>
      <p className="mt-2 text-[11px] text-ink-500">
        {submissionsLeft} of {PROJECT_SUBMISSIONS} submissions left. Your best grade across submissions counts.
      </p>
    </div>
  )
}
