import { Link } from '@tanstack/react-router'
import { ArrowRight, Inbox } from 'lucide-react'
import type { MentorSideMatch } from '@/lib/mentorMatches'

const DAY = 24 * 60 * 60 * 1000

/** "today", "yesterday" or "3 days ago" — how long the oldest request has waited. */
function waited(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

/**
 * A line at the top of every mentor-portal page when students are waiting.
 * The request email is the main alert, but emails go missing — this is the
 * one place a mentor can't overlook them. Hidden when nothing is waiting.
 */
export function RequestsLine({ rows }: { rows: MentorSideMatch[] }) {
  const waiting = rows.filter((r) => r.status === 'requested')
  if (waiting.length === 0) return null

  const oldest = waiting.reduce((a, b) => (new Date(a.created_at) <= new Date(b.created_at) ? a : b))
  const days = Math.floor((Date.now() - new Date(oldest.created_at).getTime()) / DAY)

  return (
    <Link
      to="/community-portal"
      hash="requests"
      className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
        days >= 3
          ? 'border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-200'
          : 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
      }`}
    >
      <Inbox size={18} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <strong>
          {waiting.length} {waiting.length === 1 ? 'student is' : 'students are'} waiting for your reply
        </strong>
        <span className="block text-xs opacity-80">
          {waiting.length === 1 ? 'Asked' : 'The oldest asked'} {waited(oldest.created_at)}
          {days >= 3 ? ' — please reply soon' : ''}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
        Review
        <ArrowRight size={15} />
      </span>
    </Link>
  )
}
