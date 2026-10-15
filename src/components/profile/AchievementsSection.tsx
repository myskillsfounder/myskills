import type { ReactNode } from 'react'
import { BadgeCheck, Briefcase, Clock, ExternalLink, FolderKanban } from 'lucide-react'
import type { MentorProject } from '@/lib/mentorProjects'
import { day, type ConfirmedInternship, type MyApplication } from '@/lib/internships'
import { Section } from './ui'

/** Only http(s) links are rendered as anchors — a mentor typed this one, but
 *  it's shown to the student and later to others, so it gets the same care. */
function safeLink(url?: string | null): string | null {
  const v = url?.trim()
  return v && /^https?:\/\//i.test(v) ? v : null
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">{children}</p>
}

/**
 * Everything a student has earned on MySkills, in one read-only card:
 * certificates, projects a mentor recorded for them, and internships done
 * through the app. Nothing here is typed in by the student, so there's nothing
 * to add or edit.
 *
 * An internship is listed as done only once MySkills has confirmed it: the
 * company signing it off is not enough on its own (see
 * docs/supabase-internships.sql). One the team is still checking is shown as
 * that, apart from the confirmed ones.
 */
export function AchievementsSection({
  certificate,
  projects,
  internships = [],
  confirming = [],
}: {
  /** The certificates block. */
  certificate: ReactNode
  projects: MentorProject[]
  /** Confirmed by MySkills, first one first. */
  internships?: ConfirmedInternship[]
  /** Signed off by the company, still being confirmed. */
  confirming?: MyApplication[]
}) {
  return (
    <Section title="Achievements">
      <div className="mb-6">
        <Label>Certificates</Label>
        {certificate}
      </div>

      <div className="mb-6">
        <Label>Projects</Label>
        {projects.length ? (
          <ul className="space-y-4">
            {projects.map((p) => {
              const href = safeLink(p.link)
              return (
                <li key={p.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <FolderKanban size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900">{p.title}</p>
                    <p className="mt-0.5 inline-flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        <BadgeCheck size={13} />
                        Verified{p.mentor?.full_name ? ` by ${p.mentor.full_name}` : ' by your mentor'}
                      </span>
                      {p.year && <span>· {p.year}</span>}
                    </p>
                    {href && (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs font-medium text-brand-700 hover:underline"
                      >
                        <ExternalLink size={12} className="shrink-0" />
                        <span className="truncate">{href.replace(/^https?:\/\//i, '')}</span>
                      </a>
                    )}
                    {p.description && <p className="mt-1.5 whitespace-pre-line text-sm text-ink-600">{p.description}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-ink-500">
            Your mentor adds the projects you do on your programme — each one verified by them.
          </p>
        )}
      </div>

      <div>
        <Label>Internships</Label>
        {internships.length > 0 && (
          <ul className="space-y-4">
            {internships.map((x, i) => (
              <li key={x.id} className="flex gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Briefcase size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900">{x.role_title || 'Internship'}</p>
                  <p className="text-sm text-ink-700">{x.organisation}</p>
                  <p className="mt-0.5 inline-flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                      <BadgeCheck size={13} />
                      Confirmed by MySkills
                    </span>
                    {x.started_on && x.ended_on && (
                      <span>
                        · {day(x.started_on)} to {day(x.ended_on)}
                      </span>
                    )}
                    <span>· supervised by {x.supervisor_name}</span>
                  </p>
                  {i === 0 && <p className="mt-1 text-xs text-ink-500">Your first internship counts for 20 points of your Global Readiness Score.</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
        {confirming.length > 0 && (
          <ul className={`space-y-2 ${internships.length > 0 ? 'mt-4' : ''}`}>
            {confirming.map((a) => (
              <li key={a.id} className="flex items-start gap-2 rounded-xl bg-ink-900/[0.03] p-3 text-sm text-ink-600">
                <Clock size={15} className="mt-0.5 shrink-0 text-ink-400" />
                <span>
                  <span className="font-semibold text-ink-800">{a.title}</span> at {a.organisation}: signed off by the
                  company. MySkills is confirming it, and it shows here as done once that’s finished.
                </span>
              </li>
            ))}
          </ul>
        )}
        {internships.length === 0 && confirming.length === 0 && (
          <p className="inline-flex items-start gap-2 text-sm text-ink-500">
            <Briefcase size={15} className="mt-0.5 shrink-0" />
            Internships you do through MySkills appear here once MySkills has confirmed them. Roles are open in
            Community.
          </p>
        )}
      </div>
    </Section>
  )
}
