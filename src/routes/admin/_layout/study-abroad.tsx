import { useCallback, useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ExternalLink, Eye, Plane, Plus, Save } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { slugify } from '@/lib/programmeEngine'
import {
  APPLICATION_STATUS,
  dateText,
  fetchAdminStudyAbroad,
  saveStudyProgramme,
  setStudyApplication,
  type AdminStudyApplication,
  type AdminStudyProgramme,
  type ApplicationStatus,
  type StudyProgrammeDraft,
} from '@/lib/studyAbroad'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Markdown } from '@/components/admin/programme/Markdown'
import { Alert, Badge, Button, EmptyState, PageHeader, Skeleton } from '@/components/ui'

// Admissions: study-abroad programmes by country, and the students applying
// (docs/supabase-study-abroad.sql). The 'leads' section, as Global
// Leadership leads.
export const Route = createFileRoute('/admin/_layout/study-abroad')({
  component: () => (
    <RequireSection section="leads">
      <StudyAbroadAdmin />
    </RequireSection>
  ),
})

const PROGRAMME_STATUS = {
  draft: { label: 'Draft', tone: 'warning' as const, hint: 'Only the team sees it' },
  open: { label: 'Open', tone: 'success' as const, hint: 'Students can apply' },
  closed: { label: 'Closed', tone: 'neutral' as const, hint: 'Shown, no new applications' },
}
const TEAM_STEPS: Exclude<ApplicationStatus, 'withdrawn'>[] = ['applied', 'in_review', 'shortlisted', 'offered', 'enrolled', 'not_selected']

const blank = (): StudyProgrammeDraft => ({
  id: null, slug: '', title: '', country: '', field: '', level: '', summary: '', details: '',
  duration: '', language: '', intake: '', fees: '', apply_by: null, status: 'draft',
})

function Input({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block text-sm font-medium text-ink-800">
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field mt-1" />
    </label>
  )
}

/** Add or edit one programme. */
function ProgrammeEditor({ start, onSaved, onCancel }: { start: StudyProgrammeDraft; onSaved: () => void; onCancel: () => void }) {
  const [p, setP] = useState(start)
  const [touchedSlug, setTouchedSlug] = useState(Boolean(start.id))
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const put = <K extends keyof StudyProgrammeDraft>(k: K, v: StudyProgrammeDraft[K]) => setP((x) => ({ ...x, [k]: v }))

  async function save() {
    setBusy(true)
    setError(undefined)
    try {
      await saveStudyProgramme(p)
      onSaved()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className="card space-y-4 p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink-900">{p.id ? `Edit ${start.title}` : 'New study-abroad programme'}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Name"
          value={p.title}
          onChange={(v) => {
            put('title', v)
            if (!touchedSlug) put('slug', slugify(v))
          }}
          placeholder="Study Nursing in Italy"
        />
        <label className="block text-sm font-medium text-ink-800">
          Web address
          <input
            value={p.slug}
            onChange={(e) => {
              setTouchedSlug(true)
              put('slug', slugify(e.target.value))
            }}
            className="field mt-1"
            placeholder="nursing-italy"
          />
          <span className="mt-1 block text-xs font-normal text-ink-500">myskills.org.in/study-abroad/{p.slug || '…'}</span>
        </label>
        <Input label="Country" value={p.country} onChange={(v) => put('country', v)} placeholder="Italy" />
        <Input label="Subject" value={p.field ?? ''} onChange={(v) => put('field', v)} placeholder="Nursing" />
        <Input label="Level" value={p.level ?? ''} onChange={(v) => put('level', v)} placeholder="Bachelor’s degree" />
        <Input label="Duration" value={p.duration ?? ''} onChange={(v) => put('duration', v)} placeholder="3 years" />
        <Input label="Taught in" value={p.language ?? ''} onChange={(v) => put('language', v)} placeholder="English" />
        <Input label="Starts" value={p.intake ?? ''} onChange={(v) => put('intake', v)} placeholder="September each year" />
        <Input label="Fees" value={p.fees ?? ''} onChange={(v) => put('fees', v)} placeholder="About €2,000 a year" />
        <Input label="Apply by (optional)" type="date" value={p.apply_by ?? ''} onChange={(v) => put('apply_by', v || null)} />
      </div>
      <label className="block text-sm font-medium text-ink-800">
        Summary (on the card)
        <textarea value={p.summary ?? ''} onChange={(e) => put('summary', e.target.value)} rows={2} maxLength={600} className="field mt-1" />
      </label>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-800">The full page</span>
          <button type="button" onClick={() => setPreview((x) => !x)} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
            <Eye size={13} /> {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
        {preview ? (
          <div className="mt-1 rounded-xl bg-ink-50 p-4">
            <Markdown text={p.details ?? ''} />
          </div>
        ) : (
          <textarea
            value={p.details ?? ''}
            onChange={(e) => put('details', e.target.value)}
            rows={14}
            className="field mt-1 font-mono text-xs"
            placeholder={'## Who it’s for\n…\n\n## What you need\n- …'}
          />
        )}
        <p className="mt-1 text-xs text-ink-500">“## ” starts a heading, “- ” a bullet, **bold**, [link](https://…).</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PROGRAMME_STATUS) as (keyof typeof PROGRAMME_STATUS)[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => put('status', s)}
            className={`rounded-xl border px-3 py-2 text-left text-sm ${p.status === s ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700'}`}
          >
            <span className="font-semibold">{PROGRAMME_STATUS[s].label}</span>
            <span className="block text-xs opacity-80">{PROGRAMME_STATUS[s].hint}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <Button icon={Save} disabled={busy} onClick={() => void save()}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

/** One student's application, opened. */
function ApplicationRow({ a, onSaved }: { a: AdminStudyApplication; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(a.status)
  const [note, setNote] = useState(a.team_note ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const st = APPLICATION_STATUS[a.status]
  const phone = (a.phone ?? '').replace(/[^\d+]/g, '')

  async function save() {
    if (status === 'withdrawn') return
    setBusy(true)
    setError(undefined)
    try {
      await setStudyApplication(a.id, status, note)
      onSaved()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <li>
      <button type="button" onClick={() => setOpen((x) => !x)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 text-left hover:bg-ink-50">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink-900">{a.name}</span>
            <Badge tone={st.tone}>{st.label}</Badge>
          </span>
          <span className="mt-0.5 block text-xs text-ink-500">
            {a.programme} · applied {dateText(a.created_at)}
            {a.education ? ` · ${a.education}` : ''}
          </span>
        </span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-ink-900/[0.06] bg-ink-50/50 px-5 py-4 text-sm">
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-500">Email</dt>
              <dd>
                <a href={`mailto:${a.email}`} className="text-brand-700 underline underline-offset-2">
                  {a.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Phone</dt>
              <dd>
                {a.phone}
                {phone && (
                  <a href={`https://wa.me/${phone.replace(/^\+/, '')}`} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-0.5 text-xs text-brand-700">
                    WhatsApp <ExternalLink size={11} />
                  </a>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Education</dt>
              <dd>{a.education || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">English</dt>
              <dd>{a.english_level || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Wants to start</dt>
              <dd>{a.intake || '—'}</dd>
            </div>
          </dl>
          {a.note && <p className="rounded-lg bg-white p-3 text-ink-700">“{a.note}”</p>}
          {a.status === 'withdrawn' ? (
            <p className="text-ink-500">The student withdrew this application.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {TEAM_STEPS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${status === s ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200'}`}
                  >
                    {APPLICATION_STATUS[s].label}
                  </button>
                ))}
              </div>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} className="field text-sm" placeholder="Team note (only the team sees it)" />
              {error && <p className="text-red-700">{error}</p>}
              <Button size="sm" disabled={busy} onClick={() => void save()}>
                {busy ? 'Saving…' : 'Save'}
              </Button>
              <p className="text-xs text-ink-500">The student sees the step (Applied, In review, Shortlisted…), never the note.</p>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

function StudyAbroadAdmin() {
  const [data, setData] = useState<{ programmes: AdminStudyProgramme[]; applications: AdminStudyApplication[] } | null>()
  const [error, setError] = useState<string>()
  const [tab, setTab] = useState<'applications' | 'programmes'>('applications')
  const [editing, setEditing] = useState<StudyProgrammeDraft | null>(null)
  const [programme, setProgramme] = useState('all')

  const load = useCallback(() => {
    fetchAdminStudyAbroad().then(setData, (e) => setError(errorMessage(e)))
  }, [])
  useEffect(load, [load])

  const newCount = data?.applications.filter((a) => a.status === 'applied').length ?? 0
  const apps = (data?.applications ?? []).filter((a) => programme === 'all' || a.programme_id === programme)

  return (
    <>
      <PageHeader
        eyebrow="Admissions"
        title="Study abroad"
        subtitle="Programmes to study in another country, by country, and the students applying. A programme is a draft until you open it; students then see it under Study abroad and apply."
        actions={
          data && !editing ? (
            <Button
              icon={Plus}
              onClick={() => {
                setTab('programmes')
                setEditing(blank())
              }}
            >
              New programme
            </Button>
          ) : undefined
        }
      />

      {error && (
        <Alert tone="danger" title="Couldn’t load study abroad">
          <p>{error}</p>
        </Alert>
      )}
      {data === null && (
        <Alert tone="info" title="Study abroad isn’t set up yet">
          <p>Run docs/supabase-study-abroad.sql in Supabase.</p>
        </Alert>
      )}
      {data === undefined && !error && <Skeleton className="h-64 w-full" />}

      {data && (
        <>
          <div className="mb-4 flex gap-1.5" role="tablist">
            {(['applications', 'programmes'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'}`}
              >
                {t === 'applications' ? 'Applications' : 'Programmes'}{' '}
                <span className="opacity-60">{t === 'applications' ? data.applications.length : data.programmes.length}</span>
                {t === 'applications' && newCount > 0 && <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold text-white">{newCount} new</span>}
              </button>
            ))}
          </div>

          {tab === 'programmes' &&
            (editing ? (
              <ProgrammeEditor
                start={editing}
                onCancel={() => setEditing(null)}
                onSaved={() => {
                  setEditing(null)
                  load()
                }}
              />
            ) : data.programmes.length === 0 ? (
              <EmptyState icon={Plane} title="No programmes yet" description="Add the first with “New programme”." />
            ) : (
              <ul className="card divide-y divide-ink-900/[0.06] overflow-hidden">
                {data.programmes.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink-900">{p.title}</span>
                        <Badge tone={PROGRAMME_STATUS[p.status].tone}>{PROGRAMME_STATUS[p.status].label}</Badge>
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-500">
                        {p.country} · /study-abroad/{p.slug} · {p.applications} {p.applications === 1 ? 'application' : 'applications'}
                        {p.new ? ` (${p.new} new)` : ''}
                        {p.apply_by ? ` · apply by ${dateText(p.apply_by)}` : ''}
                      </span>
                    </span>
                    <a href={`/study-abroad/${p.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-ink-600 hover:text-ink-900">
                      <Eye size={13} /> View
                    </a>
                    <Button size="sm" variant="secondary" onClick={() => setEditing({ ...p, details: p.details ?? '' })}>
                      Edit
                    </Button>
                  </li>
                ))}
              </ul>
            ))}

          {tab === 'applications' && (
            <>
              {data.programmes.length > 1 && (
                <select value={programme} onChange={(e) => setProgramme(e.target.value)} className="field mb-3 max-w-xs text-sm">
                  <option value="all">All programmes</option>
                  {data.programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              )}
              {apps.length === 0 ? (
                <EmptyState icon={Plane} title="No applications yet" description="When students apply to an open programme, they appear here, newest first." />
              ) : (
                <ul className="card divide-y divide-ink-900/[0.06] overflow-hidden">
                  {apps.map((a) => (
                    <ApplicationRow key={a.id} a={a} onSaved={load} />
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}
