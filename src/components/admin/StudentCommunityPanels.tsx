import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { fetchAdminPipeline, type AdminApplication } from '@/lib/internships'
import { RESOURCE_LABEL, fetchStudentConnections, type StudentConnection } from '@/lib/communityPortal'
import { ApplicationRow } from '@/components/admin/InternshipPipeline'
import { Badge } from '@/components/ui'

const day = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

const CONNECTION: Record<StudentConnection['status'], { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  active: { label: 'Sharing now', tone: 'success' },
  invited: { label: 'Asked, no answer yet', tone: 'warning' },
  declined: { label: 'Declined', tone: 'neutral' },
  ended: { label: 'Finished', tone: 'neutral' },
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 lg:col-span-2">
      <h2 className="font-display text-base font-semibold text-ink-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

/**
 * The parts of a student's admin page that come from Community: their
 * internship applications, wherever they stand, and every counsellor, guide,
 * company and institution they are with, were with, or have been asked by.
 * Each loads on its own and is left out before docs/supabase-admin-
 * internships.sql is run.
 */
export function StudentCommunityPanels({ studentId }: { studentId: string }) {
  const [apps, setApps] = useState<AdminApplication[] | null | undefined>(undefined)
  const [links, setLinks] = useState<StudentConnection[] | null | undefined>(undefined)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    fetchAdminPipeline(studentId).then(
      (r) => active && setApps(r),
      (e) => {
        if (!active) return
        setApps(null)
        setError(errorMessage(e))
      },
    )
    fetchStudentConnections(studentId).then(
      (r) => active && setLinks(r),
      (e) => {
        if (!active) return
        setLinks(null)
        setError(errorMessage(e))
      },
    )
    return () => {
      active = false
    }
  }, [studentId])

  // The score counts the first confirmed internship; later ones are on the record only.
  const confirmed = (apps ?? []).filter((a) => a.status === 'completed').length

  return (
    <>
      {apps && (
        <Panel title="Internships">
          {apps.length === 0 ? (
            <p className="text-sm text-ink-500">Hasn’t applied for a role yet.</p>
          ) : (
            <>
              {confirmed > 0 && (
                <p className="mb-2 text-sm text-ink-600">
                  {confirmed === 1 ? 'One confirmed internship' : `${confirmed} confirmed internships`}: the first adds 20
                  points to the score.
                </p>
              )}
              <ul className="-mx-4 divide-y divide-ink-100">
                {apps.map((a) => (
                  <ApplicationRow key={a.id} a={a} showStudent={false} />
                ))}
              </ul>
            </>
          )}
        </Panel>
      )}
      {links && (
        <Panel title="Who can see their record">
          {links.length === 0 ? (
            <p className="text-sm text-ink-500">No counsellor, guide, company or institution.</p>
          ) : (
            <ul className="divide-y divide-ink-100 text-sm">
              {links.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="min-w-0 text-ink-800">
                    <span className="font-semibold">{c.partner}</span>
                    <span className="text-ink-500">
                      {' '}
                      · {RESOURCE_LABEL[c.resource]} ·{' '}
                      {c.status === 'active'
                        ? `since ${day(c.started_on)}`
                        : c.status === 'ended'
                          ? `${day(c.started_on)} to ${c.ended_on ? day(c.ended_on) : '…'}`
                          : `asked ${day(c.asked_on)}`}
                    </span>
                  </span>
                  <Badge tone={CONNECTION[c.status].tone}>{CONNECTION[c.status].label}</Badge>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-ink-500">
            A partner can open the student’s record only while it says “Sharing now”. Mentors aren’t listed here.
          </p>
        </Panel>
      )}
      {error && <p className="text-sm text-red-700 lg:col-span-2">{error}</p>}
    </>
  )
}
