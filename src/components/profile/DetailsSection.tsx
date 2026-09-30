/**
 * Personal details on the profile page.
 *
 * These used to be step 1 of onboarding. Sign-up now only asks for career
 * stage + goals, and everything personal is collected here instead — as
 * profile completion, at the user's own pace.
 */
import { useState } from 'react'
import { BadgeCheck, Cake, Lock, MapPin, Phone, UserRound } from 'lucide-react'
import type { ComponentType } from 'react'
import type { Profile, ProfilePatch } from '@/lib/profile'
import {
  careerStageLabel,
  genderOptions,
  personalDetailsForm,
} from '@/lib/onboardingContent'
import { Field, Modal, PrimaryButton, Section, Select } from './ui'

type IconType = ComponentType<{ size?: number; className?: string }>

const f = personalDetailsForm.fields

const careerLabel = careerStageLabel
const genderLabel = (v: string) => genderOptions.find((o) => o.value === v)?.label ?? v

const formatDob = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ----------------------------------------------------------- completeness */

/** Fields tracked by the completion nudge that PersonalDetailsModal can
 *  actually edit -- used to decide whether "Add details" has anything to do. */
const MODAL_KEYS = new Set(['phone', 'date_of_birth', 'gender', 'country', 'state'])

export interface DetailItem {
  key: keyof Pick<
    Profile,
    'phone' | 'date_of_birth' | 'gender' | 'country' | 'state' | 'avatar_url'
  >
  label: string
}

export const DETAIL_ITEMS: DetailItem[] = [
  { key: 'avatar_url', label: 'Profile picture' },
  { key: 'phone', label: f.phone.label },
  { key: 'date_of_birth', label: f.dob.label },
  { key: 'gender', label: f.gender.label },
  { key: 'country', label: f.country.label },
  { key: 'state', label: f.state.label },
]

/** Which personal details are still blank. (No education or work history:
 *  the profile only carries what's built through MySkills.) */
export function missingDetails(profile: Profile): DetailItem[] {
  return DETAIL_ITEMS.filter((i) => {
    const value = profile[i.key]
    return Array.isArray(value) ? value.length === 0 : !String(value ?? '').trim()
  })
}

/* ---------------------------------------------------------------- editing */

interface DetailsDraft {
  phone: string
  date_of_birth: string
  gender: string
  country: string
  state: string
}

const draftFrom = (p: Profile): DetailsDraft => ({
  phone: p.phone ?? '',
  date_of_birth: p.date_of_birth ?? '',
  gender: p.gender ?? '',
  country: p.country || f.country.default,
  state: p.state || f.state.default,
})

/** Shared edit dialog — opened from the Details card and from the nudge card. */
export function PersonalDetailsModal({
  open,
  profile,
  save,
  onClose,
}: {
  open: boolean
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
  onClose: () => void
}) {
  const [draft, setDraft] = useState<DetailsDraft>(() => draftFrom(profile))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  // Re-seed the draft each time the dialog opens so it always reflects saved data.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraft(draftFrom(profile))
      setError(undefined)
    }
  }

  function set<K extends keyof DetailsDraft>(key: K, value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function submit() {
    setSaving(true)
    setError(undefined)
    try {
      // Only seed the header's location when the user hasn't set one — it is
      // freely editable up there and shouldn't be overwritten from here.
      const location = profile.location
        ? ''
        : [draft.state, draft.country].filter(Boolean).join(', ')
      await save({
        phone: draft.phone.trim(),
        // A blank date column must stay null, not ''.
        date_of_birth: draft.date_of_birth || null,
        gender: draft.gender,
        country: draft.country.trim(),
        state: draft.state.trim(),
        ...(location ? { location } : {}),
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title={personalDetailsForm.title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-ink-600">{personalDetailsForm.subtitle}</p>

        <Field
          label={f.phone.label}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={f.phone.placeholder}
          value={draft.phone}
          onChange={(e) => set('phone', e.target.value)}
        />
        <Field
          label={f.dob.label}
          type="date"
          value={draft.date_of_birth}
          onChange={(e) => set('date_of_birth', e.target.value)}
        />
        <Select
          label={f.gender.label}
          placeholder={f.gender.placeholder}
          options={genderOptions}
          value={draft.gender}
          onChange={(e) => set('gender', e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={f.country.label}
            placeholder={f.country.placeholder}
            value={draft.country}
            onChange={(e) => set('country', e.target.value)}
          />
          <Field
            label={f.state.label}
            placeholder={f.state.placeholder}
            value={draft.state}
            onChange={(e) => set('state', e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end pt-1">
          <PrimaryButton onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save details'}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------- nudge card */

/**
 * Sits under the profile header until every personal detail is filled in.
 * This is the replacement for the old onboarding step — same questions, but
 * asked once someone is already inside the product.
 */
export function ProfileCompletion({
  profile,
  save,
}: {
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
}) {
  const [open, setOpen] = useState(false)
  const missing = missingDetails(profile)
  if (!missing.length) return null

  const done = DETAIL_ITEMS.length - missing.length
  const percent = Math.round((done / DETAIL_ITEMS.length) * 100)
  // The profile picture lives in the header right above -- this button only
  // ever needs to appear when it has something of ITS OWN to open.
  const canOpenModal = missing.some((m) => MODAL_KEYS.has(m.key))

  return (
    <>
      <section className="card border-brand-200 bg-brand-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink-900 sm:text-lg">
              Complete your profile
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Add {missing.map((m) => m.label.toLowerCase()).join(', ')} so we can
              personalize your tracks and your certificate.
            </p>
          </div>
          {canOpenModal && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="press h-11 shrink-0 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
            >
              Add details
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-200">
            <span
              className="block h-full rounded-full bg-brand-600 transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="shrink-0 text-xs font-medium text-ink-600">
            {done} of {DETAIL_ITEMS.length}
          </p>
        </div>
      </section>

      <PersonalDetailsModal
        open={open}
        profile={profile}
        save={save}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

/* ------------------------------------------------------------ details card */

/** Career stage as a display label, for the header. */
export function headerExtras(profile: Profile): { careerStage?: string } {
  return { careerStage: profile.career_stage ? careerLabel(profile.career_stage) : undefined }
}

/**
 * The student's personal details as a tidy grid of tiles — phone, date of
 * birth, gender and where they live. Private to them; career stage and the
 * public location line live in the header.
 */
export function DetailsSection({
  profile,
  save,
  verified = false,
}: {
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
  /** Identity (name and date of birth) checked by MySkills on a call. */
  verified?: boolean
}) {
  const [open, setOpen] = useState(false)
  const place = [profile.state, profile.country].filter(Boolean).join(', ')
  const items: { icon: IconType; label: string; value: string }[] = [
    { icon: Phone, label: f.phone.label, value: profile.phone },
    { icon: Cake, label: f.dob.label, value: formatDob(profile.date_of_birth) },
    { icon: UserRound, label: f.gender.label, value: profile.gender ? genderLabel(profile.gender) : '' },
    { icon: MapPin, label: 'Lives in', value: place },
  ]

  return (
    <Section title="Details" onEdit={() => setOpen(true)}>
      {verified && (
        <p className="-mt-1 mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <BadgeCheck size={13} /> Verified by MySkills
        </p>
      )}
      <dl className="grid grid-cols-2 gap-2.5">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl bg-ink-50 p-3">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
              <Icon size={13} className="shrink-0" />
              {label}
            </dt>
            <dd className={`mt-1 truncate text-sm font-semibold ${value ? 'text-ink-900' : 'text-ink-400'}`}>
              {value || 'Add'}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 inline-flex items-start gap-1.5 text-xs leading-relaxed text-ink-500">
        <Lock size={12} className="mt-0.5 shrink-0" />
        {verified
          ? 'Only you can see these. Changing your name or date of birth sends it back for a re-check.'
          : 'Only you can see these. They’re checked on your verification call.'}
      </p>

      <PersonalDetailsModal open={open} profile={profile} save={save} onClose={() => setOpen(false)} />
    </Section>
  )
}
