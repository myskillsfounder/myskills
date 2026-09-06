import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, MessagesSquare } from 'lucide-react'
import { fetchOnlineMentorProfiles, type OnlineMentor } from '@/lib/support'
import { Badge } from '@/components/ui'

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

function namesLine(mentors: OnlineMentor[]): string {
  const names = mentors.map((m) => m.name.split(' ')[0])
  if (names.length === 1) return `${names[0]} is`
  if (names.length === 2) return `${names[0]} and ${names[1]} are`
  return `${names[0]}, ${names[1]} +${names.length - 2} more are`
}

/**
 * "Talk to a mentor" — the dashboard's promoted entry point into live
 * support chat. Shows the actual online mentors (photo + first name) rather
 * than an abstract "online now" badge, so waiting for a person feels
 * concrete instead of like a generic feature tile.
 */
export function MentorPromoCard() {
  const [online, setOnline] = useState<OnlineMentor[]>([])

  useEffect(() => {
    let alive = true
    fetchOnlineMentorProfiles()
      .then((rows) => alive && setOnline(rows))
      .catch(() => alive && setOnline([]))
    return () => {
      alive = false
    }
  }, [])

  const hasOnline = online.length > 0

  return (
    <Link
      to="/support"
      className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-ink-900/[0.08] bg-gradient-to-br from-brand-50 via-white to-white p-5 shadow-e1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-e2 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
    >
      <span aria-hidden className="pointer-events-none absolute -right-12 -top-12 opacity-[0.07]">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="#5b4bd6" strokeWidth="2">
          <circle cx="120" cy="80" r="76" />
          <circle cx="120" cy="80" r="56" />
          <circle cx="120" cy="80" r="36" />
        </svg>
      </span>

      <div className="relative shrink-0">
        {hasOnline ? (
          <div className="flex -space-x-3">
            {online.slice(0, 3).map((m) => (
              <span
                key={m.id}
                className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-brand-100 text-lg font-semibold text-brand-700 shadow-e2"
              >
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialsOf(m.name)
                )}
              </span>
            ))}
          </div>
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e2">
            <MessagesSquare size={26} />
          </span>
        )}
        {hasOnline && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center">
            <span className="live-ping relative h-2.5 w-2.5 rounded-full bg-emerald-500 text-emerald-500 ring-2 ring-white" />
          </span>
        )}
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl font-semibold text-ink-900">Talk to a mentor</h2>
          {hasOnline ? (
            <Badge tone="success">{online.length} online now</Badge>
          ) : (
            <Badge tone="neutral">Replies soon</Badge>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-ink-600">
          {hasOnline
            ? `${namesLine(online)} online right now — ask about a concept, a campaign, or your next career step.`
            : 'Stuck on a concept, a campaign, or your next career step? Start a live chat and get a real answer — not a search result.'}
        </p>
      </div>

      <span className="press relative inline-flex h-12 shrink-0 items-center gap-2 self-start rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 text-sm font-semibold text-white shadow-e2 transition-transform duration-300 group-hover:translate-x-0.5 sm:self-auto">
        Start chat
        <ArrowRight size={16} />
      </span>
    </Link>
  )
}
