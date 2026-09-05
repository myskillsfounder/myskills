import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { MessageSquare, Star } from 'lucide-react'
import { fetchAllFeedback, type AdminFeedback } from '@/lib/admin'
import { Alert, Badge, EmptyState, PageHeader, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/admin/feedback')({
  component: FeedbackPage,
})

const toneFor = (rating: number | null) =>
  rating === null ? 'neutral' : rating >= 8 ? 'success' : rating >= 5 ? 'warning' : 'danger'

function FeedbackPage() {
  const [items, setItems] = useState<AdminFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    fetchAllFeedback()
      .then((rows) => active && setItems(rows))
      .catch((e) => active && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const rated = items.filter((i) => i.rating !== null)
  const avg = rated.length
    ? Math.round((rated.reduce((s, i) => s + (i.rating ?? 0), 0) / rated.length) * 10) / 10
    : null

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Feedback"
        subtitle={
          avg === null
            ? 'What users are telling you.'
            : `What users are telling you — ${avg}/10 across ${rated.length} ratings.`
        }
      />

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load feedback">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No feedback yet"
          description="Ratings and reviews from the Feedback page will appear here."
        />
      ) : (
        <div className="space-y-4">
          {items.map((f) => (
            <article key={f.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone={toneFor(f.rating)} icon={Star}>
                  {f.rating === null ? 'No rating' : `${f.rating}/10`}
                </Badge>
                <time className="text-xs text-ink-500" dateTime={f.created_at}>
                  {new Date(f.created_at).toLocaleDateString()}
                </time>
              </div>

              {f.review.trim() && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-800">
                  {f.review}
                </p>
              )}

              {f.suggestion.trim() && (
                <div className="mt-3 rounded-xl bg-ink-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Suggestion
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                    {f.suggestion}
                  </p>
                </div>
              )}

              {!f.review.trim() && !f.suggestion.trim() && (
                <p className="mt-3 text-sm italic text-ink-500">Rating only — no comment left.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  )
}
