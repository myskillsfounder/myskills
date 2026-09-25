import { useState } from 'react'
import { CheckCircle2, Clock, MessageSquareText, Send } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  cancelMyMentorReview,
  requestMentorReview,
  type MentorReview,
  type ReviewProgramme,
  type ReviewState,
} from '@/lib/mentorReview'
import { Alert, Button, Textarea } from '@/components/ui'

/**
 * The mentor-review stage, made actionable. Sits under the programme's
 * completion stages and only appears once practice is finished — before
 * that there's nothing to review. The server re-checks eligibility, so this
 * is guidance, not the gate.
 */
export function MentorReviewPanel({
  programme,
  practiceDone,
  review,
  state,
  onChange,
}: {
  programme: ReviewProgramme
  practiceDone: boolean
  review: MentorReview | null
  state: ReviewState
  onChange: () => void
}) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  if (!practiceDone && state === 'none') return null

  const isCareer = programme === 'career-readiness'

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      setNote('')
      onChange()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const reviewerNote = review?.reviewer_note && (
    <p className="mt-2 whitespace-pre-line rounded-xl bg-white p-3 text-sm leading-relaxed text-ink-700 ring-1 ring-ink-900/[0.06]">
      {review.reviewer_note}
    </p>
  )

  if (state === 'approved') {
    return (
      <div className="mt-5 rounded-xl bg-emerald-50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <CheckCircle2 size={16} /> A mentor signed off your practice
        </p>
        {reviewerNote}
        <p className="mt-2 text-xs text-emerald-700">
          Next: an internship through MySkills — we’ll let you know when they open.
        </p>
      </div>
    )
  }

  if (state === 'requested') {
    return (
      <div className="mt-5 flex flex-col gap-3 rounded-xl bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-900">
            <Clock size={16} /> Review requested
            {review && <span className="font-normal text-brand-800/80">· {new Date(review.created_at).toLocaleDateString()}</span>}
          </p>
          <p className="mt-0.5 text-xs text-brand-800/80">
            A mentor is looking at your results. We’ll email you when they’ve reviewed them.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => cancelMyMentorReview(programme))}
          className="shrink-0 self-start text-xs font-semibold text-ink-600 hover:text-ink-900 disabled:opacity-60 sm:self-auto"
        >
          Withdraw request
        </button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    )
  }

  // 'none' (practice finished) or 'changes_requested'
  const again = state === 'changes_requested'
  return (
    <div className="mt-5 rounded-xl border border-ink-900/[0.08] bg-ink-900/[0.02] p-4">
      {again ? (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <MessageSquareText size={16} className="text-amber-600" /> Your mentor’s notes
          </p>
          {reviewerNote}
          <p className="mt-3 text-sm text-ink-600">
            {isCareer
              ? 'Worked on them? Update your answers in the modules, then ask for another review.'
              : 'Worked on them? Practise the tracks again, then ask for another review.'}
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-ink-900">Practice done — ask a mentor to review it</p>
          <p className="mt-0.5 text-sm text-ink-600">
            {isCareer
              ? 'A mentor reads what you wrote in the five modules, then signs your practice off or tells you what to work on.'
              : 'A mentor reads your assessment and track results, then signs your practice off or tells you what to work on.'}
          </p>
        </>
      )}

      <div className="mt-3">
        <Textarea
          label="Anything you’d like the mentor to look at?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required={false}
          rows={2}
          maxLength={1000}
          placeholder={
            isCareer ? 'e.g. I’d like feedback on my goal in module 1.' : 'e.g. I’m least confident about Google Ads bidding.'
          }
        />
      </div>

      {error && (
        <div className="mt-3">
          <Alert tone="danger" title="Couldn’t send your request">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      <Button
        size="sm"
        icon={Send}
        className="mt-3"
        disabled={busy}
        onClick={() => run(() => requestMentorReview(programme, note))}
      >
        {busy ? 'Sending…' : again ? 'Ask for another review' : 'Request mentor review'}
      </Button>
    </div>
  )
}
