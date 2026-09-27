import { useState } from 'react'
import {
  CalendarClock,
  Check,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Video,
} from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import type { Profile, Project } from '@/lib/profile'
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
          I agree to a video call with the MySkills team to verify my identity and the projects on
          my profile. I’ll show my documents and work on camera. MySkills won’t record the call or
          keep copies of them, and will only use the result to mark my profile entries as verified.
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

/** 'none' = nothing in this category to verify yet — shown for information,
 *  but it doesn't block completion or count in the ring (a student with no
 *  projects can still reach "Complete"). */
type StepState = 'done' | 'partial' | 'todo' | 'none'

/** One row of the checklist — the KYC-app pattern: an icon that says at a
 *  glance whether the step is done, and a short line of why not if it isn't. */
function Step({ label, state, detail }: { label: string; state: StepState; detail: string }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          state === 'done'
            ? 'bg-emerald-100 text-emerald-700'
            : state === 'partial'
              ? 'bg-amber-100 text-amber-700'
              : state === 'none'
                ? 'bg-ink-50 text-ink-300'
                : 'bg-ink-100 text-ink-400'
        }`}
      >
        {state === 'done' ? <Check size={15} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${state === 'none' ? 'text-ink-500' : 'text-ink-900'}`}>{label}</p>
        <p className="text-xs text-ink-500">{detail}</p>
      </div>
    </li>
  )
}

/**
 * The KYC step of profile completion, shown the way verification checklists
 * usually are: one step per part of the profile, each with its own done /
 * in-progress / not-started mark, a ring for the overall share, and a single
 * call to action underneath. It completes the profile; it isn't part of the
 * Career Readiness Score, which only counts what's done on MySkills.
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

  const group = (label: string, list: Project[], type: 'project') => {
    const verified = list.filter((e) => view.status(type, e) === 'verified').length
    const state: StepState =
      list.length === 0 ? 'none' : verified === list.length ? 'done' : verified > 0 ? 'partial' : 'todo'
    const detail =
      list.length === 0
        ? `No ${label.toLowerCase()} added yet`
        : verified === list.length
          ? `All ${list.length} verified`
          : `${verified} of ${list.length} verified`
    return { key: label, label, state, detail }
  }

  const steps: { key: string; label: string; state: StepState; detail: string }[] = [
    {
      key: 'identity',
      label: 'Identity',
      state: view.identity === 'verified' ? 'done' : 'todo',
      detail: view.identity === 'verified' ? 'Verified' : 'Not yet verified',
    },
    // The profile has no education or work history — only what's built
    // through MySkills — so identity and projects are all there is to check.
    group('Projects', profile.projects, 'project'),
  ]
  // Empty categories (e.g. no projects added) don't block completion or count
  // in the ring — there's nothing there to verify.
  const counted = steps.filter((s) => s.state !== 'none')
  const done = counted.filter((s) => s.state === 'done').length
  const fullyVerified = counted.length > 0 && done === counted.length

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
  const R = 20
  const C = 2 * Math.PI * R
  const share = counted.length ? done / counted.length : 0

  return (
    <section id="verification" className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative h-12 w-12 shrink-0">
          <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="24" cy="24" r={R} fill="none" strokeWidth="4" className="stroke-ink-100" />
            {share > 0 && (
              <circle
                cx="24"
                cy="24"
                r={R}
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                className={fullyVerified ? 'stroke-emerald-600' : 'stroke-brand-600'}
                strokeDasharray={C}
                strokeDashoffset={C * (1 - share)}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {fullyVerified ? (
              <ShieldCheck size={18} className="text-emerald-600" />
            ) : (
              <span className="font-display text-xs font-semibold text-ink-700">
                {done}/{counted.length}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-ink-900">Profile verification</h2>
            {fullyVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <ShieldCheck size={11} /> Complete
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-600">
            {fullyVerified
              ? 'Everything on your profile is verified. Editing a verified entry sends it back for a re-check.'
              : 'Employers trust what a person has checked. Get verified on a short video call.'}
          </p>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-ink-100 border-t border-ink-100">
        {steps.map((s) => (
          <Step key={s.key} label={s.label} state={s.state} detail={s.detail} />
        ))}
      </ul>

      <div className="mt-4 border-t border-ink-100 pt-4">
        {request?.status === 'scheduled' && request.scheduled_at ? (
          <div className="space-y-2 text-sm text-ink-700">
            <p className="inline-flex items-center gap-1.5 font-semibold text-ink-900">
              <CalendarClock size={16} className="text-brand-600" /> Your call: {fmtCall(request.scheduled_at)}
            </p>
            <p>
              Have a government photo ID ready, and be ready to show the projects on your profile —
              links, files or the work itself.
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
            <div>
              <button type="button" onClick={cancel} className="text-sm font-medium text-ink-500 hover:text-red-700">
                Cancel request
              </button>
            </div>
          </div>
        ) : request?.status === 'requested' ? (
          <div className="space-y-2">
            <p className="inline-flex items-center gap-1.5 text-sm text-ink-700">
              <Clock size={16} className="text-amber-600" />
              Request received. We’ll email you a call time soon.
            </p>
            <button type="button" onClick={cancel} className="text-sm font-medium text-ink-500 hover:text-red-700">
              Cancel request
            </button>
          </div>
        ) : showForm ? (
          <RequestForm
            onDone={() => {
              setShowForm(false)
              onChange()
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          !fullyVerified && (
            <PrimaryButton type="button" onClick={() => setShowForm(true)}>
              {request?.status === 'completed' ? 'Verify new entries' : 'Request verification'}
            </PrimaryButton>
          )
        )}

        {request?.status === 'completed' && request.note_to_student && !open && !showForm && (
          <p className="mt-3 rounded-xl bg-ink-50 p-3 text-sm text-ink-700">
            <span className="font-semibold">From the MySkills team: </span>
            {request.note_to_student}
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    </section>
  )
}
