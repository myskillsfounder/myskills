import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Send, X } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { useProfile } from '@/lib/useProfile'
import { enquireInstitution, type EnquiryInput } from '@/lib/institutionLeads'
import type { InstitutionPartner } from '@/lib/institutionPartners'
import { Alert, Button, Input, Textarea } from '@/components/ui'

/*
 * Apply Now on an academy or partner institution (Paul, 18 Nov 2026: "for
 * all academies and partner institutions, we are going to be listing and just
 * apply now button. The lead should come to the internal team").
 *
 * The application is an institution lead (docs/supabase-institution-leads.sql):
 * it goes to Admin > Leads > Institution leads, and to the team's Inbox, never
 * to the institution. Name and email come from the student's account; the
 * phone from their profile, which they can change here. The team calls, so a
 * phone number is needed.
 */

const WHEN = ['Any time', 'Weekday mornings', 'Weekday afternoons', 'Weekday evenings', 'Weekends']

function ApplyForm({ partner, courses, onSent }: { partner: InstitutionPartner; courses: string[]; onSent: () => void }) {
  const { profile } = useProfile()
  const [form, setForm] = useState<EnquiryInput>({ course: '', phone: '', city: '', preferred: WHEN[0], message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>()

  useEffect(() => {
    setForm((f) => ({ ...f, phone: f.phone || profile?.phone || '', city: f.city || partner.city || '' }))
  }, [profile?.phone, partner.city])

  const set = (key: keyof EnquiryInput) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.phone.replace(/\D/g, '').length < 10) {
      setSubmitError('Add your phone number, so the MySkills team can call you.')
      return
    }
    setSubmitError(undefined)
    setSubmitting(true)
    try {
      await enquireInstitution(partner.id, form)
      onSent()
    } catch (err) {
      setSubmitError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <p className="text-sm text-ink-600">
        The MySkills team will call you within two working days with {partner.legal_name}’s fees and batch dates, and can set
        up a visit.
      </p>
      {courses.length > 0 && (
        <label className="block text-sm font-medium text-ink-800">
          Course you want to join
          <select value={form.course} onChange={set('course')} className="field mt-1.5 block w-full">
            <option value="">Not sure yet</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Phone" value={form.phone} onChange={set('phone')} type="tel" autoComplete="tel" />
        <Input label="City" value={form.city} onChange={set('city')} required={false} />
      </div>
      <label className="block text-sm font-medium text-ink-800">
        When suits you for a call
        <select value={form.preferred} onChange={set('preferred')} className="field mt-1.5 block w-full">
          {WHEN.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </label>
      <Textarea
        label="Anything else?"
        value={form.message}
        onChange={set('message')}
        required={false}
        rows={2}
        maxLength={2000}
        placeholder="Your budget, batch timing, or a question for the team"
      />
      <p className="text-xs text-ink-500">Your name, email and phone go to the MySkills team only.</p>

      {submitError && (
        <Alert tone="danger" title="Couldn't send your application">
          <p>{submitError}</p>
        </Alert>
      )}

      <Button type="submit" icon={Send} disabled={submitting} full>
        {submitting ? 'Sending…' : 'Send Application'}
      </Button>
    </form>
  )
}

/** The Apply Now dialog: the form, then a confirmation. `onDone` runs when it closes after sending. */
export function ApplyDialog({
  partner,
  courses,
  onClose,
  onDone,
}: {
  partner: InstitutionPartner
  courses: string[]
  onClose: () => void
  onDone?: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [sent, setSent] = useState(false)
  const close = () => (sent ? (onDone ?? onClose)() : onClose())

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
    // close reads `sent`; re-bind when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sent])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Apply to ${partner.legal_name}`}>
      <button type="button" aria-label="Close" onClick={close} className="absolute inset-0 bg-ink-900/50" />
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-e2 sm:max-w-lg sm:rounded-3xl">
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
        >
          <X size={18} />
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">Apply Now</p>
        <h2 className="mt-1 pr-10 font-display text-xl font-semibold text-ink-900">{partner.legal_name}</h2>
        <div className="mt-4">
          {sent ? (
            <div className="rounded-2xl bg-emerald-50 p-5 text-center">
              <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
              <p className="mt-2 font-display text-lg font-semibold text-ink-900">Application sent</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-700">
                The MySkills team will call you within two working days. You can see where it stands on the Institutions page.
              </p>
              <Button className="mt-4" onClick={close}>
                Done
              </Button>
            </div>
          ) : (
            <ApplyForm partner={partner} courses={courses} onSent={() => setSent(true)} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
