import { useState } from 'react'
import { CalendarClock, CheckCircle2, ShieldAlert, ShieldCheck, Video } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import type { Profile } from '@/lib/profile'
import {
  cancelMyVerificationRequest,
  requestVerification,
  type EntryStatus,
  type VerificationRequest,
  type VerificationView,
} from '@/lib/verification'
import { Field, PrimaryButton, Textarea } from './ui'

/** Small status pill used on every verifiable entry. */
export function VerificationBadge({ status }: { status: EntryStatus }) {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <ShieldCheck size={11} /> Verified
      </span>
    )
  }
  if (status === 'changed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
        <ShieldAlert size={11} /> Changed since verified
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
      Unverified
    </span>
  )
}

const fmtCall = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }) + ' IST'

/** Only https links become anchors — this one is typed by staff, but it's
 *  rendered to a student, so it gets the same care as any link. */
const safeHttps = (url: string | null) => (url && /^https:\/\//i.test(url) ? url : null)

function RequestForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [times, setTimes] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) return
    setBusy(true)
    setError(undefined)
    try {
      await requestVerification({ preferred_times: times, phone })
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4 border-t border-ink-200 pt-5">
      <Textarea
        label="When suits you for a 15-minute video call?"
        rows={2}
        placeholder="e.g. Weekday evenings after 6pm, or Saturday morning"
        value={times}
        onChange={(e) => setTimes(e.target.value)}
      />
      <Field
        label="Phone or WhatsApp (optional)"
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <label className="flex items-start gap-2.5 rounded-xl bg-ink-50 p-3 text-sm leading-relaxed text-ink-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          I agree to a video call with the MySkills team to verify my identity and the education,
          experience and projects on my profile. I’ll show my documents on camera. MySkills won’t
          record the call or keep copies of them, and will only use the result to mark my profile
          entries as verified.
        </span>
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton type="submit" disabled={!consent || busy}>
          {busy ? 'Sending…' : 'Request verification'}
        </PrimaryButton>
        <button type="button" onClick={onCancel} className="text-sm font-medium text-ink-600 hover:text-ink-900">
          Not now
        </button>
      </div>
    </form>
  )
}

/**
 * The KYC step of profile completion: the MySkills team checks identity and
 * each credential on a short call, so a profile shows employers what's been
 * proven. It completes the profile; it isn't part of the Career Readiness
 * Score, which only counts what's done on MySkills.
 */
export function VerificationSection({
  profile,
  view,
  request,
  onChange,
}: {
  profile: Profile
  view: VerificationView
  request: VerificationRequest | null
  onChange: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string>()

  const open = request?.status === 'requested' || request?.status === 'scheduled'
  const entries = [
    ...profile.education.map((e) => view.status('education', e)),
    ...profile.experience.map((x) => view.status('experience', x)),
    ...profile.projects.map((p) => view.status('project', p)),
  ]
  const verified = entries.filter((s) => s === 'verified').length
  const needsCheck = entries.length - verified + (view.identity === 'verified' ? 0 : 1)
  const fullyVerified = view.identity === 'verified' && entries.length > 0 && needsCheck === 0

  async function cancel() {
    setError(undefined)
    try {
      await cancelMyVerificationRequest()
      onChange()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const link = safeHttps(request?.meeting_link ?? null)

  return (
    <section id="verification" className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-e1 ${
            fullyVerified ? 'bg-emerald-600' : 'bg-gradient-to-br from-brand-500 to-brand-700'
          }`}
        >
          {fullyVerified ? <ShieldCheck size={22} /> : <Video size={22} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-ink-900">Profile verification</h2>
            <VerificationBadge status={view.identity} />
          </div>

          {request?.status === 'scheduled' && request.scheduled_at ? (
            <div className="mt-2 space-y-2 text-sm text-ink-700">
              <p className="inline-flex items-center gap-1.5 font-semibold text-ink-900">
                <CalendarClock size={16} className="text-brand-600" /> Your call: {fmtCall(request.scheduled_at)}
              </p>
              <p>
                Have a government photo ID ready, plus proof for each entry on your profile —
                certificates, marksheets, offer or experience letters.
              </p>
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  <Video size={15} /> Join the call
                </a>
              )}
            </div>
          ) : request?.status === 'requested' ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-700">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Request received. We’ll email you a call time soon.
            </p>
          ) : fullyVerified ? (
            <p className="mt-2 text-sm text-ink-700">
              Your identity and every entry on your profile are verified. Edits to a verified entry
              need re-checking before they count again.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Get your identity, education, experience and projects verified on a short video call, so
              employers can see what’s been checked.
            </p>
          )}

          {request?.status === 'completed' && request.note_to_student && !open && (
            <p className="mt-3 rounded-xl bg-ink-50 p-3 text-sm text-ink-700">
              <span className="font-semibold">From the MySkills team: </span>
              {request.note_to_student}
            </p>
          )}

          <p className="mt-3 text-xs text-ink-500">
            {view.identity === 'verified' ? 'Identity verified' : 'Identity not yet verified'} ·{' '}
            {verified} of {entries.length} {entries.length === 1 ? 'entry' : 'entries'} verified
          </p>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        </div>

        {!showForm && (
          <div className="shrink-0">
            {open ? (
              <button
                type="button"
                onClick={cancel}
                className="text-sm font-medium text-ink-500 hover:text-red-700"
              >
                Cancel request
              </button>
            ) : (
              !fullyVerified && (
                <PrimaryButton type="button" onClick={() => setShowForm(true)}>
                  {request?.status === 'completed' ? 'Verify new entries' : 'Request verification'}
                </PrimaryButton>
              )
            )}
          </div>
        )}
      </div>

      {showForm && (
        <RequestForm
          onDone={() => {
            setShowForm(false)
            onChange()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </section>
  )
}
