import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, GraduationCap, Languages, Send, Wallet } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import {
  APPLICATION_NEXT,
  APPLICATION_STATUS,
  applyStudyAbroad,
  dateText,
  fetchStudyProgramme,
  withdrawStudyAbroad,
  type StudyApplicationForm,
  type StudyProgrammeFull,
} from '@/lib/studyAbroad'
import { AppShell } from '@/components/app/AppShell'
import { Markdown } from '@/components/admin/programme/Markdown'
import { Alert, Badge, Button, EmptyState, Skeleton } from '@/components/ui'

// Behind sign-in, so not in PAGE_SEO.
export const Route = createFileRoute('/study-abroad/$slug')({
  beforeLoad: requireOnboarded,
  component: StudyProgrammePage,
})

const EMPTY: StudyApplicationForm = { phone: '', education: '', english: '', intake: '', note: '' }

function Fact({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={16} className="mt-0.5 shrink-0 text-brand-600" />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">{label}</p>
        <p className="text-sm text-ink-800">{value}</p>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-ink-800">
      {label}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-ink-500">{hint}</span>}
    </label>
  )
}

function StudyProgrammePage() {
  const { slug } = Route.useParams()
  const [p, setP] = useState<StudyProgrammeFull | null>()
  const [form, setForm] = useState<StudyApplicationForm>(EMPTY)
  const [applying, setApplying] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const load = useCallback(() => {
    fetchStudyProgramme(slug).then(setP, (e) => setError(errorMessage(e)))
  }, [slug])
  useEffect(load, [load])

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      load()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const put = (k: keyof StudyApplicationForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value })
  const mine = p?.my_application
  const active = mine && mine.status !== 'withdrawn'
  const closed = p ? p.status !== 'open' || Boolean(p.apply_by && p.apply_by < new Date().toISOString().slice(0, 10)) : false

  return (
    <AppShell wide>
      <Link to="/study-abroad" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
        <ArrowLeft size={16} /> Study abroad
      </Link>

      {p === undefined && !error && <Skeleton className="h-96 w-full" />}
      {p === null && <EmptyState icon={GraduationCap} title="Programme not found" description="It may have closed. See every programme on Study abroad." />}
      {error && !p && (
        <Alert tone="danger" title="Couldn’t load this programme">
          <p>{error}</p>
        </Alert>
      )}

      {p && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <article>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">{[p.field, p.country].filter(Boolean).join(' · ')}</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink-900">{p.title}</h1>
            {p.level && <p className="mt-1 text-sm text-ink-600">{p.level}</p>}
            {p.status === 'draft' && (
              <div className="mt-3">
                <Alert tone="warning" title="Draft: only the MySkills team can see this">
                  <p>Open it in Admin → Study abroad when it has been checked.</p>
                </Alert>
              </div>
            )}
            {p.summary && <p className="mt-4 text-base leading-relaxed text-ink-700">{p.summary}</p>}
            {p.details && (
              <div className="card mt-5 p-5 sm:p-6">
                <Markdown text={p.details} />
              </div>
            )}
          </article>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="card space-y-3 p-5">
              <Fact icon={Clock} label="Duration" value={p.duration} />
              <Fact icon={Languages} label="Taught in" value={p.language} />
              <Fact icon={CalendarDays} label="Starts" value={p.intake} />
              <Fact icon={Wallet} label="Fees" value={p.fees} />
              <Fact icon={Send} label="Apply by" value={p.apply_by ? dateText(p.apply_by) : null} />
            </div>

            <div className="card p-5">
              {error && p && <p className="mb-3 text-sm text-red-700">{error}</p>}
              {active ? (
                <div>
                  <p className="flex items-center gap-2 font-semibold text-ink-900">
                    <CheckCircle2 size={18} className="text-emerald-600" /> You’ve applied
                  </p>
                  <div className="mt-2">
                    <Badge tone={APPLICATION_STATUS[mine.status].tone}>{APPLICATION_STATUS[mine.status].label}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-ink-600">{APPLICATION_NEXT[mine.status]}</p>
                  <p className="mt-2 text-xs text-ink-500">Applied {dateText(mine.created_at)}</p>
                  {['applied', 'in_review', 'shortlisted', 'offered'].includes(mine.status) && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm('Withdraw your application? You can apply again while the programme is open.')) void run(() => withdrawStudyAbroad(p.id))
                      }}
                      className="mt-3 text-xs font-medium text-ink-500 underline underline-offset-2 hover:text-ink-900"
                    >
                      Withdraw my application
                    </button>
                  )}
                </div>
              ) : closed ? (
                <p className="text-sm text-ink-600">{p.status === 'draft' ? 'Not open for applications yet.' : 'Applications are closed for now.'}</p>
              ) : !applying ? (
                <div>
                  <p className="font-semibold text-ink-900">Interested?</p>
                  <p className="mt-1 text-sm text-ink-600">Apply in two minutes. The MySkills team will contact you, and a mentor guides you through every step.</p>
                  {mine?.status === 'withdrawn' && <p className="mt-2 text-xs text-ink-500">{APPLICATION_NEXT.withdrawn}</p>}
                  <Button full className="mt-3" icon={Send} onClick={() => setApplying(true)}>
                    Apply
                  </Button>
                </div>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void run(async () => {
                      await applyStudyAbroad(p.id, form)
                      setApplying(false)
                      setForm(EMPTY)
                    })
                  }}
                >
                  <p className="font-semibold text-ink-900">Apply</p>
                  <Field label="Phone (WhatsApp)">
                    <input value={form.phone} onChange={put('phone')} required minLength={7} maxLength={30} inputMode="tel" className="field mt-1" placeholder="+91 98765 43210" />
                  </Field>
                  <Field label="Your education now" hint="Class 12 stream and year, or your degree">
                    <input value={form.education} onChange={put('education')} required minLength={3} maxLength={300} className="field mt-1" placeholder="Class 12 Science (PCB), 2026" />
                  </Field>
                  <Field label="English (optional)" hint="A test score, or how comfortable you are">
                    <input value={form.english} onChange={put('english')} maxLength={120} className="field mt-1" placeholder="IELTS 6.5, or not taken yet" />
                  </Field>
                  <Field label="When do you want to start? (optional)">
                    <input value={form.intake} onChange={put('intake')} maxLength={120} className="field mt-1" placeholder="September 2027" />
                  </Field>
                  <Field label="Anything else? (optional)">
                    <textarea value={form.note} onChange={put('note')} maxLength={2000} rows={3} className="field mt-1" />
                  </Field>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={busy}>
                      {busy ? 'Sending…' : 'Send application'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setApplying(false)}>
                      Cancel
                    </Button>
                  </div>
                  <p className="text-xs text-ink-500">The MySkills team sees your name, email and these answers.</p>
                </form>
              )}
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  )
}
