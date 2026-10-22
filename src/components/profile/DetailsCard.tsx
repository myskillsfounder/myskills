import { useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  Cake,
  CalendarClock,
  Check,
  Lock,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  ShieldQuestion,
  UserRound,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import type { Profile, ProfilePatch } from '@/lib/profile'
import { genderOptions } from '@/lib/onboardingContent'
import { cancelMyVerificationRequest, type VerificationRequest } from '@/lib/verification'
import { PersonalDetailsModal } from './DetailsSection'
import { RequestForm, fmtCall, safeHttps } from './VerificationSection'

const fmtDob = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
}
/** A date of birth that can't be right (a five-digit year, or in the future). */
const oddDob = (iso: string) => Boolean(iso) && (!/^\d{4}-/.test(iso) || Number(iso.slice(0, 4)) < 1940 || new Date(iso) > new Date())

function Row({ icon: Icon, tint, label, value, onAdd, verified, warn }: { icon: LucideIcon; tint: string; label: string; value: string; onAdd: () => void; verified?: boolean; warn?: string }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-ink-500">{label}</p>
        {value ? (
          <p className="flex items-center gap-1.5 truncate text-[15px] font-semibold text-ink-900">
            {value}
            {verified && <BadgeCheck size={15} className="shrink-0 text-emerald-600" aria-label="Verified" />}
          </p>
        ) : (
          <button type="button" onClick={onAdd} className="text-sm font-semibold text-brand-700 hover:underline">
            Add
          </button>
        )}
        {warn && (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-amber-700">
            <AlertTriangle size={11} /> {warn}
          </p>
        )}
      </div>
    </li>
  )
}

type Step = 'done' | 'now' | 'todo'

function Tracker({ steps }: { steps: { label: string; state: Step }[] }) {
  return (
    <ol className="flex items-start">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex flex-1 flex-col items-center text-center">
          {i > 0 && <span className={`absolute right-1/2 top-3.5 h-0.5 w-full ${s.state === 'todo' ? 'bg-ink-200' : 'bg-emerald-400'}`} />}
          <span
            className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
              s.state === 'done' ? 'bg-emerald-500 text-white' : s.state === 'now' ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-white text-ink-400 ring-1 ring-ink-200'
            }`}
          >
            {s.state === 'done' ? <Check size={14} strokeWidth={3} /> : i + 1}
          </span>
          <span className={`mt-1.5 text-[11px] font-semibold ${s.state === 'todo' ? 'text-ink-400' : 'text-ink-800'}`}>{s.label}</span>
        </li>
      ))}
    </ol>
  )
}

/**
 * Personal details and their verification, in one card: the details as a
 * list, and beside them the whole verification journey (details, a short
 * video call, verified), with what to do next right there.
 */
export function DetailsCard({
  profile,
  save,
  verified,
  request,
  canRequest,
  onChange,
}: {
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
  verified: boolean
  request: VerificationRequest | null
  /** Verification opens after the first aptitude test. */
  canRequest: boolean
  /** After a request is made or cancelled. */
  onChange: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string>()
  const place = [profile.state, profile.country].filter(Boolean).join(', ')
  const gender = profile.gender ? (genderOptions.find((o) => o.value === profile.gender)?.label ?? profile.gender) : ''
  const complete = Boolean(profile.phone && profile.date_of_birth && profile.gender && place)
  const requested = request?.status === 'requested'
  const scheduled = request?.status === 'scheduled'
  const link = safeHttps(request?.meeting_link ?? null)

  const steps: { label: string; state: Step }[] = [
    { label: 'Details', state: complete ? 'done' : 'now' },
    { label: 'Video call', state: verified ? 'done' : requested || scheduled ? 'now' : complete ? 'now' : 'todo' },
    { label: 'Verified', state: verified ? 'done' : 'todo' },
  ]

  async function cancel() {
    setError(undefined)
    try {
      await cancelMyVerificationRequest()
      onChange()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const panelTone = verified ? 'border-emerald-200 from-emerald-50 to-white' : scheduled || requested ? 'border-brand-200 from-brand-50 to-white' : 'border-amber-200 from-amber-50 to-white'

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/[0.06] px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Details &amp; verification</h2>
          <p className="flex items-center gap-1.5 text-xs text-ink-500">
            <Lock size={11} /> Private: only you and the MySkills team see these.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
        >
          <Pencil size={13} /> Edit
        </button>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ul className="divide-y divide-ink-900/[0.06] rounded-2xl border border-ink-900/[0.08] bg-white">
          <Row icon={Phone} tint="bg-sky-100 text-sky-700" label="Phone" value={profile.phone} onAdd={() => setEditing(true)} />
          <Row
            icon={Cake}
            tint="bg-pink-100 text-pink-700"
            label="Date of birth"
            value={profile.date_of_birth ? fmtDob(profile.date_of_birth) : ''}
            verified={verified}
            onAdd={() => setEditing(true)}
            warn={profile.date_of_birth && oddDob(profile.date_of_birth) ? 'This looks wrong: edit it to a four-digit year.' : undefined}
          />
          <Row icon={UserRound} tint="bg-violet-100 text-violet-700" label="Gender" value={gender} onAdd={() => setEditing(true)} />
          <Row icon={MapPin} tint="bg-emerald-100 text-emerald-700" label="Lives in" value={place} onAdd={() => setEditing(true)} />
        </ul>

        <div className={`flex flex-col rounded-2xl border bg-gradient-to-b p-5 ${panelTone}`}>
          <div className="flex items-start gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${verified ? 'bg-emerald-500 text-white' : 'bg-white text-amber-600 shadow-sm ring-1 ring-amber-200'}`}>
              {verified ? <ShieldCheck size={22} /> : <ShieldQuestion size={22} />}
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-tight text-ink-900">
                {verified ? 'Verified by MySkills' : scheduled ? 'Your call is booked' : requested ? 'Request received' : 'Get your verified tick'}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">
                {verified
                  ? 'Your name and date of birth were checked. Employers and partners see the tick by your name.'
                  : scheduled
                    ? 'Have a government photo ID ready.'
                    : requested
                      ? 'We’ll email you a call time soon.'
                      : 'Employers trust profiles a person has checked. A 15-minute video call confirms your name and date of birth.'}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Tracker steps={steps} />
          </div>

          <div className="mt-5">
            {scheduled && request?.scheduled_at && (
              <div className="space-y-3">
                <p className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-ink-900 ring-1 ring-ink-900/[0.06]">
                  <CalendarClock size={16} className="text-brand-600" /> {fmtCall(request.scheduled_at)}
                </p>
                {link && (
                  <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                    <Video size={15} /> Join the call
                  </a>
                )}
              </div>
            )}
            {(requested || scheduled) && (
              <button type="button" onClick={() => void cancel()} className="mt-2 block text-xs font-medium text-ink-500 hover:text-red-700">
                Cancel request
              </button>
            )}
            {!verified && !requested && !scheduled && !asking && (
              canRequest ? (
                <button
                  type="button"
                  onClick={() => (complete ? setAsking(true) : setEditing(true))}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  {complete ? (
                    <>
                      <Video size={15} /> Book my verification call
                    </>
                  ) : (
                    'Add your details first'
                  )}
                </button>
              ) : (
                <p className="text-xs text-ink-500">Verification opens after your first aptitude test.</p>
              )
            )}
            {asking && (
              <RequestForm
                onDone={() => {
                  setAsking(false)
                  onChange()
                }}
                onCancel={() => setAsking(false)}
              />
            )}
            {verified && <p className="text-xs text-ink-500">Changing your name or date of birth sends it back for a re-check.</p>}
            {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
          </div>
        </div>
      </div>

      <PersonalDetailsModal open={editing} profile={profile} save={save} onClose={() => setEditing(false)} />
    </section>
  )
}
