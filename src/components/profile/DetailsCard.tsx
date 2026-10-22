import { useState } from 'react'
import { AlertTriangle, BadgeCheck, Cake, Lock, MapPin, Pencil, Phone, ShieldCheck, ShieldQuestion, UserRound, Video, type LucideIcon } from 'lucide-react'
import type { Profile, ProfilePatch } from '@/lib/profile'
import { genderOptions } from '@/lib/onboardingContent'
import type { VerificationRequest } from '@/lib/verification'
import { PersonalDetailsModal } from './DetailsSection'

const fmtDob = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
/** A date of birth that can't be right (a five-digit year, or in the future). */
const oddDob = (iso: string) => {
  const y = Number(iso.slice(0, 4))
  return Boolean(iso) && (!/^\d{4}-/.test(iso) || y < 1940 || new Date(iso) > new Date())
}

function Tile({ icon: Icon, label, value, warn, tick }: { icon: LucideIcon; label: string; value: string; warn?: string; tick?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${warn ? 'border-amber-200 bg-amber-50' : 'border-ink-900/[0.06] bg-ink-50/60'}`}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
        <Icon size={14} className="shrink-0" /> {label}
        {tick && <BadgeCheck size={13} className="ml-auto text-emerald-600" aria-label="Verified" />}
      </p>
      <p className={`mt-1.5 truncate text-[15px] font-semibold ${value ? 'text-ink-900' : 'text-ink-400'}`}>{value || 'Add'}</p>
      {warn && (
        <p className="mt-1 flex items-start gap-1 text-[11px] text-amber-800">
          <AlertTriangle size={11} className="mt-0.5 shrink-0" /> {warn}
        </p>
      )}
    </div>
  )
}

/**
 * Personal details and their verification, in one card: the details as
 * tiles, and beside them where the student stands with MySkills'
 * verification (a short video call that checks name and date of birth).
 */
export function DetailsCard({
  profile,
  save,
  verified,
  request,
  canRequest,
}: {
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
  verified: boolean
  request: VerificationRequest | null
  /** Verification opens after the first aptitude test (the checklist above has the button). */
  canRequest: boolean
}) {
  const [open, setOpen] = useState(false)
  const place = [profile.state, profile.country].filter(Boolean).join(', ')
  const gender = profile.gender ? (genderOptions.find((o) => o.value === profile.gender)?.label ?? profile.gender) : ''
  const pending = request?.status === 'requested' || request?.status === 'scheduled'

  const status = verified
    ? { icon: ShieldCheck, tone: 'from-emerald-50 to-emerald-100/60 border-emerald-200', iconTone: 'bg-emerald-500 text-white', title: 'Verified by MySkills', body: 'Your name and date of birth were checked on a video call. Employers and partners see the tick by your name.' }
    : pending
      ? { icon: Video, tone: 'from-sky-50 to-sky-100/60 border-sky-200', iconTone: 'bg-sky-500 text-white', title: request?.status === 'scheduled' ? 'Verification call booked' : 'Verification requested', body: 'The details of your call are in the verification checklist above.' }
      : { icon: ShieldQuestion, tone: 'from-ink-50 to-white border-ink-200', iconTone: 'bg-ink-200 text-ink-600', title: 'Not verified yet', body: canRequest ? 'A 15-minute video call checks your name and date of birth. Request it in the checklist above.' : 'Verification opens after your first aptitude test.' }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Details &amp; verification</h2>
          <p className="flex items-center gap-1.5 text-sm text-ink-500">
            <Lock size={12} /> Only you can see your details.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
          Edit details <Pencil size={14} />
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile icon={Phone} label="Phone" value={profile.phone} />
          <Tile
            icon={Cake}
            label="Date of birth"
            value={profile.date_of_birth ? fmtDob(profile.date_of_birth) : ''}
            tick={verified}
            warn={profile.date_of_birth && oddDob(profile.date_of_birth) ? 'This looks wrong. Edit it to a four-digit year.' : undefined}
          />
          <Tile icon={UserRound} label="Gender" value={gender} />
          <Tile icon={MapPin} label="Lives in" value={place} />
        </div>

        <div className={`flex gap-3 rounded-2xl border bg-gradient-to-br p-4 ${status.tone}`}>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${status.iconTone}`}>
            <status.icon size={20} />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink-900">{status.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-600">{status.body}</p>
            {verified && <p className="mt-2 text-[11px] text-ink-500">Changing your name or date of birth sends it back for a re-check.</p>}
          </div>
        </div>
      </div>

      <PersonalDetailsModal open={open} profile={profile} save={save} onClose={() => setOpen(false)} />
    </section>
  )
}
