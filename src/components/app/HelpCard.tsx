import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { fetchMentors, type Mentor } from '@/lib/mentors'
import { initialsOf } from '@/components/community/Marketplace'

// Once per visit: the sidebar is drawn again on every page.
let mentorsOnce: Promise<Mentor[]> | null = null
const loadMentors = () => (mentorsOnce ??= fetchMentors().catch(() => []))

/**
 * "Need help?" at the foot of the sidebar: the faces of real mentors, and the
 * way to them in Community. Drawn only once there are mentors to show.
 */
export function HelpCard({ onNavigate }: { onNavigate?: () => void }) {
  const [mentors, setMentors] = useState<Mentor[] | null>(null)
  useEffect(() => {
    let active = true
    void loadMentors().then((m) => active && setMentors(m))
    return () => {
      active = false
    }
  }, [])
  if (!mentors || mentors.length === 0) return null
  const shown = mentors.slice(0, 4)
  const more = mentors.length - shown.length

  return (
    <Link
      to="/community"
      search={{ category: 'mentors' } as never}
      onClick={onNavigate}
      className="group relative block overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-3.5 text-white shadow-e2 transition-transform duration-300 hover:-translate-y-0.5"
    >
      <span aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
      <p className="relative text-[13px] font-semibold">Need help?</p>
      <p className="relative mt-0.5 text-[11px] leading-snug text-white/80">Talk to a mentor who has done it.</p>
      <div className="relative mt-2.5 flex items-center">
        <div className="flex -space-x-1.5">
          {shown.map((m) =>
            m.avatar_url ? (
              <img key={m.id} src={m.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-brand-600" />
            ) : (
              <span
                key={m.id}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-brand-700 ring-2 ring-brand-600"
              >
                {initialsOf(m.full_name)}
              </span>
            ),
          )}
          {more > 0 && (
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-semibold ring-2 ring-brand-600">
              +{more}
            </span>
          )}
        </div>
        <ArrowRight size={14} className="ml-auto text-white/80 transition-transform duration-300 group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
