import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { fetchMentors, type Mentor } from '@/lib/mentors'

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

/**
 * The LaunchPad's way to a mentor: the faces of a few of the verified mentors,
 * and one button to the mentors in the Community, where a student asks one to
 * work with them. It took the place of the old live chat, which promised a
 * mentor online and rarely had one.
 *
 * Nothing is drawn until the mentors are known, and nothing at all while none
 * is listed: a button to an empty list would be worse than no button.
 */
export function FindMentorCard({ hasOne = false }: { hasOne?: boolean }) {
  const [mentors, setMentors] = useState<Mentor[] | null>(null)

  useEffect(() => {
    let active = true
    fetchMentors()
      .then((list) => active && setMentors(list))
      .catch(() => active && setMentors([]))
    return () => {
      active = false
    }
  }, [])

  if (!mentors || mentors.length === 0) return null
  const faces = mentors.slice(0, 3)

  return (
    <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
      <div className="flex shrink-0 -space-x-3">
        {faces.map((m) => (
          <span
            key={m.id}
            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-brand-100 text-sm font-semibold text-brand-700 shadow-e1"
          >
            {m.avatar_url ? <img src={m.avatar_url} alt="" className="h-full w-full object-cover" /> : initialsOf(m.full_name)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl font-semibold text-ink-900">
          {hasOne ? 'A mentor for your other programme' : 'Work with a mentor'}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-600">
          {hasOne
            ? 'You have a mentor for one programme. Each programme has its own, so you can ask one for the other too.'
            : `${mentors.length} verified ${mentors.length === 1 ? 'mentor works' : 'mentors work'} one to one with students: they see your results, meet you, and grade the project you build.`}
        </p>
      </div>

      <Link
        to="/community"
        search={{ category: 'mentors' }}
        className="press inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700 sm:self-auto"
      >
        Find a mentor
        <ArrowRight size={16} />
      </Link>
    </section>
  )
}
