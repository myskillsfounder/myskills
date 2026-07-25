import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, Loader2, Send, Star } from 'lucide-react'
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
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Feedback</h1>
          <p className="mt-1 text-sm text-ink-500">
            Help us improve MySkills — rate the app, suggest ideas, and leave a review.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-ink-100 bg-white p-5">
          {/* Rating 1-10 */}
          <div>
            <label className="block text-sm font-medium text-ink-700">
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
                      : 'border-ink-200 text-ink-500 hover:border-brand-300 hover:bg-brand-50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-ink-400">
              <span>Poor</span>
              <span>{rating > 0 ? `${rating}/10` : ''}</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Suggestion */}
          <div>
            <label className="block text-sm font-medium text-ink-700">What are your suggestions?</label>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              rows={3}
              placeholder="Anything you'd like us to add or improve…"
              className="mt-1.5 w-full resize-y rounded-lg border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>

          {/* Review */}
          <div>
            <label className="block text-sm font-medium text-ink-700">Leave us a review</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              placeholder="Tell us about your experience…"
              className="mt-1.5 w-full resize-y rounded-lg border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
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
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {submitting ? 'Sending…' : 'Submit feedback'}
          </button>
        </form>

        {/* Past submissions */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-ink-900">Your submissions</h2>
          {loadingList ? (
            <p className="text-sm text-ink-500">Loading…</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
              You haven’t submitted anything yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it.id} className="rounded-2xl border border-ink-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                      <Star size={14} className="text-amber-400" fill="currentColor" />
                      {it.rating ?? '—'}/10
                    </span>
                    <span className="text-xs text-ink-400">{new Date(it.created_at).toLocaleDateString()}</span>
                  </div>
                  {it.suggestion && (
                    <p className="mt-2 text-sm text-ink-600">
                      <span className="font-medium text-ink-800">Suggestion: </span>
                      {it.suggestion}
                    </p>
                  )}
                  {it.review && (
                    <p className="mt-1 text-sm text-ink-600">
                      <span className="font-medium text-ink-800">Review: </span>
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
