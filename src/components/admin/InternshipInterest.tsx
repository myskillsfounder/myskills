import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { csvDate } from '@/lib/csv'
import { INTEREST_LABEL } from '@/components/community/InterestDialog'
import {
  cvLink,
  fetchAdminInterest,
  setInterestStatus,
  type AdminInterest,
  type InterestStatus,
} from '@/lib/internshipInterest'
import { ExportButton } from '@/components/admin/ExportButton'

/**
 * Students who applied, with a CV, to a kind of internship from Home
 * (docs/supabase-internship-interest.sql). The team opens the CV, and moves each one
 * on: new, in touch, shared with a company, closed. Left out entirely until the SQL
 * has been run (the list comes back empty-handed, not empty).
 */

const STATUSES: InterestStatus[] = ['new', 'contacted', 'shared', 'closed']

/** The student's MySkills profile, as it came with the application. */
function ProfileLine({ row }: { row: AdminInterest }) {
  const p = row.student_profile
  if (!p && row.score == null) return null
  const where = [p?.location, p?.state, p?.country].find((x) => x && x.trim())
  const line = [p?.headline, where, p?.career_stage].filter((x) => x && String(x).trim()).join(' · ')
  const skills = (p?.skills ?? []).filter(Boolean).slice(0, 8)
  const edu = p?.education?.find((e) => e.school || e.degree)
  const eduLine = edu ? [[edu.degree, edu.field].filter(Boolean).join(' '), edu.school].filter(Boolean).join(', ') : ''
  const job = p?.experience?.find((e) => e.title || e.company)
  const jobLine = job ? [job.title, job.company].filter(Boolean).join(' at ') : ''
  return (
    <div className="mt-2 rounded-xl bg-ink-900/[0.03] p-3 text-sm">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-700">
        {line && <span>{line}</span>}
        {row.score != null && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Readiness score {row.score}</span>
        )}
      </p>
      {(eduLine || jobLine) && (
        <p className="mt-1 text-xs text-ink-600">{[eduLine && `Studied: ${eduLine}`, jobLine && `Worked: ${jobLine}`].filter(Boolean).join(' · ')}</p>
      )}
      {skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.map((k) => (
            <span key={k} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-ink-700 ring-1 ring-ink-900/[0.08]">
              {k}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function InternshipInterest() {
  const [rows, setRows] = useState<AdminInterest[] | null>(null)
  const [error, setError] = useState('')
  const [opening, setOpening] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    void fetchAdminInterest().then((r) => live && setRows(r))
    return () => {
      live = false
    }
  }, [])

  if (rows === null) return null

  async function openCv(row: AdminInterest) {
    setOpening(row.id)
    setError('')
    try {
      window.open(await cvLink(row.cv_path), '_blank', 'noopener,noreferrer')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setOpening(null)
    }
  }

  async function move(row: AdminInterest, status: InterestStatus) {
    setError('')
    const before = rows
    setRows((rs) => (rs ?? []).map((r) => (r.id === row.id ? { ...r, status } : r)))
    try {
      await setInterestStatus(row.id, status)
    } catch (e) {
      setRows(before)
      setError(errorMessage(e))
    }
  }

  const open = rows.filter((r) => r.status !== 'closed').length

  return (
    <section className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Applications with a CV · {rows.length}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-600">
            Students who applied to a kind of internship from Home. Open the CV, and share it with a partner company when that kind of internship opens.
            {rows.length > 0 ? ` ${open} not closed.` : ''}
          </p>
        </div>
        {rows.length > 0 && (
          <ExportButton<AdminInterest>
            name="internship-applications-cv"
            label="Export applications"
            rows={rows}
            columns={[
              { header: 'Applied', value: (r) => csvDate(r.created_at) },
              { header: 'Student', value: (r) => r.student_name ?? '' },
              { header: 'Email', value: (r) => r.student_email ?? '' },
              { header: 'Phone', value: (r) => r.student_phone ?? '' },
              { header: 'Internship', value: (r) => r.track_title },
              { header: 'Headline', value: (r) => r.student_profile?.headline ?? '' },
              { header: 'Skills', value: (r) => (r.student_profile?.skills ?? []).join(', ') },
              { header: 'Readiness score', value: (r) => r.score ?? '' },
              { header: 'Status', value: (r) => INTEREST_LABEL[r.status] },
              { header: 'Note', value: (r) => r.note ?? '' },
            ]}
          />
        )}
      </div>

      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

      {rows.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-ink-300 p-5 text-sm text-ink-600">
          No one has applied yet. Applications appear here when a student sends their CV from an internship card on Home.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900">
                  {r.student_name || 'A student'} <span className="font-normal text-ink-500">· {r.track_title}</span>
                </p>
                <p className="mt-0.5 break-words text-sm text-ink-600">
                  {[r.student_email, r.student_phone].filter(Boolean).join(' · ') || 'No contact details'} · applied {csvDate(r.created_at)}
                </p>
                <ProfileLine row={r} />
                {r.note && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">{r.note}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={opening === r.id}
                  onClick={() => void openCv(r)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-300 px-3 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-100 disabled:opacity-50"
                >
                  <FileText size={15} /> {opening === r.id ? 'Opening…' : 'Open CV'}
                </button>
                <select
                  value={r.status}
                  onChange={(e) => void move(r, e.target.value as InterestStatus)}
                  aria-label={`Status for ${r.student_name ?? 'this student'}`}
                  className="h-9 rounded-lg border border-ink-300 bg-white px-2 text-sm text-ink-900"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {INTEREST_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
