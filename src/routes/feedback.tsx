import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, Heart, Loader2, PenLine, Send, Star } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { fetchMyFeedback, submitFeedback, type Feedback } from '@/lib/feedback'
import { AppShell } from '@/components/app/AppShell'

function FeedbackPage() {
  const [rating, setRating] = useState(0)
  const [suggestion, setSuggestion] = useState('')
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<string>()
  const [error, setError] = useState<string>()

  const [items, setItems] = useState<Feedback[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function refresh() {
    try {
      setItems(await fetchMyFeedback())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoadingList(false)
    }
  }
  useEffect(() => {
    void refresh()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(undefined)
    setNotice(undefined)
    if (rating === 0) {
      setError('Please rate the app from 1 to 10.')
      return
    }
    if (!suggestion.trim() && !review.trim()) {
      setError('Add a suggestion or a review before submitting.')
      return
    }
    setSubmitting(true)
    try {
      await submitFeedback({ rating, suggestion, review })
      setNotice('Thanks! Your feedback was received.')
      setRating(0)
      setSuggestion('')
      setReview('')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">Feedback</h1>
          <p className="mt-1 text-sm text-ink-600">
            Help us improve MySkills — rate the app, suggest ideas, and leave a review.
          </p>
        </div>

        {/* Already reviewed? Say thanks instead of asking again. */}
        {!loadingList && items.length > 0 && !showForm && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600">
                <Heart size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-emerald-900">Thanks for your feedback!</p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  You’ve already rated MySkills{items[0].rating ? ` ${items[0].rating}/10` : ''}. We read every
                  note — it genuinely shapes what we build next.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
                >
                  <PenLine size={13} /> Share more feedback
                </button>
              </div>
            </div>
          </div>
        )}

        {(loadingList || items.length === 0 || showForm) && (
        <form onSubmit={handleSubmit} className="space-y-5 card p-5">
          {/* Rating 1-10 */}
          <div>
            <label className="block text-sm font-medium text-ink-800">
              How would you rate this app?
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                    n <= rating
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-ink-300 text-ink-600 hover:border-brand-300 hover:bg-brand-50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-ink-500">
              <span>Poor</span>
              <span>{rating > 0 ? `${rating}/10` : ''}</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Suggestion */}
          <div>
            <label className="block text-sm font-medium text-ink-800">What are your suggestions?</label>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              rows={3}
              placeholder="Anything you'd like us to add or improve…"
              className="field mt-1.5 resize-y"
            />
          </div>

          {/* Review */}
          <div>
            <label className="block text-sm font-medium text-ink-800">Leave us a review</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              placeholder="Tell us about your experience…"
              className="field mt-1.5 resize-y"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {notice && (
            <p className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 size={15} /> {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 press h-11 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {submitting ? 'Sending…' : 'Submit feedback'}
          </button>
        </form>
        )}

        {/* Past submissions */}
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Your submissions</h2>
          {loadingList ? (
            <p className="text-sm text-ink-600">Loading…</p>
          ) : items.length === 0 ? (
            <div className="card border-dashed p-8 text-center text-sm text-ink-600">
              You haven’t submitted anything yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it.id} className="card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                      <Star size={14} className="text-amber-400" fill="currentColor" />
                      {it.rating ?? '—'}/10
                    </span>
                    <span className="text-xs text-ink-500">{new Date(it.created_at).toLocaleDateString()}</span>
                  </div>
                  {it.suggestion && (
                    <p className="mt-2 text-sm text-ink-600">
                      <span className="font-medium text-ink-900">Suggestion: </span>
                      {it.suggestion}
                    </p>
                  )}
                  {it.review && (
                    <p className="mt-1 text-sm text-ink-600">
                      <span className="font-medium text-ink-900">Review: </span>
                      {it.review}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export const Route = createFileRoute('/feedback')({
  beforeLoad: requireOnboarded,
  component: FeedbackPage,
})
