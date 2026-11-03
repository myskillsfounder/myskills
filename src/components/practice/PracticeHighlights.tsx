import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Briefcase, GraduationCap } from 'lucide-react'
import { MY_STATUS, fetchMyApplications, roleFacts, type ApplicationStatus, type MyApplication } from '@/lib/internships'
import type { StudentMatch } from '@/lib/mentorMatches'
import { Avatar, Badge } from '@/components/ui'

/** An internship the company has said yes to: an offer, or under way, or done. */
const APPROVED: ApplicationStatus[] = ['offered', 'accepted', 'signoff_pending', 'completed']

/**
 * Practice's home, under the programme cards (Paul, 4 Nov 2026: "highlight
 * mentor and internship if any approved"): a mentor working with the student,
 * and an internship a company has said yes to. Nothing is drawn until there is
 * one; asking and applying live in the profile's "Your applications".
 */
export function PracticeHighlights({
  mentors,
  onOpenProgramme,
}: {
  mentors: { match: StudentMatch | null; programme: 1 | 2; label: string }[]
  onOpenProgramme: (programme: 1 | 2) => void
}) {
  const [applications, setApplications] = useState<MyApplication[]>([])
  useEffect(() => {
    void fetchMyApplications().then(setApplications)
  }, [])

  const active = mentors.filter((m) => m.match?.status === 'active')
  const internships = applications.filter((a) => APPROVED.includes(a.status))
  if (active.length === 0 && internships.length === 0) return null

  return (
    <section aria-label="Your mentor and internship" className="grid gap-4 md:grid-cols-2">
      {active.map(({ match, programme, label }) => {
        const name = match!.mentor?.full_name ?? 'Your mentor'
        return (
          <button
            key={`mentor-${programme}`}
            type="button"
            onClick={() => onOpenProgramme(programme)}
            className="lift group flex items-center gap-4 rounded-2xl border border-brand-300 bg-gradient-to-br from-brand-50 to-white p-5 text-left shadow-e1"
          >
            <span className="relative shrink-0">
              <Avatar name={name} src={match!.mentor?.avatar_url} size={52} />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white ring-2 ring-white">
                <GraduationCap size={13} />
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">Your mentor · {label}</span>
              <span className="mt-0.5 block truncate font-display text-lg font-semibold text-ink-900">{name}</span>
              <span className="block truncate text-sm text-ink-600">{match!.mentor?.headline || 'Working with you'}</span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-brand-700 transition-transform group-hover:translate-x-1" />
          </button>
        )
      })}
      {internships.map((a) => (
        <Link
          key={a.id}
          to="/profile"
          className="lift group flex items-center gap-4 rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-e1"
        >
          <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-e1">
            <Briefcase size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Your internship</span>
              <Badge tone={MY_STATUS[a.status].tone}>{MY_STATUS[a.status].label}</Badge>
            </span>
            <span className="mt-0.5 block truncate font-display text-lg font-semibold text-ink-900">{a.title}</span>
            <span className="block truncate text-sm text-ink-600">
              {a.organisation} · {roleFacts(a)}
            </span>
            {a.status === 'offered' && <span className="mt-1 block text-xs font-semibold text-amber-700">Answer the offer in your profile</span>}
          </span>
          <ArrowRight size={18} className="shrink-0 text-emerald-700 transition-transform group-hover:translate-x-1" />
        </Link>
      ))}
    </section>
  )
}
