import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { StudentMatch } from '@/lib/mentorMatches'
import { rememberProgramme } from '@/lib/practiceProgramme'

/**
 * The student's own mentor, ahead of the directory: who they're working with
 * (or waiting to hear from) in each programme. Shown only when there is one —
 * a student without a mentor gets the listings, which is the way to find one.
 */
export function YourMentors({ matches }: { matches: { match: StudentMatch | null; programme: 1 | 2; label: string }[] }) {
  const mine = matches.filter((m) => m.match && (m.match.status === 'active' || m.match.status === 'requested'))
  if (mine.length === 0) return null
  return (
    <section className="card p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Your mentor</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {mine.map(({ match, programme, label }) => {
          const name = match!.mentor?.full_name ?? 'Your mentor'
          const waiting = match!.status === 'requested'
          return (
            <li key={programme}>
              <Link
                to="/practice"
                onClick={() => rememberProgramme(programme)}
                className="group flex items-center gap-3 rounded-xl border border-ink-900/[0.08] p-3 transition-colors hover:border-brand-300"
              >
                {match!.mentor?.avatar_url ? (
                  <img src={match!.mentor.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                    {name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-900">{name}</span>
                  <span className="block truncate text-xs text-ink-500">
                    {label} · {waiting ? 'waiting for them to accept' : 'working with you'}
                  </span>
                </span>
                <ArrowRight size={15} className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
