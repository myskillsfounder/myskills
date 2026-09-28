import type { ReactNode } from 'react'
import { BadgeCheck, Briefcase, ExternalLink, FolderKanban } from 'lucide-react'
import type { MentorProject } from '@/lib/mentorProjects'
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
 * certificates, projects a mentor recorded for them, and — once partner
 * internships open — internships done through the app. Nothing here is typed
 * in by the student, so there's nothing to add or edit.
 */
export function AchievementsSection({
  certificate,
  projects,
}: {
  /** The certificates block. */
  certificate: ReactNode
  projects: MentorProject[]
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
        <p className="inline-flex items-start gap-2 text-sm text-ink-500">
          <Briefcase size={15} className="mt-0.5 shrink-0" />
          Internships with MySkills partners will appear here once they open.
        </p>
      </div>
    </Section>
  )
}
