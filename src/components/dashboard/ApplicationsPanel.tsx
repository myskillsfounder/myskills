import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Briefcase, GraduationCap } from 'lucide-react'
import { MY_STATUS, fetchMyApplications, roleFacts, type MyApplication } from '@/lib/internships'
import type { StudentMatch } from '@/lib/mentorMatches'
import { rememberProgramme } from '@/lib/practiceProgramme'
import { ApplicationActions, nextStep } from '@/components/community/Internships'
import { Badge } from '@/components/ui'

export interface MentorAsk {
  match: StudentMatch | null
  programme: 1 | 2
  label: string
}

/**
 * The student's applications, where the LaunchPad's "Explore" was (Paul,
 * 3 Nov 2026): internships applied for and mentors asked, with where each
 * stands. An offer, or a Withdraw, is answered right here.
 */
export function ApplicationsPanel({ mentors, hideEmpty = false }: { mentors: MentorAsk[]; hideEmpty?: boolean }) {
  const [applications, setApplications] = useState<MyApplication[]>()
  const load = useCallback(() => {
    void fetchMyApplications().then(setApplications)
  }, [])
  useEffect(load, [load])

  const asked = mentors.filter((m) => m.match && (m.match.status === 'active' || m.match.status === 'requested'))
  const none = applications !== undefined && applications.length === 0 && asked.length === 0
  if (hideEmpty && (none || applications === undefined)) return null

  return (
    <section className="card h-full p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink-900">Your applications</h2>
      <p className="text-sm text-ink-500">Internships and mentors you’ve asked</p>

      {none ? (
        <div className="mt-4 rounded-2xl border border-dashed border-ink-300 p-5 text-center">
          <p className="text-sm font-medium text-ink-800">Nothing yet</p>
          <p className="mt-0.5 text-xs text-ink-500">Apply for an internship or ask a mentor, and it shows here.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm font-semibold">
            <Link to="/community" search={{ category: 'internships' }} className="text-brand-700 hover:text-brand-800">
              Find an internship
            </Link>
            <Link to="/community" search={{ category: 'mentors' }} className="text-brand-700 hover:text-brand-800">
              Find a mentor
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-ink-900/[0.06]">
          {(applications ?? []).map((a) => (
            <li key={a.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Briefcase size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{a.title}</p>
                    <p className="truncate text-xs text-ink-600">
                      {a.organisation} · {roleFacts(a)}
                    </p>
                  </div>
                  <Badge tone={MY_STATUS[a.status].tone}>{MY_STATUS[a.status].label}</Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">{nextStep(a.status, a.organisation)}</p>
                <ApplicationActions id={a.id} status={a.status} onChanged={load} />
              </div>
            </li>
          ))}
          {asked.map(({ match, programme, label }) => {
            const name = match!.mentor?.full_name ?? 'Your mentor'
            const waiting = match!.status === 'requested'
            return (
              <li key={`mentor-${programme}`} className="py-4 first:pt-0 last:pb-0">
                <Link to="/practice" onClick={() => rememberProgramme(programme)} className="group flex items-center gap-3">
                  {match!.mentor?.avatar_url ? (
                    <img src={match!.mentor.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <GraduationCap size={18} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-900">{name}</span>
                    <span className="block truncate text-xs text-ink-600">Mentor · {label}</span>
                  </span>
                  <Badge tone={waiting ? 'brand' : 'success'}>{waiting ? 'Waiting' : 'Active'}</Badge>
                  <ArrowRight size={15} className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
