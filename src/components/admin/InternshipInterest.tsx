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
