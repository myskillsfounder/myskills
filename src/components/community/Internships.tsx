import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Briefcase, CalendarClock, Check, ShieldCheck, X } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  MY_STATUS,
  applyForInternship,
  day,
  fetchMyApplications,
  fetchOpenRoles,
  respondToOffer,
  roleFacts,
  withdrawApplication,
  type ApplicationStatus,
  type MyApplication,
  type OpenRole,
} from '@/lib/internships'
import { useMyAptitudeResult } from '@/lib/dmAptitude'
import { useMyAssessmentResult } from '@/lib/careerReadinessAssessment'
import { useInitialAssessment } from '@/lib/assessmentResults'
import { Badge, Button, Textarea } from '@/components/ui'

/** The open roles and this student's applications, with one way to refresh both. */
export function useInternships() {
  const [roles, setRoles] = useState<OpenRole[]>([])
  const [applications, setApplications] = useState<MyApplication[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const [r, a] = await Promise.all([fetchOpenRoles(), fetchMyApplications()])
    setRoles(r)
    setApplications(a)
    setLoading(false)
  }, [])
  useEffect(() => {
    void reload()
  }, [reload])

  return { roles, applications, loading, reload }
}

/** What happens next, in the student's words, for each state of an application. */
function nextStep(status: ApplicationStatus, organisation: string): string {
  switch (status) {
    case 'applied':
      return `${organisation} can see your score, certificates and note. You’ll hear by email.`
    case 'shortlisted':
      return `${organisation} shortlisted you. They can now see your email and phone, and may get in touch.`
    case 'offered':
      return `${organisation} has offered you this internship. Accept to start, or decline.`
    case 'accepted':
      return `You’re interning with ${organisation}. When it ends they sign it off, MySkills confirms it, and it counts for your score.`
    case 'signoff_pending':
      return `${organisation} has signed off your internship. MySkills is confirming it.`
    case 'completed':
      return 'Completed and confirmed. It is on your record.'
    case 'rejected':
      return 'This one didn’t go through. Other roles are open.'
    default:
      return ''
  }
}

/** Accept / decline an offer, or pull out, for one application. */
function ApplicationActions({
  id,
  status,
  onChanged,
}: {
  id: string
  status: ApplicationStatus
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [confirming, setConfirming] = useState(false)

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  if (status !== 'applied' && status !== 'shortlisted' && status !== 'offered') return null
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        {status === 'offered' && (
          <>
            <Button size="sm" icon={Check} disabled={busy} onClick={() => void run(() => respondToOffer(id, true))}>
              Accept offer
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => void run(() => respondToOffer(id, false))}>
              Decline
            </Button>
          </>
        )}
        {status !== 'offered' &&
          (confirming ? (
            <span className="inline-flex items-center gap-2 text-sm text-ink-700">
              Withdraw your application?
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void run(() => withdrawApplication(id))}>
                Yes
              </Button>
              <button type="button" className="text-sm font-medium text-ink-500" onClick={() => setConfirming(false)}>
                No
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-sm font-medium text-ink-600 underline underline-offset-2 hover:text-ink-900"
            >
              Withdraw
            </button>
          ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}

/**
 * The student's own applications, ahead of the listings: an offer waiting for
 * an answer is the most important thing on the page. Nothing is drawn when
 * there are none.
 */
export function YourInternships({ applications, onChanged }: { applications: MyApplication[]; onChanged: () => void }) {
  if (applications.length === 0) return null
  return (
    <section className="card p-5" aria-label="Your internship applications">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Your internships</p>
      <ul className="mt-3 divide-y divide-ink-900/[0.06]">
        {applications.map((a) => (
          <li key={a.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <div className="min-w-0">
                <p className="font-display text-base font-semibold leading-snug text-ink-900">{a.title}</p>
                <p className="text-sm text-ink-600">
                  {a.organisation} · {roleFacts(a)}
                </p>
              </div>
              <Badge tone={MY_STATUS[a.status].tone}>{MY_STATUS[a.status].label}</Badge>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{nextStep(a.status, a.organisation)}</p>
            <ApplicationActions id={a.id} status={a.status} onChanged={onChanged} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** One open role in the listings. The whole card opens it. */
export function InternshipRoleCard({ role, onOpen }: { role: OpenRole; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="card lift group flex flex-col p-5 text-left">
      <div className="flex w-full items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-e1">
          <Briefcase size={20} />
        </span>
        {role.my_status ? (
          <Badge tone={MY_STATUS[role.my_status].tone}>{MY_STATUS[role.my_status].label}</Badge>
        ) : (
          <Badge tone="success">Open</Badge>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-ink-900">{role.title}</h3>
      <p className="mt-0.5 text-sm font-medium text-ink-700">{role.organisation}</p>
      <p className="mt-1 text-sm text-ink-600">{roleFacts(role)}</p>
      {role.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {role.skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink-700 ring-1 ring-ink-900/[0.08]">
              {s}
            </span>
          ))}
        </div>
      )}
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
        {role.my_status ? 'See your application' : 'View and apply'}
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}

/** Applying: the note, and what the company gets to see for it. */
function ApplyForm({ role, onApplied }: { role: OpenRole; onApplied: () => void }) {
  // The same door as Practice: one aptitude assessment (or the older Foundation one).
  const dm = useMyAptitudeResult()
  const cr = useMyAssessmentResult()
  const foundation = useInitialAssessment()
  const checking = dm.loading || cr.loading || foundation.loading
  const ready = dm.result != null || cr.result != null || foundation.result != null
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function apply() {
    setBusy(true)
    setError(undefined)
    try {
      await applyForInternship(role.id, note)
      onApplied()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  if (checking) return <p className="mt-6 text-sm text-ink-500">Loading…</p>
  if (!ready) {
    return (
      <div className="mt-6 rounded-2xl bg-brand-50 p-4">
        <p className="text-sm font-semibold text-ink-900">Take an aptitude assessment first</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-600">
          It takes about five minutes and has no right answers. It opens Practice, where you build the Career
          Readiness Score that {role.organisation} looks at.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/aptitude-assessment" className="press inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white">
            Marketing aptitude <ArrowRight size={14} />
          </Link>
          <Link to="/career-readiness-assessment" className="press inline-flex h-10 items-center gap-1.5 rounded-full border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-800">
            Leadership Aptitude Test
          </Link>
        </div>
      </div>
    )
  }
  return (
    <div className="mt-6 border-t border-ink-900/[0.06] pt-5">
      <Textarea
        label="Why you?"
        required={false}
        rows={4}
        maxLength={1000}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="A few lines on what you’ve practised and why this role fits."
      />
      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-600">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand-600" />
        <span>
          When you apply, {role.organisation} sees your name, headline, Global Readiness Score, certificates and this
          note. Your email and phone are shared only if they shortlist you.
        </span>
      </p>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <Button className="mt-4" full disabled={busy} onClick={() => void apply()}>
        {busy ? 'Applying…' : 'Apply for this role'}
      </Button>
    </div>
  )
}

/** A role in full, over the page: what it is, and applying or the state of an application. */
export function InternshipRoleDialog({
  role,
  onClose,
  onChanged,
}: {
  role: OpenRole
  onClose: () => void
  onChanged: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    // The page behind doesn't scroll while the role is open.
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={role.title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink-900/50" />
      <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-e2 sm:max-w-lg sm:rounded-3xl">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close role"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
        >
          <X size={18} />
        </button>
        <div className="overflow-y-auto p-6 sm:p-8">
          <p className="pr-10 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Internship</p>
          <h2 className="mt-1 pr-10 font-display text-2xl font-semibold leading-tight text-ink-900">{role.title}</h2>
          <p className="mt-1 text-sm font-medium text-ink-700">{role.organisation}</p>
          <p className="mt-1 text-sm text-ink-600">
            {roleFacts(role)} · {role.openings} {role.openings === 1 ? 'opening' : 'openings'}
          </p>
          {role.apply_by && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-ink-600">
              <CalendarClock size={13} /> Apply by {day(role.apply_by)}
            </p>
          )}
          {role.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {role.skills.map((s) => (
                <span key={s} className="rounded-full bg-ink-900/[0.04] px-2.5 py-1 text-[11px] font-medium text-ink-700">
                  {s}
                </span>
              ))}
            </div>
          )}
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-ink-700">{role.description}</p>

          {role.my_status && role.my_application ? (
            <div className="mt-6 rounded-2xl bg-ink-900/[0.03] p-4">
              <Badge tone={MY_STATUS[role.my_status].tone}>{MY_STATUS[role.my_status].label}</Badge>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">{nextStep(role.my_status, role.organisation)}</p>
              <ApplicationActions id={role.my_application} status={role.my_status} onChanged={onChanged} />
            </div>
          ) : (
            <ApplyForm role={role} onApplied={onChanged} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
